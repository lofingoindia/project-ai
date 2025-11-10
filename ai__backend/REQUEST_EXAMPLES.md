# Request Examples

Complete working examples for all API endpoints with detailed explanations.

## Table of Contents

1. [Health & Monitor](#health--monitor)
2. [Image Generation](#image-generation)
3. [Cover Generation](#cover-generation)
4. [Book Processing](#book-processing)
5. [URL Management](#url-management)
6. [Complete Workflows](#complete-workflows)

---

## Health & Monitor

### 1. Health Check

**Endpoint:** `GET /health`

**Request:**
```http
GET http://localhost:5000/health
```

**Response:**
```json
{
  "status": "healthy",
  "message": "API is running",
  "orderMonitor": {
    "enabled": true,
    "running": true
  }
}
```

**Use Case:** Verify server is running before making requests.

---

### 2. Monitor Status

**Endpoint:** `GET /monitor/status`

**Request:**
```http
GET http://localhost:5000/monitor/status
```

**Response:**
```json
{
  "isRunning": true,
  "processingOrders": 2,
  "pollInterval": 10000
}
```

**Fields Explained:**
- `isRunning`: Whether monitor is actively checking for orders
- `processingOrders`: Number of orders currently being processed
- `pollInterval`: Milliseconds between database checks

---

### 3. Start Monitor

**Endpoint:** `POST /monitor/start`

**Request:**
```http
POST http://localhost:5000/monitor/start
```

**Response:**
```json
{
  "message": "Order monitor started successfully"
}
```

**Note:** If already running, returns: `"Order monitor is already running"`

---

### 4. Stop Monitor

**Endpoint:** `POST /monitor/stop`

**Request:**
```http
POST http://localhost:5000/monitor/stop
```

**Response:**
```json
{
  "message": "Order monitor stopped successfully"
}
```

---

## Image Generation

### Generate Single Image

**Endpoint:** `POST /generate-image`

**Request:**
```json
{
  "prompt": "A magical forest scene with a friendly dragon and a brave child holding a sword. The child has brown hair and is wearing a red cape. Cartoon style, bright colors, suitable for children aged 5-8.",
  "image": "<BASE64_IMAGE_DATA>"
}
```

**Response:**
```json
{
  "success": true,
  "generated_image": "<BASE64_GENERATED_IMAGE>",
  "message": "Image generated successfully"
}
```

**Prompt Guidelines:**
- Be descriptive about scene, characters, and style
- Specify age-appropriateness
- Include art style (cartoon, realistic, watercolor, etc.)
- Mention specific features (hair color, clothing, etc.)

**Example Prompts:**

**Adventure Scene:**
```
A brave young explorer with blonde hair discovering a hidden treasure cave. 
Bright gems sparkle on the walls. Cartoon style, vibrant colors, exciting mood, 
suitable for children aged 6-8.
```

**Space Theme:**
```
A child astronaut in a colorful spacesuit floating near colorful planets. 
Stars twinkle in the background. Friendly alien creatures wave hello. 
Playful cartoon style, bright colors, ages 5-7.
```

**Fantasy Theme:**
```
A young wizard with a magical wand standing in an enchanted library. 
Books float in the air, glowing with magic. A friendly owl perches nearby. 
Whimsical illustration style, warm colors, ages 7-10.
```

---

## Cover Generation

### Basic Cover Generation

**Endpoint:** `POST /generate-cover`

**Request (Minimal):**
```json
{
  "originalCoverImage": "<BASE64_ORIGINAL_COVER>",
  "childImage": "<BASE64_CHILD_PHOTO>",
  "bookData": {
    "name": "The Magical Adventure"
  },
  "childData": {
    "name": "Emma"
  }
}
```

**Request (Complete):**
```json
{
  "originalCoverImage": "<BASE64_ORIGINAL_COVER>",
  "childImage": "<BASE64_CHILD_PHOTO>",
  "bookData": {
    "name": "The Magical Adventure",
    "description": "A thrilling adventure story where the child becomes a hero in a magical world",
    "genre": "Fantasy Adventure",
    "ageRange": "5-8 years",
    "themes": ["courage", "friendship", "magic"],
    "mainCharacterDescription": "A brave young hero"
  },
  "childData": {
    "name": "Emma",
    "age": 6,
    "gender": "girl",
    "hairColor": "brown",
    "favoriteColor": "purple"
  }
}
```

**Response:**
```json
{
  "success": true,
  "coverImage": "<BASE64_PERSONALIZED_COVER>",
  "message": "Personalized cover generated successfully"
}
```

**Cover Generation Examples:**

**Girl Character - Fantasy:**
```json
{
  "originalCoverImage": "<BASE64>",
  "childImage": "<BASE64>",
  "bookData": {
    "name": "Emma's Enchanted Forest",
    "description": "Emma discovers a magical forest where animals talk and trees whisper secrets",
    "genre": "Fantasy",
    "ageRange": "5-8 years"
  },
  "childData": {
    "name": "Emma",
    "age": 6,
    "gender": "girl"
  }
}
```

**Boy Character - Adventure:**
```json
{
  "originalCoverImage": "<BASE64>",
  "childImage": "<BASE64>",
  "bookData": {
    "name": "Alex's Pirate Adventure",
    "description": "Alex sets sail on a quest to find the legendary treasure island",
    "genre": "Adventure",
    "ageRange": "6-10 years"
  },
  "childData": {
    "name": "Alex",
    "age": 8,
    "gender": "boy"
  }
}
```

**Neutral - Educational:**
```json
{
  "originalCoverImage": "<BASE64>",
  "childImage": "<BASE64>",
  "bookData": {
    "name": "Sam's Space Mission",
    "description": "Join Sam on an educational journey through the solar system",
    "genre": "Educational Science Fiction",
    "ageRange": "7-10 years"
  },
  "childData": {
    "name": "Sam",
    "age": 7,
    "gender": "other"
  }
}
```

---

## Book Processing

### Analyze Book (Preview)

**Endpoint:** `POST /analyze-book`

**Request:**
```json
{
  "bookPages": [
    "<BASE64_PAGE_1>",
    "<BASE64_PAGE_2>",
    "<BASE64_PAGE_3>",
    "<BASE64_PAGE_4>",
    "<BASE64_PAGE_5>"
  ]
}
```

**Response:**
```json
{
  "success": true,
  "bookAnalysis": {
    "totalPages": 5,
    "charactersDetected": true,
    "estimatedProcessingTime": "75-150 seconds",
    "recommendations": {
      "batchSize": 3,
      "quality": "high",
      "styleConsistency": true
    },
    "detectedElements": {
      "hasText": true,
      "hasCharacters": true,
      "complexityLevel": "medium"
    }
  },
  "message": "Book analysis completed successfully"
}
```

**Use Case:** Preview before processing to estimate time and resources needed.

---

### Process Complete Book

**Endpoint:** `POST /process-complete-book`

**Request (Small Book - 3 Pages):**
```json
{
  "bookPages": [
    "<BASE64_PAGE_1>",
    "<BASE64_PAGE_2>",
    "<BASE64_PAGE_3>"
  ],
  "childImage": "<BASE64_CHILD_PHOTO>",
  "childName": "Emma",
  "bookTitle": "Emma's Magical Adventure",
  "processingOptions": {
    "batchSize": 3,
    "quality": "high",
    "styleConsistency": true
  }
}
```

**Request (Medium Book - 10 Pages):**
```json
{
  "bookPages": [
    "<BASE64_PAGE_1>",
    "<BASE64_PAGE_2>",
    "<BASE64_PAGE_3>",
    "<BASE64_PAGE_4>",
    "<BASE64_PAGE_5>",
    "<BASE64_PAGE_6>",
    "<BASE64_PAGE_7>",
    "<BASE64_PAGE_8>",
    "<BASE64_PAGE_9>",
    "<BASE64_PAGE_10>"
  ],
  "childImage": "<BASE64_CHILD_PHOTO>",
  "childName": "Alex",
  "bookTitle": "Alex's Space Adventure",
  "processingOptions": {
    "batchSize": 5,
    "quality": "high",
    "styleConsistency": true
  }
}
```

**Request (High Quality - Small Batch):**
```json
{
  "bookPages": [
    "<BASE64_PAGE_1>",
    "<BASE64_PAGE_2>",
    "<BASE64_PAGE_3>",
    "<BASE64_PAGE_4>",
    "<BASE64_PAGE_5>"
  ],
  "childImage": "<BASE64_CHILD_PHOTO>",
  "childName": "Sophie",
  "bookTitle": "Sophie's Enchanted Forest",
  "processingOptions": {
    "batchSize": 2,
    "quality": "ultra",
    "styleConsistency": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "personalizedBook": {
    "pages": [
      "<BASE64_PERSONALIZED_PAGE_1>",
      "<BASE64_PERSONALIZED_PAGE_2>",
      "<BASE64_PERSONALIZED_PAGE_3>"
    ],
    "metadata": {
      "childName": "Emma",
      "bookTitle": "Emma's Magical Adventure",
      "totalPages": 3,
      "processingDate": "2025-11-09T12:00:00Z"
    }
  },
  "totalPages": 3,
  "processingTime": "52.3 seconds",
  "characterReplacements": 15,
  "message": "Complete book processed successfully"
}
```

**Processing Options Explained:**

**batchSize:**
- `1-2`: Maximum quality, slowest (5-10s per page)
- `3`: Balanced - Recommended (3-5s per page)
- `4-5`: Faster processing, slight quality trade-off (2-3s per page)
- `6+`: Not recommended (consistency issues)

**quality:**
- `standard`: Fast, good for testing (80% quality)
- `high`: Production quality - Recommended (95% quality)
- `ultra`: Maximum quality, slowest (100% quality)

**styleConsistency:**
- `true`: Maintains consistent character appearance across pages (Recommended)
- `false`: Faster but character may vary slightly

**Recommended Combinations:**

**Fast Testing:**
```json
{
  "batchSize": 5,
  "quality": "standard",
  "styleConsistency": false
}
```

**Production:**
```json
{
  "batchSize": 3,
  "quality": "high",
  "styleConsistency": true
}
```

**Showcase/Demo:**
```json
{
  "batchSize": 2,
  "quality": "ultra",
  "styleConsistency": true
}
```

---

## URL Management

### Generate Signed URL

**Endpoint:** `POST /generate-signed-url`

**Request:**
```json
{
  "s3Key": "books/user-abc123/order-def456/personalized-book-789.pdf",
  "expiresIn": 604800
}
```

**Response:**
```json
{
  "success": true,
  "signedUrl": "https://s3.amazonaws.com/your-bucket/books/user-abc123/order-def456/personalized-book-789.pdf?AWSAccessKeyId=...&Signature=...&Expires=...",
  "expiresIn": 604800
}
```

**Expiration Times:**
- `3600`: 1 hour (testing)
- `86400`: 24 hours (short-term)
- `604800`: 7 days (default, recommended)
- `2592000`: 30 days (long-term)

**Example S3 Keys:**
```
books/user-{userId}/order-{orderId}/book-{bookId}.pdf
books/user-{userId}/order-{orderId}/cover-{bookId}.jpg
books/test-user/test-order/sample-book.pdf
```

---

### Refresh Order URLs

**Endpoint:** `POST /refresh-order-urls`

**Request:**
```json
{
  "orderItemId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response:**
```json
{
  "success": true,
  "pdfUrl": "https://s3.amazonaws.com/.../personalized-book.pdf?...",
  "coverUrl": "https://s3.amazonaws.com/.../personalized-cover.jpg?...",
  "message": "Signed URLs refreshed successfully"
}
```

**Use Case:** When existing URLs have expired and user needs to re-download.

---

## Complete Workflows

### Workflow 1: Quick Single Image Test

**Purpose:** Test basic AI image generation

**Steps:**

1. **Health Check**
```http
GET /health
```

2. **Generate Image**
```json
POST /generate-image
{
  "prompt": "A friendly cartoon character, smiling and happy",
  "image": "<BASE64_SAMPLE>"
}
```

**Total Time:** ~10-30 seconds

---

### Workflow 2: Cover Generation

**Purpose:** Generate personalized book cover

**Steps:**

1. **Analyze Book (Optional)**
```json
POST /analyze-book
{
  "bookPages": ["<BASE64_PAGE_1>", "<BASE64_PAGE_2>"]
}
```

2. **Generate Cover**
```json
POST /generate-cover
{
  "originalCoverImage": "<BASE64_COVER>",
  "childImage": "<BASE64_CHILD>",
  "bookData": {
    "name": "The Adventure",
    "genre": "Fantasy",
    "ageRange": "5-8"
  },
  "childData": {
    "name": "Emma",
    "age": 6,
    "gender": "girl"
  }
}
```

**Total Time:** ~15-60 seconds

---

### Workflow 3: Complete Book Processing

**Purpose:** Process entire book with personalization

**Steps:**

1. **Check Monitor Status**
```http
GET /monitor/status
```

2. **Analyze Book First**
```json
POST /analyze-book
{
  "bookPages": ["<BASE64_PAGE_1>", "<BASE64_PAGE_2>", "<BASE64_PAGE_3>"]
}
```

3. **Process Book**
```json
POST /process-complete-book
{
  "bookPages": ["<BASE64_PAGE_1>", "<BASE64_PAGE_2>", "<BASE64_PAGE_3>"],
  "childImage": "<BASE64_CHILD>",
  "childName": "Emma",
  "bookTitle": "Emma's Adventure",
  "processingOptions": {
    "batchSize": 3,
    "quality": "high",
    "styleConsistency": true
  }
}
```

4. **Save Results**
- Extract personalized pages from response
- Save to local storage or S3
- Generate PDF (if needed)

**Total Time:** ~30-90 seconds for 3 pages

---

### Workflow 4: Order Monitor Testing

**Purpose:** Test automatic order processing

**Steps:**

1. **Check Initial Status**
```http
GET /monitor/status
```

2. **Start Monitor**
```http
POST /monitor/start
```

3. **Create Test Order** (in database)
```sql
-- Insert a test order with payment_status = 'paid'
-- Monitor will automatically pick it up
```

4. **Monitor Processing**
```http
GET /monitor/status
-- Check processingOrders count
```

5. **Verify Results** (in database)
```sql
-- Check order_items table for generation_status = 'completed'
-- Verify pdf_url and cover_image_url are populated
```

6. **Stop Monitor**
```http
POST /monitor/stop
```

**Total Time:** Variable (depends on order complexity)

---

### Workflow 5: URL Refresh

**Purpose:** Refresh expired download URLs

**Steps:**

1. **Get Order Item ID** (from database or app)

2. **Refresh URLs**
```json
POST /refresh-order-urls
{
  "orderItemId": "550e8400-e29b-41d4-a716-446655440000"
}
```

3. **Update Frontend** with new URLs

**Total Time:** ~1-2 seconds

---

## Error Handling Examples

### Missing Parameters

**Request:**
```json
POST /generate-image
{
  "prompt": "Test image"
  // Missing "image" parameter
}
```

**Response:**
```json
{
  "error": "prompt and image parameters are required"
}
```

**Status Code:** 400

---

### Invalid Image Data

**Request:**
```json
POST /generate-cover
{
  "originalCoverImage": "invalid_base64",
  "childImage": "also_invalid",
  // ...
}
```

**Response:**
```json
{
  "success": false,
  "error": "Cover generation failed: Invalid image format"
}
```

**Status Code:** 500

---

### Monitor Already Running

**Request:**
```http
POST /monitor/start
```

**Response:**
```json
{
  "message": "Order monitor is already running"
}
```

**Status Code:** 200

---

## Tips for Success

### Image Quality

**For Best Results:**
- Use JPEG format for photos
- Resolution: 1024x1024 or higher
- File size: Under 5MB per image
- Clear, well-lit photos
- Child facing camera
- Minimal background clutter

### Processing Tips

1. **Start Small:** Test with 2-3 pages first
2. **Analyze First:** Always analyze before processing large books
3. **Adjust Settings:** Fine-tune based on results
4. **Monitor Logs:** Watch server console for detailed progress
5. **Save Responses:** Keep successful responses for reference

### Performance Optimization

1. **Batch Size:** Start with 3, increase to 5 for larger books
2. **Quality:** Use "high" for production, "standard" for testing
3. **Timeouts:** Set appropriate timeouts (60s for images, 300s for books)
4. **Retry Logic:** Implement retry for 500 errors
5. **Caching:** Cache generated images where possible

---

## Next Steps

1. Import the [Postman Collection](AI-Backend-Postman-Collection.json)
2. Review the [Testing Guide](POSTMAN_TESTING_GUIDE.md)
3. Check the [API Quick Reference](API_QUICK_REFERENCE.md)
4. Read the main [README](README.md) for setup

**Happy Testing! 🚀**

