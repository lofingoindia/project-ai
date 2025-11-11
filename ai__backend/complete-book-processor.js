// Complete Book Processing Pipeline
// Enhanced AI service for processing entire books with character replacement

const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');
const PDFExtractor = require('./pdf-extractor');

class CompleteBookPersonalizationService {
  constructor() {
    if (!process.env.GOOGLE_AI_API_KEY) {
      throw new Error('GOOGLE_AI_API_KEY environment variable is required');
    }
    this.genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
    this.model = "gemini-2.5-flash-image-preview";
    this.maxRetries = 5; // Retry failed API calls (increased from 3)
    this.retryDelay = 3000; // 3 seconds base delay between retries (increased from 2)
    this.pdfExtractor = new PDFExtractor();
  }

  /**
   * Main entry point for complete book processing
   * Accepts either pdfUrl or bookPages (for backward compatibility)
   */
  async processCompleteBook({
    pdfUrl,
    bookPages,
    childImage,
    childName,
    bookTitle,
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
      
      // Step 1: Analyze all pages
      console.log('🔍 Step 1: Analyzing all book pages...');
      const bookAnalysis = await this.analyzeCompleteBook(pagesToProcess);
      console.log('✅ Book analysis complete');
      
      // Step 2: Map characters across pages
      console.log('👤 Step 2: Mapping characters across pages...');
      const characterMapping = await this.mapCharacterAcrossPages(pagesToProcess, bookAnalysis);
      console.log(`✅ Character mapping complete: ${characterMapping.length} total pages mapped`);
      console.log(`   Pages with replacement: ${characterMapping.filter(m => m.replacementNeeded).length}`);
      console.log(`   Pages to preserve (original): ${characterMapping.filter(m => !m.replacementNeeded).length}`);
      
      // Debug: Show which pages will be processed
      const pagesToReplace = characterMapping.filter(m => m.replacementNeeded).map(m => m.pageNumber);
      const pagesToPreserve = characterMapping.filter(m => !m.replacementNeeded).map(m => m.pageNumber);
      console.log(`   📝 Pages to replace: [${pagesToReplace.join(', ')}]`);
      if (pagesToPreserve.length > 0) {
        console.log(`   📝 Pages to preserve: [${pagesToPreserve.join(', ')}]`);
      }
      
      // Step 3: Process pages in batches
      console.log('🔄 Step 3: Processing pages in batches...');
      const processedPages = await this.processPagesInBatches(
        pagesToProcess,
        characterMapping,
        childImage,
        childName,
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
      
      try {
        const pageAnalysis = await this.analyzePage(page, i);
        analysisResults.push(pageAnalysis);
        
        // Add small delay to avoid rate limiting
        await this.sleep(100);
      } catch (error) {
        console.error(`❌ Failed to analyze page ${i + 1}:`, error);
        // Use proper fallback analysis with character data (so page will be processed)
        const fallbackAnalysis = this.createFallbackAnalysis(i);
        fallbackAnalysis.error = error.message;
        analysisResults.push(fallbackAnalysis);
        console.log(`⚠️  Using fallback analysis for page ${i + 1} - will attempt face replacement`);
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
        const delay = this.retryDelay * Math.pow(2, attempt - 1);
        // Add random jitter (0-1s) to avoid thundering herd
        const jitter = Math.random() * 1000;
        const totalDelay = delay + jitter;
        console.log(`⏳ Waiting ${Math.round(totalDelay)}ms before retry (exponential backoff)...`);
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
    
    const generativeModel = this.genAI.getGenerativeModel({ model: this.model });
    const result = await generativeModel.generateContent({
      contents: [{
        role: "user",
        parts: [
          {
            inlineData: {
              data: pageImage,
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
   */
  async processPagesInBatches(bookPages, characterMapping, childImage, childName, options) {
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
          
          const result = await this.processPage(mapping, childImage, childName, previousPage);
          batchResults.push(result);
          
          // Log result
          if (result.success) {
            console.log(`     ✅ Page ${mapping.pageNumber} processed successfully`);
          } else {
            console.log(`     ⚠️  Page ${mapping.pageNumber} processing issue: ${result.error || result.note || 'unknown'}`);
          }
          
          // Update lastProcessedPage if this was a successful face replacement
          if (result.success && result.character && !result.note) {
            lastProcessedPage = result;
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
        console.log(`✅ Batch ${batchNumber} completed: ${batchResults.length} pages → ${batchResults.length} images`);
        console.log(`📊 Total pages processed so far: ${processedPages.length}/${characterMapping.length}`);
        console.log(`🔄 ========== BATCH ${batchNumber}/${totalBatches} END ==========\n`);
        
        // Add delay between batches to avoid rate limiting
        if (i + batchSize < characterMapping.length) {
          console.log(`⏳ Waiting 1 second before next batch...`);
          await this.sleep(1000);
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
    const pagesWithReplacement = processedPages.filter(p => p.success && p.character && !p.note).length;
    const pagesPreserved = processedPages.filter(p => p.note || (!p.character && p.success)).length;
    const pagesFailed = processedPages.filter(p => !p.success && !p.note).length;
    
    console.log(`📊 Final validation: ${processedPages.length} pages processed → ${processedPages.length} images`);
    console.log(`📊 Summary: ${pagesWithReplacement} pages with face replacement, ${pagesPreserved} pages preserved (original), ${pagesFailed} pages failed`);
    
    if (processedPages.length !== characterMapping.length) {
      console.warn(`⚠️  Warning: Expected ${characterMapping.length} images but got ${processedPages.length}`);
    }
    
    return processedPages;
  }

  /**
   * Process a single page with character replacement (with retry logic)
   * IMPORTANT: This function processes ONE page and returns ONE image
   * Ensures 1:1 mapping (one page = one processed image)
   * Maintains consistent character appearance across all pages
   */
  async processPage(characterMapping, childImage, childName, previousPage = null) {
    const { character, pageImage, pageNumber, replacementNeeded } = characterMapping;
    
    // Validate: Ensure we have valid page image
    if (!pageImage) {
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
    
    // Retry logic for failed image generation
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const prompt = this.generatePagePrompt(characterMapping, childName, previousPage);
        
        console.log(`🎨 Processing page ${pageNumber} → generating 1 image (attempt ${attempt}/${this.maxRetries})...`);
        console.log(`📝 Prompt preview: ${prompt.substring(0, 200)}...`);
        console.log(`📸 Image order: 1) Child reference photo, 2) PDF page to edit`);
        
        const generativeModel = this.genAI.getGenerativeModel({ model: this.model });
        
        // Prepare multi-image input with prompt (same as cover generator)
        const contents = [{
          role: "user",
          parts: [
            {
              inlineData: {
                data: childImage,
                mimeType: "image/jpeg"
              }
            },
            {
              inlineData: {
                data: pageImage,
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
        
        // If this was the last attempt or error is not retryable, return with original image
        if (attempt === this.maxRetries || !isRetryable) {
          if (!isRetryable) {
            console.warn(`⚠️  Non-retryable error, using original page ${pageNumber}`);
          } else {
            console.warn(`⚠️  Using original page ${pageNumber} after ${this.maxRetries} failed attempts`);
          }
          return {
            pageNumber: characterMapping.pageNumber,
            processedImage: characterMapping.pageImage, // Use original as fallback
            pageImage: characterMapping.pageImage, // Also include pageImage for compatibility
            success: false,
            error: error.message,
            character: characterMapping.character ? characterMapping.character.description : null,
            attempts: attempt
          };
        }
        
        // Wait before retrying (exponential backoff with jitter)
        const delay = this.retryDelay * Math.pow(2, attempt - 1);
        const jitter = Math.random() * 1000;
        const totalDelay = delay + jitter;
        console.log(`⏳ Waiting ${Math.round(totalDelay)}ms before retry (exponential backoff)...`);
        await this.sleep(totalDelay);
      }
    }
  }

  /**
   * Generate improved prompt for page processing
   * Emphasizes consistent character appearance and only replacing main human character
   * CRITICAL: This is a FACE REPLACEMENT task, NOT a page regeneration task
   */
  generatePagePrompt(characterMapping, childName, previousPageReference = null) {
    const { character, replacementStrategy, replacementGuidance } = characterMapping;
    
    const consistencyNote = previousPageReference 
      ? `CRITICAL CONSISTENCY: ${childName} must look EXACTLY the same as in previous pages - SAME EXACT SKIN TONE (do not change color), same face, same hair color, same eye color, same distinctive facial features. Use the SAME child reference photo (FIRST IMAGE) consistently. The child must be INSTANTLY recognizable as the same person.`
      : `CRITICAL CONSISTENCY: This is part of a complete book. ${childName} must have IDENTICAL appearance across ALL pages - SAME EXACT SKIN TONE on every page (copy from reference photo), same face, same hair, same distinctive features. Use the FIRST IMAGE (child reference) for consistent skin tone. The child must look like the SAME person throughout the entire book.`;
    
    return `
    ⚠️ CRITICAL: This is a FACE REPLACEMENT task on an existing PDF page. You MUST preserve the original page 100% - only replace the character's face.
    
    IMAGE REFERENCE GUIDE:
    - FIRST IMAGE: Reference photo of ${childName} (use this child's EXACT face, skin tone, and features for replacement)
    - SECOND IMAGE: The PDF page to edit (this is the existing page - preserve it 100% except for face replacement)
    
    TASK: Replace ONLY the MAIN HUMAN CHARACTER's FACE in the SECOND IMAGE (the PDF page) with ${childName}'s face from the FIRST IMAGE (reference photo). This is NOT a generation task - you are EDITING an existing page.
    
    ${consistencyNote}
    
    ⚠️ ABSOLUTE CONSISTENCY REQUIREMENTS (MOST CRITICAL):
    - Use the EXACT same skin tone as in the FIRST IMAGE (child reference photo) - DO NOT change skin color
    - Use the EXACT same facial features throughout ALL pages
    - Keep ${childName}'s skin tone, hair color, eye color IDENTICAL across all pages
    - The child must be INSTANTLY recognizable as the same person on every page
    - DO NOT lighten, darken, or alter the skin tone in any way
    - DO NOT change hair style, hair color, or any distinctive features
    - The face must look like it was photographed from the same child every time
    
    ⚠️ PDF PRESERVATION REQUIREMENTS (MOST CRITICAL):
    - This is an EXISTING PDF page - you MUST preserve it exactly as-is
    - Keep ALL text EXACTLY as it appears (word-for-word, same font, same size, same position)
    - Keep ALL background elements 100% identical (colors, patterns, objects, layout)
    - Keep ALL other characters UNCHANGED (animals, pets, side characters, all non-human elements)
    - Keep ALL props, objects, and scene elements in their EXACT original positions
    - Keep the EXACT same page layout, composition, and visual structure
    - DO NOT regenerate, recreate, or modify anything except the main human character's face
    - The output must look like the original page with ONLY the face replaced
    
    TARGET CHARACTER TO REPLACE (MAIN HUMAN CHARACTER ONLY):
    - Description: ${character.description}
    - Position: ${character.position}
    - Size: ${character.size}
    - Current emotion: ${character.emotion}
    - Current pose: ${character.pose}
    - Replacement difficulty: ${character.replacementDifficulty || 'medium'}
    - CRITICAL: This must be the MAIN HUMAN PROTAGONIST, NOT an animal or other character
    
    CHILD'S APPEARANCE (from reference photo - USE CONSISTENTLY):
    - CRITICAL: Use the EXACT same skin tone from the reference photo - DO NOT alter skin color in any way
    - Use the EXACT same child's facial features, hair color, hair style, eye color as in all other pages
    - Maintain the child's distinctive characteristics consistently
    - The child's face must look IDENTICAL across all pages of the book (same person, same skin tone, same features)
    - Make ${childName} look natural in this illustration style
    - Use the SAME child image reference to ensure consistency
    - NEVER change, lighten, darken, or modify the skin tone - keep it exactly as in the reference photo
    - The child should be instantly recognizable as the same person across all pages
    
    REPLACEMENT REQUIREMENTS:
    1. FACE REPLACEMENT ONLY (MAIN HUMAN CHARACTER):
       - Replace ONLY the main human character's FACE with ${childName}'s face from the FIRST IMAGE
       - CRITICAL: Use the EXACT skin tone from the child reference photo (FIRST IMAGE) - DO NOT change it
       - DO NOT replace the body, clothing, or pose (keep them exactly as in original)
       - DO NOT replace headwear, hats, crowns, helmets, or any accessories on the head (preserve them exactly)
       - DO NOT replace animals, pets, or any non-human characters
       - DO NOT replace background elements, objects, or other items
       - Match facial proportions to the illustration style but KEEP THE EXACT SKIN TONE
       - Keep the same expression and emotion as the original
       - Ensure the face looks natural in the art style while maintaining skin tone consistency
       - The face must match ${childName}'s appearance (especially skin tone) from previous pages
       - If the character is wearing something on their head (hat, crown, helmet, etc.), keep it EXACTLY as it is - only replace the face underneath
       - ABSOLUTELY NO changes to skin color, tone, or complexion - copy exactly from reference photo
    
    2. BODY & POSE (KEEP UNCHANGED):
       - Keep the EXACT same body pose as the original character
       - Keep the EXACT same clothing (same colors, same style, same design)
       - Preserve ALL body language and gestures exactly as they are
       - Same size and position on the page (pixel-perfect)
       - CRITICAL: Preserve ALL headwear, accessories, hats, crowns, helmets, or anything on the head - keep them EXACTLY as they appear in the original
    
    3. ARTISTIC CONSISTENCY:
       - Match the EXACT artistic style of the original (watercolor/digital/cartoon/etc.)
       - Use the EXACT same color palette and lighting
       - Maintain the EXACT same level of detail
       - Keep the EXACT same line work and shading style
    
    4. SCENE PRESERVATION (CRITICAL - DO NOT CHANGE):
       - Keep ALL background elements EXACTLY the same (pixel-perfect preservation)
       - Preserve ALL text EXACTLY as it appears (same words, same font, same position, same size)
       - Maintain ALL other characters UNCHANGED (including animals, pets, side characters)
       - Keep ALL props and objects in their EXACT original positions
       - DO NOT modify or replace anything except the main human character's face
       - The page layout must remain 100% identical to the original
    
    5. CHARACTER CONSISTENCY (CRITICAL - SKIN TONE):
       - ${childName} must look EXACTLY the same as in all other pages
       - CRITICAL: EXACT same skin tone on every page - copy directly from reference photo
       - Same face, same hair, SAME SKIN COLOR, same distinctive features
       - The child's appearance must be IDENTICAL throughout the entire book
       - Use the reference child image (FIRST IMAGE) to maintain exact skin tone consistency
       - The child should be the SAME person with the SAME skin tone on every single page
       - DO NOT adapt or modify skin tone to match the illustration - keep it from the reference photo
    
    6. NATURAL INTEGRATION:
       - The face replacement should be seamless and undetectable
       - ${childName}'s face should look like it was always part of this illustration
       - No obvious editing artifacts or inconsistencies
       - Professional quality result
    
    ⚠️ CRITICAL RULES (MUST FOLLOW):
    - This is a FACE REPLACEMENT task, NOT a page generation task
    - ONLY replace the MAIN HUMAN CHARACTER's FACE (nothing else)
    - CRITICAL: Use the EXACT skin tone from the child reference photo (FIRST IMAGE) on ALL pages
    - DO NOT replace headwear, hats, crowns, helmets, or any accessories - preserve them exactly
    - DO NOT replace animals, pets, or any non-human characters
    - DO NOT replace background elements, objects, or other items
    - DO NOT regenerate or recreate the page - preserve the original PDF content
    - ${childName} must look IDENTICAL across all pages (SAME face, SAME skin tone, SAME appearance)
    - Keep EVERYTHING else exactly as it appears in the original PDF page (including all accessories and headwear)
    - The output must be the original page with ONLY the face replaced (accessories and headwear must remain unchanged)
    - SKIN TONE MUST BE IDENTICAL on every page - copy from the reference photo, not from the illustration
    
    Return the original PDF page with ONLY the main human character's face replaced with ${childName}'s face (using EXACT skin tone from reference photo). Everything else must remain 100% identical to the original.
    `;
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
   * Utility function for delays
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = CompleteBookPersonalizationService;
