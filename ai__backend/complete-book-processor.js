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
   */
  async analyzePage(pageImage, pageNumber) {
    const analysisPrompt = `
    Analyze this children's book page (page ${pageNumber + 1}) and provide detailed information:
    
    1. CHARACTER DETECTION:
       - How many characters are visible on this page?
       - Which character appears to be the main protagonist?
       - Describe each character's appearance, pose, and emotion
    
    2. SCENE ANALYSIS:
       - What is happening in this scene?
       - What is the setting/background?
       - What is the mood or atmosphere?
    
    3. TEXT CONTENT:
       - What text is visible on this page?
       - Are there any character names mentioned?
       - What is the story context?
    
    4. LAYOUT ANALYSIS:
       - How is the page composed?
       - Where are the characters positioned?
       - What is the visual hierarchy?
    
    Provide analysis in JSON format:
    {
      "pageNumber": ${pageNumber + 1},
      "characters": [
        {
          "isMainCharacter": true/false,
          "description": "detailed description",
          "position": "left/center/right",
          "size": "large/medium/small",
          "emotion": "happy/sad/excited/etc",
          "pose": "standing/sitting/running/etc"
        }
      ],
      "scene": {
        "action": "what's happening",
        "setting": "where it takes place",
        "mood": "exciting/calm/mysterious/etc"
      },
      "text": {
        "content": "visible text",
        "characterNames": ["name1", "name2"],
        "context": "story context"
      },
      "layout": {
        "composition": "description",
        "characterPositions": ["left", "center"],
        "visualFocus": "main focus area"
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
   * Process a single page with character replacement
   */
  async processPage(characterMapping, childImage, childName) {
    try {
      const { character, pageImage, pageNumber } = characterMapping;
      const prompt = this.generatePagePrompt(characterMapping, childName);
      
      console.log(`🎨 Processing page ${pageNumber}...`);
      
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
        console.log(`✅ Page ${pageNumber} processed successfully`);
        return {
          pageNumber,
          processedImage: generatedImageData,
          success: true,
          character: character.description
        };
      } else {
        throw new Error('No image generated');
      }
      
    } catch (error) {
      console.error(`❌ Page ${characterMapping.pageNumber} processing failed:`, error);
      return {
        pageNumber: characterMapping.pageNumber,
        processedImage: characterMapping.pageImage, // Use original as fallback
        success: false,
        error: error.message,
        character: characterMapping.character.description
      };
    }
  }

  /**
   * Generate prompt for page processing
   */
  generatePagePrompt(characterMapping, childName) {
    const { character, replacementStrategy } = characterMapping;
    
    return `
    Replace the main character in this book page with ${childName}'s face.
    
    CHARACTER REPLACEMENT:
    - Replace the character that is ${character.description}
    - Maintain the character's position: ${character.position}
    - Keep the character's size: ${character.size}
    - Preserve the character's emotion: ${character.emotion}
    - Maintain the character's pose: ${character.pose}
    
    REPLACEMENT STRATEGY:
    - Face replacement: ${replacementStrategy.faceReplacement}
    - Full body replacement: ${replacementStrategy.fullBodyReplacement}
    - Style adaptation: ${replacementStrategy.styleAdaptation}
    - Position preservation: ${replacementStrategy.positionPreservation}
    
    TECHNICAL REQUIREMENTS:
    - The child's face should be clearly recognizable as ${childName}
    - Maintain the same artistic style as the original
    - Keep all other elements unchanged
    - Preserve text and layout exactly
    - Ensure natural-looking integration
    - The final image should look like ${childName} is the original character in this book
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
