// Main Server with Order Monitoring
// Automatically processes paid orders and generates personalized books

require("dotenv").config();
const express = require("express");
const path = require("path");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const CompleteBookPersonalizationService = require("./complete-book-processor");
const CoverImageGenerator = require("./cover-image-generator");
const OrderMonitor = require("./order-monitor");

const app = express();
app.use(express.json({ limit: "50mb" }));

// Enable CORS
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  next();
});

// Serve static files from uploads directory
const uploadsPath = path.join(__dirname, "uploads");
app.use("/uploads", express.static(uploadsPath));
console.log(`📁 Serving static files from: ${uploadsPath}`);

// Import PDF upload routes
const pdfUploadsRouter = require('./pdf-uploads');

// Use PDF upload routes
app.use('/api', pdfUploadsRouter);
console.log(`📄 PDF upload endpoints registered at /api`);

// Initialize services
const bookPersonalizationService = new CompleteBookPersonalizationService();
const coverImageGenerator = new CoverImageGenerator();

// Initialize and start order monitor
let orderMonitor = null;

function startOrderMonitor() {
  try {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
      console.warn(
        "⚠️  Supabase credentials not found. Order monitoring disabled."
      );
      console.warn(
        "   Set SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables to enable."
      );
      return;
    }

    orderMonitor = new OrderMonitor({
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseKey: process.env.SUPABASE_SERVICE_KEY,
      geminiApiKey: process.env.GOOGLE_AI_API_KEY,
      pollInterval: parseInt(process.env.POLL_INTERVAL || "10000"),
    });

    orderMonitor.start();
    console.log("✅ Order monitor started successfully");
  } catch (error) {
    console.error("❌ Failed to start order monitor:", error);
  }
}

// Helper functions
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function callGenerateStreamWithRetries(
  genAI,
  model,
  contents,
  config,
  maxAttempts = 3,
  initialBackoff = 1000
) {
  let backoff = initialBackoff;
  let lastError = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(
        `[genai] Attempt ${attempt} calling generateContentStream (model=${model})`
      );
      const generativeModel = genAI.getGenerativeModel({ model });
      return await generativeModel.generateContentStream({
        contents,
        generationConfig: config,
      });
    } catch (error) {
      lastError = error;

      if (error.status >= 500 && error.status < 600) {
        console.log(
          `[genai] ServerError on attempt ${attempt}: ${error.message}. Backing off ${backoff}ms before retry.`
        );

        if (attempt === maxAttempts) {
          console.log("[genai] Max retries reached; throwing exception.");
          throw error;
        }

        await sleep(backoff);
        backoff *= 2;
      } else {
        console.log(
          `[genai] Unexpected exception while calling generateContentStream: ${error.message}`
        );
        throw error;
      }
    }
  }

  throw lastError;
}

// Image generation function
async function generateImageFromPrompt(prompt, inputImageBase64) {
  try {
    const genAI = new GoogleGenerativeAI(
      process.env.GOOGLE_AI_API_KEY || "AIzaSyDQ_IImJ2MNZ-IgI9dm35PZwXWDEFBW76g"
    );

    console.log(
      `🎨 Generating image with prompt: ${prompt.substring(0, 100)}...`
    );

    const model = "gemini-2.5-flash-image-preview";

    const contents = [
      {
        role: "user",
        parts: [
          {
            inlineData: {
              data: inputImageBase64,
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

    let generatedImageData = null;

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
          if (!chunk.candidates?.[0]?.content?.parts) {
            continue;
          }

          for (const part of chunk.candidates[0].content.parts) {
            if (part.inlineData?.data) {
              generatedImageData = part.inlineData.data;
              console.log(
                `✅ Generated image: ${generatedImageData.length} bytes`
              );
              return generatedImageData;
            }
          }
        }
      }
    } catch (error) {
      console.log(`[genai] Streaming failed after retries: ${error.message}`);
    }

    // Fallback to non-streaming
    try {
      console.log(
        "[genai] Streaming returned no image — attempting non-stream fallback"
      );
      const generativeModel = genAI.getGenerativeModel({ model });
      const result = await generativeModel.generateContent({
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
                  `✅ Fallback generated image: ${generatedImageData.length} bytes`
                );
                return generatedImageData;
              }
            }
          }
        }
      }
    } catch (error) {
      console.log(`[genai] Fallback generateContent failed: ${error.message}`);
    }

    console.log("❌ No image data found in response");
    return null;
  } catch (error) {
    console.log(`💥 Error in generateImageFromPrompt: ${error.message}`);
    return null;
  }
}

