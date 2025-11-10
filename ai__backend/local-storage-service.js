// Local File Storage Service
// Replaces S3 with local file system storage

const fs = require("fs");
const path = require("path");

class LocalStorageService {
  constructor(config = {}) {
    // Base directory for uploads (defaults to ./uploads in the backend folder)
    this.baseDir = config.baseDir || path.join(__dirname, "uploads");
    this.baseUrl = config.baseUrl || process.env.BASE_URL || "https://api.hero-kids.net";
    
    // Create uploads directory if it doesn't exist
    this._ensureDirectoryExists(this.baseDir);
    
    // Create subdirectories
    this._ensureDirectoryExists(path.join(this.baseDir, "books"));
    this._ensureDirectoryExists(path.join(this.baseDir, "covers"));
    
    console.log(`✅ Local Storage Service initialized (Directory: ${this.baseDir})`);
  }

  /**
   * Ensure directory exists, create if it doesn't
   */
  _ensureDirectoryExists(dirPath) {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      console.log(`📁 Created directory: ${dirPath}`);
    }
  }

  /**
   * Upload file to local storage
   * @param {Buffer|string} data - File data as Buffer or base64 string
   * @param {string} key - File path (e.g., 'books/order_123_book.pdf')
   * @param {string} contentType - MIME type (e.g., 'image/jpeg', 'application/pdf')
   * @returns {Promise<string>} - File path key
   */
  async uploadFile(data, key, contentType) {
    try {
      let buffer;

      // Convert base64 to buffer if needed
      if (typeof data === "string") {
        buffer = Buffer.from(data, "base64");
      } else {
        buffer = data;
      }

      // Full file path
      const filePath = path.join(this.baseDir, key);
      
      // Ensure parent directory exists
      const parentDir = path.dirname(filePath);
      this._ensureDirectoryExists(parentDir);

      // Write file to disk
      fs.writeFileSync(filePath, buffer);

      console.log(`✅ File saved locally: ${key}`);
      return key; // Return the key
    } catch (error) {
      console.error("❌ Local storage upload failed:", error);
      throw new Error(`Failed to save file locally: ${error.message}`);
    }
  }

  /**
   * Generate a public URL for accessing the file
   * @param {string} key - File path key
   * @param {number} expiresIn - Not used for local storage (included for API compatibility)
   * @returns {Promise<string>} - Public URL
   */
  async getPublicUrl(key, expiresIn = 3600) {
    try {
      // Return a URL that points to our static file server
      // e.g., http://localhost:5000/uploads/books/order_123_book.pdf
      const publicUrl = `${this.baseUrl}/uploads/${key}`;
      return publicUrl;
    } catch (error) {
      console.error("❌ Failed to generate public URL:", error);
      throw new Error(`Failed to generate public URL: ${error.message}`);
    }
  }

  /**
   * Upload file and return public URL in one call
   * @param {Buffer|string} data - File data
   * @param {string} key - File path key
   * @param {string} contentType - MIME type
   * @param {number} expiresIn - Not used for local storage (API compatibility)
   * @returns {Promise<{key: string, signedUrl: string}>}
   */
  async uploadAndGetSignedUrl(data, key, contentType, expiresIn = 3600) {
    const uploadedKey = await this.uploadFile(data, key, contentType);
    const publicUrl = await this.getPublicUrl(uploadedKey, expiresIn);

    return {
      key: uploadedKey,
      signedUrl: publicUrl,
    };
  }

  /**
   * Check if file exists
   * @param {string} key - File path key
   * @returns {boolean}
   */
  fileExists(key) {
    const filePath = path.join(this.baseDir, key);
    return fs.existsSync(filePath);
  }

  /**
   * Delete file
   * @param {string} key - File path key
   * @returns {Promise<boolean>}
   */
  async deleteFile(key) {
    try {
      const filePath = path.join(this.baseDir, key);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`✅ File deleted: ${key}`);
        return true;
      }
      return false;
    } catch (error) {
      console.error("❌ Failed to delete file:", error);
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }

  /**
   * Get file stats
   * @param {string} key - File path key
   * @returns {Promise<Object>}
   */
  async getFileStats(key) {
    try {
      const filePath = path.join(this.baseDir, key);
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        return {
          size: stats.size,
          created: stats.birthtime,
          modified: stats.mtime,
        };
      }
      return null;
    } catch (error) {
      console.error("❌ Failed to get file stats:", error);
      throw new Error(`Failed to get file stats: ${error.message}`);
    }
  }
}

module.exports = LocalStorageService;

