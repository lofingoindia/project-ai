# Story Timeline Caching Implementation

## Overview

This implementation adds story timeline caching to optimize book processing. When a story analysis is done for the first time, the complete timeline (including page analysis and character mapping) is stored in the database. On subsequent orders for the same book, the system skips the analysis phase and directly replaces images using the stored timeline.

## Key Features

1. **Story Timeline Storage**: Complete story analysis stored in `books.story_timeline` column
2. **Automatic Reuse**: Subsequent orders automatically use stored timeline
3. **Image Replacement**: All pages are replaced with the child's image (main character replacement)
4. **Performance Optimization**: Skips expensive AI analysis on repeat orders

## Database Changes

### Migration: `migrations/add_story_timeline_to_books.sql`

Adds `story_timeline` column to `books` table:

```sql
ALTER TABLE books
ADD COLUMN IF NOT EXISTS story_timeline JSONB DEFAULT NULL;
```

The timeline stores:
- `bookAnalysis`: Complete page-by-page analysis
- `characterMapping`: Character replacement mapping for each page
- `storedAt`: Timestamp when timeline was stored
- `totalPages`: Number of pages in the book
- `version`: Version for future compatibility

## Code Changes

### 1. `complete-book-processor.js`

**Modified `processCompleteBook()` method:**

- Added `bookId` and `supabase` parameters
- Checks for stored timeline before analysis
- If timeline exists: Uses stored data, skips analysis, replaces images
- If timeline doesn't exist: Performs full analysis, stores timeline in DB
- Ensures ALL pages are replaced when using stored timeline

**Key Logic:**

```javascript
// Check for stored timeline
if (bookId && supabase) {
  const { data: bookData } = await supabase
    .from('books')
    .select('story_timeline')
    .eq('id', bookId)
    .single();
  
  if (bookData?.story_timeline) {
    // Use stored timeline - skip analysis
    bookAnalysis = bookData.story_timeline.bookAnalysis;
    characterMapping = bookData.story_timeline.characterMapping;
    // Attach page images and ensure all pages are replaced
  } else {
    // Perform full analysis and store timeline
  }
}
```

### 2. `order-monitor.js`

**Modified `_processOrderItem()` method:**

- Passes `bookId` and `supabase` client to `processCompleteBook()`
- Enables timeline caching for all orders

```javascript
const bookResult = await this.bookProcessor.processCompleteBook({
  pdfUrl: bookData.pdf_url,
  childImage: childImageBase64,
  childName: personalizationData.childName,
  bookTitle: bookData.title,
  bookId: orderItem.book_id,        // NEW: For timeline storage
  supabase: this.supabase,          // NEW: For DB operations
  options: { ... }
});
```

## Flow Diagram

### First Order (No Timeline)
```
1. Extract PDF pages
2. Analyze all pages (AI analysis)
3. Map characters across pages
4. Store timeline in DB ← NEW
5. Replace images with child's face
6. Generate PDF
```

### Subsequent Orders (Timeline Exists)
```
1. Extract PDF pages
2. Load timeline from DB ← NEW (skips analysis)
3. Replace images with child's face (using stored mapping)
4. Generate PDF
```

## Benefits

1. **Faster Processing**: Skips expensive AI analysis on repeat orders
2. **Cost Reduction**: Fewer API calls to AI services
3. **Consistency**: Same character mapping across all orders for a book
4. **Reliability**: Stored analysis ensures consistent results

## Important Notes

- **All Pages Replaced**: When using stored timeline, ALL pages are marked for replacement
- **Main Character Replacement**: The main character from the story is replaced with the child's image
- **Page Images**: Page images (base64) are NOT stored in timeline (too large), they are re-extracted from PDF
- **Timeline Versioning**: Timeline includes version field for future compatibility

## Testing

To test the implementation:

1. **First Order**: Process a book - should perform full analysis and store timeline
2. **Second Order**: Process same book with different child - should use stored timeline and skip analysis
3. **Verify**: Check `books.story_timeline` column contains the analysis data

## Migration Instructions

Run the migration to add the column:

```bash
# Using Supabase CLI or SQL editor
psql -f migrations/add_story_timeline_to_books.sql
```

Or manually execute the SQL in your database.

## Future Enhancements

- Timeline versioning and migration
- Timeline invalidation when book PDF changes
- Timeline compression for large books
- Timeline sharing across book versions

