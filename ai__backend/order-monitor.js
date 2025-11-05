
// Watches for paid orders and triggers automatic book generation

const { createClient } = require("@supabase/supabase-js");
const CoverImageGenerator = require("./cover-image-generator");
const CompleteBookPersonalizationService = require("./complete-book-processor");
const axios = require("axios");
const fs = require("fs");
const path = require("path");

class OrderMonitor {
  constructor(config = {}) {
    this.supabaseUrl = config.supabaseUrl || process.env.SUPABASE_URL;
    this.supabaseKey = config.supabaseKey || process.env.SUPABASE_SERVICE_KEY;

    if (!this.supabaseUrl || !this.supabaseKey) {
      throw new Error("Supabase URL and Service Key are required");
    }

    this.supabase = createClient(this.supabaseUrl, this.supabaseKey);
    this.coverGenerator = new CoverImageGenerator(config.geminiApiKey);
    this.bookProcessor = new CompleteBookPersonalizationService();

    this.processingOrders = new Set(); // Track orders being processed
    this.pollInterval = config.pollInterval || 10000; // Poll every 10 seconds
    this.isRunning = false;
  }

  /**
   * Start monitoring for paid orders
   */
  start() {
    if (this.isRunning) {
      console.log("⚠️  Order monitor is already running");
      return;
    }

    console.log("🚀 Starting order monitor...");
    this.isRunning = true;
    this._startPolling();
  }

  /**
   * Stop monitoring
   */
  stop() {
    console.log("🛑 Stopping order monitor...");
    this.isRunning = false;
    if (this.pollTimer) {
      clearTimeout(this.pollTimer);
    }
  }

  /**
   * Poll for pending orders with paid status
   */
  async _startPolling() {
    while (this.isRunning) {
      try {
        await this._checkForPaidOrders();
      } catch (error) {
        console.error("❌ Error checking for paid orders:", error);
      }

      // Wait before next poll
      await new Promise((resolve) => {
        this.pollTimer = setTimeout(resolve, this.pollInterval);
      });
    }
  }

  /**
   * Check for paid orders that need processing
   */
  async _checkForPaidOrders() {
    try {
      // Query for paid orders with pending generation status
      const { data: orderItems, error } = await this.supabase
        .from("order_items")
        .select(
          `
          id,
          order_id,
          book_id,
          quantity,
          personalization_data,
          generation_status,
          orders!inner(
            id,
            payment_status,
            status,
            user_id,
            order_number
          ),
          books(
            id,
            title,
            description,
            genre,
            age_range,
            cover_image_url,
            images,
            characters,
            ideal_for
          )
        `
        )
        .eq("orders.payment_status", "paid")
        .eq("generation_status", "pending")
        .limit(5); // Process up to 5 orders at a time

      if (error) {
        console.error("Database query error:", error);
        return;
      }

      if (!orderItems || orderItems.length === 0) {
        // No pending orders
        return;
      }

      console.log(
        `📋 Found ${orderItems.length} paid order(s) pending generation`
      );

      // Process each order item
      for (const orderItem of orderItems) {
        // Skip if already processing
        if (this.processingOrders.has(orderItem.id)) {
          continue;
        }

        // Process in background
        this._processOrderItem(orderItem).catch((error) => {
          console.error(`Failed to process order item ${orderItem.id}:`, error);
        });
      }
    } catch (error) {
      console.error("Error in _checkForPaidOrders:", error);
    }
  }

