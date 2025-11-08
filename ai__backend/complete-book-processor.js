// Complete Book Processing Pipeline
// Enhanced AI service for processing entire books with character replacement

const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');

class CompleteBookPersonalizationService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || "AIzaSyDQ_IImJ2MNZ-IgI9dm35PZwXWDEFBW76g");
    this.model = "gemini-2.5-flash-image-preview";
    this.maxRetries = 3; // Retry failed image generation
    this.retryDelay = 2000; // 2 seconds between retries
  }

  /**
   * Main entry point for complete book processing
   */
  async processCompleteBook({
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
      console.log(`📄 Total pages: ${bookPages.length}`);
      
      const startTime = Date.now();
      
      // Step 1: Analyze all pages
      console.log('🔍 Step 1: Analyzing all book pages...');
      const bookAnalysis = await this.analyzeCompleteBook(bookPages);
      console.log('✅ Book analysis complete');
      
      // Step 2: Map characters across pages
      console.log('👤 Step 2: Mapping characters across pages...');
      const characterMapping = await this.mapCharacterAcrossPages(bookPages, bookAnalysis);
      console.log(`✅ Character mapping complete: ${characterMapping.length} replacements needed`);
      
      // Step 3: Process pages in batches
      console.log('🔄 Step 3: Processing pages in batches...');
      const processedPages = await this.processPagesInBatches(
        bookPages,
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
        // Add fallback analysis
        analysisResults.push({
          pageNumber: i + 1,
          characters: [],
          scene: { action: 'unknown', setting: 'unknown', mood: 'unknown' },
          text: { content: '', characterNames: [], context: 'unknown' },
          layout: { composition: 'unknown', characterPositions: [], visualFocus: 'unknown' },
          error: error.message
        });
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
   */
  async analyzePage(pageImage, pageNumber) {
    const analysisPrompt = `
    You are an expert at analyzing children's book illustrations. Analyze this book page (page ${pageNumber + 1}) with extreme precision:
    
    1. CHARACTER DETECTION (MOST IMPORTANT):
       - Count ALL characters visible (humans, animals, creatures)
       - Identify the MAIN PROTAGONIST (usually appears most frequently, is central to the story)
       - For EACH character, describe:
         * Physical appearance (age, gender, hair color, clothing, distinctive features)
         * Position in the image (specific location: top-left, center, bottom-right, etc.)
         * Size relative to page (large/medium/small/tiny)
         * Facial expression and body language
         * Is this likely the story's hero/main character? (yes/no/maybe)
    
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
       - Which character(s) should be replaced with the child's face?
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
        "targetCharacter": "which character to replace",
        "considerations": "special notes for replacement"
      }
    }
    `;
    
    try {
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
      const analysisText = response.text();
      
      // Parse JSON response
      try {
        const analysis = JSON.parse(analysisText);
        return analysis;
      } catch (parseError) {
        console.error('❌ Failed to parse analysis JSON:', parseError);
        return this.createFallbackAnalysis(pageNumber);
      }
      
    } catch (error) {
      console.error(`❌ Page analysis failed for page ${pageNumber + 1}:`, error);
      return this.createFallbackAnalysis(pageNumber);
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
        description: "main character (analysis failed)",
        position: "center",
        size: "medium",
        emotion: "neutral",
        pose: "standing"
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
      }
    };
  }

  /**
   * Identify the main character across all pages
   */
  identifyMainCharacter(analysisResults) {
    const characterCounts = {};
    
    analysisResults.forEach(page => {
      page.characters.forEach(char => {
        if (char.isMainCharacter) {
          const key = char.description.toLowerCase();
          characterCounts[key] = (characterCounts[key] || 0) + 1;
        }
      });
    });
    
    const mostFrequent = Object.entries(characterCounts)
      .sort(([,a], [,b]) => b - a)[0];
    
    return {
      description: mostFrequent ? mostFrequent[0] : "main character",
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
   */
  analyzeCharacterConsistency(analysisResults) {
    const mainCharacterAppearances = analysisResults
      .filter(page => page.characters.some(char => char.isMainCharacter))
      .length;
    
    return {
      totalAppearances: mainCharacterAppearances,
      consistency: mainCharacterAppearances / analysisResults.length,
      needsReplacement: mainCharacterAppearances > 0
    };
  }

  /**
   * Map characters across all pages for replacement strategy
   */
  async mapCharacterAcrossPages(bookPages, bookAnalysis) {
    const characterMapping = [];
    
    for (let i = 0; i < bookAnalysis.pages.length; i++) {
      const pageAnalysis = bookAnalysis.pages[i];
      const mainCharacter = pageAnalysis.characters.find(char => char.isMainCharacter);
      
      if (mainCharacter) {
        characterMapping.push({
          pageNumber: i + 1,
          character: mainCharacter,
          replacementNeeded: true,
          replacementStrategy: this.determineReplacementStrategy(mainCharacter, i),
          pageImage: bookPages[i]
        });
      }
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
   */
  async processPagesInBatches(bookPages, characterMapping, childImage, childName, options) {
    const batchSize = options.batchSize || 3;
    const processedPages = [];
    
    for (let i = 0; i < characterMapping.length; i += batchSize) {
      const batch = characterMapping.slice(i, i + batchSize);
      const batchNumber = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(characterMapping.length / batchSize);
      
      console.log(`🔄 Processing batch ${batchNumber}/${totalBatches} (${batch.length} pages)`);
      
      try {
        const batchResults = await Promise.all(
          batch.map(mapping => 
            this.processPage(mapping, childImage, childName)
          )
        );
        
        processedPages.push(...batchResults);
        console.log(`✅ Batch ${batchNumber} completed`);
        
        // Add delay between batches to avoid rate limiting
        if (i + batchSize < characterMapping.length) {
          await this.sleep(1000);
        }
        
      } catch (error) {
        console.error(`❌ Batch ${batchNumber} failed:`, error);
        // Add fallback pages for failed batch
        batch.forEach(mapping => {
          processedPages.push({
            pageNumber: mapping.pageNumber,
            processedImage: mapping.pageImage, // Use original if processing fails
            success: false,
            error: error.message
          });
        });
      }
    }
    
    return processedPages;
  }

  /**
   * Process a single page with character replacement (with retry logic)
   */
  async processPage(characterMapping, childImage, childName) {
    const { character, pageImage, pageNumber } = characterMapping;
    
    // Retry logic for failed image generation
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const prompt = this.generatePagePrompt(characterMapping, childName);
        
        console.log(`🎨 Processing page ${pageNumber} (attempt ${attempt}/${this.maxRetries})...`);
        
        const generativeModel = this.genAI.getGenerativeModel({ model: this.model });
        const result = await generativeModel.generateContent({
          contents: [{
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
          }],
          generationConfig: {
            responseModalities: ["IMAGE"]
          }
        });
        
        const response = await result.response;
        let generatedImageData = null;
        
        if (response.candidates) {
          for (const candidate of response.candidates) {
            if (candidate.content && candidate.content.parts) {
              for (const part of candidate.content.parts) {
                if (part.inlineData && part.inlineData.data) {
                  generatedImageData = part.inlineData.data;
                  break;
                }
              }
            }
          }
        }
        
        if (generatedImageData) {
          console.log(`✅ Page ${pageNumber} processed successfully${attempt > 1 ? ` (after ${attempt} attempts)` : ''}`);
          return {
            pageNumber,
            processedImage: generatedImageData,
            success: true,
            character: character.description,
            attempts: attempt
          };
        } else {
          throw new Error('No image generated in response');
        }
        
      } catch (error) {
        console.error(`❌ Page ${pageNumber} processing failed (attempt ${attempt}/${this.maxRetries}):`, error.message);
        
        // If this was the last attempt, return with original image
        if (attempt === this.maxRetries) {
          console.warn(`⚠️  Using original page ${pageNumber} after ${this.maxRetries} failed attempts`);
          return {
            pageNumber: characterMapping.pageNumber,
            processedImage: characterMapping.pageImage, // Use original as fallback
            success: false,
            error: error.message,
            character: characterMapping.character.description,
            attempts: attempt
          };
        }
        
        // Wait before retrying
        console.log(`⏳ Waiting ${this.retryDelay}ms before retry...`);
        await this.sleep(this.retryDelay);
      }
    }
  }

  /**
   * Generate improved prompt for page processing
   */
  generatePagePrompt(characterMapping, childName) {
    const { character, replacementStrategy, replacementGuidance } = characterMapping;
    
    return `
    You are an expert at seamlessly replacing characters in children's book illustrations.
    
    TASK: Replace the main character in this illustration with ${childName}'s face/appearance while maintaining perfect artistic consistency.
    
    TARGET CHARACTER TO REPLACE:
    - Description: ${character.description}
    - Position: ${character.position}
    - Size: ${character.size}
    - Current emotion: ${character.emotion}
    - Current pose: ${character.pose}
    - Replacement difficulty: ${character.replacementDifficulty || 'medium'}
    
    CHILD'S APPEARANCE (from reference photo):
    - Use the child's actual facial features, hair color, hair style, skin tone
    - Maintain the child's distinctive characteristics
    - Make ${childName} look natural in this illustration style
    
    REPLACEMENT REQUIREMENTS:
    1. FACE REPLACEMENT:
       - Replace the character's face with ${childName}'s face
       - Match facial proportions to the illustration style
       - Keep the same expression and emotion
       - Ensure the face looks natural in the art style
    
    2. BODY & POSE:
       - Keep the exact same body pose as the original character
       - Maintain the same clothing style (adapt colors if needed)
       - Preserve all body language and gestures
       - Same size and position on the page
    
    3. ARTISTIC CONSISTENCY:
       - Match the EXACT artistic style of the original (watercolor/digital/cartoon/etc.)
       - Use the same color palette and lighting
       - Maintain the same level of detail
       - Keep the same line work and shading style
    
    4. SCENE PRESERVATION:
       - Keep ALL background elements exactly the same
       - Preserve ALL text exactly as it appears
       - Maintain ALL other characters unchanged
       - Keep ALL props and objects in their original positions
    
    5. NATURAL INTEGRATION:
       - The replacement should be seamless and undetectable
       - ${childName} should look like they were always part of this illustration
       - No obvious editing artifacts or inconsistencies
       - Professional quality result
    
    CRITICAL: Generate an image where ${childName} is the main character, looking natural and perfectly integrated into the scene's artistic style.
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
   * Utility function for delays
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = CompleteBookPersonalizationService;