// ============================================================================
// API ENDPOINTS
// ============================================================================

// Single image generation endpoint
app.post("/generate-image", async (req, res) => {
  try {
    const { prompt, image } = req.body;

    if (!prompt || !image) {
      return res
        .status(400)
        .json({ error: "prompt and image parameters are required" });
    }

    const generatedImageData = await generateImageFromPrompt(prompt, image);

    if (!generatedImageData) {
      return res.status(500).json({ error: "Failed to generate image" });
    }

    return res.json({
      success: true,
      generated_image: generatedImageData,
      message: "Image generated successfully",
    });
  } catch (error) {
    console.error("API Error:", error);
    return res
      .status(500)
      .json({ error: `Internal server error: ${error.message}` });
  }
});

// Complete book processing endpoint
app.post("/process-complete-book", async (req, res) => {
  try {
    const {
      pdfUrl,
      bookPages,
      childImage,
      childName,
      bookTitle,
      processingOptions = {},
    } = req.body;

    // Validate: either pdfUrl or bookPages must be provided
    if (!pdfUrl && (!bookPages || !Array.isArray(bookPages) || bookPages.length === 0)) {
      return res
        .status(400)
        .json({ 
          error: "Either pdfUrl or bookPages array is required. pdfUrl is preferred." 
        });
    }

    if (!childImage || !childName) {
      return res
        .status(400)
        .json({ error: "childImage and childName are required" });
    }

    console.log(
      `📚 Processing complete book: ${bookTitle || "Personalized Book"}`
    );
    if (pdfUrl) {
      console.log(`📄 Using PDF URL: ${pdfUrl}`);
    } else {
      console.log(`📄 Using ${bookPages.length} book pages`);
    }

    const result = await bookPersonalizationService.processCompleteBook({
      pdfUrl,
      bookPages,
      childImage,
      childName,
      bookTitle: bookTitle || "Personalized Book",
      options: {
        batchSize: processingOptions.batchSize || 3,
        quality: processingOptions.quality || "high",
        styleConsistency: processingOptions.styleConsistency !== false,
      },
    });

    if (result.success) {
      return res.json({
        success: true,
        personalizedBook: result.personalizedBook,
        totalPages: result.totalPages,
        processingTime: result.processingTime,
        characterReplacements: result.characterReplacements,
        message: "Complete book processed successfully",
      });
    } else {
      return res.status(500).json({
        success: false,
        error: result.error,
        message: "Complete book processing failed",
      });
    }
  } catch (error) {
    console.error("Complete book processing failed:", error);
    return res.status(500).json({
      success: false,
      error: `Book processing failed: ${error.message}`,
    });
  }
});

// Personalized cover generation endpoint
app.post("/generate-cover", async (req, res) => {
  try {
    const { originalCoverImage, childImage, bookData, childData } = req.body;

    if (!originalCoverImage || !childImage) {
      return res.status(400).json({
        error: "originalCoverImage and childImage are required",
      });
    }

    console.log(
      `🎨 Generating personalized cover for: ${
        bookData?.name || "Unknown Book"
      }`
    );

    const coverImage = await coverImageGenerator.generatePersonalizedCover({
      originalCoverImageBase64: originalCoverImage,
      childImageBase64: childImage,
      bookData: bookData || {},
      childData: childData || {},
    });

    return res.json({
      success: true,
      coverImage: coverImage,
      message: "Personalized cover generated successfully",
    });
  } catch (error) {
    console.error("Cover generation failed:", error);
    return res.status(500).json({
      success: false,
      error: `Cover generation failed: ${error.message}`,
    });
  }
});

// Book analysis endpoint
app.post("/analyze-book", async (req, res) => {
  try {
    const { bookPages } = req.body;

    if (!bookPages || !Array.isArray(bookPages) || bookPages.length === 0) {
      return res.status(400).json({ error: "bookPages array is required" });
    }

    console.log(`🔍 Analyzing book with ${bookPages.length} pages...`);

    const bookAnalysis = await bookPersonalizationService.analyzeCompleteBook(
      bookPages
    );

    return res.json({
      success: true,
      bookAnalysis,
      message: "Book analysis completed successfully",
    });
  } catch (error) {
    console.error("Book analysis failed:", error);
    return res.status(500).json({
      success: false,
      error: `Book analysis failed: ${error.message}`,
    });
  }
});

