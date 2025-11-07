import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../models/book.dart';
import '../services/book_service.dart';
import '../services/localization_service.dart';
import 'product_detail_page.dart';

// Responsive helper functions
bool _isMobile(BuildContext context) => MediaQuery.of(context).size.width < 650;
bool _isTablet(BuildContext context) => MediaQuery.of(context).size.width >= 650 && MediaQuery.of(context).size.width < 1100;

double _getMaxWidth(BuildContext context) {
  final width = MediaQuery.of(context).size.width;
  if (_isMobile(context)) return width;
  if (_isTablet(context)) return 900;
  return 1000;
}

EdgeInsets _getResponsivePadding(BuildContext context) {
  if (_isMobile(context)) return const EdgeInsets.symmetric(horizontal: 20);
  if (_isTablet(context)) return const EdgeInsets.symmetric(horizontal: 40);
  final width = MediaQuery.of(context).size.width;
  final padding = (width - 1000) / 2;
  return EdgeInsets.symmetric(horizontal: padding > 40 ? padding : 40);
}

class SearchPage extends StatefulWidget {
  const SearchPage({Key? key}) : super(key: key);

  @override
  State<SearchPage> createState() => _SearchPageState();
}

class _SearchPageState extends State<SearchPage> {
  final BookService _bookService = BookService();
  final LocalizationService _localizationService = LocalizationService();
  final TextEditingController _searchController = TextEditingController();
  List<Book> _searchResults = [];
  List<Book> _recentBooks = [];
  bool _isLoading = false;
  bool _isLoadingRecent = true; // Add loading state for recent books
  bool _hasSearched = false;
  String _lastSearchQuery = '';

