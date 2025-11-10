// PDF Extractor Utility
// Converts PDF pages to base64 images using pdf-to-img

const axios = require('axios');
const fs = require('fs');
const path = require('path');

class PDFExtractor {
  /**
   * Extract all pages from a PDF URL and convert to base64 images
   * @param {string} pdfUrl - URL or path to PDF file
   * @returns {Promise<Array<string>>} - Array of base64-encoded page images
   */
  async extractPagesFromPDF(pdfUrl) {
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

      // Iterate through each page
      for await (const image of document) {
        console.log(`📄 Processing page ${pageCounter}...`);
        
        // Convert image buffer to base64
        // image is a Buffer, convert it to base64 string
        const base64Image = Buffer.from(image).toString('base64');
        pageImages.push(base64Image);
        
        console.log(`✅ Page ${pageCounter} converted to base64`);
        pageCounter++;
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

      console.log(`✅ All ${pageImages.length} pages extracted successfully`);
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
