// To run this code you need to install the following dependencies:
// npm install @google/generative-ai express

const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');

const app = express();
app.use(express.json({ limit: '50mb' })); // Increase limit for base64 images

// Helper function to save binary file
function saveBinaryFile(fileName, data) {
    fs.writeFileSync(fileName, data);
    console.log(`File saved to: ${fileName}`);
}

// Helper function to sleep/delay
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Retry wrapper for API calls (exactly like your Python code)
async function callGenerateStreamWithRetries(genAI, model, contents, config, maxAttempts = 3, initialBackoff = 1000) {
    let backoff = initialBackoff;
    let lastError = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            console.log(`[genai] Attempt ${attempt} calling generateContentStream (model=${model})`);
            const generativeModel = genAI.getGenerativeModel({ model });
            return await generativeModel.generateContentStream({
                contents,
                generationConfig: config
            });
        } catch (error) {
            lastError = error;
            
            // Check if it's a server error (500-level)
            if (error.status >= 500 && error.status < 600) {
                console.log(`[genai] ServerError on attempt ${attempt}: ${error.message}. Backing off ${backoff}ms before retry.`);
                console.log(`[genai] server error: ${JSON.stringify(error)}`);
                
                if (attempt === maxAttempts) {
                    console.log('[genai] Max retries reached; throwing exception.');
                    throw error;
                }
                
                await sleep(backoff);
                backoff *= 2;
            } else {
                // Non-server errors: throw immediately
                console.log(`[genai] Unexpected exception while calling generateContentStream: ${error.message}`);
                throw error;
            }
        }
    }
    
    throw lastError;
}

// Image generation function - converted from your Python code
async function generateImageFromPrompt(prompt, inputImageBase64) {
    try {
        const genAI = new GoogleGenerativeAI("AIzaSyDQ_IImJ2MNZ-IgI9dm35PZwXWDEFBW76g");
        
        console.log(`🎨 Generating image with prompt: ${prompt.substring(0, 100)}...`);
        
        // Use the same model as your working Python API
        const model = "gemini-2.5-flash-image-preview";
        
        // Prepare the content exactly like your Python API
        const contents = [
            {
                role: "user",
                parts: [
                    {
                        inlineData: {
                            data: inputImageBase64,
                            mimeType: "image/jpeg"
                        }
                    },
                    { text: prompt }
                ]
            }
        ];
        
        const generationConfig = {
            responseModalities: ["IMAGE"]  // Only generate images, no text
        };
        
        let generatedImageData = null;
        
        // Try streaming with retries (like your Python code)
        try {
            const streamResult = await callGenerateStreamWithRetries(
                genAI, 
                model, 
                contents, 
                generationConfig, 
                3
            );
            
            if (streamResult) {
                for await (const chunk of streamResult.stream) {
                    try {
                        const candidate = chunk.candidates && chunk.candidates[0];
                        if (candidate && candidate.content && candidate.content.parts) {
                            console.log(`[genai] Received chunk with ${candidate.content.parts.length} part(s)`);
                        } else {
                            console.log('[genai] Received chunk with no content.parts');
                        }
                    } catch (e) {
                        console.log('[genai] Error inspecting chunk metadata');
                    }
                    
                    if (!chunk.candidates || 
                        !chunk.candidates[0] || 
                        !chunk.candidates[0].content || 
                        !chunk.candidates[0].content.parts) {
                        continue;
                    }
                    
                    for (const part of chunk.candidates[0].content.parts) {
                        if (part.inlineData && part.inlineData.data) {
                            generatedImageData = part.inlineData.data;
                            console.log(`✅ Generated image: ${generatedImageData.length} bytes`);
                            return generatedImageData;
                        } else if (part.text) {
                            const txt = part.text;
                            console.log(`📝 Text part (ignoring): ${txt.substring(0, 120)}${txt.length > 120 ? '...' : ''}`);
                        }
                    }
                }
            }
        } catch (error) {
            console.log(`[genai] Streaming failed after retries: ${error.message}`);
        }
        
        // Fallback to non-streaming if stream didn't return image (like your Python code)
        try {
            console.log('[genai] Streaming returned no image — attempting non-stream fallback (generateContent)');
            const generativeModel = genAI.getGenerativeModel({ model });
            const result = await generativeModel.generateContent({
                contents,
                generationConfig
            });
            
            const response = await result.response;
            
            if (response.candidates) {
                for (const candidate of response.candidates) {
                    if (candidate.content && candidate.content.parts) {
                        for (const part of candidate.content.parts) {
                            if (part.inlineData && part.inlineData.data) {
                                generatedImageData = part.inlineData.data;
                                console.log(`✅ Fallback generated image: ${generatedImageData.length} bytes`);
                                return generatedImageData;
                            } else if (part.text) {
                                console.log(`📝 Fallback text part (ignoring): ${part.text.substring(0, 120)}${part.text.length > 120 ? '...' : ''}`);
                            }
                        }
                    }
                }
            }
        } catch (error) {
            console.log(`[genai] Fallback generateContent failed: ${error.message}`);
            console.error(error);
        }
        
        console.log('❌ No image data found in response (stream + fallback)');
        return null;
        
    } catch (error) {
        console.log(`💥 Error in generateImageFromPrompt: ${error.message}`);
        console.error(error);
        return null;
    }
}

// API endpoint for image generation (converted from your Python Flask API)
app.post('/generate-image', async (req, res) => {
    try {
        const data = req.body;
        
        if (!data) {
            return res.status(400).json({ error: 'No JSON data provided' });
        }
        
        const prompt = data.prompt;
        const imageBase64 = data.image;
        
        if (!prompt) {
            return res.status(400).json({ error: 'prompt parameter is required' });
        }
        
        if (!imageBase64) {
            return res.status(400).json({ error: 'image parameter is required' });
        }
        
        // Validate base64 image
        try {
            // Remove data URL prefix if present
            const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
            Buffer.from(base64Data, 'base64');
        } catch (error) {
            return res.status(400).json({ 
                error: `Invalid base64 image data: ${error.message}` 
            });
        }
        
        // Generate image
        console.log('🎨 Starting image generation...');
        const generatedImageData = await generateImageFromPrompt(prompt, imageBase64);
        
        if (!generatedImageData) {
            console.log('❌ Image generation returned null');
            return res.status(500).json({ 
                error: 'Failed to generate image - no image data returned' 
            });
        }
        
        // Return response (same format as your Python API)
        return res.json({
            success: true,
            generated_image: generatedImageData,
            message: 'Image generated successfully'
        });
        
    } catch (error) {
        console.log(`💥 API Error: ${error.message}`);
        console.error(error);
        return res.status(500).json({ 
            error: `Internal server error: ${error.message}` 
        });
    }
});

// Health check endpoint (same as your Python API)
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        message: 'API is running' 
    });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
});