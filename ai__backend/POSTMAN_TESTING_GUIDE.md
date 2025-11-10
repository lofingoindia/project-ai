# Postman Testing Guide for AI Backend

Complete guide for testing the AI Book Personalization Backend using the Postman collection.

## 📥 Import the Collection

### Method 1: Import from File

1. Open Postman
2. Click **Import** button (top left)
3. Select **File** tab
4. Choose `AI-Backend-Postman-Collection.json` from the `ai__backend` directory
5. Click **Import**

### Method 2: Drag and Drop

1. Open Postman
2. Drag `AI-Backend-Postman-Collection.json` into Postman window
3. Confirm import

## 🔧 Setup Environment Variables

The collection includes default variables, but you should customize them:

### Option 1: Use Collection Variables (Default)

The collection comes with default variables:
- `baseUrl`: `http://localhost:5000` (default)
- `sampleImage`: A small 1x1 base64 image for testing

### Option 2: Create a Postman Environment (Recommended for Production)

1. Click **Environments** in left sidebar
2. Click **+** to create new environment
3. Name it: `AI Backend Local` or `AI Backend Production`
4. Add variables:

```
Variable Name    | Initial Value              | Current Value
----------------|----------------------------|---------------------------
baseUrl         | http://localhost:5000      | http://localhost:5000
sampleImage     | <your_base64_image>        | <your_base64_image>
orderItemId     | <test_order_item_uuid>     | <test_order_item_uuid>
s3Key           | books/test/sample.pdf      | books/test/sample.pdf
```

5. Save the environment
6. Select the environment from dropdown (top right)

## 🚀 Before Running Tests

### 1. Start the Backend Server

```bash
cd ai__backend
npm install
npm start
```

Verify server is running at `http://localhost:5000`

### 2. Configure Environment Variables

Ensure your `.env` file has required keys:

```env
GOOGLE_AI_API_KEY=your_gemini_api_key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key
PORT=5000
AUTO_START_MONITOR=true
POLL_INTERVAL=10000
```

### 3. Prepare Real Images (Optional but Recommended)

The collection includes a tiny sample image. For better testing:

1. **Get Base64 images**:
   ```bash
   # On Mac/Linux
   base64 -i your_image.jpg | pbcopy
   
   # On Windows
   certutil -encode your_image.jpg temp.b64 && findstr /v /c:- temp.b64 > image.b64
   ```

2. **Replace `sampleImage` variable** in Postman with actual base64 data

## 📋 Collection Structure

The collection is organized into 6 main folders:

### 1. Health & Monitor
- Health Check
- Get Monitor Status
- Start Order Monitor
- Stop Order Monitor

### 2. Image Generation
- Generate Single Image

### 3. Cover Generation
- Generate Personalized Cover (Girl Character)
- Generate Cover - Boy Character

### 4. Book Analysis & Processing
- Analyze Book (Preview)
- Process Complete Book - Small (3 pages)
- Process Complete Book - Medium (10 pages)
- Process Complete Book - Custom Quality

### 5. URL Management (S3)
- Generate Signed URL
- Refresh Order URLs

### 6. Complete Flow Test Scenarios
- 5 complete test scenarios (see below)

## 🧪 Testing Workflows

### Quick Start Test (5 minutes)

**Run Scenario 1: Quick Health Check**

1. Open `6. Complete Flow Test Scenarios` → `Scenario 1: Quick Health Check`
2. Run all requests in sequence:
   - `1.1 - Health Check` → Should return `status: "healthy"`
   - `1.2 - Monitor Status` → Should return monitor status

**Expected Results:**
```json
// Health Check Response
{
  "status": "healthy",
  "message": "API is running",
  "orderMonitor": {
    "enabled": true,
    "running": true
  }
}

// Monitor Status Response
{
  "isRunning": true,
  "processingOrders": 0,
  "pollInterval": 10000
}
```

### Test Image Generation (2-5 minutes)

**Run Scenario 2: Single Image Test**

1. Navigate to `Scenario 2: Single Image Test`
2. Run `2.1 - Generate Test Image`
3. Check response includes `generated_image` field with base64 data

**Expected Response:**
```json
{
  "success": true,
  "generated_image": "<base64_image_data>",
  "message": "Image generated successfully"
}
```

**Note:** Response time can be 5-30 seconds depending on AI API.

### Test Cover Generation (5-10 minutes)

**Run Scenario 3: Cover Generation Flow**

