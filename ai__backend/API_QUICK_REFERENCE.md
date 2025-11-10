# AI Backend API Quick Reference

Quick reference for all API endpoints with cURL examples.

## 🚀 Base URL

```
Local: http://localhost:5000
Production: https://your-domain.com
```

## 📡 Endpoints Overview

| Method | Endpoint | Purpose | Time |
|--------|----------|---------|------|
| GET | `/health` | Health check | < 1s |
| GET | `/monitor/status` | Monitor status | < 1s |
| POST | `/monitor/start` | Start monitor | < 1s |
| POST | `/monitor/stop` | Stop monitor | < 1s |
| POST | `/generate-image` | Single image | 5-30s |
| POST | `/generate-cover` | Cover generation | 10-40s |
| POST | `/analyze-book` | Book analysis | 5-15s |
| POST | `/process-complete-book` | Complete book | 30s-5m |
| POST | `/generate-signed-url` | Generate URL | < 1s |
| POST | `/refresh-order-urls` | Refresh URLs | 1-2s |

## 🔧 cURL Examples

### 1. Health Check

```bash
curl -X GET http://localhost:5000/health
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

---

### 2. Monitor Status

```bash
curl -X GET http://localhost:5000/monitor/status
```

**Response:**
```json
{
  "isRunning": true,
  "processingOrders": 0,
  "pollInterval": 10000
}
```

---

### 3. Start Order Monitor

```bash
curl -X POST http://localhost:5000/monitor/start
```

**Response:**
```json
{
  "message": "Order monitor started successfully"
}
```

---

### 4. Stop Order Monitor

```bash
curl -X POST http://localhost:5000/monitor/stop
```

**Response:**
```json
{
  "message": "Order monitor stopped successfully"
}
```

---

### 5. Generate Single Image

```bash
curl -X POST http://localhost:5000/generate-image \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A friendly cartoon dragon in a magical forest",
    "image": "/9j/4AAQSkZJRg...base64data..."
  }'
```

**Response:**
```json
{
  "success": true,
  "generated_image": "/9j/4AAQSkZJRg...base64data...",
  "message": "Image generated successfully"
}
```

---

### 6. Generate Personalized Cover

```bash
curl -X POST http://localhost:5000/generate-cover \
  -H "Content-Type: application/json" \
  -d '{
    "originalCoverImage": "/9j/4AAQSkZJRg...base64...",
    "childImage": "/9j/4AAQSkZJRg...base64...",
    "bookData": {
      "name": "The Magical Adventure",
      "description": "A thrilling adventure story",
      "genre": "Fantasy Adventure",
      "ageRange": "5-8 years"
    },
    "childData": {
      "name": "Emma",
      "age": 6,
      "gender": "girl"
    }
  }'
```

**Response:**
```json
{
  "success": true,
  "coverImage": "/9j/4AAQSkZJRg...base64...",
  "message": "Personalized cover generated successfully"
}
```

---

### 7. Analyze Book

```bash
curl -X POST http://localhost:5000/analyze-book \
  -H "Content-Type: application/json" \
  -d '{
    "bookPages": [
      "/9j/4AAQSkZJRg...page1...",
      "/9j/4AAQSkZJRg...page2...",
      "/9j/4AAQSkZJRg...page3..."
    ]
  }'
```

**Response:**
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
  },
  "message": "Book analysis completed successfully"
}
```

---

### 8. Process Complete Book

```bash
curl -X POST http://localhost:5000/process-complete-book \
  -H "Content-Type: application/json" \
  --max-time 300 \
  -d '{
    "bookPages": [
      "/9j/4AAQSkZJRg...page1...",
      "/9j/4AAQSkZJRg...page2...",
      "/9j/4AAQSkZJRg...page3..."
    ],
    "childImage": "/9j/4AAQSkZJRg...child...",
    "childName": "Emma",
    "bookTitle": "Emma'\''s Magical Adventure",
    "processingOptions": {
      "batchSize": 3,
      "quality": "high",
      "styleConsistency": true
    }
  }'
```

**Note:** Added `--max-time 300` for 5-minute timeout (processing can take time)

**Response:**
```json
{
  "success": true,
  "personalizedBook": {
    "pages": [
      "/9j/4AAQSkZJRg...personalized_page1...",
      "/9j/4AAQSkZJRg...personalized_page2...",
      "/9j/4AAQSkZJRg...personalized_page3..."
    ]
  },
  "totalPages": 3,
  "processingTime": "52.3 seconds",
  "characterReplacements": 15,
  "message": "Complete book processed successfully"
}
```

---

### 9. Generate Signed URL

```bash
curl -X POST http://localhost:5000/generate-signed-url \
  -H "Content-Type: application/json" \
  -d '{
    "s3Key": "books/user-123/order-456/book-789.pdf",
    "expiresIn": 604800
  }'
```

**Response:**
```json
{
  "success": true,
  "signedUrl": "https://s3.amazonaws.com/...",
  "expiresIn": 604800
}
```

---

### 10. Refresh Order URLs

```bash
curl -X POST http://localhost:5000/refresh-order-urls \
  -H "Content-Type: application/json" \
  -d '{
    "orderItemId": "550e8400-e29b-41d4-a716-446655440000"
  }'
```

**Response:**
```json
{
  "success": true,
  "pdfUrl": "https://s3.amazonaws.com/...pdf",
  "coverUrl": "https://s3.amazonaws.com/...jpg",
  "message": "Signed URLs refreshed successfully"
}
```

---

## 🧪 Quick Testing Scripts

### Complete Flow Test Script

Save as `test-flow.sh`:

