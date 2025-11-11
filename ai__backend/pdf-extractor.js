// PDF Extractor Utility
// Converts PDF pages to base64 images using pdf-to-img

const axios = require('axios');
const fs = require('fs');
const path = require('path');

class PDFExtractor {
  /**
   * Extract all pages from a PDF URL and convert to base64 images
   * Images are kept in memory only (not saved to disk)
   * @param {string} pdfUrl - URL or path to PDF file
   * @param {string} outputPrefix - Optional prefix (kept for compatibility, not used)
   * @returns {Promise<Array<string>>} - Array of base64-encoded page images
   */
  async extractPagesFromPDF(pdfUrl, outputPrefix = null) {
    try {
      console.log(`📄 Extracting pages from PDF: ${pdfUrl}`);

      let pdfPath = pdfUrl;
      let shouldDeleteTempFile = false;

      // Download PDF if it's a URL
      if (pdfUrl.startsWith('http://') || pdfUrl.startsWith('https://')) {
        console.log('⬇️ Downloading PDF from URL...');
        const response = await axios.get(pdfUrl, {
          responseType: 'arraybuffer'
        });
        
        // Save to temporary file
        const tempDir = path.join(__dirname, 'temp');
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true });
        }
        
        pdfPath = path.join(tempDir, `temp_${Date.now()}.pdf`);
        fs.writeFileSync(pdfPath, response.data);
        shouldDeleteTempFile = true;
        console.log(`✅ PDF downloaded to temporary file: ${pdfPath}`);
      }

      // Import pdf-to-img (ES module, so we use dynamic import)
      const { pdf } = await import('pdf-to-img');

      // Convert PDF to images
      console.log('🔄 Converting PDF pages to images...');
      const document = await pdf(pdfPath, { 
        scale: 2.0 // Scale for better quality
      });

      const pageImages = [];
      let pageCounter = 1;

      // Iterate through each page - ONE PAGE = ONE IMAGE
      for await (const image of document) {
        console.log(`📄 Extracting page ${pageCounter} from PDF...`);
        
        // Validate: Each iteration = one PDF page = one image
        if (!image || !Buffer.isBuffer(image)) {
          throw new Error(`Invalid image data for page ${pageCounter}`);
        }
        
        // Convert image buffer to base64 for processing (do not save to disk)
        const base64Image = image.toString('base64');
        
        // Ensure we have valid base64 data
        if (!base64Image || base64Image.length === 0) {
          throw new Error(`Empty image data for page ${pageCounter}`);
        }
        
        // Add to array - maintaining 1:1 mapping (index = page number - 1)
        pageImages.push(base64Image);
        
        console.log(`✅ Page ${pageCounter} extracted and converted to base64 (${base64Image.length} chars)`);
        pageCounter++;
      }

      // Validate: Ensure we extracted at least one page
      if (pageImages.length === 0) {
        throw new Error('No pages extracted from PDF');
      }

      // Clean up temporary PDF file if we downloaded it
      if (shouldDeleteTempFile) {
        try {
          fs.unlinkSync(pdfPath);
          console.log(`🗑️  Temporary PDF file deleted: ${pdfPath}`);
        } catch (err) {
          console.warn(`⚠️  Could not delete temp PDF file: ${pdfPath}`);
        }
      }

      console.log(`✅ All ${pageImages.length} pages extracted successfully (1 page = 1 image)`);
      console.log(`📊 Page-to-image mapping: ${pageImages.length} pages → ${pageImages.length} images`);
      console.log(`💾 Images kept in memory only (not saved to disk)`);
      
      return pageImages;

    } catch (error) {
      console.error('❌ Failed to extract PDF pages:', error);
      throw new Error(`PDF extraction failed: ${error.message}`);
    }
  }

  /**
   * Get PDF page count
   * @param {string} pdfUrl - URL or path to PDF file
   * @returns {Promise<number>} - Number of pages
   */
  async getPageCount(pdfUrl) {
    try {
      let pdfPath = pdfUrl;
      let shouldDeleteTempFile = false;

      // Download PDF if it's a URL
      if (pdfUrl.startsWith('http://') || pdfUrl.startsWith('https://')) {
        console.log('⬇️ Downloading PDF from URL to count pages...');
        const response = await axios.get(pdfUrl, {
          responseType: 'arraybuffer'
        });
        
        // Save to temporary file
        const tempDir = path.join(__dirname, 'temp');
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true });
        }
        
        pdfPath = path.join(tempDir, `temp_count_${Date.now()}.pdf`);
        fs.writeFileSync(pdfPath, response.data);
        shouldDeleteTempFile = true;
      }

      // Import pdf-to-img
      const { pdf } = await import('pdf-to-img');

      // Convert PDF to images (just to count pages)
      const document = await pdf(pdfPath, { 
        scale: 1.0 // Lower scale for faster counting
      });

      let pageCount = 0;
      for await (const image of document) {
        pageCount++;
        // Don't need to process the image, just count
      }

      // Clean up temporary PDF file if we downloaded it
      if (shouldDeleteTempFile) {
        try {
          fs.unlinkSync(pdfPath);
        } catch (err) {
          // Ignore cleanup errors
        }
      }

      return pageCount;
    } catch (error) {
      console.error('❌ Failed to get PDF page count:', error);
      throw new Error(`Failed to get page count: ${error.message}`);
    }
  }
}

module.exports = PDFExtractor;