1. Navigate to `Scenario 3: Cover Generation Flow`
2. Run requests in order:
   - `3.1 - Analyze Book First` → Get book structure
   - `3.2 - Generate Cover` → Generate personalized cover

**Tips:**
- Analyzing helps you understand book structure
- Cover generation uses dynamic prompts (no hardcoded prompts!)
- Response includes personalized cover in base64 format

### Test Complete Book Processing (10-30 minutes)

**Run Scenario 4: Complete Book Processing**

This is the full end-to-end test:

1. Navigate to `Scenario 4: Complete Book Processing`
2. Run `4.1 - Analyze Book` first
   - Review the analysis output
   - Note character detection and page count
3. Run `4.2 - Process Book`
   - This will take 30-60 seconds per book
   - Watch the processing status

**Expected Analysis Response:**
```json
{
  "success": true,
  "bookAnalysis": {
    "totalPages": 3,
    "charactersDetected": true,
    "estimatedProcessingTime": "45-90 seconds",
    "recommendations": {
      "batchSize": 3,
      "quality": "high"
    }
  }
}
```

**Expected Processing Response:**
```json
{
  "success": true,
  "personalizedBook": {
    "pages": ["<base64_page1>", "<base64_page2>", ...],
    "metadata": { ... }
  },
  "totalPages": 3,
  "processingTime": "52.3 seconds",
  "characterReplacements": 15,
  "message": "Complete book processed successfully"
}
```

### Test Order Monitor (5 minutes)

**Run Scenario 5: Order Monitor Flow**

Test the order monitor lifecycle:

1. Navigate to `Scenario 5: Order Monitor Flow`
2. Run all requests in sequence:
   - `5.1 - Check Initial Status`
   - `5.2 - Start Monitor`
   - `5.3 - Verify Running` → Should show `isRunning: true`
   - `5.4 - Stop Monitor`
   - `5.5 - Verify Stopped` → Should show `isRunning: false`

This tests the monitor can be controlled programmatically.

## 🎯 Individual Endpoint Tests

### Test Different Book Sizes

Try processing different book sizes:

**Small Book (3 pages) - Fast**
- Use: `Process Complete Book - Small (3 pages)`
- Time: ~30-45 seconds
- Good for: Initial testing

**Medium Book (10 pages) - Realistic**
- Use: `Process Complete Book - Medium (10 pages)`
- Time: ~2-3 minutes
- Good for: Real-world testing

**Custom Quality Settings**
- Use: `Process Complete Book - Custom Quality`
- Adjust `batchSize`, `quality`, `styleConsistency`
- Experiment with different settings

### Processing Options Explained

```json
{
  "processingOptions": {
    "batchSize": 3,           // Pages processed in parallel (1-5)
    "quality": "high",        // "standard", "high", "ultra"
    "styleConsistency": true  // Maintain consistent character style
  }
}
```

**Batch Size Guidelines:**
- `1-2`: Slower but more accurate
- `3`: Balanced (recommended)
- `4-5`: Faster but may lose some consistency

**Quality Options:**
- `standard`: Fast, good for testing
- `high`: Best balance (recommended)
- `ultra`: Slowest, highest quality

## 🔄 Testing S3/URL Management

### Generate Signed URL

1. Open `5. URL Management (S3)` → `Generate Signed URL`
2. Update the request body with a real S3 key:
   ```json
   {
     "s3Key": "books/user-123/order-456/book-789.pdf",
     "expiresIn": 604800
   }
   ```
3. Run the request
4. Response includes a signed URL valid for 7 days

### Refresh Order URLs

1. Get a real order item ID from your database
2. Update collection variable `orderItemId` or edit request body
3. Run `Refresh Order URLs`
4. Response includes fresh URLs for both PDF and cover

**Note:** These endpoints require Supabase to be configured.

## 📊 Monitoring Test Results

### Success Indicators

✅ **Health Check:**
- Status code: `200`
- Response includes `"status": "healthy"`

✅ **Image Generation:**
- Status code: `200`
- Response includes `generated_image` with base64 data
- No error messages

✅ **Book Processing:**
- Status code: `200`
- `success: true`
- All pages processed
- Character replacements > 0

✅ **Monitor Control:**
- Start/Stop commands acknowledged
- Status accurately reflects running state

### Common Issues & Solutions

#### ❌ Connection Refused

**Issue:** Cannot connect to server

**Solution:**
1. Verify server is running: `http://localhost:5000/health`
2. Check `baseUrl` variable matches server address
3. Check firewall settings