```bash
#!/bin/bash

BASE_URL="http://localhost:5000"

echo "=== AI Backend Complete Flow Test ==="
echo ""

# 1. Health Check
echo "1. Health Check..."
curl -s "$BASE_URL/health" | jq '.'
echo ""

# 2. Monitor Status
echo "2. Monitor Status..."
curl -s "$BASE_URL/monitor/status" | jq '.'
echo ""

# 3. Start Monitor
echo "3. Starting Monitor..."
curl -s -X POST "$BASE_URL/monitor/start" | jq '.'
echo ""

# 4. Verify Monitor Running
echo "4. Verify Monitor Running..."
curl -s "$BASE_URL/monitor/status" | jq '.'
echo ""

# 5. Stop Monitor
echo "5. Stopping Monitor..."
curl -s -X POST "$BASE_URL/monitor/stop" | jq '.'
echo ""

echo "=== Flow Test Complete ==="
```

Run with: `chmod +x test-flow.sh && ./test-flow.sh`

---

### Image Generation Test

Save as `test-image.sh`:

```bash
#!/bin/bash

BASE_URL="http://localhost:5000"

# Sample 1x1 transparent image in base64
SAMPLE_IMAGE="/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCRAFmH/9k="

echo "Generating test image..."

curl -X POST "$BASE_URL/generate-image" \
  -H "Content-Type: application/json" \
  -d "{
    \"prompt\": \"A friendly cartoon character, smiling and happy\",
    \"image\": \"$SAMPLE_IMAGE\"
  }" | jq '.success'

echo "Image generation complete"
```

Run with: `chmod +x test-image.sh && ./test-image.sh`

---

## 📝 Request Body Templates

### Minimal Image Generation

```json
{
  "prompt": "Your prompt here",
  "image": "base64_image_data"
}
```

### Minimal Cover Generation

```json
{
  "originalCoverImage": "base64_original",
  "childImage": "base64_child",
  "bookData": {
    "name": "Book Name"
  },
  "childData": {
    "name": "Child Name"
  }
}
```

### Minimal Book Processing

```json
{
  "bookPages": ["base64_page1", "base64_page2"],
  "childImage": "base64_child",
  "childName": "Child Name"
}
```

### Full Book Processing (All Options)

```json
{
  "bookPages": ["base64_page1", "base64_page2", "base64_page3"],
  "childImage": "base64_child_photo",
  "childName": "Emma",
  "bookTitle": "Emma's Adventure",
  "processingOptions": {
    "batchSize": 3,
    "quality": "high",
    "styleConsistency": true
  }
}
```

---

## 🔐 Authentication

Currently, the API does not require authentication for direct endpoint access. However:

- **Order Monitor** requires Supabase credentials in `.env`
- **S3 URLs** require AWS credentials configured
- **Production** should add API key authentication

---

## ⚡ Performance Tips

### Timeout Settings

Different endpoints have different processing times:

```bash
# Health & Monitor endpoints: 1s timeout
curl --max-time 1 ...

# Image generation: 60s timeout
curl --max-time 60 ...

# Book processing: 300s (5m) timeout
curl --max-time 300 ...
```

### Optimal Settings

**Fast Testing (3 pages):**
```json
{
  "batchSize": 3,
  "quality": "standard"
}
```

**Production Quality (10+ pages):**
```json
{
  "batchSize": 5,
  "quality": "high"
}
```

**Maximum Quality (showcase):**
```json
{
  "batchSize": 2,
  "quality": "ultra"
}
```

---

## 🐛 Error Codes

| Code | Meaning | Common Cause |
|------|---------|--------------|
| 200 | Success | Request completed |
| 400 | Bad Request | Missing/invalid parameters |
| 500 | Server Error | AI API error, internal error |
| 503 | Service Unavailable | Server overloaded |

### Error Response Format

```json
{
  "error": "Error message describing what went wrong",
  "success": false
}
```

---

## 📊 Response Time Benchmarks

Based on typical usage:

| Endpoint | Avg Time | Max Time |
|----------|----------|----------|
| Health Check | 50ms | 100ms |
| Monitor Status | 50ms | 100ms |
| Generate Image | 15s | 45s |
| Generate Cover | 20s | 60s |
| Analyze Book | 10s | 30s |
| Process Book (3p) | 45s | 90s |
| Process Book (10p) | 2.5m | 5m |
| Generate URL | 100ms | 500ms |
| Refresh URLs | 500ms | 2s |

---

## 🔍 Debugging

### Enable Verbose Output

```bash
curl -v -X POST http://localhost:5000/health
```

### Save Response to File

```bash
curl -X POST http://localhost:5000/generate-image \
  -H "Content-Type: application/json" \
  -d @request.json \
  -o response.json
```

### Check Response Headers

```bash
curl -I http://localhost:5000/health
```

### Test with Pretty Print

```bash
curl -s http://localhost:5000/health | jq '.'
```

---

## 🚀 Production Examples

### With API Key (when implemented)

```bash
curl -X POST https://api.yourserver.com/generate-image \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d @request.json
```

### Through Load Balancer

```bash
curl -X POST https://api.yourserver.com/process-complete-book \
  -H "Content-Type: application/json" \
  -H "X-Request-ID: unique-request-id" \
  --max-time 300 \
  -d @book-request.json
```

---

## 📞 Quick Support Checklist

If something doesn't work:

1. ✅ Is server running? `curl http://localhost:5000/health`
2. ✅ Are environment variables set? Check `.env`
3. ✅ Is request format correct? Check JSON syntax
4. ✅ Are images valid base64? Test with small sample
5. ✅ Check server logs in terminal
6. ✅ Try with minimal required fields first
7. ✅ Increase timeout for book processing

---

**📚 For complete testing workflows, see: [POSTMAN_TESTING_GUIDE.md](POSTMAN_TESTING_GUIDE.md)**

**📖 For setup instructions, see: [README.md](README.md)**

