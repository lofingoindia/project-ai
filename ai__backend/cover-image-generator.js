// Generalized Cover Image Generator
// Creates personalized book covers dynamically without hardcoded prompts

const { GoogleGenerativeAI } = require("@google/generative-ai");

class CoverImageGenerator {
  constructor(apiKey) {
    this.genAI = new GoogleGenerativeAI(
      apiKey ||
        process.env.GOOGLE_AI_API_KEY ||
        "AIzaSyDQ_IImJ2MNZ-IgI9dm35PZwXWDEFBW76g"
    );
    this.model = "gemini-2.5-flash-image-preview";
  }

  /**
   * Generate a personalized book cover image
   * @param {Object} params - Parameters for cover generation
   * @param {string} params.originalCoverImageBase64 - Original book cover as base64
   * @param {string} params.childImageBase64 - Child's photo as base64
   * @param {Object} params.bookData - Book metadata (name, description, genre, etc.)
   * @param {Object} params.childData - Child personalization data (name, age, gender, etc.)
   * @returns {Promise<string>} - Generated cover image as base64
   */
  async generatePersonalizedCover({
    originalCoverImageBase64,
    childImageBase64,
    bookData = {},
    childData = {},
  }) {
    try {
      console.log("🎨 Starting generalized cover image generation...");
      console.log(`📖 Book: ${bookData.name || "Unknown"}`);
      console.log(`👶 Child: ${childData.name || "Unknown"}`);

      // Step 1: Analyze the original cover to understand its style and composition
      const coverAnalysis = await this._analyzeOriginalCover(
        originalCoverImageBase64,
        bookData
      );
      console.log("✅ Original cover analyzed");

      // Step 2: Analyze the child's image to extract features
      const childFeatures = await this._analyzeChildImage(
        childImageBase64,
        childData
      );
      console.log("✅ Child features extracted");

      // Step 3: Generate dynamic prompt based on analysis (AI-powered)
      const prompt = await this._generateDynamicPrompt(
        coverAnalysis,
        childFeatures,
        bookData,
        childData
      );
      console.log("📝 AI-generated prompt created");

      // Step 4: Generate the personalized cover
      const generatedCover = await this._generateCoverImage(
        originalCoverImageBase64,
        childImageBase64,
        prompt
      );
      console.log("✅ Personalized cover generated");

      return generatedCover;
    } catch (error) {
      console.error("❌ Cover generation failed:", error);
      throw error;
    }
  }

  /**
   * Analyze the original cover image to understand style, composition, and elements
   */
  async _analyzeOriginalCover(coverImageBase64, bookData) {
    try {
      const model = this.genAI.getGenerativeModel({
        model: "gemini-2.0-flash-exp",
      });

      const analysisPrompt = `Analyze this book cover image in detail. Describe:
1. Visual style and art technique (illustration style, color palette, mood)
2. Main character appearance and position (if present)
3. Background elements and setting
4. Typography and text placement
5. Overall composition and layout
6. Key visual elements that make this cover appealing

Book title: ${bookData.name || "N/A"}
Genre: ${bookData.genre || "Children's Book"}
Target age: ${
        bookData.ageRange ||
        `${bookData.ageMin || 3}-${bookData.ageMax || 12} years`
      }

Provide a structured analysis that can be used to recreate a similar style.`;

      const result = await model.generateContent([
        {
          inlineData: {
            data: coverImageBase64,
            mimeType: "image/jpeg",
          },
        },
        analysisPrompt,
      ]);

      const response = await result.response;
      const analysisText = response.text();

      return {
        rawAnalysis: analysisText,
        style: this._extractStyle(analysisText),
        composition: this._extractComposition(analysisText),
        characterPosition: this._extractCharacterPosition(analysisText),
        colorPalette: this._extractColorPalette(analysisText),
      };
    } catch (error) {
      console.error("Cover analysis failed:", error);
      // Return default analysis if API fails
      return {
        style: "children's book illustration",
        composition: "centered",
        characterPosition: "center",
        colorPalette: "vibrant and colorful",
      };
    }
  }