#### ❌ 500 Server Error on Image Generation

**Issue:** Image generation fails

**Solution:**
1. Verify `GOOGLE_AI_API_KEY` is valid
2. Check API quota/rate limits
3. Try with smaller/valid base64 images
4. Check server logs for detailed error

#### ❌ Order Monitor Not Starting

**Issue:** Monitor shows as disabled

**Solution:**
1. Check `.env` has `SUPABASE_URL` and `SUPABASE_SERVICE_KEY`
2. Verify Supabase credentials are valid
3. Check server logs for initialization errors
4. Try manual start: POST `/monitor/start`

#### ❌ Book Processing Times Out

**Issue:** Request exceeds 60 seconds

**Solution:**
1. Reduce number of pages
2. Increase Postman timeout: Settings → General → Request timeout
3. Try smaller `batchSize` (1-2)
4. Use `standard` quality instead of `ultra`

## 🔍 Advanced Testing

### Testing with Real Images

1. **Prepare high-quality images:**
   - Child photo: Clear, well-lit, facing camera
   - Book pages: High resolution, clear text and images
   - Original cover: Book cover in good condition

2. **Convert to base64:**
   ```bash
   base64 -i child_photo.jpg > child.b64
   base64 -i book_page_1.jpg > page1.b64
   ```

3. **Create custom request:**
   - Duplicate existing request
   - Replace base64 data with real images
   - Run the test

### Performance Testing

Test processing performance:

1. **Single Page:** ~5-10 seconds
2. **3 Pages (batch=3):** ~30-45 seconds
3. **10 Pages (batch=5):** ~2-3 minutes
4. **20 Pages (batch=5):** ~4-6 minutes

Track these metrics:
- Response time
- Processing time (from response)
- Character replacements
- Success rate

### Automated Testing with Newman

Run collection from command line:

```bash
# Install Newman
npm install -g newman

# Run collection
newman run AI-Backend-Postman-Collection.json \
  --environment your-environment.json \
  --reporters cli,json \
  --timeout-request 120000

# Run with folder selection
newman run AI-Backend-Postman-Collection.json \
  --folder "1. Health & Monitor"
```

## 📝 Testing Checklist

Use this checklist for comprehensive testing:

### Basic Functionality
- [ ] Server health check passes
- [ ] Monitor status returns correctly
- [ ] Can start monitor
- [ ] Can stop monitor
- [ ] Monitor status updates correctly

### Image Generation
- [ ] Single image generation works
- [ ] Generated image is valid base64
- [ ] Different prompts produce different results

### Cover Generation
- [ ] Cover generation succeeds with sample data
- [ ] Cover generation works for boy character
- [ ] Cover generation works for girl character
- [ ] Generated covers are personalized

### Book Processing
- [ ] Book analysis returns structure
- [ ] Can process 3-page book
- [ ] Can process 10-page book
- [ ] Character replacements > 0
- [ ] All pages returned in response
- [ ] Processing completes within expected time

### URL Management
- [ ] Can generate signed URL
- [ ] Can refresh order URLs
- [ ] Generated URLs are accessible

### Error Handling
- [ ] Missing parameters return 400 error
- [ ] Invalid data returns appropriate error
- [ ] Server errors include error messages

## 🎓 Best Practices

1. **Start Simple:** Begin with health check and single image
2. **Test Incrementally:** Test each endpoint before full workflows
3. **Use Real Data:** Replace sample images with real photos for accurate testing
4. **Monitor Logs:** Watch server console for detailed processing info
5. **Save Responses:** Save successful responses for reference
6. **Version Control:** Save your custom environment configurations
7. **Document Issues:** Note any errors or unexpected behavior
8. **Performance Baseline:** Establish performance baselines for your setup

## 📞 Support

If you encounter issues:

1. Check server logs in terminal
2. Verify all environment variables are set
3. Review this testing guide
4. Check the main README.md for setup instructions
5. Ensure all dependencies are installed: `npm install`

## 🚀 Next Steps

After successful testing:

1. **Integrate with Frontend:** Use the API in your Flutter app
2. **Setup Production:** Deploy to production server
3. **Monitor Performance:** Track processing times and success rates
4. **Optimize Settings:** Fine-tune batch sizes and quality settings
5. **Scale:** Add load balancing and caching as needed

---

**Happy Testing! 🎉**

The collection is designed to test every aspect of the AI Backend. Start with the Quick Start Test and progress through the scenarios. Each test builds on the previous one, giving you confidence in the entire system.

