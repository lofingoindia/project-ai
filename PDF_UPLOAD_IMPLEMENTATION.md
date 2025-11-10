# PDF Upload Feature Implementation

This document describes the PDF upload functionality implemented for the AI Image Project admin panel.

## Overview

The PDF upload feature allows administrators to upload PDF files for products through the admin panel. PDFs are stored on the Node.js backend server (not in Supabase storage) and their URLs are saved in the database.

## Architecture

```
Frontend (React) → Node.js Backend → Local File Storage
                        ↓
                   Database (pdf_url)
```

## Files Created/Modified

### Backend Files

1. **`pdf-upload-service.js`** - Core PDF upload service
   - Handles file validation, storage, and management
   - Supports upload, delete, and info operations
   - Validates file type and size (max 50MB)

2. **`pdf-uploads.js`** - Express router with PDF endpoints
   - `POST /api/upload-pdf` - Upload PDF file
   - `GET /api/pdf-info/:filename` - Get PDF information
   - `DELETE /api/pdf/:filename` - Delete PDF file
   - `GET /api/health` - Service health check

3. **`server.js`** - Updated to include PDF routes
   - Added PDF upload router
   - Updated endpoint documentation

4. **`uploads/pdfs/`** - Directory for storing PDF files
   - Auto-created by the service
   - Includes `.gitkeep` file

5. **`test-pdf-upload.js`** - Test file for functionality verification

### Frontend Files

6. **`types/index.ts`** - Updated Product interface
   - Added `pdf_url?: string` field

7. **`lib/supabase.ts`** - Updated database operations
   - Added PDF URL handling in queries and mutations

8. **`pages/Products.tsx`** - Updated Products page
   - Added PDF upload UI component
   - Added PDF upload handler function
   - Added PDF display in view mode
   - Updated form data structure

9. **`.env.local`** - Environment configuration
   - Added `VITE_BACKEND_URL` for backend communication

### Database Changes

10. **`add_pdf_url_column.sql`** - Database migration
    - Adds `pdf_url TEXT` column to `books` table

## Database Migration

Run this SQL in your Supabase SQL Editor:

```sql
ALTER TABLE books ADD COLUMN IF NOT EXISTS pdf_url TEXT;
COMMENT ON COLUMN books.pdf_url IS 'URL to the PDF file stored on backend server';
```

## Environment Configuration

### Backend (`.env`)
```env
PORT=3002
# ... other existing variables
```

### Frontend (`.env.local`)
```env
VITE_BACKEND_URL=http://localhost:3002
# ... other existing variables
```

## API Endpoints

### Upload PDF
```http
POST /api/upload-pdf
Content-Type: multipart/form-data

Form Data:
- pdf: (PDF file, max 50MB)

Response:
{
  "success": true,
  "data": {
    "pdf_url": "http://localhost:3002/uploads/pdfs/filename.pdf",
    "filename": "1699123456789-987654321.pdf",
    "originalName": "document.pdf",
    "size": 1048576,
    "sizeFormatted": "1.00MB",
    "uploadedAt": "2023-11-04T10:30:00.000Z"
  }
}
```

### Get PDF Info
```http
GET /api/pdf-info/:filename

Response:
{
  "success": true,
  "data": {
    "exists": true,
    "filename": "1699123456789-987654321.pdf",
    "size": 1048576,
    "sizeFormatted": "1.00MB",
    "createdAt": "2023-11-04T10:30:00.000Z",
    "modifiedAt": "2023-11-04T10:30:00.000Z"
  }
}
```

### Delete PDF
```http
DELETE /api/pdf/:filename

Response:
{
  "success": true,
  "message": "PDF file deleted successfully.",
  "filename": "1699123456789-987654321.pdf"
}
```

## Frontend Integration

### PDF Upload Component
- Drag & drop or click to upload
- File type validation (PDF only)
- Size validation (max 50MB)
- Progress indication
- Success/error feedback

### Product Form Integration
- PDF URL field added to form data
- Upload function integrated with existing form
- View mode shows PDF download link
- Edit mode allows PDF replacement

## File Structure

```
ai__backend/
├── pdf-upload-service.js      # Core upload service
├── pdf-uploads.js             # Express routes
├── server.js                  # Updated main server
├── test-pdf-upload.js         # Test functionality
└── uploads/
    └── pdfs/                  # PDF storage directory
        └── .gitkeep

ai_new_admin/
├── src/
│   ├── types/index.ts         # Updated interfaces
│   ├── lib/supabase.ts        # Updated DB operations
│   └── pages/Products.tsx     # Updated product page
├── .env.local                 # Environment config
└── add_pdf_url_column.sql     # Database migration
```

## Security Considerations

1. **File Validation**: Only PDF files are accepted
2. **Size Limits**: Maximum 50MB file size
3. **Unique Naming**: Files get unique timestamp-based names
4. **Error Handling**: Comprehensive error messages
5. **Path Security**: Files stored in controlled directory

## Testing

1. **Backend Test**:
   ```bash
   cd ai__backend
   node test-pdf-upload.js
   ```

2. **Manual Testing**:
   - Start backend: `npm start`
   - Test upload: Use Postman or frontend
   - Verify file storage in `uploads/pdfs/`
   - Check database `pdf_url` field

## Deployment Notes

1. Ensure `uploads/pdfs` directory exists and is writable
2. Configure proper file serving in production
3. Set up file cleanup policies if needed
4. Update `VITE_BACKEND_URL` for production environment

## Error Handling

The system handles various error scenarios:
- Invalid file types
- File size exceeding limits
- Network connectivity issues
- Server-side storage errors
- Database operation failures

All errors are logged and user-friendly messages are displayed in the UI.