  /**
   * Analyze child's image to extract key features
   */
  async _analyzeChildImage(childImageBase64, childData) {
    try {
      const model = this.genAI.getGenerativeModel({
        model: "gemini-2.0-flash-exp",
      });

      const analysisPrompt = `Analyze this child's photo and describe:
1. Physical appearance (hair color, hair style, eye color, skin tone)
2. Approximate age and gender (if determinable)
3. Facial features (round face, oval face, etc.)
4. Expression and mood
5. Clothing or accessories visible

Child's name: ${childData.name || "N/A"}
Age: ${childData.age || "N/A"}
Gender: ${childData.gender || "N/A"}

Provide detailed but natural descriptions suitable for creating an illustrated character.`;

      const result = await model.generateContent([
        {
          inlineData: {
            data: childImageBase64,
            mimeType: "image/jpeg",
          },
        },
        analysisPrompt,
      ]);

      const response = await result.response;
      const analysisText = response.text();

      return {
        name: childData.name || "the child",
        age: childData.age || null,
        gender: childData.gender || null,
        appearance: analysisText,
        features: this._extractKeyFeatures(analysisText),
      };
    } catch (error) {
      console.error("Child analysis failed:", error);
      // Return basic features if API fails
      return {
        name: childData.name || "the child",
        age: childData.age || null,
        gender: childData.gender || null,
        appearance: "a young child",
        features: "happy and friendly",
      };
    }
  }

  /**
   * Generate dynamic prompt based on analysis - AI generates the prompt!
   * This makes the prompt truly adaptive and intelligent
   */
  async _generateDynamicPrompt(coverAnalysis, childFeatures, bookData, childData) {
    try {
      const model = this.genAI.getGenerativeModel({
        model: "gemini-2.0-flash-exp",
      });

      const bookName = bookData.name || "Adventure Book";
      const childName = childFeatures.name;
      const genre = bookData.genre || "adventure";

      // Use AI to create the perfect prompt based on analysis
      const metaPrompt = `You are an expert AI prompt engineer specializing in children's book cover personalization.

Based on the following analysis data, create a precise and detailed prompt for an AI image generator to create a personalized book cover.

ORIGINAL COVER ANALYSIS:
${coverAnalysis.rawAnalysis}

Key extracted elements:
- Art Style: ${coverAnalysis.style}
- Color Palette: ${coverAnalysis.colorPalette}
- Composition: ${coverAnalysis.composition}
- Character Position: ${coverAnalysis.characterPosition}

CHILD'S APPEARANCE:
${childFeatures.appearance}
- Name: ${childName}
- Age: ${childFeatures.age || "Not specified"}
- Gender: ${childFeatures.gender || "Not specified"}
- Key Features: ${childFeatures.features}

BOOK DETAILS:
- Title: "${bookName}"
- Genre: ${genre}
- Target Age: ${bookData.ageRange || `${bookData.ageMin || 3}-${bookData.ageMax || 12} years old`}
- Description: ${bookData.description || "Not provided"}

TASK:
Generate a detailed prompt for creating a personalized book cover where ${childName} replaces the main character. The prompt should:

1. Specify EXACTLY how to maintain the original cover's artistic style, mood, and composition
2. Describe precisely how to integrate ${childName}'s appearance into the illustration style
3. Detail which elements to keep identical (background, setting, typography, layout)
4. Explain how the child's features should be adapted to match the illustration style
5. Ensure the personalization feels natural and professional
6. Maintain age-appropriate content for the target audience

Generate a comprehensive, technical prompt that an AI image generator can use to create a seamless personalized cover. Be specific about colors, positioning, lighting, and artistic techniques.

Respond ONLY with the prompt itself - no explanations or meta-text.`;

      const result = await model.generateContent(metaPrompt);
      const response = await result.response;
      const generatedPrompt = response.text().trim();

      console.log("🤖 AI-Generated Prompt:");
      console.log(generatedPrompt.substring(0, 200) + "...");

      return generatedPrompt;
    } catch (error) {
      console.error("AI prompt generation failed, using fallback:", error);
      
      // Fallback to template-based prompt if AI fails
      return this._generateFallbackPrompt(coverAnalysis, childFeatures, bookData, childData);
    }
  }

  /**
   * Fallback template-based prompt (used if AI prompt generation fails)
   */
  _generateFallbackPrompt(coverAnalysis, childFeatures, bookData, childData) {
    const bookName = bookData.name || "Adventure Book";
    const childName = childFeatures.name;
    const genre = bookData.genre || "adventure";

    return `Create a personalized children's book cover with the following specifications:

BOOK INFORMATION:
- Title: "${bookName}"
- Genre: ${genre}
- Target Age: ${bookData.ageRange || `${bookData.ageMin || 3}-${bookData.ageMax || 12} years old`}

VISUAL STYLE (from original cover):
- Art Style: ${coverAnalysis.style}
- Color Palette: ${coverAnalysis.colorPalette}
- Composition: ${coverAnalysis.composition}
- Character Position: ${coverAnalysis.characterPosition}

MAIN CHARACTER (personalized for ${childName}):
- Replace the main character with this child's appearance: ${childFeatures.appearance}
- Key features to maintain: ${childFeatures.features}
- Name: ${childName}
${childFeatures.age ? `- Age: ${childFeatures.age} years old` : ""}
${childFeatures.gender ? `- Gender: ${childFeatures.gender}` : ""}

REQUIREMENTS:
1. Keep the original cover's artistic style and mood
2. Maintain the same background elements and setting
3. Replace ONLY the main character with the personalized child character
4. Preserve the text placement and title position
5. Match the original color palette and lighting
6. Keep the same composition and layout
7. Ensure the child character looks natural in the illustration style
8. Make it look like the child was always meant to be the story's hero

The result should be a professional children's book cover where ${childName} is the main character, seamlessly integrated into the original cover's style and setting.`;
  }

