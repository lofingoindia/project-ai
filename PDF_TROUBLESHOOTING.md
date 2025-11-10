# PDF Upload Troubleshooting Guide

## Issue: "Failed to fetch" error when uploading PDF

This error typically indicates a connection problem between the frontend and backend. Here's how to resolve it:

### Step 1: Verify Backend Server is Running

1. **Check if backend is running:**
   ```bash
   # Navigate to backend directory
   cd ai__backend
   
   # Start the server
   npm start
   ```

2. **Verify server is accessible:**
   Open your browser and go to: `http://localhost:3002/health`
   
   You should see:
   ```json
   {
     "success": true,
     "status": "healthy",
     "timestamp": "..."
   }
   ```

### Step 2: Test PDF Upload Endpoint

Test the PDF upload endpoint directly:
```bash
# Using curl (if available)
curl -X POST http://localhost:3002/api/upload-pdf -F "pdf=@/path/to/test.pdf"

# Or use Postman
POST http://localhost:3002/api/upload-pdf
Body: form-data
Key: pdf
Value: [select PDF file]
```

### Step 3: Check Environment Configuration

1. **Frontend (.env.local in ai_new_admin/):**
   ```env
   VITE_BACKEND_URL=http://localhost:3002
   ```

2. **Backend (.env in ai__backend/):**
   ```env
   PORT=3002
   ```

### Step 4: Verify CORS Configuration

The backend server.js should have:
```javascript
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  
  next();
});
```

### Step 5: Check File Structure

Ensure these files exist in `ai__backend/`:
- ✅ `pdf-upload-service.js`
- ✅ `pdf-uploads.js` 
- ✅ `server.js` (with PDF routes imported)
- ✅ `uploads/pdfs/` directory

### Step 6: Database Setup

Run this SQL in Supabase:
```sql
ALTER TABLE books ADD COLUMN IF NOT EXISTS pdf_url TEXT;
```

### Common Error Messages and Solutions

1. **"Failed to fetch"**
   - ✅ Start backend server: `npm start` in `ai__backend/`
   - ✅ Check if port 3002 is available
   - ✅ Verify CORS configuration

2. **"Cannot connect to server"**
   - ✅ Ensure backend is running on port 3002
   - ✅ Check firewall settings
   - ✅ Try different port if needed

3. **"Only PDF files are allowed"**
   - ✅ Ensure you're uploading a .pdf file
   - ✅ Check file MIME type

4. **"File size too large"**
   - ✅ Ensure PDF is under 50MB
   - ✅ Check server upload limits

### Quick Test Sequence

1. **Terminal 1 - Start Backend:**
   ```bash
   cd ai__backend
   npm start
   ```

2. **Terminal 2 - Test Connection:**
   ```bash
   curl http://localhost:3002/health
   ```

3. **Browser - Test Frontend:**
   - Open admin panel
   - Go to Products → Add Product
   - Try uploading a small PDF file

### Debug Information

When testing, check browser console for detailed logs:
- Upload URL being used
- Backend connection test results
- Server response details
- Error stack traces

### Manual Testing with Postman

1. Open Postman
2. Create new POST request to `http://localhost:3002/api/upload-pdf`
3. In Body tab, select "form-data"
4. Add key "pdf" with type "File"
5. Select a PDF file and send

Expected response:
```json
{
  "success": true,
  "data": {
    "pdf_url": "http://localhost:3002/uploads/pdfs/filename.pdf",
    "filename": "...",
    "originalName": "...",
    "size": 1234
  }
}
```

### If Nothing Works

1. Delete and recreate all PDF-related backend files
2. Restart VS Code
3. Clear browser cache
4. Try different port (3001, 3003, etc.)
5. Check Windows Firewall/Antivirus settings

### Contact Information

If issues persist, provide these details:
- Error messages (exact text)
- Browser console logs
- Server console output
- Environment (Windows version, Node.js version)
- Network configuration (proxy, VPN, etc.)