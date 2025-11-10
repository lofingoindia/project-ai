// PDF Uploads Endpoint
// Handles PDF file uploads for products

const express = require('express');
const PDFUploadService = require('./pdf-upload-service');

// Initialize PDF upload service
const pdfUploadService = new PDFUploadService();

// Create router for PDF endpoints
const router = express.Router();

// POST /api/upload-pdf - Upload a single PDF file
router.post('/upload-pdf', (req, res, next) => {
  // Apply multer middleware
  pdfUploadService.uploadSingle()(req, res, (err) => {
    if (err) {
      console.error('Multer error:', err);
      
      // Handle multer-specific errors
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          error: 'File size too large. Maximum allowed size is 50MB.',
          code: 'FILE_TOO_LARGE'
        });
      }
      
      if (err.code === 'INVALID_FILE_TYPE') {
        return res.status(400).json({
          success: false,
          error: 'Only PDF files are allowed.',
          code: 'INVALID_FILE_TYPE'
        });
      }

      if (err.code === 'INVALID_FILE_EXTENSION') {
        return res.status(400).json({
          success: false,
          error: 'File must have .pdf extension.',
          code: 'INVALID_FILE_EXTENSION'
        });
      }
      
      return res.status(400).json({
        success: false,
        error: err.message || 'File upload failed.',
        code: 'UPLOAD_ERROR'
      });
    }
    
    // If no multer error, proceed to upload handler
    next();
  });
}, (req, res) => {
  // Handle the upload
  pdfUploadService.handleUpload(req, res);
});

// GET /api/pdf-info/:filename - Get PDF file information
router.get('/pdf-info/:filename', (req, res) => {
  try {
    const { filename } = req.params;
    
    if (!filename) {
      return res.status(400).json({
        success: false,
        error: 'Filename is required.',
        code: 'MISSING_FILENAME'
      });
    }

    const pdfInfo = pdfUploadService.getPDFInfo(filename);
    
    res.json({
      success: true,
      data: pdfInfo
    });
    
  } catch (error) {
    console.error('Error getting PDF info:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get PDF information.',
      code: 'INFO_ERROR'
    });
  }
});

// DELETE /api/pdf/:filename - Delete a PDF file
router.delete('/pdf/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    
    if (!filename) {
      return res.status(400).json({
        success: false,
        error: 'Filename is required.',
        code: 'MISSING_FILENAME'
      });
    }

    const deleted = await pdfUploadService.deletePDF(filename);
    
    if (deleted) {
      res.json({
        success: true,
        message: 'PDF file deleted successfully.',
        filename: filename
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'PDF file not found.',
        code: 'FILE_NOT_FOUND'
      });
    }
    
  } catch (error) {
    console.error('Error deleting PDF:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete PDF file.',
      code: 'DELETE_ERROR'
    });
  }
});

// Health check endpoint for PDF service
router.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'PDF Upload Service',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    endpoints: [
      'POST /api/upload-pdf - Upload PDF file',
      'GET /api/pdf-info/:filename - Get PDF information',
      'DELETE /api/pdf/:filename - Delete PDF file'
    ]
  });
});

module.exports = router;