  /**
   * Process a single order item - generate personalized book
   */
  async _processOrderItem(orderItem) {
    const orderItemId = orderItem.id;

    try {
      // Mark as processing
      this.processingOrders.add(orderItemId);

      console.log(`\n${"=".repeat(80)}`);
      console.log(`📚 Processing Order Item: ${orderItemId}`);
      console.log(`📖 Book: ${orderItem.books?.title || "Unknown"}`);
      console.log(
        `🎫 Order: ${orderItem.orders?.order_number || orderItem.order_id}`
      );
      console.log(`${"=".repeat(80)}\n`);

      // Update status to processing
      await this.supabase
        .from("order_items")
        .update({
          generation_status: "processing",
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderItemId);

      // Extract personalization data
      const personalizationData = orderItem.personalization_data || {};
      const bookData = orderItem.books || {};

      // Validate required data
      if (
        !personalizationData.childImage &&
        !personalizationData.child_image_url
      ) {
        throw new Error("Child image not found in personalization data");
      }

      if (!personalizationData.childName && !personalizationData.child_name) {
        throw new Error("Child name not found in personalization data");
      }

      // Get child image
      const childImageBase64 = await this._getImageAsBase64(
        personalizationData.childImage || personalizationData.child_image_url
      );

      // Get book cover image
      const bookCoverBase64 = await this._getImageAsBase64(
        bookData.cover_image_url
      );

      // Get all book page images
      const bookPageImages = await this._getBookPageImages(bookData);

      console.log("✅ All images retrieved");

      // Step 1: Generate personalized cover
      console.log("🎨 Generating personalized cover...");
      const coverImageBase64 =
        await this.coverGenerator.generatePersonalizedCover({
          originalCoverImageBase64: bookCoverBase64,
          childImageBase64: childImageBase64,
          bookData: {
            name: bookData.title,
            description: bookData.description,
            genre: bookData.genre,
            ageRange: bookData.age_range,
            characters: bookData.characters,
            idealFor: bookData.ideal_for,
          },
          childData: {
            name:
              personalizationData.childName || personalizationData.child_name,
            age: personalizationData.childAge || personalizationData.child_age,
            gender:
              personalizationData.childGender ||
              personalizationData.child_gender,
          },
        });
      console.log("✅ Personalized cover generated");

      // Upload cover to Supabase Storage
      const coverUrl = await this._uploadToStorage(
        coverImageBase64,
        `covers/order_${orderItem.order_id}_item_${orderItemId}_cover.jpg`,
        "image/jpeg"
      );
      console.log(`✅ Cover uploaded: ${coverUrl}`);

      // Update order item with cover URL
      await this.supabase
        .from("order_items")
        .update({ cover_image_url: coverUrl })
        .eq("id", orderItemId);

      // Step 2: Process complete book with all pages
      console.log("📚 Processing complete book...");
      const bookResult = await this.bookProcessor.processCompleteBook({
        bookPages: bookPageImages,
        childImage: childImageBase64,
        childName:
          personalizationData.childName || personalizationData.child_name,
        bookTitle: bookData.title,
        options: {
          batchSize: 3,
          quality: "high",
          styleConsistency: true,
        },
      });

      if (!bookResult.success) {
        throw new Error(`Book processing failed: ${bookResult.error}`);
      }

      console.log("✅ Complete book processed");
      console.log(`📊 Processing time: ${bookResult.processingTime}ms`);
      console.log(`📄 Pages processed: ${bookResult.totalPages}`);
      console.log(
        `🔄 Character replacements: ${bookResult.characterReplacements}`
      );

      // Step 3: Generate PDF from processed pages
      console.log("📄 Generating PDF...");
      const pdfBuffer = await this._generatePDF(bookResult.personalizedBook, {
        bookName: bookData.title,
        childName:
          personalizationData.childName || personalizationData.child_name,
        coverImage: coverImageBase64,
      });
      console.log("✅ PDF generated");

      // Upload PDF to Supabase Storage
      const pdfUrl = await this._uploadToStorage(
        pdfBuffer,
        `books/order_${orderItem.order_id}_item_${orderItemId}_book.pdf`,
        "application/pdf"
      );
      console.log(`✅ PDF uploaded: ${pdfUrl}`);

      // Step 4: Update order item with success
      await this.supabase
        .from("order_items")
        .update({
          generation_status: "completed",
          pdf_url: pdfUrl,
          generated_at: new Date().toISOString(),
          generation_error: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderItemId);

      // Step 5: Send notification to user
      await this._sendNotification(orderItem, pdfUrl, coverUrl);

      console.log(`\n✅ Order item ${orderItemId} completed successfully!\n`);
    } catch (error) {
      console.error(`❌ Failed to process order item ${orderItemId}:`, error);

      // Update with error status
      await this.supabase
        .from("order_items")
        .update({
          generation_status: "failed",
          generation_error: error.message,
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderItemId);
    } finally {
      // Remove from processing set
      this.processingOrders.delete(orderItemId);
    }
  }

  /**
   * Get image as base64 from URL or existing base64
   */
  async _getImageAsBase64(imageUrlOrBase64) {
    if (!imageUrlOrBase64) {
      throw new Error("Image URL or base64 is required");
    }

    // If already base64, return it
    if (
      imageUrlOrBase64.startsWith("data:image") ||
      !imageUrlOrBase64.startsWith("http")
    ) {
      return imageUrlOrBase64.replace(/^data:image\/\w+;base64,/, "");
    }

    // Download from URL
    try {
      const response = await axios.get(imageUrlOrBase64, {
        responseType: "arraybuffer",
      });
      return Buffer.from(response.data).toString("base64");
    } catch (error) {
      console.error("Failed to download image:", error);
      throw new Error(`Failed to download image from ${imageUrlOrBase64}`);
    }
  }

  /**
   * Get all book page images
   */
  async _getBookPageImages(bookData) {
    const images = bookData.images || [];

    if (images.length === 0) {
      throw new Error("No book page images found");
    }

    console.log(`📄 Retrieving ${images.length} book page images...`);

    const pageImages = [];
    for (const imageUrl of images) {
      const base64 = await this._getImageAsBase64(imageUrl);
      pageImages.push(base64);
    }

    return pageImages;
  }

  /**
   * Generate PDF from processed book pages
   */
  async _generatePDF(personalizedBook, metadata) {
    // For now, we'll use a simple approach - in production you'd use a proper PDF library
    // This is a placeholder that creates a PDF with the processed images

    // TODO: Implement proper PDF generation with PDFKit or similar
    // For now, return a simple buffer
    const PDFDocument = require("pdfkit");

    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ size: "A4", margin: 0 });
        const chunks = [];

        doc.on("data", (chunk) => chunks.push(chunk));
        doc.on("end", () => resolve(Buffer.concat(chunks)));
        doc.on("error", reject);

        // Add cover page with metadata
        if (metadata.coverImage) {
          const coverBuffer = Buffer.from(metadata.coverImage, "base64");
          doc.image(coverBuffer, 0, 0, { width: 595.28, height: 841.89 });
        }

        // Add each processed page
        if (personalizedBook.pages) {
          for (const page of personalizedBook.pages) {
            if (page.processedImage) {
              doc.addPage();
              const pageBuffer = Buffer.from(page.processedImage, "base64");
              doc.image(pageBuffer, 0, 0, { width: 595.28, height: 841.89 });
            }
          }
        }

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Upload file to Supabase Storage
   */
  async _uploadToStorage(dataBufferOrBase64, filePath, contentType) {
    try {
      let buffer;

      if (typeof dataBufferOrBase64 === "string") {
        // Convert base64 to buffer
        buffer = Buffer.from(dataBufferOrBase64, "base64");
      } else {
        buffer = dataBufferOrBase64;
      }

      // Upload to Supabase Storage bucket 'books'
      const { data, error } = await this.supabase.storage
        .from("books")
        .upload(filePath, buffer, {
          contentType: contentType,
          upsert: true,
        });

      if (error) {
        throw error;
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = this.supabase.storage.from("books").getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error("Upload to storage failed:", error);
      throw error;
    }
  }

  /**
   * Send notification to user
   */
  async _sendNotification(orderItem, pdfUrl, coverUrl) {
    try {
      const userId = orderItem.orders?.user_id;
      const bookName = orderItem.books?.title || "Your Book";

      if (!userId) {
        console.warn("No user ID found for notification");
        return;
      }

      // Create in-app notification
      await this.supabase.from("notifications").insert({
        user_id: userId,
        title: "Your Book is Ready! 📚",
        message: `"${bookName}" has been personalized and is ready to download.`,
        type: "book_completed",
        metadata: {
          order_id: orderItem.order_id,
          order_item_id: orderItem.id,
          book_id: orderItem.book_id,
          pdf_url: pdfUrl,
          cover_url: coverUrl,
        },
        is_read: false,
        created_at: new Date().toISOString(),
      });

      console.log("✅ Notification sent to user");
    } catch (error) {
      console.error("Failed to send notification:", error);
    }
  }
}

module.exports = OrderMonitor;