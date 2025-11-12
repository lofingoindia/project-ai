// Complete Book Processing Pipeline
// Enhanced AI service for processing entire books with character replacement

const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');
const PDFExtractor = require('./pdf-extractor');

/**
 * Rate Limiter to prevent API overload
 * Ensures requests are spaced out to avoid hitting rate limits
 */
class RateLimiter {
  constructor(minDelayMs = 2000, maxDelayMs = 10000) {
    this.minDelayMs = minDelayMs; // Minimum delay between requests
    this.maxDelayMs = maxDelayMs; // Maximum delay (adaptive)
    this.currentDelay = minDelayMs;
    this.lastRequestTime = 0;
    this.consecutive503Errors = 0; // Track 503 errors for adaptive backoff
  }

  /**
   * Wait before making next request (rate limiting)
   */
  async waitBeforeRequest() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    // If enough time has passed, use current delay
    // Otherwise, wait for the remaining time plus current delay
    if (timeSinceLastRequest < this.currentDelay) {
      const waitTime = this.currentDelay - timeSinceLastRequest;
      console.log(`⏳ Rate limiter: waiting ${Math.round(waitTime)}ms before next request`);
      await this.sleep(waitTime);
    }
    
    this.lastRequestTime = Date.now();
  }

  /**
   * Increase delay when 503 errors are detected (adaptive backoff)
   */
  handle503Error() {
    this.consecutive503Errors++;
    // Increase delay exponentially when 503 errors occur
    this.currentDelay = Math.min(
      this.minDelayMs * Math.pow(2, this.consecutive503Errors),
      this.maxDelayMs
    );
    console.log(`⚠️  Rate limiter: 503 error detected. Increasing delay to ${Math.round(this.currentDelay)}ms (consecutive 503s: ${this.consecutive503Errors})`);
  }

  /**
   * Reset delay when requests succeed (gradual recovery)
   */
  handleSuccess() {
    if (this.consecutive503Errors > 0) {
      // Gradually reduce delay back to minimum
      this.consecutive503Errors = Math.max(0, this.consecutive503Errors - 1);
      this.currentDelay = Math.max(
        this.minDelayMs,
        this.minDelayMs * Math.pow(2, this.consecutive503Errors)
      );
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

class CompleteBookPersonalizationService {
  constructor() {
    if (!process.env.GOOGLE_AI_API_KEY) {
      throw new Error('GOOGLE_AI_API_KEY environment variable is required');
    }
    this.genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
    this.model = "gemini-2.5-flash"; // For text analysis tasks
    this.imageModel = "gemini-2.5-flash-image-preview"; // For image generation tasks
    this.maxRetries = 5; // Retry failed API calls (increased from 3)
    this.retryDelay = 3000; // 3 seconds base delay between retries (increased from 2)
    this.pdfExtractor = new PDFExtractor();
    
    // Rate limiting configuration
    this.rateLimiter = new RateLimiter(2000, 15000); // 2-15 seconds between requests
    this.pageAnalysisDelay = 2000; // 2 seconds between page analyses
    this.pageProcessingDelay = 2000; // 2 seconds between page processing
    this.batchDelay = 3000; // 3 seconds between batches
  }

  /**
   * Main entry point for complete book processing
   * Accepts either pdfUrl or bookPages (for backward compatibility)
   * Now supports story timeline caching - if timeline exists in DB, skips analysis and just replaces images
   */
  async processCompleteBook({
    pdfUrl,
    bookPages,
    childImage,
    childName,
    bookTitle,
    bookId = null, // Book ID for storing/retrieving timeline
    supabase = null, // Supabase client for DB operations
    options = {}
  }) {
    try {
      console.log('📚 Starting complete book personalization...');
      console.log(`📖 Book: ${bookTitle}`);
      console.log(`👶 Child: ${childName}`);
      
      const startTime = Date.now();
      
      // Step 0: Extract pages from PDF if pdfUrl is provided
      let pagesToProcess = bookPages;
      if (pdfUrl) {
        console.log('📄 Extracting pages from PDF...');
        // Generate a meaningful prefix for PNG files (using book title and timestamp)
        const safeBookTitle = (bookTitle || 'book').replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
        const outputPrefix = `${safeBookTitle}_${Date.now()}`;
        pagesToProcess = await this.pdfExtractor.extractPagesFromPDF(pdfUrl, outputPrefix);
        console.log(`✅ Extracted ${pagesToProcess.length} pages from PDF`);
        
        // Validate: Ensure 1:1 mapping (one PDF page = one image)
        if (pagesToProcess.length === 0) {
          throw new Error('No pages extracted from PDF');
        }
        console.log(`📊 PDF extraction validation: ${pagesToProcess.length} pages = ${pagesToProcess.length} images (1:1 mapping)`);
      }
      
      if (!pagesToProcess || pagesToProcess.length === 0) {
        throw new Error('No book pages provided. Either pdfUrl or bookPages must be provided.');
      }
      
      console.log(`📄 Total pages to process: ${pagesToProcess.length}`);
      
      // Step 0.5: Check if story timeline exists in DB
      let bookAnalysis = null;
      let characterMapping = null;
      let timelineFromDB = null;
      
      if (bookId && supabase) {
        console.log(`🔍 Checking for stored story timeline (book_id: ${bookId})...`);
        const { data: bookData, error: dbError } = await supabase
          .from('books')
          .select('story_timeline')
          .eq('id', bookId)
          .single();
        
        if (!dbError && bookData && bookData.story_timeline) {
          timelineFromDB = bookData.story_timeline;
          console.log('✅ Found stored story timeline in database - skipping analysis!');
          console.log(`   Timeline contains ${timelineFromDB.characterMapping?.length || 0} pages`);
          
          // Use stored timeline
          bookAnalysis = timelineFromDB.bookAnalysis;
          characterMapping = timelineFromDB.characterMapping || [];
          
          // Ensure character mapping has page images attached and all required fields
          if (characterMapping && pagesToProcess) {
            for (let i = 0; i < characterMapping.length && i < pagesToProcess.length; i++) {
              characterMapping[i].pageImage = pagesToProcess[i];
              characterMapping[i].replacementNeeded = true; // Always replace images when using stored timeline
              
              // Ensure replacementStrategy exists (restore if missing)
              if (!characterMapping[i].replacementStrategy && characterMapping[i].character) {
                characterMapping[i].replacementStrategy = this.determineReplacementStrategy(
                  characterMapping[i].character,
                  i
                );
              }
            }
            
            // Validate page count matches
            if (characterMapping.length !== pagesToProcess.length) {
              console.warn(`⚠️  Timeline has ${characterMapping.length} pages but PDF has ${pagesToProcess.length} pages`);
              console.warn(`   Will use timeline for available pages and process remaining pages normally`);
            }
          }
        } else {
          console.log('📝 No stored timeline found - will perform full analysis and store it');
        }
      }
      
      // Step 1: Analyze all pages (only if timeline not found)
      if (!bookAnalysis) {
        console.log('🔍 Step 1: Analyzing all book pages...');
        bookAnalysis = await this.analyzeCompleteBook(pagesToProcess);
        console.log('✅ Book analysis complete');
        
        // Step 2: Map characters across pages
        console.log('👤 Step 2: Mapping characters across pages...');
        characterMapping = await this.mapCharacterAcrossPages(pagesToProcess, bookAnalysis);
        console.log(`✅ Character mapping complete: ${characterMapping.length} total pages mapped`);
        
        // Store timeline in DB if bookId and supabase are provided
        if (bookId && supabase) {
          console.log(`💾 Storing story timeline in database (book_id: ${bookId})...`);
          const timelineData = {
            bookAnalysis: {
              totalPages: bookAnalysis.totalPages,
              pages: bookAnalysis.pages.map(page => ({
                pageNumber: page.pageNumber,
                characters: page.characters,
                scene: page.scene,
                text: page.text,
                layout: page.layout,
                replacementGuidance: page.replacementGuidance
              })),
              mainCharacter: bookAnalysis.mainCharacter,
              bookStyle: bookAnalysis.bookStyle,
              characterConsistency: bookAnalysis.characterConsistency
            },
            characterMapping: characterMapping.map(m => ({
              pageNumber: m.pageNumber,
              character: m.character,
              replacementNeeded: m.replacementNeeded,
              replacementStrategy: m.replacementStrategy,
              // Don't store pageImage (base64 is too large, will be re-extracted from PDF)
            })),
            storedAt: new Date().toISOString(),
            totalPages: pagesToProcess.length,
            version: '1.0' // Version for future compatibility
          };
          
          const { error: updateError } = await supabase
            .from('books')
            .update({ story_timeline: timelineData })
            .eq('id', bookId);
          
          if (updateError) {
            console.warn('⚠️  Failed to store timeline in DB:', updateError.message);
          } else {
            console.log('✅ Story timeline stored in database');
            console.log(`   Stored ${timelineData.characterMapping.length} page mappings`);
          }
        }
      } else {
        console.log('✅ Using stored story timeline - skipping analysis');
      }
      
      console.log(`   Pages with replacement: ${characterMapping.filter(m => m.replacementNeeded).length}`);
      console.log(`   Pages to preserve (original): ${characterMapping.filter(m => !m.replacementNeeded).length}`);
      
      // Debug: Show which pages will be processed
      const pagesToReplace = characterMapping.filter(m => m.replacementNeeded).map(m => m.pageNumber);
      const pagesToPreserve = characterMapping.filter(m => !m.replacementNeeded).map(m => m.pageNumber);
      console.log(`   📝 Pages to replace: [${pagesToReplace.join(', ')}]`);
      if (pagesToPreserve.length > 0) {
        console.log(`   📝 Pages to preserve: [${pagesToPreserve.join(', ')}]`);
      }
      
      // CRITICAL: Ensure ALL pages are marked for replacement when using stored timeline
      if (timelineFromDB) {
        console.log('🔄 Using stored timeline - ensuring ALL pages are replaced...');
        characterMapping.forEach(m => {
          m.replacementNeeded = true; // Force replacement for all pages
        });
        console.log(`✅ All ${characterMapping.length} pages will be replaced`);
      }
      
      // Step 2.5: Analyze child image ONCE (same as cover generation) - reuse throughout PDF
      console.log('👶 Step 2.5: Analyzing child image (will be reused for all pages)...');
      const childFeatures = await this._analyzeChildImage(childImage, childName);
      console.log('✅ Child analysis complete - will be used consistently across all pages');
      console.log(`   Child name: ${childFeatures.name}`);
      console.log(`   Key features: ${childFeatures.features}`);
      
      // Step 3: Process pages in batches
      console.log('🔄 Step 3: Processing pages in batches...');
      const processedPages = await this.processPagesInBatches(
        pagesToProcess,
        characterMapping,
        childImage,
        childName,
        childFeatures, // Pass pre-analyzed child features
        options
      );
      console.log('✅ All pages processed');
      
      // Step 4: Assemble final book
      console.log('📚 Step 4: Assembling personalized book...');
      const personalizedBook = await this.assemblePersonalizedBook(
        processedPages,
        bookTitle,
        childName
      );
      console.log('✅ Personalized book assembled');
      
      const processingTime = Date.now() - startTime;
      
      return {
        success: true,
        personalizedBook,
        totalPages: processedPages.length,
        processingTime,
        characterReplacements: characterMapping.length,
        bookAnalysis,
        characterMapping
      };
      
    } catch (error) {
      console.error('❌ Complete book processing failed:', error);
      return {
        success: false,
        error: error.message,
        totalPages: 0,
        processingTime: 0,
        characterReplacements: 0
      };
    }
  }

  /**
   * Analyze all pages of the book to understand characters and content
   */
  async analyzeCompleteBook(bookPages) {
    const analysisResults = [];
    
    for (let i = 0; i < bookPages.length; i++) {
      const page = bookPages[i];
      console.log(`📄 Analyzing page ${i + 1}/${bookPages.length}`);
      
      // Rate limit: wait before making request
      await this.rateLimiter.waitBeforeRequest();
      
      try {
        const pageAnalysis = await this.analyzePage(page, i);
        analysisResults.push(pageAnalysis);
        this.rateLimiter.handleSuccess(); // Track successful request
        
        // Add delay between page analyses to avoid rate limiting
        if (i < bookPages.length - 1) {
          console.log(`⏳ Waiting ${this.pageAnalysisDelay}ms before next page analysis...`);
          await this.sleep(this.pageAnalysisDelay);
        }
      } catch (error) {
        // Check if it's a 503 error and update rate limiter
        const errorStatus = error.status || error.statusCode || (error.message?.includes('503') ? 503 : null);
        if (errorStatus === 503) {
          this.rateLimiter.handle503Error();
        }
        
        console.error(`❌ Failed to analyze page ${i + 1}:`, error);
        // Use proper fallback analysis with character data (so page will be processed)
        const fallbackAnalysis = this.createFallbackAnalysis(i);
        fallbackAnalysis.error = error.message;
        analysisResults.push(fallbackAnalysis);
        console.log(`⚠️  Using fallback analysis for page ${i + 1} - will attempt face replacement`);
        
        // Add extra delay after error before next page
        if (i < bookPages.length - 1) {
          const errorDelay = errorStatus === 503 ? this.pageAnalysisDelay * 2 : this.pageAnalysisDelay;
          console.log(`⏳ Waiting ${errorDelay}ms after error before next page analysis...`);
          await this.sleep(errorDelay);
        }
      }
    }
    
    return {
      totalPages: bookPages.length,
      pages: analysisResults,
      mainCharacter: this.identifyMainCharacter(analysisResults),
      bookStyle: this.analyzeBookStyle(analysisResults),
      characterConsistency: this.analyzeCharacterConsistency(analysisResults)
    };
  }

  /**
   * Analyze a single page for character detection and scene understanding
   * Improved with better prompting for character detection
   * Includes retry logic for API errors
   */
  async analyzePage(pageImage, pageNumber) {
    // Retry logic for failed page analysis
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        return await this._analyzePageAttempt(pageImage, pageNumber, attempt);
      } catch (error) {
        const errorStatus = error.status || error.statusCode || (error.message?.includes('500') ? 500 : null);
        const isRetryable = this._isRetryableError(error, errorStatus);
        
        console.error(`❌ Page ${pageNumber + 1} analysis failed (attempt ${attempt}/${this.maxRetries}):`, error.message);
        if (errorStatus) {
          console.error(`   Error status: ${errorStatus}`);
        }
        
        // If 503 error, update rate limiter for adaptive backoff
        if (errorStatus === 503) {
          this.rateLimiter.handle503Error();
        }
        
        // If this was the last attempt or error is not retryable, return fallback
        if (attempt === this.maxRetries || !isRetryable) {
          if (!isRetryable) {
            console.warn(`⚠️  Non-retryable error, using fallback analysis for page ${pageNumber + 1}`);
          } else {
            console.warn(`⚠️  Using fallback analysis for page ${pageNumber + 1} after ${this.maxRetries} failed attempts`);
          }
          return this.createFallbackAnalysis(pageNumber);
        }
        
        // Wait before retrying (exponential backoff with jitter)
        // Exponential backoff: 3s, 6s, 12s, 24s, 48s
        // For 503 errors, use longer delays
        let baseDelay = this.retryDelay;
        if (errorStatus === 503) {
          // Use rate limiter's current delay as base for 503 errors
          baseDelay = Math.max(this.retryDelay, this.rateLimiter.currentDelay);
        }
        const delay = baseDelay * Math.pow(2, attempt - 1);
        // Add random jitter (0-2s) to avoid thundering herd
        const jitter = Math.random() * 2000;
        const totalDelay = delay + jitter;
        console.log(`⏳ Waiting ${Math.round(totalDelay)}ms before retry (exponential backoff${errorStatus === 503 ? ' + 503 adaptive delay' : ''})...`);
        await this.sleep(totalDelay);
      }
    }
  }

  /**
   * Single attempt to analyze a page
   */
  async _analyzePageAttempt(pageImage, pageNumber, attempt) {
    const analysisPrompt = `
    You are an expert at analyzing children's book illustrations. Analyze this book page (page ${pageNumber + 1}) with extreme precision:
    
    1. CHARACTER DETECTION (MOST IMPORTANT - DETECT ALL HUMAN CHARACTERS):
       - Identify ALL HUMAN CHARACTERS on this page (children, people, NOT animals)
       - Mark the MAIN/PRIMARY human character (the story's protagonist)
       - The main character is usually:
         * A human child or person
         * The largest or most prominent human in the scene
         * Central to the story narrative
         * Appears consistently throughout the book
       - For EACH HUMAN CHARACTER (main and secondary), describe:
         * Physical appearance (age, gender, hair color, hair style, clothing, distinctive features)
         * Position in the image (specific location: top-left, center, bottom-right, etc.)
         * Size relative to page (large/medium/small/tiny)
         * Facial expression and body language
         * isMainCharacter: true for the PRIMARY protagonist, false for others
         * replaceWithChild: true for the main protagonist (largest human character), false for minor characters
       - Mark isMainCharacter=true for the MOST PROMINENT HUMAN on the page
       - List animals and pets separately, marked as isAnimal=true and NOT for replacement
    
    2. SCENE ANALYSIS:
       - What is happening in this scene? (action, interaction, event)
       - Setting/location (indoor/outdoor, specific place)
       - Time of day and lighting
       - Mood and atmosphere
       - Important objects or props
    
    3. TEXT CONTENT:
       - Extract ALL visible text word-for-word
       - List any character names mentioned
       - Story context and narrative
    
    4. LAYOUT & STYLE:
       - Artistic style (watercolor, digital, cartoon, realistic, etc.)
       - Page composition (where elements are placed)
       - Color palette (dominant colors)
       - Visual hierarchy (what draws attention first)
    
    5. REPLACEMENT GUIDANCE:
       - ONLY the MAIN HUMAN CHARACTER should be replaced (never animals, pets, or other items)
       - Difficulty level for replacement (easy/medium/hard)
       - Special considerations for replacement
    
    Return ONLY valid JSON (no markdown, no extra text):
    {
      "pageNumber": ${pageNumber + 1},
      "hasCharacters": true/false,
      "mainCharacterDetected": true/false,
      "characters": [
        {
          "isMainCharacter": true/false,
          "isHuman": true/false,
          "isAnimal": true/false,
          "confidence": 0.9,
          "description": "detailed physical description",
          "position": "specific position",
          "size": "large/medium/small",
          "emotion": "specific emotion",
          "pose": "specific pose/action",
          "replaceWithChild": true/false,
          "replacementDifficulty": "easy/medium/hard"
        }
      ],
      "scene": {
        "action": "what's happening",
        "setting": "where it takes place",
        "timeOfDay": "morning/afternoon/evening/night",
        "mood": "specific mood",
        "objects": ["list of important objects"]
      },
      "text": {
        "content": "exact text",
        "characterNames": ["names"],
        "context": "story context"
      },
      "layout": {
        "artStyle": "specific style",
        "composition": "description",
        "colorPalette": ["colors"],
        "visualFocus": "main focus area"
      },
      "replacementGuidance": {
        "shouldReplace": true/false,
        "targetCharacter": "which character to replace (MUST be main human character only)",
        "considerations": "special notes for replacement - DO NOT replace animals or other items"
      }
    }
    `;
    
    console.log(`🔍 Analyzing page ${pageNumber + 1} (attempt ${attempt}/${this.maxRetries})...`);
    
    // Strip data URI prefix if present (Google API expects only base64 string)
    const cleanPageImage = this._stripDataUriPrefix(pageImage);
    
    const generativeModel = this.genAI.getGenerativeModel({ model: this.model });
    const result = await generativeModel.generateContent({
      contents: [{
        role: "user",
        parts: [
          {
            inlineData: {
              data: cleanPageImage,
              mimeType: "image/jpeg"
            }
          },
          { text: analysisPrompt }
        ]
      }],
      generationConfig: {
        responseModalities: ["TEXT"]
      }
    });
    
    const response = await result.response;
    let analysisText = response.text();
    
    // Clean up the response text - remove markdown code blocks if present
    analysisText = this._cleanJsonResponse(analysisText);
    
    // Parse JSON response
    try {
      const analysis = JSON.parse(analysisText);
      console.log(`✅ Page ${pageNumber + 1} analyzed successfully${attempt > 1 ? ` (after ${attempt} attempts)` : ''}`);
      return analysis;
    } catch (parseError) {
      console.error('❌ Failed to parse analysis JSON:', parseError);
      console.error('Raw response text (first 500 chars):', analysisText.substring(0, 500));
      throw new Error(`JSON parsing failed: ${parseError.message}`);
    }
  }

  /**
   * Create fallback analysis when AI analysis fails
   */
  createFallbackAnalysis(pageNumber) {
    return {
      pageNumber: pageNumber + 1,
      characters: [{
        isMainCharacter: true,
        isHuman: true,
        isAnimal: false,
        description: "main human character (analysis failed)",
        position: "center",
        size: "medium",
        emotion: "neutral",
        pose: "standing",
        replaceWithChild: true,
        replacementDifficulty: "medium"
      }],
      scene: {
        action: "story continues",
        setting: "book setting",
        mood: "neutral"
      },
      text: {
        content: "story text",
        characterNames: [],
        context: "story context"
      },
      layout: {
        composition: "standard layout",
        characterPositions: ["center"],
        visualFocus: "main character"
      },
      replacementGuidance: {
        shouldReplace: true,
        targetCharacter: "main human character",
        considerations: "fallback analysis - proceed with caution"
      }
    };
  }

  /**
   * Identify the main character across all pages
   * Only considers human characters (excludes animals)
   */
  identifyMainCharacter(analysisResults) {
    const characterCounts = {};
    
    analysisResults.forEach(page => {
      page.characters.forEach(char => {
        // Only count human main characters (exclude animals)
        if (char.isMainCharacter && 
            char.isHuman !== false && 
            char.isAnimal !== true) {
          const key = char.description.toLowerCase();
          characterCounts[key] = (characterCounts[key] || 0) + 1;
        }
      });
    });
    
    const mostFrequent = Object.entries(characterCounts)
      .sort(([,a], [,b]) => b - a)[0];
    
    return {
      description: mostFrequent ? mostFrequent[0] : "main human character",
      frequency: mostFrequent ? mostFrequent[1] : 0,
      totalPages: analysisResults.length
    };
  }

  /**
   * Analyze book style for consistency
   */
  analyzeBookStyle(analysisResults) {
    const styles = analysisResults.map(page => ({
      artStyle: "children's book illustration",
      colors: ["vibrant", "colorful"],
      lighting: "bright"
    }));
    
    return {
      dominantStyle: "children's book illustration",
      colorPalette: ["vibrant", "colorful", "bright"],
      lighting: "bright",
      consistency: "high"
    };
  }

  /**
   * Analyze character consistency across pages
   * Only considers human main characters (excludes animals)
   */
  analyzeCharacterConsistency(analysisResults) {
    const mainCharacterAppearances = analysisResults
      .filter(page => page.characters.some(char => 
        char.isMainCharacter && 
        char.isHuman !== false && 
        char.isAnimal !== true
      ))
      .length;
    
    return {
      totalAppearances: mainCharacterAppearances,
      consistency: mainCharacterAppearances / analysisResults.length,
      needsReplacement: mainCharacterAppearances > 0
    };
  }

  /**
   * Map characters across all pages for replacement strategy
   * Includes ALL pages - pages without human characters will use original image
   * FLEXIBLE: Looks for any human character, not just strictly marked "main character"
   */
  async mapCharacterAcrossPages(bookPages, bookAnalysis) {
    const characterMapping = [];
    
    for (let i = 0; i < bookAnalysis.pages.length; i++) {
      const pageAnalysis = bookAnalysis.pages[i];
      
      // Safety check: Ensure characters array exists
      if (!pageAnalysis.characters || !Array.isArray(pageAnalysis.characters)) {
        console.warn(`⚠️  Page ${i + 1}: No characters array found in analysis, creating fallback`);
        pageAnalysis.characters = [{
          isMainCharacter: true,
          isHuman: true,
          isAnimal: false,
          description: "main character (missing analysis)",
          position: "center",
          size: "medium",
          emotion: "neutral",
          pose: "standing",
          replaceWithChild: true,
          replacementDifficulty: "medium"
        }];
      }
      
      // Log characters found for debugging
      console.log(`🔍 Page ${i + 1}: Found ${pageAnalysis.characters.length} character(s)`);
      if (pageAnalysis.characters.length > 0) {
        pageAnalysis.characters.forEach((char, idx) => {
          console.log(`   - Character ${idx + 1}: ${char.description?.substring(0, 50)}... (isMain: ${char.isMainCharacter}, isHuman: ${char.isHuman !== false}, isAnimal: ${char.isAnimal === true})`);
        });
      }
      
      // STRATEGY 1: Try to find main character first
      let characterToReplace = pageAnalysis.characters.find(char => 
        char.isMainCharacter && 
        char.isHuman !== false && 
        char.isAnimal !== true && 
        (char.replaceWithChild !== false)
      );
      
      // STRATEGY 2: If no main character found, look for ANY human character (not animal)
      // This handles cases where AI doesn't consistently mark "isMainCharacter" on every page
      if (!characterToReplace && pageAnalysis.characters && pageAnalysis.characters.length > 0) {
        characterToReplace = pageAnalysis.characters.find(char => 
          char.isHuman !== false && 
          char.isAnimal !== true &&
          (char.replaceWithChild !== false) &&
          // Look for human-like characteristics
          (char.description?.toLowerCase().includes('child') ||
           char.description?.toLowerCase().includes('boy') ||
           char.description?.toLowerCase().includes('girl') ||
           char.description?.toLowerCase().includes('person') ||
           char.description?.toLowerCase().includes('kid') ||
           char.description?.toLowerCase().includes('human'))
        );
      }
      
      // STRATEGY 3: If still no character, check if ANY character exists that's not explicitly marked as animal
      if (!characterToReplace && pageAnalysis.characters && pageAnalysis.characters.length > 0) {
        characterToReplace = pageAnalysis.characters.find(char => 
          char.isAnimal !== true && // Not explicitly marked as animal
          char.isHuman !== false && // Not explicitly marked as non-human
          char.size && (char.size === 'large' || char.size === 'medium') // Has substantial presence
        );
      }
      
      // STRATEGY 4: Last resort - if page has ANY character that's not explicitly an animal, try to replace it
      if (!characterToReplace && pageAnalysis.characters && pageAnalysis.characters.length > 0) {
        characterToReplace = pageAnalysis.characters.find(char => char.isAnimal !== true);
        if (characterToReplace) {
          console.log(`⚠️  Page ${i + 1}: Using last-resort strategy - processing character that may not be explicitly human`);
        }
      }
      
      // STRATEGY 5: FORCE PROCESS - If still no character but analysis has character data, create a default character
      // This ensures ALL pages get processed unless they're explicitly text-only pages
      if (!characterToReplace && pageAnalysis.characters && pageAnalysis.characters.length > 0) {
        // Take the first character regardless
        characterToReplace = pageAnalysis.characters[0];
        console.log(`⚠️  Page ${i + 1}: FORCE PROCESSING - using first available character from analysis`);
      }
      
      // STRATEGY 6: ULTIMATE FALLBACK - FORCE PROCESS ALL PAGES
      // Process EVERY page unless it has explicit errors or is marked as text-only
      if (!characterToReplace) {
        console.warn(`⚠️  Page ${i + 1}: FORCE PROCESSING ALL PAGES - creating default character`);
        characterToReplace = {
          isMainCharacter: true,
          isHuman: true,
          isAnimal: false,
          description: "main character (forced processing - all pages)",
          position: "center",
          size: "medium",
          emotion: "neutral",
          pose: "standing",
          replaceWithChild: true,
          replacementDifficulty: "medium"
        };
      }
      
      // At this point, characterToReplace MUST exist due to Strategy 6 fallback
      // Every page will be processed
      const pageImageData = bookPages[i];
      const imagePreview = pageImageData ? `${pageImageData.substring(0, 50)}... (${pageImageData.length} chars)` : 'MISSING IMAGE DATA!';
      
      if (!characterToReplace) {
        // This should NEVER happen due to Strategy 6, but just in case
        console.error(`❌ CRITICAL: Page ${i + 1} has no character despite fallback strategies!`);
        console.error(`   This should never happen. Creating emergency fallback character.`);
        characterToReplace = {
          isMainCharacter: true,
          isHuman: true,
          isAnimal: false,
          description: "emergency fallback character",
          position: "center",
          size: "medium",
          emotion: "neutral",
          pose: "standing",
          replaceWithChild: true,
          replacementDifficulty: "medium"
        };
      }
      
      // ALL pages will be processed
      characterMapping.push({
        pageNumber: i + 1,
        character: characterToReplace,
        replacementNeeded: true, // ALWAYS true - process ALL pages
        replacementStrategy: this.determineReplacementStrategy(characterToReplace, i),
        pageImage: pageImageData
      });
      
      console.log(`✅ Page ${i + 1}: Character assigned (${characterToReplace.isMainCharacter ? 'main' : 'fallback'}), WILL BE PROCESSED`);
      console.log(`   📷 Page ${i + 1} image: ${imagePreview}`);
    }
    
    const replacementCount = characterMapping.filter(m => m.replacementNeeded).length;
    console.log(`📊 Character mapping complete: ${characterMapping.length} total pages`);
    console.log(`✅ ALL ${replacementCount} pages will be processed with face replacement`);
    
    // Verify ALL pages are being processed
    if (replacementCount !== characterMapping.length) {
      console.error(`❌ CRITICAL ERROR: Not all pages marked for processing!`);
      console.error(`   Expected: ${characterMapping.length}, Got: ${replacementCount}`);
      const skippedPages = characterMapping.filter(m => !m.replacementNeeded).map(m => m.pageNumber);
      console.error(`   Skipped pages: [${skippedPages.join(', ')}] - THIS SHOULD NOT HAPPEN!`);
    } else {
      console.log(`✅ Verified: 100% of pages (${replacementCount}/${characterMapping.length}) will be processed`);
    }
    
    return characterMapping;
  }

  /**
   * Determine replacement strategy for each character
   */
  determineReplacementStrategy(character, pageIndex) {
    return {
      faceReplacement: character.size === 'large' || character.size === 'medium',
      fullBodyReplacement: character.pose !== 'face_only',
      styleAdaptation: character.emotion,
      positionPreservation: character.position,
      sizeMaintenance: character.size,
      emotionPreservation: character.emotion,
      posePreservation: character.pose
    };
  }

  /**
   * Process all pages in batches for efficiency
   * IMPORTANT: Each page is processed individually to maintain 1:1 mapping
   * (one page = one processed image)
   * Uses pre-analyzed child features for consistency (same as cover generation)
   */
  async processPagesInBatches(bookPages, characterMapping, childImage, childName, childFeatures, options) {
    const batchSize = options.batchSize || 3;
    const processedPages = [];
    
    console.log(`🔄 Processing ${characterMapping.length} pages in batches of ${batchSize}`);
    console.log(`📊 Ensuring 1:1 mapping: ${characterMapping.length} pages → ${characterMapping.length} images`);
    
    const totalBatches = Math.ceil(characterMapping.length / batchSize);
    console.log(`📦 Will process ${totalBatches} batches total`);
    
    for (let i = 0; i < characterMapping.length; i += batchSize) {
      const batch = characterMapping.slice(i, i + batchSize);
      const batchNumber = Math.floor(i / batchSize) + 1;
      
      console.log(`\n🔄 ========== BATCH ${batchNumber}/${totalBatches} START ==========`);
      console.log(`   Pages in this batch: ${batch.map(m => m.pageNumber).join(', ')}`);
      console.log(`   Batch size: ${batch.length} pages`);
      
      try {
        // Process each page individually - ONE PAGE = ONE IMAGE
        // Pass previous page reference to maintain consistency
        // Get the last successfully processed page from all previous batches
        let lastProcessedPage = processedPages.length > 0 
          ? processedPages[processedPages.length - 1] 
          : null;
        
        // Process pages sequentially within batch to maintain consistency
        // This ensures each page can reference the previous one for consistent appearance
        const batchResults = [];
        for (let batchIdx = 0; batchIdx < batch.length; batchIdx++) {
          const mapping = batch[batchIdx];
          // Use the last successfully processed page with face replacement (from previous batch or previous page in this batch)
          // Find the most recent page that had a successful face replacement for consistency
          let previousPage = lastProcessedPage;
          if (batchResults.length > 0) {
            // Look for the most recent page that had a face replacement (not just original)
            for (let j = batchResults.length - 1; j >= 0; j--) {
              if (batchResults[j].success && batchResults[j].character && !batchResults[j].note) {
                previousPage = batchResults[j];
                break;
              }
            }
            // If no replacement page found in batch, use last from all processed pages
            if (!previousPage || previousPage.note) {
              previousPage = lastProcessedPage;
            }
          }
          
          const needsReplacement = mapping.replacementNeeded && mapping.character;
          const pageImagePreview = mapping.pageImage ? `${mapping.pageImage.substring(0, 30)}...` : 'NO IMAGE';
          console.log(`  📄 Processing page ${mapping.pageNumber}${needsReplacement ? ' (face replacement)' : ' (original preserved)'}`);
          console.log(`     Image data: ${pageImagePreview} (${mapping.pageImage ? mapping.pageImage.length : 0} chars)`);
          
          // Rate limit: wait before making request
          await this.rateLimiter.waitBeforeRequest();
          
          const result = await this.processPage(mapping, childImage, childName, childFeatures, previousPage);
          batchResults.push(result);
          
          // Log result
          if (result.success) {
            console.log(`     ✅ Page ${mapping.pageNumber} processed successfully`);
            this.rateLimiter.handleSuccess(); // Track successful request
          } else {
            console.log(`     ⚠️  Page ${mapping.pageNumber} processing issue: ${result.error || result.note || 'unknown'}`);
            // Check if it's a 503 error
            if (result.error && (result.error.includes('503') || result.error.includes('overloaded'))) {
              this.rateLimiter.handle503Error();
            }
          }
          
          // Update lastProcessedPage if this was a successful face replacement
          if (result.success && result.character && !result.note) {
            lastProcessedPage = result;
          }
          
          // Add delay between pages within batch to avoid rate limiting
          if (batchIdx < batch.length - 1) {
            console.log(`     ⏳ Waiting ${this.pageProcessingDelay}ms before next page in batch...`);
            await this.sleep(this.pageProcessingDelay);
          }
        }
        
        // Validate: Each result should have exactly one processed image
        batchResults.forEach((result, idx) => {
          if (!result.processedImage) {
            console.warn(`⚠️  Page ${result.pageNumber} has no processed image, using original`);
          } else {
            console.log(`  ✅ Page ${result.pageNumber} → 1 image generated`);
          }
        });
        
        processedPages.push(...batchResults);
        
        // Count successful vs failed pages in this batch
        const batchSuccessful = batchResults.filter(r => r.success && !r.usedOriginal).length;
        const batchFailed = batchResults.filter(r => !r.success || r.usedOriginal).length;
        
        console.log(`✅ Batch ${batchNumber} completed: ${batchResults.length} pages → ${batchResults.length} images`);
        console.log(`   ✅ Successfully processed: ${batchSuccessful} pages`);
        console.log(`   ❌ Failed (using originals): ${batchFailed} pages`);
        console.log(`📊 Total pages processed so far: ${processedPages.length}/${characterMapping.length}`);
        console.log(`🔄 ========== BATCH ${batchNumber}/${totalBatches} END ==========\n`);
        
        // Add delay between batches to avoid rate limiting
        if (i + batchSize < characterMapping.length) {
          console.log(`⏳ Waiting ${this.batchDelay}ms before next batch...`);
          await this.sleep(this.batchDelay);
        }
        
      } catch (error) {
        console.error(`❌ Batch ${batchNumber} failed with error:`, error);
        console.error(`   Error details: ${error.message}`);
        console.error(`   Stack trace:`, error.stack);
        
        // Add fallback pages for failed batch - still maintaining 1:1 mapping
        batch.forEach(mapping => {
          console.warn(`   ⚠️  Adding fallback for page ${mapping.pageNumber} due to batch error`);
          processedPages.push({
            pageNumber: mapping.pageNumber,
            processedImage: mapping.pageImage, // Use original if processing fails (1 page = 1 image)
            pageImage: mapping.pageImage, // Also include pageImage for compatibility
            success: false,
            error: error.message
          });
        });
        
        // CRITICAL: Continue processing next batch even if this one failed
        console.log(`   ⚠️  Batch ${batchNumber} completed with fallback, continuing to next batch...`);
      }
    }
    
    // Final validation: Ensure we have one image per page
    const pagesWithReplacement = processedPages.filter(p => p.success && p.character && !p.note && !p.usedOriginal).length;
    const pagesPreserved = processedPages.filter(p => p.note || (!p.character && p.success)).length;
    const pagesFailed = processedPages.filter(p => !p.success || p.usedOriginal).length;
    
    console.log(`\n${"=".repeat(80)}`);
    console.log(`📊 FINAL PROCESSING SUMMARY`);
    console.log(`${"=".repeat(80)}`);
    console.log(`📊 Total pages: ${processedPages.length}`);
    console.log(`✅ Successfully replaced: ${pagesWithReplacement} pages`);
    console.log(`❌ Failed (using originals): ${pagesFailed} pages`);
    console.log(`📝 Preserved: ${pagesPreserved} pages`);
    
    // Log failed pages details
    if (pagesFailed > 0) {
      console.log(`\n⚠️  FAILED PAGES DETAILS:`);
      processedPages.filter(p => !p.success || p.usedOriginal).forEach(p => {
        console.log(`   ❌ Page ${p.pageNumber}: ${p.error || 'Used original image'}`);
      });
    }
    
    console.log(`${"=".repeat(80)}\n`);
    
    if (processedPages.length !== characterMapping.length) {
      console.warn(`⚠️  Warning: Expected ${characterMapping.length} images but got ${processedPages.length}`);
    }
    
    if (pagesWithReplacement === 0) {
      console.error(`\n❌❌❌ CRITICAL ERROR: NO PAGES WERE SUCCESSFULLY REPLACED! ❌❌❌`);
      console.error(`   All pages are showing original images.`);
      console.error(`   This indicates a systemic issue with the AI generation process.`);
    } else if (pagesWithReplacement < characterMapping.length * 0.5) {
      console.warn(`\n⚠️⚠️⚠️  WARNING: Less than 50% of pages were successfully replaced!`);
      console.warn(`   Only ${pagesWithReplacement} out of ${characterMapping.length} pages were processed.`);
    }
    
    return processedPages;
  }

  /**
   * Analyze child's image to extract key features (similar to cover generator)
   */
  async _analyzeChildImage(childImageBase64, childName) {
    // Retry logic for API calls
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        // Rate limit: wait before making request
        await this.rateLimiter.waitBeforeRequest();
        
        const model = this.genAI.getGenerativeModel({
          model: this.model,
        });

        const analysisPrompt = `Analyze this child's photo and describe:
1. Physical appearance (hair color, hair style, eye color, skin tone)
2. Approximate age and gender (if determinable)
3. Facial features (round face, oval face, etc.)
4. Expression and mood
5. Clothing or accessories visible

Child's name: ${childName || "N/A"}

Provide detailed but natural descriptions suitable for creating an illustrated character. Focus on features that need to remain consistent across all pages of a book.`;

        console.log(`👶 Analyzing child image for page processing (attempt ${attempt}/${this.maxRetries})...`);

        // Strip data URI prefix if present
        const cleanChildImage = this._stripDataUriPrefix(childImageBase64);

        const result = await model.generateContent([
          {
            inlineData: {
              data: cleanChildImage,
              mimeType: "image/jpeg",
            },
          },
          analysisPrompt,
        ]);

        const response = await result.response;
        const analysisText = response.text();

        console.log(`✅ Child analysis successful${attempt > 1 ? ` (after ${attempt} attempts)` : ''}`);
        this.rateLimiter.handleSuccess(); // Track successful request

        return {
          name: childName || "the child",
          appearance: analysisText,
          features: this._extractKeyFeatures(analysisText),
        };
      } catch (error) {
        const errorStatus = error.status || error.statusCode || (error.message?.includes('500') ? 500 : null);
        const isRetryable = this._isRetryableError(error, errorStatus);
        
        console.error(`❌ Child analysis failed (attempt ${attempt}/${this.maxRetries}):`, error.message);
        if (errorStatus) {
          console.error(`   Error status: ${errorStatus}`);
        }
        
        // If 503 error, update rate limiter for adaptive backoff
        if (errorStatus === 503) {
          this.rateLimiter.handle503Error();
        }
        
        // If this was the last attempt or error is not retryable, return default
        if (attempt === this.maxRetries || !isRetryable) {
          if (!isRetryable) {
            console.warn(`⚠️  Non-retryable error, using default child features`);
          } else {
            console.warn(`⚠️  Using default child features after ${this.maxRetries} failed attempts`);
          }
          return {
            name: childName || "the child",
            appearance: "a young child",
            features: "happy and friendly",
          };
        }
        
        // Wait before retrying (exponential backoff with jitter)
        let baseDelay = this.retryDelay;
        if (errorStatus === 503) {
          baseDelay = Math.max(this.retryDelay, this.rateLimiter.currentDelay);
        }
        const delay = baseDelay * Math.pow(2, attempt - 1);
        const jitter = Math.random() * 2000;
        const totalDelay = delay + jitter;
        console.log(`⏳ Waiting ${Math.round(totalDelay)}ms before retry (exponential backoff${errorStatus === 503 ? ' + 503 adaptive delay' : ''})...`);
        await this.sleep(totalDelay);
      }
    }
  }

  /**
   * Extract key features from child analysis text (helper method)
   */
  _extractKeyFeatures(analysisText) {
    const features = [];
    const featureKeywords = ["hair", "eyes", "smile", "face", "skin"];
    const lowerText = analysisText.toLowerCase();

    for (const keyword of featureKeywords) {
      const regex = new RegExp(`([^.]*${keyword}[^.]*)`, "i");
      const match = analysisText.match(regex);
      if (match) {
        features.push(match[1].trim());
      }
    }

    return features.length > 0 ? features.join(", ") : "distinctive features";
  }

  /**
   * Generate dynamic prompt for page processing using AI (similar to cover generator)
   * This makes the prompt truly adaptive and intelligent
   */
  async _generateDynamicPagePrompt(pageAnalysis, childFeatures, characterMapping, childName, previousPageReference = null) {
    // SIMPLIFIED: Use static prompt instead of complex AI-generated one
    // This is more reliable and faster
    return this.generatePagePrompt(characterMapping, childName, previousPageReference);
    
    /* DISABLED: Complex dynamic prompt generation - using simple static prompt instead
    // Retry logic for API calls
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        // Rate limit: wait before making request
        await this.rateLimiter.waitBeforeRequest();
        
        const model = this.genAI.getGenerativeModel({
          model: this.model,
        });

        const { character, pageNumber } = characterMapping;

        // SIMPLIFIED meta-prompt
        const metaPrompt = `Create a simple, clear prompt for replacing the main human character in a children's book page with ${childName}.

The task is:
1. Find the main human character in the book page
2. Replace them with a cartoonized version of ${childName}
3. Keep everything else the same (background, text, other characters)
4. Match the book's illustration style
5. Remove any scanning watermarks like "Digitized by Google"

Child's features: ${childFeatures.appearance}

Character to replace: ${character.description} at position ${character.position}

Create a clear, concise prompt that tells the AI exactly what to do. Keep it simple and direct.`;

        console.log(`🤖 Generating simplified AI prompt for page ${pageNumber} (attempt ${attempt}/${this.maxRetries})...`);

        const result = await model.generateContent(metaPrompt);
        const response = await result.response;
        const generatedPrompt = response.text().trim();

        console.log(`✅ Simplified prompt generated for page ${pageNumber}${attempt > 1 ? ` (after ${attempt} attempts)` : ''}`);
        this.rateLimiter.handleSuccess(); // Track successful request

        return generatedPrompt;
      } catch (error) {
        const errorStatus = error.status || error.statusCode || (error.message?.includes('500') ? 500 : null);
        const isRetryable = this._isRetryableError(error, errorStatus);
        
        console.error(`❌ AI prompt generation failed for page ${characterMapping.pageNumber} (attempt ${attempt}/${this.maxRetries}):`, error.message);
        if (errorStatus) {
          console.error(`   Error status: ${errorStatus}`);
        }
        
        // If 503 error, update rate limiter for adaptive backoff
        if (errorStatus === 503) {
          this.rateLimiter.handle503Error();
        }
        
        // If this was the last attempt or error is not retryable, use fallback
        if (attempt === this.maxRetries || !isRetryable) {
          if (!isRetryable) {
            console.warn(`⚠️  Non-retryable error, using fallback prompt for page ${characterMapping.pageNumber}`);
          } else {
            console.warn(`⚠️  Using fallback prompt for page ${characterMapping.pageNumber} after ${this.maxRetries} failed attempts`);
          }
          return this.generatePagePrompt(characterMapping, childName, previousPageReference);
        }
        
        // Wait before retrying (exponential backoff with jitter)
        let baseDelay = this.retryDelay;
        if (errorStatus === 503) {
          baseDelay = Math.max(this.retryDelay, this.rateLimiter.currentDelay);
        }
        const delay = baseDelay * Math.pow(2, attempt - 1);
        const jitter = Math.random() * 2000;
        const totalDelay = delay + jitter;
        console.log(`⏳ Waiting ${Math.round(totalDelay)}ms before retry (exponential backoff${errorStatus === 503 ? ' + 503 adaptive delay' : ''})...`);
        await this.sleep(totalDelay);
      }
    }
    */ // End of disabled complex prompt generation
  }

  /**
   * Process a single page with character replacement (with retry logic)
   * SIMPLIFIED APPROACH: Just replace human character with cartoonized child
   * Uses straightforward prompt - no complex analysis
   * IMPORTANT: This function processes ONE page and returns ONE image
   * Ensures 1:1 mapping (one page = one processed image)
   * Maintains consistent character appearance across all pages using pre-analyzed child features
   */
  async processPage(characterMapping, childImage, childName, childFeatures, previousPage = null) {
    const { character, pageImage, pageNumber, replacementNeeded } = characterMapping;
    
    console.log(`\n🔍 DEBUG - Processing Page ${pageNumber}:`);
    console.log(`   - Has pageImage: ${!!pageImage}`);
    console.log(`   - Has character: ${!!character}`);
    console.log(`   - replacementNeeded: ${replacementNeeded}`);
    console.log(`   - Character description: ${character?.description?.substring(0, 50)}...`);
    
    // Validate: Ensure we have valid page image
    if (!pageImage) {
      console.error(`❌ Page ${pageNumber}: No page image provided!`);
      throw new Error(`No page image provided for page ${pageNumber}`);
    }
    
    // Validate: Ensure character exists (should ALWAYS exist now due to fallback strategies)
    if (!character) {
      console.error(`❌ CRITICAL: Page ${pageNumber} has no character! This should never happen.`);
      throw new Error(`No character data for page ${pageNumber}`);
    }
    
    // Validate: Ensure replacementNeeded is true (should ALWAYS be true now)
    if (!replacementNeeded) {
      console.error(`❌ CRITICAL: Page ${pageNumber} marked as no replacement needed! This should never happen.`);
      console.error(`   Forcing processing anyway...`);
    }
    
    // Check if character is explicitly marked as animal
    if (character.isAnimal === true) {
      console.warn(`⚠️  Page ${pageNumber}: Character marked as animal, but will still process`);
      console.warn(`   This may not produce good results, but processing all pages as requested`);
    }
    
    // FORCE PROCESSING - Always attempt to process this page
    console.log(`✅ Page ${pageNumber}: Proceeding with AI image generation...`);


    // Step 4: Generate the image (same as cover generator)
    // Retry logic for failed image generation
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        // Get prompt (use dynamic if available, otherwise static)
        // Use pre-analyzed child features (same as cover generation) - no need to re-analyze
        let prompt;
        try {
          // Step 1: Use pre-analyzed child features (already done once at the start - same as cover generation)
          console.log(`👶 Using pre-analyzed child features for page ${pageNumber} (consistent across all pages)...`);
          console.log(`   Child name: ${childFeatures.name}`);
          console.log(`   Key features: ${childFeatures.features}`);

          // Step 2: Get page analysis (already done during analyzeCompleteBook)
          // We'll use the character mapping data as page analysis
          const pageAnalysis = {
            pageNumber: pageNumber,
            character: character,
            scene: characterMapping.replacementStrategy || {},
            replacementGuidance: characterMapping.replacementGuidance || {}
          };

          // Step 3: Generate dynamic prompt using AI (similar to cover generator)
          // Uses the same child analysis that was used for cover generation
          console.log(`🤖 Generating AI prompt for page ${pageNumber} using consistent child analysis...`);
          prompt = await this._generateDynamicPagePrompt(
            pageAnalysis,
            childFeatures,
            characterMapping,
            childName,
            previousPage
          );
          console.log(`✅ AI prompt generated for page ${pageNumber}`);
          console.log(`📝 Prompt preview: ${prompt.substring(0, 200)}...`);
        } catch (promptError) {
          // If prompt generation fails, fall back to static prompt (still uses pre-analyzed child features)
          console.warn(`⚠️  Using static prompt for page ${pageNumber} due to error:`, promptError.message);
          prompt = this.generatePagePrompt(characterMapping, childName, previousPage);
        }
        
        console.log(`📸 Image order: 1) Child reference photo, 2) PDF page to edit`);
        
        console.log(`🎨 Processing page ${pageNumber} → generating 1 image (attempt ${attempt}/${this.maxRetries})...`);
        
        // Strip data URI prefix if present (Google API expects only base64 string)
        const cleanChildImage = this._stripDataUriPrefix(childImage);
        const cleanPageImage = this._stripDataUriPrefix(pageImage);
        
        // Rate limit: wait before making request
        await this.rateLimiter.waitBeforeRequest();
        
        // Use image generation model (not text model) for image generation
        const generativeModel = this.genAI.getGenerativeModel({ model: this.imageModel });
        
        // Prepare multi-image input with prompt (same as cover generator)
        const contents = [{
          role: "user",
          parts: [
            {
              inlineData: {
                data: cleanChildImage,
                mimeType: "image/jpeg"
              }
            },
            {
              inlineData: {
                data: cleanPageImage,
                mimeType: "image/jpeg"
              }
            },
            { text: prompt }
          ]
        }];
        
        const generationConfig = {
          responseModalities: ["IMAGE"]
        };
        
        let generatedImageData = null;
        
        // Try streaming first (same as cover generator - faster)
        try {
          const streamResult = await generativeModel.generateContentStream({
            contents,
            generationConfig
          });
          
          for await (const chunk of streamResult.stream) {
            if (chunk.candidates?.[0]?.content?.parts) {
              for (const part of chunk.candidates[0].content.parts) {
                if (part.inlineData?.data) {
                  generatedImageData = part.inlineData.data;
                  console.log(`✅ Page ${pageNumber} generated (streaming): ${generatedImageData.length} bytes${attempt > 1 ? ` (after ${attempt} attempts)` : ''}`);
                  this.rateLimiter.handleSuccess(); // Track successful request
                  return {
                    pageNumber,
                    processedImage: generatedImageData,
                    success: true,
                    character: character.description,
                    attempts: attempt
                  };
                }
              }
            }
          }
        } catch (streamError) {
          console.log(`   Streaming failed for page ${pageNumber}, trying non-stream fallback...`);
        }
        
        // Fallback to non-streaming (same as cover generator)
        const result = await generativeModel.generateContent({
          contents,
          generationConfig
        });
        
        const response = await result.response;
        
        if (response.candidates) {
          for (const candidate of response.candidates) {
            if (candidate.content?.parts) {
              for (const part of candidate.content.parts) {
                if (part.inlineData?.data) {
                  generatedImageData = part.inlineData.data;
                  console.log(`✅ Page ${pageNumber} generated (fallback): ${generatedImageData.length} bytes${attempt > 1 ? ` (after ${attempt} attempts)` : ''}`);
                  this.rateLimiter.handleSuccess(); // Track successful request
                  return {
                    pageNumber,
                    processedImage: generatedImageData,
                    success: true,
                    character: character.description,
                    attempts: attempt
                  };
                }
              }
            }
          }
        }
        
        throw new Error('No image data returned from Gemini API');
        
      } catch (error) {
        const errorStatus = error.status || error.statusCode || (error.message?.includes('500') ? 500 : null);
        const isRetryable = this._isRetryableError(error, errorStatus);
        
        console.error(`❌ Page ${pageNumber} processing failed (attempt ${attempt}/${this.maxRetries}):`, error.message);
        if (errorStatus) {
          console.error(`   Error status: ${errorStatus}`);
        }
        
        // If 503 error, update rate limiter for adaptive backoff
        if (errorStatus === 503) {
          this.rateLimiter.handle503Error();
        }
        
        // If this was the last attempt or error is not retryable, return with original image
        if (attempt === this.maxRetries || !isRetryable) {
          if (!isRetryable) {
            console.warn(`⚠️  Non-retryable error, using original page ${pageNumber}`);
          } else {
            console.warn(`⚠️  Using original page ${pageNumber} after ${this.maxRetries} failed attempts`);
          }
          console.error(`❌ FINAL ERROR for page ${pageNumber}:`, error.message);
          console.error(`❌ This page will show the ORIGINAL image (not personalized)`);
          return {
            pageNumber: characterMapping.pageNumber,
            processedImage: characterMapping.pageImage, // Use original as fallback
            pageImage: characterMapping.pageImage, // Also include pageImage for compatibility
            success: false,
            error: error.message,
            character: characterMapping.character ? characterMapping.character.description : null,
            attempts: attempt,
            usedOriginal: true // Flag to indicate original was used
          };
        }
        
        // Wait before retrying (exponential backoff with jitter)
        // For 503 errors, use longer delays based on rate limiter
        let baseDelay = this.retryDelay;
        if (errorStatus === 503) {
          // Use rate limiter's current delay as base for 503 errors
          baseDelay = Math.max(this.retryDelay, this.rateLimiter.currentDelay);
        }
        const delay = baseDelay * Math.pow(2, attempt - 1);
        // Add random jitter (0-2s) to avoid thundering herd
        const jitter = Math.random() * 2000;
        const totalDelay = delay + jitter;
        console.log(`⏳ Waiting ${Math.round(totalDelay)}ms before retry (exponential backoff${errorStatus === 503 ? ' + 503 adaptive delay' : ''})...`);
        await this.sleep(totalDelay);
      }
    }
  }

  /**
   * SIMPLIFIED prompt for page processing - just replace human character with cartoonized child
   * Direct and straightforward approach
   */
  generatePagePrompt(characterMapping, childName, previousPageReference = null) {
    return "🎯 SIMPLE TASK: Replace the human character in the book page with a cartoonized version of " + childName + ".\n\n" +
      "📸 IMAGES PROVIDED:\n" +
      "1. FIRST IMAGE: Photo of " + childName + " (the child to insert into the story)\n" +
      "2. SECOND IMAGE: Book page from PDF (the page to modify)\n\n" +
      "✅ WHAT TO DO:\n" +
      "1. Find the MAIN HUMAN CHARACTER in the SECOND IMAGE (the book page)\n" +
      "2. Replace that character with a CARTOONIZED/ILLUSTRATED version of " + childName + " from the FIRST IMAGE\n" +
      "3. Make " + childName + " look like they belong in this book illustration style\n" +
      "4. Keep " + childName + " key features: skin tone, hair color, facial features\n" +
      "5. Match the artistic style of the book (cartoon/watercolor/digital art)\n" +
      "6. Keep the SAME pose, clothing, and position as the original character\n" +
      "7. Remove any 'Digitized by Google' watermarks or scanning artifacts\n\n" +
      "❌ WHAT NOT TO DO:\n" +
      "- Don't change the background\n" +
      "- Don't change other characters (animals, people, etc.)\n" +
      "- Don't change the text\n" +
      "- Don't change the scene/setting\n" +
      "- Don't regenerate the whole page - just replace the one character\n\n" +
      "🎨 STYLE MATCHING:\n" +
      "- Make " + childName + " look like they were drawn in the book art style\n" +
      "- Keep their distinctive features recognizable\n" +
      "- Match the colors, shading, and artistic technique of the book\n" +
      "- Make it look natural and seamless\n\n" +
      "🔄 CONSISTENCY:\n" +
      "- Use the SAME skin tone, hair color, and facial features for " + childName + " on every page\n" +
      "- They should be instantly recognizable as the same child throughout the book\n" +
      "- Copy their appearance from the reference photo (FIRST IMAGE)\n\n" +
      "📝 OUTPUT:\n" +
      "Return the book page with " + childName + " as the main character, looking like they were always part of the story.";
  }


  /**
   * Assemble the final personalized book
   */
  async assemblePersonalizedBook(processedPages, bookTitle, childName) {
    const successfulPages = processedPages.filter(page => page.success);
    const failedPages = processedPages.filter(page => !page.success);
    
    const bookMetadata = {
      title: bookTitle,
      childName: childName,
      totalPages: processedPages.length,
      successfulPages: successfulPages.length,
      failedPages: failedPages.length,
      createdAt: new Date().toISOString()
    };
    
    return {
      metadata: bookMetadata,
      pages: processedPages.sort((a, b) => a.pageNumber - b.pageNumber),
      success: successfulPages.length > 0
    };
  }

  /**
   * Clean JSON response by removing markdown code blocks
   * @param {string} text - Raw response text from AI
   * @returns {string} - Cleaned JSON string
   */
  _cleanJsonResponse(text) {
    if (!text) return text;
    
    // Remove markdown code blocks (```json ... ``` or ``` ... ```)
    let cleaned = text.trim();
    
    // Remove opening code block markers
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '');
    
    // Remove closing code block markers
    cleaned = cleaned.replace(/\s*```$/i, '');
    
    // Remove any leading/trailing whitespace
    cleaned = cleaned.trim();
    
    // Try to find JSON object/array boundaries if still wrapped
    const jsonMatch = cleaned.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (jsonMatch) {
      cleaned = jsonMatch[0];
    }
    
    return cleaned;
  }

  /**
   * Check if an error is retryable
   * @param {Error} error - The error object
   * @param {number|null} statusCode - HTTP status code if available
   * @returns {boolean} - True if error should be retried
   */
  _isRetryableError(error, statusCode) {
    // Retry on 5xx server errors (500, 502, 503, 504)
    if (statusCode >= 500 && statusCode < 600) {
      return true;
    }
    
    // Retry on 429 (Too Many Requests)
    if (statusCode === 429) {
      return true;
    }
    
    // Retry on network errors
    if (error.message?.includes('ECONNRESET') || 
        error.message?.includes('ETIMEDOUT') ||
        error.message?.includes('ENOTFOUND') ||
        error.message?.includes('network')) {
      return true;
    }
    
    // Retry on Google API specific errors that indicate temporary issues
    if (error.message?.includes('Internal Server Error') ||
        error.message?.includes('Service Unavailable') ||
        error.message?.includes('Gateway Timeout') ||
        error.message?.includes('temporarily unavailable')) {
      return true;
    }
    
    // Don't retry on 4xx client errors (except 429)
    if (statusCode >= 400 && statusCode < 500) {
      return false;
    }
    
    // Default: retry on unknown errors (could be temporary)
    return true;
  }

  /**
   * Strip data URI prefix from base64 image data if present
   * Google API expects only the base64 string, not the data URI format
   * @param {string} imageData - Base64 image data (may include data URI prefix)
   * @returns {string} - Clean base64 string without prefix
   */
  _stripDataUriPrefix(imageData) {
    if (!imageData || typeof imageData !== 'string') {
      return imageData;
    }
    
    // Remove data URI prefix if present (e.g., "data:image/jpeg;base64,")
    return imageData.replace(/^data:image\/\w+;base64,/, '');
  }

  /**
   * Utility function for delays
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = CompleteBookPersonalizationService;