  @override
  void initState() {
    super.initState();
    _loadRecentBooks();
    _searchController.addListener(() {
      setState(() {}); // Update UI when text changes (for clear button)
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadRecentBooks() async {
    setState(() {
      _isLoadingRecent = true;
    });
    
    try {
      // Use getAllBooks() instead of getFeaturedBooks() to get recent books
      final books = await _bookService.getAllBooks();
      if (mounted) {
        setState(() {
          _recentBooks = books.take(10).toList(); // Take first 10 books
          _isLoadingRecent = false;
        });
      }
    } catch (e) {
      print('Error loading recent books: $e');
      if (mounted) {
        setState(() {
          _recentBooks = [];
          _isLoadingRecent = false;
        });
      }
    }
  }

  Future<void> _performSearch(String query) async {
    if (query.trim().isEmpty) {
      setState(() {
        _searchResults = [];
        _hasSearched = false;
        _isLoading = false;
      });
      return;
    }

    // Prevent duplicate searches
    if (_lastSearchQuery == query.trim().toLowerCase()) {
      return;
    }

    setState(() {
      _isLoading = true;
      _hasSearched = true;
      _lastSearchQuery = query.trim().toLowerCase();
    });

    try {
      print('SearchPage: Starting search for "$query"');
      final results = await _bookService.searchBooks(query);
      print('SearchPage: Got ${results.length} results');
      
      if (mounted) {
        setState(() {
          _searchResults = results;
          _isLoading = false;
        });
        print('SearchPage: Updated UI with ${_searchResults.length} results');
      }
    } catch (e) {
      print('SearchPage error: $e');
      if (mounted) {
        setState(() {
          _searchResults = [];
          _isLoading = false;
        });
        
        // Show error message to user
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('${'search_page_error_searching'.tr}${e.toString()}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final maxWidth = _getMaxWidth(context);
    
    return Directionality(
      textDirection: _localizationService.textDirection,
      child: Scaffold(
        backgroundColor: Colors.white,
        body: SafeArea(
          child: Center(
            child: Container(
              constraints: BoxConstraints(maxWidth: maxWidth),
              child: Column(
                children: [
                  // Header with back button and search bar
                  Container(
                    padding: _isMobile(context) 
                        ? const EdgeInsets.all(16) 
                        : EdgeInsets.symmetric(horizontal: 40, vertical: 16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.05),
                      blurRadius: 10,
                      offset: Offset(0, 2),
                    ),
                  ],
                ),
                child: Row(
                  children: [
                    // Back button
                    IconButton(
                      icon: Icon(Icons.arrow_back, color: Colors.black87),
                      onPressed: () => Navigator.pop(context),
                    ),
                    const SizedBox(width: 8),
                    // Search bar
                    Expanded(
                      child: Container(
                        decoration: BoxDecoration(
                          color: Color(0xFFF5F5F5),
                          borderRadius: BorderRadius.circular(30),
                        ),
                        child: TextField(
                          controller: _searchController,
                          autofocus: true,
                          onChanged: (value) {
                            // Debounce search
                            Future.delayed(Duration(milliseconds: 500), () {
                              if (_searchController.text == value) {
                                _performSearch(value);
                              }
                            });
                          },
                          onSubmitted: _performSearch,
                          decoration: InputDecoration(
                            hintText: 'search_page_search_for_books'.tr,
                            hintStyle: GoogleFonts.tajawal(
                              color: Colors.grey,
                              fontSize: 15,
                            ),
                            prefixIcon: Icon(
                              Icons.search,
                              color: Colors.grey,
                            ),
                            suffixIcon: _searchController.text.isNotEmpty
                                ? IconButton(
                                    icon: Icon(Icons.clear, color: Colors.grey),
                                    onPressed: () {
                                      _searchController.clear();
                                      setState(() {
                                        _searchResults = [];
                                        _hasSearched = false;
                                      });
                                    },
                                  )
                                : null,
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(30),
                              borderSide: BorderSide.none,
                            ),
                            filled: true,
                            fillColor: Color(0xFFF5F5F5),
                            contentPadding: const EdgeInsets.symmetric(
                              horizontal: 20,
                              vertical: 15,
                            ),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              // Search results or suggestions
              Expanded(
                child: _buildContent(),
              ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildContent() {
    if (_isLoading) {
      return Center(
        child: CircularProgressIndicator(
          color: Color(0xFF784D9C),
        ),
      );
    }

    if (_hasSearched) {
      if (_searchResults.isEmpty) {
        return _buildNoResults();
      }
      return _buildSearchResults();
    }

    return _buildSuggestions();
  }

  Widget _buildNoResults() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.search_off,
            size: 80,
            color: Colors.grey.shade300,
          ),
          const SizedBox(height: 16),
          Text(
            'search_page_no_books_found'.tr,
            style: GoogleFonts.tajawal(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: Colors.grey.shade600,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'search_page_try_different_keywords'.tr,
            style: GoogleFonts.tajawal(
              fontSize: 14,
              color: Colors.grey.shade500,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSearchResults() {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _searchResults.length,
      itemBuilder: (context, index) {
        return _buildBookItem(_searchResults[index]);
      },
    );
  }

  Widget _buildSuggestions() {
    return SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // const SizedBox(height: 20),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            // child: Text(
            //   'Popular Searches',
            //   style: GoogleFonts.tajawal(
            //     fontSize: 18,
            //     fontWeight: FontWeight.bold,
            //     color: Colors.black87,
            //   ),
            // ),
          ),
          const SizedBox(height: 12),
          // _buildPopularSearches(),
          const SizedBox(height: 30),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Text(
              'search_page_recent_books'.tr,
              style: GoogleFonts.tajawal(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: Colors.black87,
              ),
            ),
          ),
          const SizedBox(height: 12),
          _isLoadingRecent
              ? Center(
                  child: Padding(
                    padding: const EdgeInsets.all(20),
                    child: CircularProgressIndicator(
                      color: Color(0xFF784D9C),
                    ),
                  ),
                )
              : _recentBooks.isEmpty
                  ? Center(
                      child: Padding(
                        padding: const EdgeInsets.all(20),
                        child: Text(
                          'search_page_no_books_available'.tr,
                          style: GoogleFonts.tajawal(
                            fontSize: 14,
                            color: Colors.grey.shade600,
                          ),
                        ),
                      ),
                    )
                  : ListView.builder(
                      shrinkWrap: true,
                      physics: NeverScrollableScrollPhysics(),
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      itemCount: _recentBooks.length,
                      itemBuilder: (context, index) {
                        return _buildBookItem(_recentBooks[index]);
                      },
                    ),
        ],
      ),
    );
  }

  // Widget _buildPopularSearches() {
  //   // final popularSearches = [
  //   //   'Adventure',
  //   //   'Fantasy',
  //   //   'Mystery',
  //   //   'Science Fiction',
  //   //   'Educational',
  //   //   'Picture Books',
  //   // ];

  //   return Padding(
  //     padding: const EdgeInsets.symmetric(horizontal: 16),
  //     child: Wrap(
  //       spacing: 8,
  //       runSpacing: 8,
  //       children: popularSearches.map((search) {
  //         return GestureDetector(
  //           onTap: () {
  //             _searchController.text = search;
  //             _performSearch(search);
  //           },
  //           child: Container(
  //             padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
  //             decoration: BoxDecoration(
  //               color: Color(0xFFF5F5F5),
  //               borderRadius: BorderRadius.circular(20),
  //               border: Border.all(
  //                 color: Colors.grey.shade300,
  //                 width: 1,
  //               ),
  //             ),
  //             child: Text(
  //               search,
  //               style: GoogleFonts.tajawal(
  //                 fontSize: 14,
  //                 color: Colors.black87,
  //               ),
  //             ),
  //           ),
  //         );
  //       }).toList(),
  //     ),
  //   );
  // }

  Widget _buildBookItem(Book book) {
    return GestureDetector(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => ProductDetailPage(book: book),
          ),
        );
      },
      child: Container(
        margin: const EdgeInsets.only(bottom: 16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.08),
              blurRadius: 8,
              offset: Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          children: [
            // Book cover
            ClipRRect(
              borderRadius: BorderRadius.only(
                topLeft: Radius.circular(12),
                bottomLeft: Radius.circular(12),
              ),
              child: Container(
                width: 100,
                height: 120,
                color: _getBookColor(book.hashCode),
                child: book.displayImage.isNotEmpty
                    ? Image.network(
                        book.displayImage,
                        fit: BoxFit.cover,
                        errorBuilder: (context, error, stackTrace) {
                          return Center(
                            child: Icon(
                              Icons.book,
                              size: 40,
                              color: Colors.white.withOpacity(0.7),
                            ),
                          );
                        },
                      )
                    : Center(
                        child: Icon(
                          Icons.book,
                          size: 40,
                          color: Colors.white.withOpacity(0.7),
                        ),
                      ),
              ),
            ),
            // Book details
            Expanded(
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      book.title,
                      style: GoogleFonts.tajawal(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        color: Colors.black87,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 6),
                    Text(
                      book.description,
                      style: GoogleFonts.tajawal(
                        fontSize: 13,
                        color: Colors.grey.shade600,
                        height: 1.4,
                      ),
                      maxLines: 3,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Text(
                          '\$${book.discountedPrice.toStringAsFixed(2)}',
                          style: GoogleFonts.tajawal(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFF784D9C),
                          ),
                        ),
                        if (book.discountPercentage > 0) ...[
                          const SizedBox(width: 8),
                          Text(
                            '\$${book.price.toStringAsFixed(2)}',
                            style: GoogleFonts.tajawal(
                              fontSize: 13,
                              color: Colors.grey,
                              decoration: TextDecoration.lineThrough,
                            ),
                          ),
                        ],
                      ],
                    ),
                  ],
                ),
              ),
            ),
            // Arrow icon
            Padding(
              padding: const EdgeInsets.only(right: 12),
              child: Icon(
                Icons.arrow_forward_ios,
                size: 16,
                color: Colors.grey.shade400,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Color _getBookColor(int hashCode) {
    final colors = [
      Color(0xFF6C63FF),
      Color(0xFF4ECDC4),
      Color(0xFFFF6B6B),
      Color(0xFF45B7D1),
      Color(0xFF96CEB4),
      Color(0xFFD63384),
    ];
    return colors[hashCode % colors.length];
  }
}
