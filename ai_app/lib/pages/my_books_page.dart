import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../models/book.dart';
import '../services/book_service.dart';
import '../services/favorite_service.dart';
import '../services/localization_service.dart';
import 'product_detail_page.dart';
// import '../widgets/footer.dart';

class MyBooksPage extends StatefulWidget {
  const MyBooksPage({Key? key}) : super(key: key);

  @override
  State<MyBooksPage> createState() => _MyBooksPageState();
}

class _MyBooksPageState extends State<MyBooksPage> {
  final BookService _bookService = BookService();
  List<Book> _favoriteBooks = [];
  bool _isLoading = true;
  Set<String> _favoriteIds = {};

  @override
  void initState() {
    super.initState();
    _loadFavoriteBooks();
  }

  Future<void> _loadFavoriteBooks() async {
    setState(() => _isLoading = true);
    
    try {
      // Get favorite book IDs
      final favoriteIds = await FavoriteService.getFavoriteBookIds();
      
      if (favoriteIds.isEmpty) {
        setState(() {
          _favoriteBooks = [];
          _favoriteIds = {};
          _isLoading = false;
        });
        return;
      }

      // Load all books and filter favorites
      final allBooks = await _bookService.getAllBooks(limit: 100);
      final favoriteBooks = allBooks.where((book) => favoriteIds.contains(book.id)).toList();
      
      setState(() {
        _favoriteBooks = favoriteBooks;
        _favoriteIds = favoriteIds;
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              '${'my_books_page_error_loading'.tr}${e.toString()}',
              style: GoogleFonts.tajawal(),
            ),
            backgroundColor: Colors.red,
            duration: const Duration(seconds: 3),
          ),
        );
      }
    }
  }

  Future<void> _toggleFavorite(String bookId) async {
    await FavoriteService.toggleFavorite(bookId);
    _loadFavoriteBooks(); // Reload the favorites
  }

  void _navigateToProductDetail(Book book) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => ProductDetailPage(book: book),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final localizationService = LocalizationService();
    final screenWidth = MediaQuery.of(context).size.width;
    final isMobile = screenWidth < 650;
    final isTablet = screenWidth >= 650 && screenWidth < 1100;
    
    // Determine grid columns based on screen size
    int gridColumns = 2; // mobile default
    if (screenWidth >= 1100) {
      gridColumns = 4; // desktop
    } else if (isTablet) {
      gridColumns = 3; // tablet
    }

    return Directionality(
      textDirection: localizationService.textDirection,
      child: Scaffold(
        backgroundColor: Colors.grey[50],
        appBar: AppBar(
          backgroundColor: Colors.white,
          elevation: 0.5,
          leading: IconButton(
            icon: const Icon(Icons.arrow_back, color: Colors.black87),
            onPressed: () => Navigator.of(context).pop(),
          ),
          title: Text(
            'my_books_page_title'.tr,
            style: GoogleFonts.tajawal(
              color: Colors.black87,
              fontWeight: FontWeight.w600,
              fontSize: 18,
            ),
          ),
        ),
        body: SingleChildScrollView(
          child: Center(
            child: Container(
              constraints: BoxConstraints(maxWidth: isMobile ? double.infinity : 1200),
              child: Column(
                children: [
                  _buildHeader(),
                  _buildBookshelfSection(gridColumns),
                  // _buildFooter(),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(24, 20, 24, 10),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Text(
            _favoriteBooks.isEmpty 
                ? 'my_books_page_no_favorites_title'.tr
                : 'my_books_page_your_favorites'.tr,
            style: GoogleFonts.tajawal(
              fontSize: 28,
              fontWeight: FontWeight.bold,
              color: Colors.black87,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 16),
          Text(
            _favoriteBooks.isEmpty
                ? 'my_books_page_browse_and_add'.tr
                : "${_favoriteBooks.length} ${_favoriteBooks.length > 1 ? 'my_books_page_book_plural'.tr : 'my_books_page_book_singular'.tr} ${'my_books_page_in_collection'.tr}",
            style: GoogleFonts.tajawal(
              fontSize: 16,
              color: Colors.grey[600],
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildBookshelfSection(int gridColumns) {
    return Container(
      padding: const EdgeInsets.fromLTRB(24, 0, 24, 40),
      child: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _favoriteBooks.isEmpty
              ? _buildEmptyState()
              : GridView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: gridColumns,
                    childAspectRatio: 0.7,
                    crossAxisSpacing: 16,
                    mainAxisSpacing: 20,
                  ),
                  itemCount: _favoriteBooks.length,
                  itemBuilder: (context, index) => _buildBookCard(_favoriteBooks[index], index),
                ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(40.0),
        child: Column(
          children: [
            Icon(
              Icons.favorite_border,
              size: 80,
              color: Colors.grey[400],
            ),
            const SizedBox(height: 20),
            Text(
              'my_books_page_start_adding'.tr,
              style: GoogleFonts.tajawal(
                fontSize: 18,
                fontWeight: FontWeight.w600,
                color: Colors.grey[700],
              ),
            ),
            const SizedBox(height: 12),
            Text(
              'my_books_page_empty_description'.tr,
              textAlign: TextAlign.center,
              style: GoogleFonts.tajawal(
                fontSize: 14,
                color: Colors.grey[500],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBookCard(Book book, int index) {
    final isFavorite = _favoriteIds.contains(book.id);
    
    return GestureDetector(
      onTap: () => _navigateToProductDetail(book),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Book cover image
          Expanded(
            child: Stack(
              children: [
                Container(
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(16),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.15),
                        blurRadius: 12,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(16),
                    child: Container(
                      width: double.infinity,
                      color: _getBookColors()[book.hashCode % _getBookColors().length],
                      child: book.displayImage.isNotEmpty
                          ? Image.network(
                              book.displayImage,
                              fit: BoxFit.cover,
                              width: double.infinity,
                              height: double.infinity,
                              errorBuilder: (context, error, stackTrace) {
                                return _buildPlaceholderBookCover(book.hashCode % 6);
                              },
                            )
                          : _buildPlaceholderBookCover(book.hashCode % 6),
                    ),
                  ),
                ),
                // Favorite icon button
                Positioned(
                  top: 8,
                  right: 8,
                  child: GestureDetector(
                    onTap: () => _toggleFavorite(book.id),
                    child: Container(
                      padding: const EdgeInsets.all(6),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.2),
                            blurRadius: 6,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: Icon(
                        isFavorite ? Icons.favorite : Icons.favorite_border,
                        color: isFavorite ? Colors.red : Colors.grey[600],
                        size: 20,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 8),
          // Book title
          Text(
            book.title,
            style: GoogleFonts.tajawal(
              color: Colors.black87,
              fontSize: 15,
              fontWeight: FontWeight.w600,
            ),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }

  Widget _buildPlaceholderBookCover(int index) {
    final colors = _getBookColors();
    return Container(
      width: double.infinity,
      height: double.infinity,
      color: colors[index % colors.length],
      child: Center(
        child: Icon(Icons.book, size: 60, color: Colors.white.withOpacity(0.7)),
      ),
    );
  }

  List<Color> _getBookColors() {
    return [
      const Color(0xFF6C63FF),
      const Color(0xFF4ECDC4),
      const Color(0xFFFF6B6B),
      const Color(0xFF45B7D1),
      const Color(0xFF96CEB4),
      const Color(0xFFD63384),
    ];
  }

  // Widget _buildFooter() {
  //   return const Footer();
  // }
}
