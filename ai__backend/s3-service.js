// AWS S3 Service for file uploads and signed URL generation
// Replaces Supabase Storage with S3

const { S3Client, PutObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

class S3Service {
  constructor(config = {}) {
    this.region = config.region || process.env.AWS_REGION || "us-east-1";
    this.bucketName = config.bucketName || process.env.AWS_S3_BUCKET_NAME;
    this.accessKeyId = config.accessKeyId || process.env.AWS_ACCESS_KEY_ID;
    this.secretAccessKey =
      config.secretAccessKey || process.env.AWS_SECRET_ACCESS_KEY;

    if (!this.bucketName) {
      throw new Error("AWS S3 bucket name is required");
    }

    if (!this.accessKeyId || !this.secretAccessKey) {
      throw new Error("AWS credentials are required");
    }

    // Initialize S3 client
    this.s3Client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: this.accessKeyId,
        secretAccessKey: this.secretAccessKey,
      },
    });

    console.log(`✅ S3 Service initialized (Bucket: ${this.bucketName}, Region: ${this.region})`);
  }

  /**
   * Upload file to S3
   * @param {Buffer|string} data - File data as Buffer or base64 string
   * @param {string} key - S3 object key (path)
   * @param {string} contentType - MIME type (e.g., 'image/jpeg', 'application/pdf')
   * @returns {Promise<string>} - S3 object key (not public URL, use getSignedUrl for access)
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

      // Upload to S3
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        // Make files private by default (use signed URLs for access)
        ACL: "private",
      });

      await this.s3Client.send(command);

      console.log(`✅ File uploaded to S3: ${key}`);
      return key; // Return the key, not a URL
    } catch (error) {
      console.error("❌ S3 upload failed:", error);
      throw new Error(`Failed to upload to S3: ${error.message}`);
    }
  }

  /**
   * Generate a signed URL for downloading a file
   * @param {string} key - S3 object key
   * @param {number} expiresIn - URL expiration time in seconds (default: 1 hour)
   * @returns {Promise<string>} - Signed URL
   */
  async getSignedUrl(key, expiresIn = 3600) {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const signedUrl = await getSignedUrl(this.s3Client, command, {
        expiresIn: expiresIn,
      });

      return signedUrl;
    } catch (error) {
      console.error("❌ Failed to generate signed URL:", error);
      throw new Error(`Failed to generate signed URL: ${error.message}`);
    }
  }

  /**
   * Upload file and return signed URL in one call
   * @param {Buffer|string} data - File data
   * @param {string} key - S3 object key
   * @param {string} contentType - MIME type
   * @param {number} expiresIn - Signed URL expiration in seconds
   * @returns {Promise<{key: string, signedUrl: string}>}
   */
  async uploadAndGetSignedUrl(data, key, contentType, expiresIn = 3600) {
    const uploadedKey = await this.uploadFile(data, key, contentType);
    const signedUrl = await this.getSignedUrl(uploadedKey, expiresIn);

    return {
      key: uploadedKey,
      signedUrl: signedUrl,
    };
  }
}

module.exports = S3Service;

