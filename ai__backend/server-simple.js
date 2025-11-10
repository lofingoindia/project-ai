// Enhanced Server with PDF Upload Support
// This is a minimal server focused on PDF uploads for debugging

require("dotenv").config();
const express = require("express");
const path = require("path");

const app = express();

// Enhanced CORS configuration
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  
  next();
});

// Body parser middleware
app.use(express.json({ limit: "50mb" }));

// Serve static files
const uploadsPath = path.join(__dirname, "uploads");
app.use("/uploads", express.static(uploadsPath));
console.log(`📁 Serving static files from: ${uploadsPath}`);

// Test route
app.get('/api/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Server is running!',
    timestamp: new Date().toISOString()
  });
});

// Import and use PDF upload routes
let pdfRouterLoaded = false;
try {
  const pdfUploadsRouter = require('./pdf-uploads');
  app.use('/api', pdfUploadsRouter);
  pdfRouterLoaded = true;
  console.log('✅ PDF upload routes loaded successfully');
} catch (error) {
  console.error('❌ Failed to load PDF upload routes:', error.message);
  pdfRouterLoaded = false;
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    pdfUploadEnabled: pdfRouterLoaded,
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// Start server
const PORT = process.env.PORT || 3002;

app.listen(PORT, '0.0.0.0', () => {
  console.log("\n" + "=".repeat(60));
  console.log("🚀 Enhanced PDF Upload Server Started");
  console.log("=".repeat(60));
  console.log(`📡 Server running on: http://localhost:${PORT}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
  console.log(`🧪 Test endpoint: http://localhost:${PORT}/api/test`);
  
  if (pdfRouterLoaded) {
    console.log(`📄 PDF Upload: http://localhost:${PORT}/api/upload-pdf`);
  } else {
    console.log(`❌ PDF Upload: DISABLED (router failed to load)`);
  }
  
  console.log("=".repeat(60) + "\n");
});

module.exports = app;