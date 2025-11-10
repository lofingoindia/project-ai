// Simple Backend Connection Test
// Run this to test if the backend server is accessible

const express = require('express');

const app = express();

// Enable CORS for all origins during development
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

// Simple test route
app.get('/api/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Backend server is running correctly!',
    timestamp: new Date().toISOString(),
    port: process.env.PORT || 3002
  });
});

const PORT = process.env.PORT || 3002;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🧪 Test server running on: http://localhost:${PORT}`);
  console.log(`🔗 Test endpoint: http://localhost:${PORT}/api/test`);
  console.log('Press Ctrl+C to stop');
});