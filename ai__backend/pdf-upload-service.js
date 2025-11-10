// PDF Upload Service
// Handles PDF file uploads for products

const multer = require('multer');
const path = require('path');
const fs = require('fs');

class PDFUploadService {
  constructor() {
    this.initializeStorage();
    this.setupUpload();
  }

  initializeStorage() {
    // Ensure uploads/pdfs directory exists
    this.uploadPath = path.join(__dirname, 'uploads', 'pdfs');
    if (!fs.existsSync(this.uploadPath)) {
      fs.mkdirSync(this.uploadPath, { recursive: true });
      console.log(`📁 Created PDF upload directory: ${this.uploadPath}`);
    }
  }

  setupUpload() {
    // Configure multer storage
    const storage = multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, this.uploadPath);
      },
      filename: (req, file, cb) => {
        // Generate unique filename: timestamp-random-original.pdf
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const filename = `${uniqueSuffix}${path.extname(file.originalname)}`;
        cb(null, filename);
      }
    });

    // Configure multer with validation
    this.upload = multer({
      storage: storage,
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB limit
        files: 1 // Only one file at a time
      },
      fileFilter: (req, file, cb) => {
        // Validate file type
        if (file.mimetype !== 'application/pdf') {
          const error = new Error('Only PDF files are allowed');
          error.code = 'INVALID_FILE_TYPE';
          return cb(error, false);
        }

        // Validate file extension
        if (!file.originalname.toLowerCase().endsWith('.pdf')) {
          const error = new Error('File must have .pdf extension');
          error.code = 'INVALID_FILE_EXTENSION';
          return cb(error, false);
        }

        cb(null, true);
      }
    });
  }

  // Middleware for single PDF upload
  uploadSingle() {
    return this.upload.single('pdf');
  }

  // Handle PDF upload and return URL
  async handleUpload(req, res) {
    try {
      // Check if file was uploaded
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No PDF file uploaded. Please select a PDF file.',
          code: 'NO_FILE_UPLOADED'
        });
      }

      const file = req.file;
      
      console.log(`📄 PDF uploaded successfully:`, {
        originalName: file.originalname,
        filename: file.filename,
        size: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
        path: file.path
      });

      // Generate public URL for the uploaded PDF
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const pdfUrl = `${baseUrl}/uploads/pdfs/${file.filename}`;

      // Return success response
      res.json({
        success: true,
        message: 'PDF uploaded successfully',
        data: {
          pdf_url: pdfUrl,
          filename: file.filename,
          originalName: file.originalname,
          size: file.size,
          sizeFormatted: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
          uploadedAt: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('PDF upload error:', error);
      
      // Handle specific multer errors
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          error: 'File size too large. Maximum allowed size is 50MB.',
          code: 'FILE_TOO_LARGE'
        });
      }

      if (error.code === 'INVALID_FILE_TYPE' || error.code === 'INVALID_FILE_EXTENSION') {
        return res.status(400).json({
          success: false,
          error: error.message,
          code: error.code
        });
      }

      // Generic error response
      res.status(500).json({
        success: false,
        error: 'Failed to upload PDF file. Please try again.',
        code: 'UPLOAD_ERROR',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Delete PDF file
  async deletePDF(filename) {
    try {
      const filePath = path.join(this.uploadPath, filename);
      
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`🗑️ PDF file deleted: ${filename}`);
        return true;
      } else {
        console.warn(`⚠️ PDF file not found for deletion: ${filename}`);
        return false;
      }
    } catch (error) {
      console.error('Error deleting PDF file:', error);
      return false;
    }
  }

  // Get PDF file info
  getPDFInfo(filename) {
    try {
      const filePath = path.join(this.uploadPath, filename);
      
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        return {
          exists: true,
          filename: filename,
          size: stats.size,
          sizeFormatted: `${(stats.size / 1024 / 1024).toFixed(2)}MB`,
          createdAt: stats.birthtime,
          modifiedAt: stats.mtime
        };
      } else {
        return { exists: false, filename: filename };
      }
    } catch (error) {
      console.error('Error getting PDF info:', error);
      return { exists: false, filename: filename, error: error.message };
    }
  }
}

module.exports = PDFUploadService;