  /**
   * Generate the actual cover image using Gemini
   */
  async _generateCoverImage(originalCoverBase64, childImageBase64, prompt) {
    try {
      const model = this.genAI.getGenerativeModel({ model: this.model });

      // Prepare multi-image input with prompt
      const contents = [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                data: originalCoverBase64,
                mimeType: "image/jpeg",
              },
            },
            {
              inlineData: {
                data: childImageBase64,
                mimeType: "image/jpeg",
              },
            },
            { text: prompt },
          ],
        },
      ];

      const generationConfig = {
        responseModalities: ["IMAGE"],
      };

      // Try streaming first
      let generatedImageData = null;

      try {
        const streamResult = await model.generateContentStream({
          contents,
          generationConfig,
        });

        for await (const chunk of streamResult.stream) {
          if (chunk.candidates?.[0]?.content?.parts) {
            for (const part of chunk.candidates[0].content.parts) {
              if (part.inlineData?.data) {
                generatedImageData = part.inlineData.data;
                console.log(
                  `✅ Generated cover image: ${generatedImageData.length} bytes`
                );
                return generatedImageData;
              }
            }
          }
        }
      } catch (streamError) {
        console.log("Streaming failed, trying non-stream fallback...");
      }

      // Fallback to non-streaming
      const result = await model.generateContent({
        contents,
        generationConfig,
      });

      const response = await result.response;

      if (response.candidates) {
        for (const candidate of response.candidates) {
          if (candidate.content?.parts) {
            for (const part of candidate.content.parts) {
              if (part.inlineData?.data) {
                generatedImageData = part.inlineData.data;
                console.log(
                  `✅ Generated cover image (fallback): ${generatedImageData.length} bytes`
                );
                return generatedImageData;
              }
            }
          }
        }
      }

      throw new Error("No image data returned from Gemini API");
    } catch (error) {
      console.error("Image generation failed:", error);
      throw error;
    }
  }

  // Helper methods to extract information from analysis text
  _extractStyle(analysisText) {
    const styleKeywords = [
      "watercolor",
      "digital",
      "hand-drawn",
      "cartoon",
      "realistic",
      "minimalist",
      "whimsical",
      "illustration",
    ];
    const lowerText = analysisText.toLowerCase();

    for (const keyword of styleKeywords) {
      if (lowerText.includes(keyword)) {
        return keyword + " illustration style";
      }
    }

    return "children's book illustration style";
  }

  _extractComposition(analysisText) {
    const lowerText = analysisText.toLowerCase();

    if (lowerText.includes("center") || lowerText.includes("middle"))
      return "centered";
    if (lowerText.includes("left")) return "left-aligned";
    if (lowerText.includes("right")) return "right-aligned";

    return "balanced composition";
  }

  _extractCharacterPosition(analysisText) {
    const lowerText = analysisText.toLowerCase();

    if (lowerText.includes("foreground") || lowerText.includes("front"))
      return "foreground center";
    if (lowerText.includes("center")) return "center";
    if (lowerText.includes("left")) return "left side";
    if (lowerText.includes("right")) return "right side";

    return "center";
  }

  _extractColorPalette(analysisText) {
    const colorKeywords = {
      vibrant: "vibrant and energetic",
      pastel: "soft pastel colors",
      bright: "bright and cheerful",
      warm: "warm color tones",
      cool: "cool color tones",
      rainbow: "rainbow of colors",
      muted: "muted and soft colors",
    };

    const lowerText = analysisText.toLowerCase();

    for (const [keyword, description] of Object.entries(colorKeywords)) {
      if (lowerText.includes(keyword)) {
        return description;
      }
    }

    return "colorful and appealing";
  }

  _extractKeyFeatures(analysisText) {
    // Extract key descriptive phrases from the analysis
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
}

module.exports = CoverImageGenerator;