// Order monitor control endpoints
app.post("/monitor/start", (req, res) => {
  try {
    if (orderMonitor && orderMonitor.isRunning) {
      return res.json({ message: "Order monitor is already running" });
    }

    startOrderMonitor();
    return res.json({ message: "Order monitor started successfully" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.post("/monitor/stop", (req, res) => {
  try {
    if (orderMonitor) {
      orderMonitor.stop();
      return res.json({ message: "Order monitor stopped successfully" });
    }
    return res.json({ message: "Order monitor is not running" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.get("/monitor/status", (req, res) => {
  return res.json({
    isRunning: orderMonitor?.isRunning || false,
    processingOrders: orderMonitor?.processingOrders.size || 0,
    pollInterval: orderMonitor?.pollInterval || 0,
  });
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    message: "API is running",
    orderMonitor: {
      enabled: !!orderMonitor,
      running: orderMonitor?.isRunning || false,
    },
  });
});

// Generate signed URL for S3 object (for refreshing expired URLs)
app.post("/generate-signed-url", async (req, res) => {
  try {
    const { s3Key, expiresIn } = req.body;

    if (!s3Key) {
      return res.status(400).json({ error: "s3Key is required" });
    }

    if (!orderMonitor || !orderMonitor.s3Service) {
      return res.status(500).json({
        error: "S3 service not initialized",
      });
    }

    const signedUrl = await orderMonitor._getSignedUrlForS3Key(
      s3Key,
      expiresIn || 604800 // 7 days default
    );

    return res.json({
      success: true,
      signedUrl: signedUrl,
      expiresIn: expiresIn || 604800,
    });
  } catch (error) {
    console.error("Failed to generate signed URL:", error);
    return res.status(500).json({
      success: false,
      error: `Failed to generate signed URL: ${error.message}`,
    });
  }
});

// Refresh signed URLs for an order item
app.post("/refresh-order-urls", async (req, res) => {
  try {
    const { orderItemId } = req.body;

    if (!orderItemId) {
      return res.status(400).json({ error: "orderItemId is required" });
    }

    if (!orderMonitor) {
      return res.status(500).json({
        error: "Order monitor not initialized",
      });
    }

    const result = await orderMonitor.refreshSignedUrls(orderItemId);

    return res.json({
      success: true,
      pdfUrl: result.pdfUrl,
      coverUrl: result.coverUrl,
      message: "Signed URLs refreshed successfully",
    });
  } catch (error) {
    console.error("Failed to refresh order URLs:", error);
    return res.status(500).json({
      success: false,
      error: `Failed to refresh URLs: ${error.message}`,
    });
  }
});

// ============================================================================
// SERVER STARTUP
// ============================================================================

const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log("\n" + "=".repeat(80));
  console.log("🚀 AI Book Personalization Server Started");
  console.log("=".repeat(80));
  console.log(`📡 Server running on: http://0.0.0.0:${PORT}`);
  console.log(`🌍 Health check: http://0.0.0.0:${PORT}/health`);
  console.log("=".repeat(80));
  console.log("\n📚 Available Endpoints:");
  console.log("  POST /generate-image - Single image generation");
  console.log("  POST /generate-cover - Personalized cover generation");
  console.log("  POST /process-complete-book - Complete book processing");
  console.log("  POST /analyze-book - Book analysis");
  console.log("  POST /generate-signed-url - Generate S3 signed URL");
  console.log("  POST /refresh-order-urls - Refresh signed URLs for order");
  console.log("  POST /monitor/start - Start order monitoring");
  console.log("  POST /monitor/stop - Stop order monitoring");
  console.log("  GET  /monitor/status - Monitor status");
  console.log("  GET  /health - Health check");
  console.log("  📄 PDF Upload Endpoints:");
  console.log("  POST /api/upload-pdf - Upload PDF files for products");
  console.log("  GET  /api/pdf-info/:filename - Get PDF file information");
  console.log("  DELETE /api/pdf/:filename - Delete PDF file");
  console.log("  GET  /api/health - PDF service health check");
  console.log("=".repeat(80) + "\n");

  // Auto-start order monitor if credentials are available
  if (process.env.AUTO_START_MONITOR !== "false") {
    console.log("🔄 Auto-starting order monitor...\n");
    startOrderMonitor();
  } else {
    console.log("⏸️  Order monitor auto-start disabled\n");
  }
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("\n🛑 SIGTERM received, shutting down gracefully...");
  if (orderMonitor) {
    orderMonitor.stop();
  }
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("\n🛑 SIGINT received, shutting down gracefully...");
  if (orderMonitor) {
    orderMonitor.stop();
  }
  process.exit(0);
});
