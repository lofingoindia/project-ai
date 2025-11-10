// PDF Extractor Utility
// Converts PDF pages to base64 images

const axios = require('axios');
const { createCanvas } = require('canvas');
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');

// Disable worker for Node.js environment (not needed)
pdfjsLib.GlobalWorkerOptions.workerSrc = false;

class PDFExtractor {
  /**
   * Extract all pages from a PDF URL and convert to base64 images
   * @param {string} pdfUrl - URL or path to PDF file
   * @returns {Promise<Array<string>>} - Array of base64-encoded page images
   */
  async extractPagesFromPDF(pdfUrl) {
    try {
      console.log(`📄 Extracting pages from PDF: ${pdfUrl}`);

      // Download PDF if it's a URL
      let pdfData;
      if (pdfUrl.startsWith('http://') || pdfUrl.startsWith('https://')) {
        console.log('⬇️ Downloading PDF from URL...');
        const response = await axios.get(pdfUrl, {
          responseType: 'arraybuffer'
        });
        pdfData = new Uint8Array(response.data);
      } else {
        // Local file path
        const fs = require('fs');
        pdfData = fs.readFileSync(pdfUrl);
      }

      // Load PDF document
      const loadingTask = pdfjsLib.getDocument({ data: pdfData });
      const pdfDocument = await loadingTask.promise;
      const numPages = pdfDocument.numPages;

      console.log(`📚 PDF loaded: ${numPages} pages`);

      const pageImages = [];

      // Extract each page
      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        console.log(`📄 Extracting page ${pageNum}/${numPages}...`);
        
        const page = await pdfDocument.getPage(pageNum);
        const viewport = page.getViewport({ scale: 2.0 }); // Scale for better quality

        // Create canvas
        const canvas = createCanvas(viewport.width, viewport.height);
        const context = canvas.getContext('2d');

        // Render PDF page to canvas
        const renderContext = {
          canvasContext: context,
          viewport: viewport
        };

        await page.render(renderContext).promise;

        // Convert canvas to base64 image
        const imageData = canvas.toDataURL('image/jpeg', 0.95);
        // Remove data URI prefix to get just base64
        const base64Image = imageData.replace(/^data:image\/\w+;base64,/, '');
        
        pageImages.push(base64Image);
        console.log(`✅ Page ${pageNum} extracted`);
      }

      console.log(`✅ All ${numPages} pages extracted successfully`);
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
      let pdfData;
      if (pdfUrl.startsWith('http://') || pdfUrl.startsWith('https://')) {
        const response = await axios.get(pdfUrl, {
          responseType: 'arraybuffer'
        });
        pdfData = new Uint8Array(response.data);
      } else {
        const fs = require('fs');
        pdfData = fs.readFileSync(pdfUrl);
      }

      const loadingTask = pdfjsLib.getDocument({ data: pdfData });
      const pdfDocument = await loadingTask.promise;
      return pdfDocument.numPages;
    } catch (error) {
      console.error('❌ Failed to get PDF page count:', error);
      throw new Error(`Failed to get page count: ${error.message}`);
    }
  }
}

module.exports = PDFExtractor;

