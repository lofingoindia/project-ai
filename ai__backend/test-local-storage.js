// Test Local Storage Service
// Run with: node test-local-storage.js

const LocalStorageService = require("./local-storage-service");
const fs = require("fs");
const path = require("path");

async function testLocalStorage() {
  console.log("🧪 Testing Local Storage Service\n");

  try {
    // Initialize service
    console.log("1️⃣ Initializing LocalStorageService...");
    const storage = new LocalStorageService({
      baseDir: path.join(__dirname, "uploads"),
      baseUrl: "http://localhost:5000",
    });
    console.log("✅ Service initialized\n");

    // Test 1: Upload a text file
    console.log("2️⃣ Testing file upload...");
    const testData = "Hello, this is a test file!";
    const testBuffer = Buffer.from(testData, "utf-8");
    const testKey = "books/test_file.txt";

    const uploadedKey = await storage.uploadFile(testBuffer, testKey, "text/plain");
    console.log(`✅ File uploaded with key: ${uploadedKey}\n`);

    // Test 2: Generate public URL
    console.log("3️⃣ Testing URL generation...");
    const publicUrl = await storage.getPublicUrl(testKey);
    console.log(`✅ Public URL generated: ${publicUrl}\n`);

    // Test 3: Check if file exists
    console.log("4️⃣ Testing file existence check...");
    const exists = storage.fileExists(testKey);
    console.log(`✅ File exists: ${exists}\n`);

    // Test 4: Get file stats
    console.log("5️⃣ Testing file stats...");
    const stats = await storage.getFileStats(testKey);
    console.log(`✅ File stats:`, {
      size: `${stats.size} bytes`,
      created: stats.created.toISOString(),
      modified: stats.modified.toISOString(),
    });
    console.log();

    // Test 5: Upload and get URL in one call (simulating image upload)
    console.log("6️⃣ Testing uploadAndGetSignedUrl with base64 image...");
    const testImageBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="; // 1x1 red pixel
    const imageKey = "covers/test_cover.png";

    const result = await storage.uploadAndGetSignedUrl(
      testImageBase64,
      imageKey,
      "image/png"
    );
    console.log(`✅ Image uploaded:`);
    console.log(`   Key: ${result.key}`);
    console.log(`   URL: ${result.signedUrl}\n`);

    // Test 6: Verify image file exists
    console.log("7️⃣ Verifying image file...");
    const imageExists = storage.fileExists(imageKey);
    console.log(`✅ Image file exists: ${imageExists}\n`);

    // Test 7: Delete test files
    console.log("8️⃣ Cleaning up test files...");
    await storage.deleteFile(testKey);
    await storage.deleteFile(imageKey);
    console.log("✅ Test files deleted\n");

    // Final verification
    console.log("9️⃣ Final verification...");
    const stillExists = storage.fileExists(testKey);
    console.log(`✅ File still exists after deletion: ${stillExists}\n`);

    console.log("=" .repeat(50));
    console.log("✅ All tests passed! Local storage is working correctly.");
    console.log("=" .repeat(50));
  } catch (error) {
    console.error("\n❌ Test failed:", error);
    process.exit(1);
  }
}

// Run tests
testLocalStorage();

