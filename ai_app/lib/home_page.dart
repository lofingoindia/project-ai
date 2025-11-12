import 'package:flutter/material.dart';
import 'package:flutter/gestures.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:video_player/video_player.dart';
import 'models/book.dart';
import 'services/book_service.dart';
import 'services/user_preference_service.dart';
import 'services/favorite_service.dart';
import 'services/localization_service.dart';
import 'utils/notification_helper.dart';
import 'pages/product_detail_page.dart';
import 'pages/search_page.dart';
import 'main_navigation.dart';
import 'widgets/app_footer.dart';

// Responsive helper functions
bool _isMobile(BuildContext context) => MediaQuery.of(context).size.width < 650;
bool _isTablet(BuildContext context) => MediaQuery.of(context).size.width >= 650 && MediaQuery.of(context).size.width < 1100;

double _getMaxWidth(BuildContext context) {
  final width = MediaQuery.of(context).size.width;
  if (_isMobile(context)) return width;
  if (_isTablet(context)) return 900;
  return 1200;
}

EdgeInsets _getResponsivePadding(BuildContext context) {
  if (_isMobile(context)) return const EdgeInsets.symmetric(horizontal: 20);
  if (_isTablet(context)) return const EdgeInsets.symmetric(horizontal: 40);
  
  final width = MediaQuery.of(context).size.width;
  final padding = (width - 1200) / 2;
  final calculatedPadding = (padding > 20 ? padding : 20).toDouble();
  
  return EdgeInsets.symmetric(horizontal: calculatedPadding);
}

EdgeInsets _getResponsivePaddingNoLeft(BuildContext context) {
  final localizationService = LocalizationService();
  final isRTL = localizationService.textDirection == TextDirection.rtl;
  
  if (_isMobile(context)) return const EdgeInsets.symmetric(horizontal: 20);
  
  if (_isTablet(context)) {
    // For tablets (iPad mini), provide symmetric padding for better visual balance
    return const EdgeInsets.symmetric(horizontal: 30);
  }
  
  final width = MediaQuery.of(context).size.width;
  final padding = (width - 1200) / 2;
  final calculatedPadding = (padding > 20 ? padding : 20).toDouble();
  
  return isRTL 
      ? EdgeInsets.only(left: calculatedPadding, right: 0)
      : EdgeInsets.only(left: 0, right: calculatedPadding);
}

class HomePage extends StatefulWidget {
  const HomePage({Key? key}) : super(key: key);

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> with SingleTickerProviderStateMixin {
  final BookService _bookService = BookService();
  final LocalizationService _localizationService = LocalizationService();
  List<Book> _featuredBooks = [];
  List<String> _categories = ['all', 'boy', 'girl'];
  String _selectedCategory = 'all';
  // Display label for selected category (keeps original casing / language from DB)
  String _selectedCategoryDisplay = 'all';
  bool _isLoading = true;
  bool _categoriesLoading = true;
  List<Map<String, dynamic>> _allCategories = []; // Store full category data
  bool _allCategoriesLoading = true;
  List<String> _genreCategories = [];
  bool _genreCategoriesLoading = true;
  Map<String, List<Book>> _booksByGenre = {};
  bool _genreBooksLoading = false;
  late PageController _pageController;
  VideoPlayerController? _videoController;
  bool _isVideoInitialized = false;
  Set<String> _favoriteIds = {};

  @override
  void initState() {
    super.initState();
    _pageController = PageController();
    _initializeVideo();
    _loadUserPreferencesAndBooks();
    _loadCategories();
    _loadAllCategories(); // Load all categories from database
    _loadGenreCategories();
    _loadFavorites();
  }

  Future<void> _loadFavorites() async {
    final favorites = await FavoriteService.getFavoriteBookIds();
    setState(() {
      _favoriteIds = favorites;
    });
  }

  Future<void> _toggleFavorite(String bookId) async {
    await FavoriteService.toggleFavorite(bookId);
    _loadFavorites();
    
    // Show feedback with platform-appropriate notification
    final isFavorite = await FavoriteService.isFavorite(bookId);
    if (mounted) {
      if (isFavorite) {
        NotificationHelper.showWishlistAdded(
          context,
          'added_to_my_books'.tr,
        );
      } else {
        NotificationHelper.showWishlistRemoved(
          context,
          'removed_from_my_books'.tr,
        );
      }
    }
  }

  Future<void> _initializeVideo() async {
    try {
      final controller = VideoPlayerController.asset('assets/vd.mp4');
      _videoController = controller;
      
      await controller.initialize();
      
      if (mounted) {
        setState(() {
          _isVideoInitialized = true;
        });
        
        // Set volume to 0 before playing (required for autoplay in browsers)
        controller.setVolume(0);
        controller.setLooping(true);
        
        // Add a small delay before playing to ensure proper initialization
        await Future.delayed(const Duration(milliseconds: 100));
        
        await controller.play();
      }
    } catch (error) {
      if (mounted) {
        setState(() {
          _isVideoInitialized = false;
        });
      }
    }
  }

  @override
  void dispose() {
    _pageController.dispose();
    _videoController?.dispose();
    super.dispose();
  }

  Future<void> _loadUserPreferencesAndBooks() async {
    try {
      final selectedCategory =
          await UserPreferenceService.getSelectedCategoryWithFallback();
      setState(() {
        _selectedCategory = selectedCategory;
        _selectedCategoryDisplay = selectedCategory; // will be normalized later when categories load
      });

      _loadFeaturedBooks();
    } catch (e) {
      _loadFeaturedBooks();
    }
  }

  Future<void> _loadFeaturedBooks() async {
    setState(() {
      _isLoading = true;
    });

    try {
      // Use the same pattern as books page - load ALL books first without limit
      final books = await _bookService.getAllBooks();
      
      List<Book> filteredBooks = books;
      
      // Apply client-side filtering based on selected category
      if (_selectedCategory != 'all') {
        
        // Use the normalized category name directly for filtering
        final normalizedCategory = _selectedCategory.toLowerCase();
        
        // Filter books based on the normalized category
        filteredBooks = books.where((book) {
          // Debug: print book details
          
          if (normalizedCategory == 'girl') {
            // For girl category, check if dbCategory is 2 (since category 2 seems to be for girls)
            final isGirlBook = (book.dbCategory != null && book.dbCategory.toString() == '2') ||
                              (book.genderTarget.toLowerCase() == 'girl') ||
                              (book.category.toLowerCase().contains('girl'));
            return isGirlBook;
          } else if (normalizedCategory == 'boy') {
            // For boy category, check if dbCategory is 1 (since category 1 seems to be for boys)
            final isBoyBook = (book.dbCategory != null && book.dbCategory.toString() == '1') ||
                             (book.genderTarget.toLowerCase() == 'boy') ||
                             (book.category.toLowerCase().contains('boy'));
            return isBoyBook;
          } else {
            // For other categories, check category fields
            final isMatchingCategory = (book.dbCategory?.toString().toLowerCase() == normalizedCategory ||
                                       book.category.toLowerCase() == normalizedCategory ||
                                       book.genderTarget.toLowerCase() == normalizedCategory);
            return isMatchingCategory;
          }
        }).toList();
        
      }
      
      // Take only first 6 books for featured section
      final featuredBooks = filteredBooks.take(6).toList();
      
      for (var book in featuredBooks) {
      }

      setState(() {
        _featuredBooks = featuredBooks;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _featuredBooks = [];
        _isLoading = false;
      });
    }
  }

  // Helper method to map localized categories to database filter values
  String _mapCategoryToFilter(String category) {
    // Handle Arabic categories
    switch (category.toLowerCase()) {
      case 'فتاة':
        return 'girl';
      case 'ولد':
        return 'boy';
      case 'all':
      case 'الكل':
        return 'all';
      default:
        // Return the category as-is for English or other values
        return category.toLowerCase();
    }
  }

  Future<void> _loadCategories() async {
    try {
      final categories = await _bookService.getBookCategories();
      final validCategories = categories
          .where((c) => c.isNotEmpty)
          .map((c) => c.toLowerCase())
          .toSet() // Remove duplicates
          .toList();

      final allCategories = ['all', ...validCategories];
      setState(() {
        _categories = allCategories;
        _categoriesLoading = false;
      });
    } catch (e) {
      setState(() {
        _categoriesLoading = false;
        _categories = ['all', 'boy', 'girl']; // Fallback categories
      });
    }
  }

  Future<void> _loadAllCategories() async {
    try {
      final categories = await _bookService.getCategories();
      // Determine a user-friendly display name for the currently selected category
      String displayName = 'all';
      for (var c in categories) {
        final name = (c['name'] ?? '').toString();
        if (_normalizeCategoryName(name) == _selectedCategory) {
          displayName = name;
          break;
        }
      }

      setState(() {
        _allCategories = categories;
        _allCategoriesLoading = false;
        _selectedCategoryDisplay = displayName;
      });
    } catch (e) {
      setState(() {
        _allCategoriesLoading = false;
        _allCategories = [];
      });
    }
  }

  // Normalize a category name (handles Arabic labels and common mappings)
  String _normalizeCategoryName(String name) {
    final n = name.trim().toLowerCase();
    switch (n) {
      case 'فتاة':
  case 'بنت':
      case 'girl':
      case 'girls':
        return 'girl';
  case 'ولد':
      case 'boy':
      case 'boys':
        return 'boy';
      case 'all':
      case 'الكل':
        return 'all';
      default:
        return n; // use lowercased raw name for filtering (e.g., adventure)
    }
  }

  Future<void> _loadGenreCategories() async {
    try {
      final genres = await _bookService.getGenres();
      setState(() {
        _genreCategories = genres;
        _genreCategoriesLoading = false;
      });
      
      // Load books for all genres
      _loadBooksForAllGenres();
    } catch (e) {
      setState(() {
        _genreCategoriesLoading = false;
        _genreCategories = [];
      });
    }
  }

  Future<void> _loadBooksForAllGenres() async {
    setState(() {
      _genreBooksLoading = true;
    });

    try {
      // Use the same pattern as books page - load ALL books first
      final allBooks = await _bookService.getAllBooks();
      
      List<Book> filteredBooks = allBooks;
      
      // Apply the same category filtering logic as featured books
      if (_selectedCategory != 'all') {
        final normalizedCategory = _selectedCategory.toLowerCase();
        
        // Filter books based on the normalized category (same logic as featured books)
        filteredBooks = allBooks.where((book) {
          if (normalizedCategory == 'girl') {
            // For girl category, check if dbCategory is 2 (since category 2 seems to be for girls)
            return (book.dbCategory != null && book.dbCategory.toString() == '2') ||
                   (book.genderTarget.toLowerCase() == 'girl') ||
                   (book.category.toLowerCase().contains('girl'));
          } else if (normalizedCategory == 'boy') {
            // For boy category, check if dbCategory is 1 (since category 1 seems to be for boys)
            return (book.dbCategory != null && book.dbCategory.toString() == '1') ||
                   (book.genderTarget.toLowerCase() == 'boy') ||
                   (book.category.toLowerCase().contains('boy'));
          } else {
            // For other categories, check category fields
            return (book.dbCategory?.toString().toLowerCase() == normalizedCategory ||
                    book.category.toLowerCase() == normalizedCategory ||
                    book.genderTarget.toLowerCase() == normalizedCategory);
          }
        }).toList();
        
      }
      
      final Map<String, List<Book>> genreBooks = {};
      
      for (String genre in _genreCategories) {
        final booksInGenre = filteredBooks.where((book) => book.genre == genre).take(6).toList();
        
        if (booksInGenre.isNotEmpty) {
          genreBooks[genre] = booksInGenre;
        }
      }
      
      setState(() {
        _booksByGenre = genreBooks;
        _genreBooksLoading = false;
      });
    } catch (e) {
      setState(() {
        _genreBooksLoading = false;
        _booksByGenre = {};
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: _localizationService.textDirection,
      child: Scaffold(
        body: _buildHomeScreen(),
      ),
    );
  }

  Widget _buildHomeScreen() {
    final maxWidth = _getMaxWidth(context);
    
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            Color.fromARGB(255, 255, 255, 255),
            Color(0xFFEDE9FE),
            const Color.fromARGB(255, 255, 255, 255),
          ],
          stops: [0.0, 0.3, 1.0],
        ),
      ),
      child: SingleChildScrollView(
        child: Column(
          children: [
            // Banner Image - starts from top (Edge to Edge)
            Container(
              height: _isMobile(context) ? 450 : (_isTablet(context) ? 550 : 600),
              width: double.infinity,
              child: Stack(
                children: [
                  // Image - Full width, no border radius for edge-to-edge
                  Container(
                    height: _isMobile(context) ? 450 : (_isTablet(context) ? 550 : 600),
                    width: double.infinity,
                    child: ClipRRect(
                      borderRadius: BorderRadius.zero,
                      child: _isVideoInitialized && 
                             _videoController != null && 
                             _videoController!.value.isInitialized
                          ? SizedBox.expand(
                              child: FittedBox(
                                fit: BoxFit.cover,
                                child: SizedBox(
                                  width: _videoController!.value.size.width,
                                  height: _videoController!.value.size.height,
                                  child: VideoPlayer(_videoController!),
                                ),
                              ),
                            )
                          : Container(
                              decoration: BoxDecoration(
                                gradient: LinearGradient(
                                  begin: Alignment.topLeft,
                                  end: Alignment.bottomRight,
                                  colors: [
                                    Color(0xFF784D9C),
                                    Color(0xFF5B21B6),
                                  ],
                                ),
                              ),
                              child: Center(
                                child: CircularProgressIndicator(
                                  color: Colors.white.withOpacity(0.7),
                                ),
                              ),
                            ),
                    ),
                  ),
                  // Safe area padding for top content
                  Positioned(
                    top: 0,
                    left: 0,
                    right: 0,
                    child: SafeArea(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _buildHeader(),
                          SizedBox(height: _isMobile(context) ? 180 : 280), // Push content lower - increased mobile spacing
                          // Hello text
                          Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 20),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Text(
                                      '${'hello'.tr} ',
                                      style: GoogleFonts.tajawal(
                                        fontSize: _isMobile(context) ? 28 : (_isTablet(context) ? 36 : 42),
                                        fontWeight: FontWeight.bold,
                                        color: Colors.white,
                                      ),
                                    ),
                                    Text(
                                      '📚',
                                      style: GoogleFonts.tajawal(fontSize: _isMobile(context) ? 24 : 32),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 8),
                                Text(
                                  'bookish_adventure_1'.tr,
                                  style: GoogleFonts.tajawal(
                                    fontSize: _isMobile(context) ? 18 : (_isTablet(context) ? 22 : 24),
                                    fontWeight: FontWeight.w400,
                                    color: Colors.white,
                                  ),
                                ),
                                Text(
                                  'bookish_adventure_2'.tr,
                                  style: GoogleFonts.tajawal(
                                    fontSize: _isMobile(context) ? 18 : (_isTablet(context) ? 22 : 24),
                                    fontWeight: FontWeight.w400,
                                    color: Colors.white,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          SizedBox(height: _isMobile(context) ? 10 : 30), // Reduced spacing for mobile
                          // Search bar
                          Padding(
                            padding: _isMobile(context) 
                                ? const EdgeInsets.symmetric(horizontal: 20)
                                : _isTablet(context)
                                    ? const EdgeInsets.symmetric(horizontal: 40)
                                    : const EdgeInsets.symmetric(horizontal: 20),
                            child: GestureDetector(
                              onTap: () {
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (context) => SearchPage(),
                                  ),
                                );
                              },
                              child: Container(
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  borderRadius: BorderRadius.circular(30),
                                  boxShadow: [
                                    BoxShadow(
                                      color: Colors.black.withOpacity(0.1),
                                      blurRadius: 8,
                                      offset: Offset(0, 2),
                                    ),
                                  ],
                                ),
                                child: AbsorbPointer(
                                  child: TextField(
                                    decoration: InputDecoration(
                                      hintText: 'search_hint'.tr,
                                      hintStyle: GoogleFonts.tajawal(
                                        color: const Color.fromARGB(255, 0, 0, 0),
                                        fontSize: 15,
                                      ),
                                      prefixIcon: Icon(
                                        Icons.search,
                                        color: const Color.fromARGB(255, 0, 0, 0),
                                      ),
                                      border: OutlineInputBorder(
                                        borderRadius: BorderRadius.circular(30),
                                        borderSide: BorderSide.none,
                                      ),
                                      filled: true,
                                      fillColor: Colors.white,
                                      contentPadding: const EdgeInsets.symmetric(
                                        horizontal: 20,
                                        vertical: 15,
                                      ),
                                    ),
                                  ),
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(height: 20),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),

            // Content sections wrapped in constrained container
            Center(
              child: Container(
                constraints: BoxConstraints(maxWidth: maxWidth),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const SizedBox(height: 30),

                    // Categories Section with inline buttons
                    _buildCategoriesSection(),

                    const SizedBox(height: 15),

                    _buildAgeRangeCards(),

                    const SizedBox(height: 30),
                    
                    // Banner with a1.png image (mobile only)
                    if (_isMobile(context))
                      _buildMainBannerSection(),
                    
                    // Add spacing for mobile after banner
                    if (_isMobile(context))
                      const SizedBox(height: 40),
                  ],
                ),
              ),
            ),
            
            // Edge-to-Edge Main Banner Section (Desktop/Web and Tablet) - Right after age cards
            if (!_isMobile(context))
              _buildMainBannerSection(),
            
            // Content sections wrapped in constrained container
            Center(
              child: Container(
                constraints: BoxConstraints(maxWidth: maxWidth),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const SizedBox(height: 30),
                    
                    // Bestsellers Section
                    _buildBestsellersSection(),

                    // const SizedBox(height: 30),

                    // // Popular Books section
                    // _buildPopularPlacesSection(),

                    const SizedBox(height: 20),
                  ],
                ),
              ),
            ),
            
            // Edge-to-Edge Image Section (Desktop/Web Only)
            // if (!_isMobile(context) && !_isTablet(context))
            //   Container(
            //     width: double.infinity,
            //     height: 500.0,
            //     child: Image.asset(
            //       'assets/a3.png', // You can change this to any image from your assets
            //       fit: BoxFit.cover,
            //       errorBuilder: (context, error, stackTrace) {
            //         return Container(
            //           color: Colors.grey[300],
            //           child: Center(
            //             child: Icon(Icons.image, size: 100, color: Colors.grey[600]),
            //           ),
            //         );
            //       },
            //     ),
            //   ),
            
            // Genre Categories with magical princess banner - dynamically built
            ..._buildGenreWithBannerSections(),
            
            // Edge-to-Edge Image Section (Desktop/Web Only) - Above review carousel
            // if (!_isMobile(context) && !_isTablet(context))
            //   Container(
            //     width: double.infinity,
            //     height: 700.0,
            //     child: Image.asset(
            //       'assets/a1.png', // You can change this to any image from your assets
            //       fit: BoxFit.cover,
            //       errorBuilder: (context, error, stackTrace) {
            //         return Container(
            //           color: Colors.grey[300],
            //           child: Center(
            //             child: Icon(Icons.image, size: 100, color: Colors.grey[600]),
            //           ),
            //         );
            //       },
            //     ),
            //   ),
            
            // Add the review carousel (web/tablet/desktop only)
            if (!_isMobile(context)) _buildReviewCarouselSection(),

            // // Add the imagination section for web only, just above footer
            // if (!_isMobile(context)) _buildImaginationSection(),
            
            // Add footer at the bottom (scrollable)
            AppFooter(),
          ],
        ),
      ),
    );
  }

  Widget _buildReviewCarouselSection() {
    final isTablet = _isTablet(context);
    final cardHeight = isTablet ? 240.0 : 260.0;

    // Real customer reviews with actual content
    final reviews = [
      {
        'avatar': 'assets/22 copy.png',
        'name': 'home_page_review_sarah_name'.tr,
        'rating': 5,
        'text': 'home_page_review_sarah_text'.tr,
      },
      {
        'avatar': 'assets/11 copy.png',
        'name': 'home_page_review_michael_name'.tr,
        'rating': 5,
        'text': 'home_page_review_michael_text'.tr,
      },
      {
        'avatar': 'assets/33 copy.png',
        'name': 'home_page_review_emma_name'.tr,
        'rating': 4,
        'text': 'home_page_review_emma_text'.tr,
      },
      {
        'avatar': 'assets/4444 copy.png',
        'name': 'home_page_review_james_name'.tr,
        'rating': 5,
        'text': 'home_page_review_james_text'.tr,
      },
      {
        'avatar': 'assets/22 copy.png',
        'name': 'home_page_review_olivia_name'.tr,
        'rating': 4,
        'text': 'home_page_review_olivia_text'.tr,
      },
      {
        'avatar': 'assets/44444 copy.png',
        'name': 'home_page_review_david_name'.tr,
        'rating': 5,
        'text': 'home_page_review_david_text'.tr,
      },
    ];

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 60),
      decoration: BoxDecoration(
        color: Color(0xFFF3F0FF), // Light purple background
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: EdgeInsets.symmetric(
              horizontal: _isTablet(context) ? 40.0 : 60.0,
            ),
            child: Text(
              'home_page_reviews_title'.tr,
              style: GoogleFonts.tajawal(
                fontSize: 22,
                fontWeight: FontWeight.bold,
                color: Colors.black87,
              ),
            ),
          ),
          const SizedBox(height: 20),
          Container(
            height: cardHeight,
            child: ScrollConfiguration(
              behavior: ScrollConfiguration.of(context).copyWith(
                dragDevices: {
                  PointerDeviceKind.touch,
                  PointerDeviceKind.mouse,
                },
                scrollbars: false,
              ),
              child: ListView.separated(
                padding: EdgeInsets.symmetric(
                  horizontal: _isTablet(context) ? 40.0 : 60.0,
                ),
                scrollDirection: Axis.horizontal,
                physics: const BouncingScrollPhysics(),
                itemCount: reviews.length,
                separatorBuilder: (_, __) => const SizedBox(width: 20),
                itemBuilder: (context, index) {
                      final r = reviews[index];
                      return Container(
                        width: isTablet ? 380 : 420,
                        padding: const EdgeInsets.all(20),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(
                            color: Colors.grey.shade200,
                            width: 1,
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withOpacity(0.08),
                              blurRadius: 16,
                              offset: Offset(0, 4),
                            ),
                          ],
                        ),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            // Avatar with image
                            Container(
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                boxShadow: [
                                  BoxShadow(
                                    offset: Offset(0, 2),
                                  ),
                                ],
                              ),
                              child: CircleAvatar(
                                radius: 32,
                                backgroundColor: Colors.grey.shade100,
                                backgroundImage: AssetImage(r['avatar'] as String),
                                onBackgroundImageError: (_, __) {},
                              ),
                            ),
                            const SizedBox(width: 16),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                mainAxisAlignment: MainAxisAlignment.start,
                                children: [
                                  // Name and stars on same row
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Text(
                                        r['name'] as String,
                                        style: GoogleFonts.tajawal(
                                          fontSize: 16,
                                          fontWeight: FontWeight.w600,
                                          color: Colors.black87,
                                        ),
                                      ),
                                      Row(
                                        children: List.generate(
                                          5,
                                          (i) => Icon(
                                            i < (r['rating'] as int) ? Icons.star : Icons.star_border,
                                            color: Colors.amber,
                                            size: 18,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 12),
                                  Expanded(
                                    child: Text(
                                      r['text'] as String,
                                      style: GoogleFonts.tajawal(
                                        fontSize: 14,
                                        color: Colors.grey.shade700,
                                        height: 1.5,
                                      ),
                                      maxLines: 6,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      );
                    },
                  ),
                ),
              ),
            ],
          ),
    );
  }

  Widget _buildMagicalPrincessBanner() {
    return Container(
      width: double.infinity,
      height: 600,
      child: Image.asset(
        'assets/a4.png', // Update this with your magical princess image path
        fit: BoxFit.cover,
        width: double.infinity,
        errorBuilder: (context, error, stackTrace) {
          return Container(
            color: Color(0xFFEDE9FE),
            child: Center(
              child: Icon(
                Icons.image,
                size: 100,
                color: Colors.grey[400],
              ),
            ),
          );
        },
      ),
    );
  }

  List<Widget> _buildGenreWithBannerSections() {
    final maxWidth = _getMaxWidth(context);
    List<Widget> sections = [];
    
    if (_genreCategoriesLoading) {
      sections.add(
        Center(
          child: Container(
            constraints: BoxConstraints(maxWidth: maxWidth),
            padding: const EdgeInsets.symmetric(horizontal: 25, vertical: 30),
            child: Center(
              child: CircularProgressIndicator(color: Color(0xFF784D9C)),
            ),
          ),
        ),
      );
      return sections;
    }

    if (_genreCategories.isEmpty) {
      sections.add(
        Center(
          child: Container(
            constraints: BoxConstraints(maxWidth: maxWidth),
            padding: const EdgeInsets.symmetric(horizontal: 25, vertical: 30),
            child: Text(
              'home_page_no_categories'.tr,
              style: GoogleFonts.tajawal(
                fontSize: 14,
                color: Colors.grey,
              ),
            ),
          ),
        ),
      );
      return sections;
    }

    int displayedGenreCount = 0;
    bool titleAdded = false;
    
    for (int i = 0; i < _genreCategories.length; i++) {
      final genre = _genreCategories[i];
      final booksInGenre = _booksByGenre[genre] ?? [];
      
      if (booksInGenre.isEmpty) continue;
      
      displayedGenreCount++;
      
      // Add title before first genre
      if (!titleAdded) {
        sections.add(
          Center(
            child: Container(
              constraints: BoxConstraints(maxWidth: maxWidth),
              padding: const EdgeInsets.fromLTRB(0, 30, 0, 0),
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 25),
                child: Row(
                  children: [
                    Icon(
                      Icons.category_outlined,
                      size: 20,
                      color: const Color.fromARGB(221, 0, 0, 0),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      'genre category'.tr,
                      style: GoogleFonts.tajawal(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        color: const Color.fromARGB(221, 0, 0, 0),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        );
        titleAdded = true;
      }
      
      // Add genre section wrapped in constrained container
      sections.add(
        Center(
          child: Container(
            constraints: BoxConstraints(maxWidth: maxWidth),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 10),
                // Genre name
                Padding(
                  padding: const EdgeInsets.fromLTRB(25, 5, 25, 5),
                  child: Text(
                    genre,
                    style: GoogleFonts.tajawal(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: const Color(0xFF784D9C),
                    ),
                  ),
                ),
                
                const SizedBox(height: 10),
                
                // Books display
                _isMobile(context) || _isTablet(context)
                    ? Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 20),
                        child: GridView.builder(
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                            crossAxisCount: 2,
                            childAspectRatio: _isTablet(context) ? 0.65 : 0.6,
                            crossAxisSpacing: _isTablet(context) ? 12 : 16, // Reduced spacing for tablet
                            mainAxisSpacing: _isTablet(context) ? 16 : 20, // Reduced spacing for tablet
                          ),
                          itemCount: booksInGenre.length > 6 ? 6 : booksInGenre.length,
                          itemBuilder: (context, index) {
                            return _buildMobileBookCard(booksInGenre[index]);
                          },
                        ),
                      )
                    : Padding(
                        padding: _getResponsivePaddingNoLeft(context),
                        child: GridView.builder(
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                            crossAxisCount: 4,
                            childAspectRatio: 0.6,
                            crossAxisSpacing: 16,
                            mainAxisSpacing: 20,
                          ),
                          itemCount: booksInGenre.length > 8 ? 8 : booksInGenre.length,
                          itemBuilder: (context, index) {
                            return _buildMobileBookCard(booksInGenre[index]);
                          },
                        ),
                      ),
                const SizedBox(height: 10),
              ],
            ),
          ),
        ),
      );
      
      // Insert magical princess banner after 2nd genre (desktop only) - EDGE TO EDGE
      if (displayedGenreCount == 2 && !_isMobile(context) && !_isTablet(context)) {
        sections.add(
          Column(
            children: [
              const SizedBox(height: 30),
              _buildMagicalPrincessBanner(),
              const SizedBox(height: 30),
            ],
          ),
        );
      }
    }
    
    // Add bottom spacing
    sections.add(
      Center(
        child: Container(
          constraints: BoxConstraints(maxWidth: maxWidth),
          child: const SizedBox(height: 30),
        ),
      ),
    );

    return sections;
  }

  // Widget _buildHeader() {
  //         ],
  //       ),
  //     ),
  //   );
  // }

  Widget _buildHeader() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          // Empty space for alignment
          SizedBox(),
          // Menu and Cart icons
          Row(
            children: [
              // 4-dot menu icon
              GestureDetector(
                onTap: () {
                  // Add your menu action here
                },
                child: Container(
                  width: 30,
                  height: 30,
                  // decoration: BoxDecoration(
                  //   color: Colors.white.withOpacity(0.9),
                  //   borderRadius: BorderRadius.circular(5),
                  //   // boxShadow: [
                  //   //   BoxShadow(
                  //   //     color: Colors.black.withOpacity(0.1),
                  //   //     blurRadius: 8,
                  //   //     offset: Offset(0, 2),
                  //   //   ),
                  //   // ],
                  // ),
                  // child: Icon(
                  //   Icons.apps,
                  //   color: Color.fromARGB(255, 13, 68, 38),
                  //   size: 22,
                  // ),
                ),
              ),
              const SizedBox(width: 12),
              // Shopping cart icon
              GestureDetector(
                onTap: () {
                  // Add your cart navigation here
                },
                child: Container(
                  width: 30,
                  height: 30,
                  // decoration: BoxDecoration(
                  //   color: const Color.fromARGB(255, 120, 77, 156),
                  //   borderRadius: BorderRadius.circular(5),
                  //   // boxShadow: [
                  //   //   BoxShadow(
                  //   //     color: Colors.black.withOpacity(0.1),
                  //   //     blurRadius: 8,
                  //   //     offset: Offset(0, 2),
                  //   //   ),
                  //   // ],
                  // ),
                  child: Stack(
                    children: [
                      // Center(
                      //   child: Icon(
                      //     Icons.shopping_cart_outlined,
                      //     color:  Color.fromARGB(255, 253, 255, 254),
                      //     size: 22,
                      //   ),
                      // ),
                      // Badge for cart count (optional)
                      // Positioned(
                      //   right: 6,
                      //   top: 6,
                      //   child: Container(
                      //     padding: EdgeInsets.all(4),
                      //     decoration: BoxDecoration(
                      //       color: Colors.red,
                      //       shape: BoxShape.circle,
                      //     ),
                      //     constraints: BoxConstraints(
                      //       minWidth: 16,
                      //       minHeight: 16,
                      //     ),
                      //     child: Text(
                      //       '3',
                      //       style: TextStyle(
                      //         color: Colors.white,
                      //         fontSize: 10,
                      //         fontWeight: FontWeight.bold,
                      //       ),
                      //       textAlign: TextAlign.center,
                      //     ),
                      //   ),
                      // ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildCategoriesSection() {
    if (_categoriesLoading) {
      return Padding(
        padding: const EdgeInsets.symmetric(horizontal: 20),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Row(
              children: [
                Icon(
                  Icons.dashboard,
                  size: 24,
                  color: const Color.fromARGB(221, 17, 41, 8),
                ),
                const SizedBox(width: 8),
                Text(
                  'age'.tr,
                  style: GoogleFonts.tajawal(
                    fontSize: 22,
                    fontWeight: FontWeight.bold,
                    color: const Color.fromARGB(221, 0, 0, 0),
                  ),
                ),
              ],
            ),
            Row(
              children: [
                Container(
                  width: 60,
                  height: 35,
                  decoration: BoxDecoration(
                    color: Colors.grey.shade200,
                    borderRadius: BorderRadius.circular(20),
                  ),
                ),
                const SizedBox(width: 8),
                Container(
                  width: 60,
                  height: 35,
                  decoration: BoxDecoration(
                    color: Colors.grey.shade200,
                    borderRadius: BorderRadius.circular(20),
                  ),
                ),
              ],
            ),
          ],
        ),
      );
    }

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          // Age title on the left
          Row(
            children: [
              Icon(
                Icons.dashboard,
                size: 24,
                color: const Color.fromARGB(221, 17, 41, 8),
              ),
              const SizedBox(width: 8),
              Text(
                'age'.tr,
                style: GoogleFonts.tajawal(
                  fontSize: 22,
                  fontWeight: FontWeight.bold,
                  color: const Color.fromARGB(221, 0, 0, 0),
                ),
              ),
              const SizedBox(width: 12),
              // Show currently selected category display (if not 'all')
              if (_selectedCategoryDisplay.isNotEmpty && _selectedCategory != 'all')
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: Color(0xFF784D9C).withOpacity(0.08),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    _selectedCategoryDisplay,
                    style: GoogleFonts.tajawal(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: Color(0xFF784D9C),
                    ),
                  ),
                ),
            ],
          ),
          
          // Categories moved towards right with selection functionality
          Row(
            children: [
              if (_allCategories.isNotEmpty && !_allCategoriesLoading)
                ...(_allCategories.take(4).map((category) => // Show max 4 categories
                  GestureDetector(
                    onTap: () async {
                      // Set category as selected and filter products
                      final rawName = category['name']?.toString() ?? '';
                      final normalized = _normalizeCategoryName(rawName);

                      // Update selected category for filtering and display
                      setState(() {
                        _selectedCategory = normalized;
                        _selectedCategoryDisplay = rawName;
                      });

                      // Save preference and reload books with category filter
                      await UserPreferenceService.setSelectedCategory(normalized);
                      await _loadFeaturedBooks();
                      await _loadBooksForAllGenres();
                    },
                    child: Container(
                      margin: const EdgeInsets.only(left: 8),
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                      decoration: BoxDecoration(
                        gradient: _selectedCategory == _normalizeCategoryName(category['name']?.toString() ?? '')
                            ? LinearGradient(
                                begin: Alignment.topLeft,
                                end: Alignment.bottomRight,
                                colors: [Color(0xFF784D9C), Color(0xFF784D9C)],
                              )
                            : null,
                        color: _selectedCategory == _normalizeCategoryName(category['name']?.toString() ?? '')
                            ? null
                            : Color(0xFF784D9C).withOpacity(0.1),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                          color: _selectedCategory == _normalizeCategoryName(category['name']?.toString() ?? '')
                              ? Colors.transparent
                              : Color(0xFF784D9C).withOpacity(0.3),
                          width: 1,
                        ),
                        boxShadow: _selectedCategory == _normalizeCategoryName(category['name']?.toString() ?? '')
                            ? [
                                BoxShadow(
                                  color: Colors.black.withOpacity(0.08),
                                  blurRadius: 4,
                                  offset: Offset(0, 2),
                                ),
                              ]
                            : null,
                      ),
                      child: Text(
                        category['name'] ?? '',
                        style: GoogleFonts.tajawal(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: _selectedCategory == _normalizeCategoryName(category['name']?.toString() ?? '')
                              ? Colors.white
                              : Color(0xFF784D9C),
                        ),
                      ),
                    ),
                  ),
                )).toList()
              else
                // Fallback: Show 'all' option if no categories from database
                GestureDetector(
                  onTap: () async {
                    setState(() {
                      _selectedCategory = 'all';
                      _selectedCategoryDisplay = 'all';
                    });
                    await UserPreferenceService.setSelectedCategory('all');
                    await _loadFeaturedBooks();
                    await _loadBooksForAllGenres();
                  },
                  child: Container(
                    margin: const EdgeInsets.only(left: 8),
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    decoration: BoxDecoration(
                      gradient: _selectedCategory == 'all'
                          ? LinearGradient(
                              begin: Alignment.topLeft,
                              end: Alignment.bottomRight,
                              colors: [Color(0xFF784D9C), Color(0xFF784D9C)],
                            )
                          : null,
                      color: _selectedCategory == 'all' ? null : Color(0xFF784D9C).withOpacity(0.1),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                        color: _selectedCategory == 'all'
                            ? Colors.transparent
                            : Color(0xFF784D9C).withOpacity(0.3),
                        width: 1,
                      ),
                    ),
                    child: Text(
                      'all'.tr,
                      style: GoogleFonts.tajawal(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: _selectedCategory == 'all' ? Colors.white : Color(0xFF784D9C),
                      ),
                    ),
                  ),
                ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildAgeRangeCards() {
    final ageRanges = ['0-2', '3-5', '6-8', '9-12'];
    final ageImages = [
      'assets/11 copy.png',
      'assets/22 copy.png',
      'assets/33 copy.png',
      'assets/4444 copy.png',
    ];

    // Responsive: grid for desktop/tablet, horizontal scroll for mobile
    if (_isMobile(context)) {
      return SizedBox(
        height: 180,
        child: ListView.builder(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.symmetric(horizontal: 20),
          itemCount: ageRanges.length,
          itemBuilder: (context, index) {
            final isRTL = _localizationService.textDirection == TextDirection.rtl;
            return GestureDetector(
              onTap: () {
                MainNavigation.switchToShopWithAgeFilter(context, ageRanges[index]);
              },
              child: Container(
                width: MediaQuery.of(context).size.width * 0.35,
                margin: EdgeInsets.only(
                  right: isRTL ? 0 : (index < ageRanges.length - 1 ? 16 : 0),
                  left: isRTL ? (index < ageRanges.length - 1 ? 16 : 0) : 0,
                ),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.05),
                      blurRadius: 10,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Column(
                  children: [
                    Expanded(
                      flex: 3,
                      child: ClipRRect(
                        borderRadius: const BorderRadius.vertical(
                          top: Radius.circular(12)
                        ),
                        child: Image.asset(
                          ageImages[index],
                          width: double.infinity,
                          fit: BoxFit.cover,
                        ),
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      decoration: const BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.vertical(
                          bottom: Radius.circular(12)
                        ),
                      ),
                      child: Text(
                        ' ${'age'.tr} ${ageRanges[index]}',
                        style: GoogleFonts.tajawal(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: const Color(0xFF784D9C),
                        ),
                        textAlign: TextAlign.center,
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        ),
      );
    }

    // Grid layout for tablet and desktop
    return Padding(
      padding: _getResponsivePaddingNoLeft(context),
      child: GridView.builder(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: _isTablet(context) ? 4 : 4, // 2x2 for tablets, 4x1 for desktop
          childAspectRatio: 0.85,
          crossAxisSpacing: 16,
          mainAxisSpacing: 16,
        ),
        itemCount: ageRanges.length,
        itemBuilder: (context, index) {
          return GestureDetector(
            onTap: () {
              MainNavigation.switchToShopWithAgeFilter(context, ageRanges[index]);
            },
            child: Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.05),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Column(
                children: [
                  Expanded(
                    flex: 3,
                    child: ClipRRect(
                      borderRadius: const BorderRadius.vertical(
                        top: Radius.circular(12)
                      ),
                      child: Image.asset(
                        ageImages[index],
                        width: double.infinity,
                        fit: BoxFit.cover,
                      ),
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    decoration: const BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.vertical(
                        bottom: Radius.circular(12)
                      ),
                    ),
                    child: Text(
                      ' ${'age'.tr} ${ageRanges[index]}',
                      style: GoogleFonts.tajawal(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: const Color(0xFF784D9C),
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildPopularPlacesSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 25),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Icon(
                    Icons.auto_graph,
                    size: 24,
                    color: const Color.fromARGB(221, 0, 0, 0),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    'popular_books'.tr,
                    style: GoogleFonts.tajawal(
                      fontSize: 22,
                      fontWeight: FontWeight.bold,
                      color: const Color.fromARGB(221, 0, 0, 0),
                    ),
                  ),
                ],
              ),
              // Icon(
              //   Icons.arrow_forward,
              //   color: Colors.black87,
              //   size: 20,
              // ),
            ],
          ),
        ),
        const SizedBox(height: 15),
        
        if (_isLoading)
          Container(
            height: 220,
            child: Center(
              child: CircularProgressIndicator(color: Color(0xFF784D9C)),
            ),
          )
        else
          _buildBooksList(),
      ],
    );
  }

  Widget _buildCharacterFeaturesSection() {
    return Container(
      margin: const EdgeInsets.symmetric(vertical: 40),
      padding: const EdgeInsets.symmetric(horizontal: 40),
      child: Center(
        child: Container(
          constraints: BoxConstraints(maxWidth: _getMaxWidth(context)),
          padding: const EdgeInsets.symmetric(vertical: 60, horizontal: 40),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [
                Color.fromARGB(255, 255, 76, 118),
                Color(0xFFFF6B8A),
              ],
            ),
            borderRadius: BorderRadius.circular(24),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.1),
                blurRadius: 20,
                offset: const Offset(0, 10),
              ),
            ],
          ),
          child: Column(
            children: [
              // Title
              Text(
                'CUSTOMIZE FACTS, EXPRESSIONS, AND ANGLES',
                textAlign: TextAlign.center,
                style: GoogleFonts.tajawal(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: Colors.white,
                  letterSpacing: 1.5,
                ),
              ),
              const SizedBox(height: 16),
              Text(
                'To bring your character to life!',
                textAlign: TextAlign.center,
                style: GoogleFonts.tajawal(
                  fontSize: 28,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
              const SizedBox(height: 50),
              
              // Three feature cards
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  _buildFeatureCard('assets/E1 copy.png'),
                  _buildFeatureCard('assets/E2 copy.png'),
                  _buildFeatureCard('assets/E3 copy.png'),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildFeatureCard(String imagePath) {
    return Expanded(
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 15),
        child: Container(
          constraints: BoxConstraints(
            maxWidth: 250,
            maxHeight: 250,
          ),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(20),
            // boxShadow: [
            //   BoxShadow(
            //     color: Colors.black.withOpacity(0.15),
            //     blurRadius: 15,
            //     offset: const Offset(0, 6),
            //   ),
            // ],
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(20),
            child: Image.asset(
              imagePath,
              fit: BoxFit.contain,
              errorBuilder: (context, error, stackTrace) {
                return Container(
                  color: Colors.white.withOpacity(0.3),
                  child: const Center(
                    child: Icon(Icons.image, color: Colors.white, size: 50),
                  ),
                );
              },
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildBooksList() {
    if (_featuredBooks.isEmpty) {
      return Container(
        height: 250,
        child: Center(
          child: Text(
            'no_books_available'.tr,
            style: GoogleFonts.tajawal(
              fontSize: 16,
              color: Colors.grey,
            ),
          ),
        ),
      );
    }

    // Mobile and Tablet: Grid layout with 2 columns
    if (_isMobile(context) || _isTablet(context)) {
      return Padding(
        padding: const EdgeInsets.symmetric(horizontal: 20),
        child: GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            childAspectRatio: _isTablet(context) ? 0.65 : 0.6,
            crossAxisSpacing: _isTablet(context) ? 12 : 16, // Reduced spacing for tablet
            mainAxisSpacing: _isTablet(context) ? 16 : 20, // Reduced spacing for tablet
          ),
          itemCount: _featuredBooks.length,
          itemBuilder: (context, index) {
            return _buildMobileBookCard(_featuredBooks[index]);
          },
        ),
      );
    }

    // Desktop: Grid layout with 4 columns (no horizontal scrolling)
    return Padding(
      padding: _getResponsivePaddingNoLeft(context),
      child: GridView.builder(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 4,
          childAspectRatio: 0.6,
          crossAxisSpacing: 16,
          mainAxisSpacing: 20,
        ),
        itemCount: _featuredBooks.length,
        itemBuilder: (context, index) {
          return _buildMobileBookCard(_featuredBooks[index]);
        },
      ),
    );
  }

  Widget _buildMobileBookCard(Book book) {
    final isFavorite = _favoriteIds.contains(book.id);
    
    return GestureDetector(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => ProductDetailPage(book: book),
          ),
        );
      },
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Book Image - standalone without background
          Expanded(
            flex: 5,
            child: Stack(
              children: [
                Container(
                  width: double.infinity,
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(16),
                    child: book.displayImage.isNotEmpty
                        ? Image.network(
                            book.displayImage,
                            fit: BoxFit.cover,
                            width: double.infinity,
                            height: double.infinity,
                            errorBuilder: (context, error, stackTrace) {
                              return Container(
                                decoration: BoxDecoration(
                                  gradient: LinearGradient(
                                    begin: Alignment.topLeft,
                                    end: Alignment.bottomRight,
                                    colors: [
                                      Color(0xFF784D9C),
                                      Color(0xFF784D9C),
                                    ],
                                  ),
                                  borderRadius: BorderRadius.circular(16),
                                ),
                                child: Center(
                                  child: Icon(
                                    Icons.book,
                                    size: 40,
                                    color: Colors.white.withOpacity(0.7),
                                  ),
                                ),
                              );
                            },
                          )
                        : Container(
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                begin: Alignment.topLeft,
                                end: Alignment.bottomRight,
                                colors: [
                                  Color(0xFF784D9C),
                                  Color(0xFF784D9C),
                                ],
                              ),
                              borderRadius: BorderRadius.circular(16),
                            ),
                            child: Center(
                              child: Icon(
                                Icons.book,
                                size: 40,
                                color: Colors.white.withOpacity(0.7),
                              ),
                            ),
                          ),
                  ),
                ),
                // Favorite icon button
                Positioned(
                  top: 8,
                  right: _localizationService.textDirection == TextDirection.rtl ? null : 8,
                  left: _localizationService.textDirection == TextDirection.rtl ? 8 : null,
                  child: GestureDetector(
                    onTap: () => _toggleFavorite(book.id),
                    child: Container(
                      padding: const EdgeInsets.all(6),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.15),
                            blurRadius: 4,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: Icon(
                        isFavorite ? Icons.favorite : Icons.favorite_border,
                        color: isFavorite ? Colors.red : Colors.grey[600],
                        size: 14,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
          
          const SizedBox(height: 8),
          
          // Text content - no background container
          Expanded(
            flex: 3,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                // Title
                Text(
                  book.title,
                  style: GoogleFonts.tajawal(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: Colors.black87,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 4),
                // Subtitle/Description
                Flexible(
                  child: Text(
                    book.description.isNotEmpty ? book.description : 'تجربة ممتعة ومشوقة',
                    style: GoogleFonts.tajawal(
                      fontSize: 10,
                      fontWeight: FontWeight.w400,
                      color: Colors.grey[600],
                      height: 1.3,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                const SizedBox(height: 6),
                // Personalize button
                SizedBox(
                  width: double.infinity,
                  height: 30,
                  child: ElevatedButton(
                    onPressed: () => Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => ProductDetailPage(book: book),
                      ),
                    ),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Color(0xFF784D9C),
                      foregroundColor: Colors.white,
                      elevation: 0,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                      padding: EdgeInsets.zero,
                    ),
                    child: Text(
                      'شخصي',
                      style: GoogleFonts.tajawal(
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBookCard(Book book, int index) {
    final isFavorite = _favoriteIds.contains(book.id);
    final isMobile = _isMobile(context);
    final isTablet = _isTablet(context);
    final isRTL = _localizationService.textDirection == TextDirection.rtl;
    
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
        width: isMobile ? 240 : (isTablet ? 260 : 280), // Fixed widths for all screen sizes
        margin: EdgeInsets.only(
          right: isRTL ? 0 : 16,
          left: isRTL ? 16 : 0,
        ), // RTL-aware margin
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Book cover image - NO BACKGROUND
            Stack(
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(16),
                  child: Container(
                    width: double.infinity,
                    height: isMobile ? 240 : (isTablet ? 260 : 280),
                    color: book.displayImage.isEmpty ? _getBookColors()[book.hashCode % _getBookColors().length] : null,
                    child: book.displayImage.isNotEmpty
                        ? Image.network(
                            book.displayImage,
                            fit: BoxFit.cover,
                            errorBuilder: (context, error, stackTrace) {
                              return Container(
                                color: _getBookColors()[book.hashCode % _getBookColors().length],
                                child: Center(
                                  child: Icon(Icons.book, size: 60, color: Colors.white.withOpacity(0.7)),
                                ),
                              );
                            },
                          )
                        : Center(
                            child: Icon(Icons.book, size: 60, color: Colors.white.withOpacity(0.7)),
                          ),
                  ),
                ),
                // Favorite icon button
                Positioned(
                  top: 8,
                  right: _localizationService.textDirection == TextDirection.rtl ? null : 8,
                  left: _localizationService.textDirection == TextDirection.rtl ? 8 : null,
                  child: GestureDetector(
                    onTap: () => _toggleFavorite(book.id),
                    child: Container(
                      padding: const EdgeInsets.all(8),
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
                        size: 16,
                      ),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            
            // Book title - NO BACKGROUND
            Text(
              book.title.isNotEmpty ? book.title : book.name,
              style: GoogleFonts.tajawal(
                color: Color(0xFF2D2D2D),
                fontSize: 15,
                fontWeight: FontWeight.w700,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 6),
            
            // Description - NO BACKGROUND
            Text(
              book.description.isNotEmpty ? book.description : book.title,
              style: GoogleFonts.tajawal(
                fontSize: 12,
                color: Colors.grey[600],
                height: 1.4,
              ),
              maxLines: 3,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 10),
            
            // Customize button
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => ProductDetailPage(book: book),
                    ),
                  );
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor:  Color(0xFF784D9C),
                  foregroundColor: Colors.white,
                  padding: EdgeInsets.symmetric(vertical: 10),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                  elevation: 0,
                ),
                child: Text(
                  'تخصيص',
                  style: GoogleFonts.tajawal(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPopularBookGridCard(Book book) {
    final isFavorite = _favoriteIds.contains(book.id);
    
    return GestureDetector(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => ProductDetailPage(book: book),
          ),
        );
      },
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Book cover image with favorite button - NO BACKGROUND
          Expanded(
            flex: 5,
            child: Stack(
              children: [
                // Book cover
                ClipRRect(
                  borderRadius: BorderRadius.circular(16),
                  child: Container(
                    width: double.infinity,
                    height: double.infinity,
                    color: book.displayImage.isEmpty ? _getBookColors()[book.hashCode % _getBookColors().length] : null,
                    child: book.displayImage.isNotEmpty
                        ? Image.network(
                            book.displayImage,
                            fit: BoxFit.cover,
                            errorBuilder: (context, error, stackTrace) {
                              return Container(
                                color: Color(0xFFF5F5F5),
                                child: Icon(Icons.book, size: 48, color: Colors.grey[400]),
                              );
                            },
                          )
                        : Icon(Icons.book, size: 48, color: Colors.white.withOpacity(0.7)),
                  ),
                ),
                // Favorite button
                Positioned(
                  top: 8,
                  right: _localizationService.textDirection == TextDirection.rtl ? null : 8,
                  left: _localizationService.textDirection == TextDirection.rtl ? 8 : null,
                  child: GestureDetector(
                    onTap: () => _toggleFavorite(book.id),
                    child: Container(
                      padding: EdgeInsets.all(6),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.1),
                            blurRadius: 4,
                            offset: Offset(0, 2),
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
          
          // Content section - NO BACKGROUND
          const SizedBox(height: 12),
          
          Expanded(
            flex: 4,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Book title
                Text(
                  book.title.isNotEmpty ? book.title : book.name,
                  style: GoogleFonts.tajawal(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF2D2D2D),
                    height: 1.3,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                
                const SizedBox(height: 6),
                
                // Description
                Expanded(
                  child: Text(
                    book.description.isNotEmpty ? book.description : book.title,
                    style: GoogleFonts.tajawal(
                      fontSize: 12,
                      color: Colors.grey[600],
                      height: 1.4,
                    ),
                    maxLines: 3,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                
                const SizedBox(height: 8),
                
                // Customize button
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => ProductDetailPage(book: book),
                        ),
                      );
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor:  Color(0xFF784D9C),
                      foregroundColor: Colors.white,
                      padding: EdgeInsets.symmetric(vertical: 10),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                      elevation: 0,
                    ),
                    child: Text(
                      'تخصيص',
                      style: GoogleFonts.tajawal(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPlaceholderBookCover(int index) {
    final colors = _getBookColors();
    return Container(
      width: 200,
      height: 220,
      color: colors[index % colors.length],
      child: Center(
        child: Icon(Icons.book, size: 60, color: Colors.white.withOpacity(0.7)),
      ),
    );
  }

  List<Color> _getBookColors() {
    return [
      Color(0xFF6C63FF),
      Color(0xFF4ECDC4),
      Color(0xFFFF6B6B),
      Color(0xFF45B7D1),
      Color(0xFF96CEB4),
      Color(0xFFD63384),
    ];
  }

  Widget _buildAllGenresWithBooksSection() {
    if (_genreCategoriesLoading) {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 25),
        child: Center(
          child: CircularProgressIndicator(color: Color(0xFF784D9C)),
        ),
      );
    }

    if (_genreCategories.isEmpty) {
      return Padding(
        padding: const EdgeInsets.symmetric(horizontal: 25),
        child: Text(
          'home_page_no_categories'.tr,
          style: GoogleFonts.tajawal(
            fontSize: 14,
            color: Colors.grey,
          ),
        ),
      );
    }

    // Build genre sections with banner inserted after 2nd genre
    List<Widget> genreSections = [];
    int displayedGenreCount = 0;
    
    for (int i = 0; i < _genreCategories.length; i++) {
      final genre = _genreCategories[i];
      final booksInGenre = _booksByGenre[genre] ?? [];
      
      if (booksInGenre.isEmpty) continue;
      
      displayedGenreCount++;
      
      // Add genre section
      genreSections.add(
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Genre name
            Padding(
              padding: const EdgeInsets.fromLTRB(25, 5, 25, 5),
              child: Text(
                genre,
                style: GoogleFonts.tajawal(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: const Color(0xFF784D9C),
                ),
              ),
            ),
            
            const SizedBox(height: 10),
            
            // Books display
            _isMobile(context) || _isTablet(context)
                ? Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    child: GridView.builder(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: 2,
                        childAspectRatio: _isTablet(context) ? 0.65 : 0.6,
                        crossAxisSpacing: _isTablet(context) ? 12 : 16,
                        mainAxisSpacing: _isTablet(context) ? 16 : 20,
                      ),
                      itemCount: booksInGenre.length > 6 ? 6 : booksInGenre.length,
                      itemBuilder: (context, index) {
                        return _buildMobileBookCard(booksInGenre[index]);
                      },
                    ),
                  )
                : Padding(
                    padding: _getResponsivePaddingNoLeft(context),
                    child: GridView.builder(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: 4,
                        childAspectRatio: 0.6,
                        crossAxisSpacing: 16,
                        mainAxisSpacing: 20,
                      ),
                      itemCount: booksInGenre.length > 8 ? 8 : booksInGenre.length,
                      itemBuilder: (context, index) {
                        return _buildMobileBookCard(booksInGenre[index]);
                      },
                    ),
                  ),
            const SizedBox(height: 15),
          ],
        ),
      );
      
      // Insert magical princess banner after 2nd genre (desktop only)
      if (displayedGenreCount == 2 && !_isMobile(context) && !_isTablet(context)) {
        genreSections.add(
          Column(
            children: [
              const SizedBox(height: 30),
              _buildMagicalPrincessBanner(),
              const SizedBox(height: 30),
            ],
          ),
        );
      }
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Title
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 25, vertical: 0),
          child: Row(
            children: [
              Icon(
                Icons.category_outlined,
                size: 20,
                color: const Color.fromARGB(221, 0, 0, 0),
              ),
              const SizedBox(width: 8),
              Text(
                'genre category'.tr,
                style: GoogleFonts.tajawal(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: const Color.fromARGB(221, 0, 0, 0),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 10),
        
        // Genre sections with banner inserted
        if (_genreBooksLoading)
          Container(
            height: 200,
            child: Center(
              child: CircularProgressIndicator(color: Color(0xFF784D9C)),
            ),
          )
        else
          ...genreSections,
      ],
    );
  }

  Widget _buildGridBookCard(Book book) {
    final isFavorite = _favoriteIds.contains(book.id);
    
    return GestureDetector(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => ProductDetailPage(book: book),
          ),
        );
      },
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Book cover image with favorite button - NO BACKGROUND
          Expanded(
            flex: 5,
            child: Stack(
              children: [
                // Book cover
                ClipRRect(
                  borderRadius: BorderRadius.circular(16),
                  child: Container(
                    width: double.infinity,
                    height: double.infinity,
                    color: book.displayImage.isEmpty ? _getBookColors()[book.hashCode % _getBookColors().length] : null,
                    child: book.displayImage.isNotEmpty
                        ? Image.network(
                            book.displayImage,
                            fit: BoxFit.cover,
                            errorBuilder: (context, error, stackTrace) {
                              return Container(
                                color: Color(0xFFF5F5F5),
                                child: Icon(Icons.book, size: 48, color: Colors.grey[400]),
                              );
                            },
                          )
                        : Icon(Icons.book, size: 48, color: Colors.white.withOpacity(0.7)),
                  ),
                ),
                // Favorite button
                Positioned(
                  top: 8,
                  right: _localizationService.textDirection == TextDirection.rtl ? null : 8,
                  left: _localizationService.textDirection == TextDirection.rtl ? 8 : null,
                  child: GestureDetector(
                    onTap: () => _toggleFavorite(book.id),
                    child: Container(
                      padding: EdgeInsets.all(6),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.1),
                            blurRadius: 4,
                            offset: Offset(0, 2),
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
          
          // Content section - NO BACKGROUND
          const SizedBox(height: 12),
          
          Expanded(
            flex: 4,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Book title
                Text(
                  book.title.isNotEmpty ? book.title : book.name,
                  style: GoogleFonts.tajawal(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF2D2D2D),
                    height: 1.3,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                
                const SizedBox(height: 6),
                
                // Description
                Expanded(
                  child: Text(
                    book.description.isNotEmpty ? book.description : book.title,
                    style: GoogleFonts.tajawal(
                      fontSize: 12,
                      color: Colors.grey[600],
                      height: 1.4,
                    ),
                    maxLines: 3,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                
                const SizedBox(height: 8),
                
                // Customize button
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => ProductDetailPage(book: book),
                        ),
                      );
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor:  Color(0xFF784D9C),
                      foregroundColor: Colors.white,
                      padding: EdgeInsets.symmetric(vertical: 10),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                      elevation: 0,
                    ),
                    child: Text(
                      'تخصيص',
                      style: GoogleFonts.tajawal(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMainBannerSection() {
    // For mobile only, keep the original stacked layout
    if (_isMobile(context)) {
      return Container(
        width: double.infinity,
        margin: EdgeInsets.zero, // No margins for mobile
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              Color(0xFFE8D5FF), // Light purple
              Color(0xFFF3E8FF), // Lighter purple
              Color(0xFFE8D5FF), // Light purple
            ],
            stops: [0.0, 0.5, 1.0],
          ),
          borderRadius: BorderRadius.zero, // No border radius for edge-to-edge
        ),
        child: Column(
          children: [
            // Banner Image at the top
            Container(
              width: double.infinity,
              height: 200,
              child: ClipRRect(
                borderRadius: BorderRadius.zero,
                child: Image.asset(
                  'assets/a1.png',
                  fit: BoxFit.cover,
                  errorBuilder: (context, error, stackTrace) {
                    return Container(
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                          colors: [Color(0xFF784D9C), Color(0xFFB39DDB)],
                        ),
                      ),
                      child: Center(
                        child: Icon(Icons.image, size: 80, color: Colors.white70),
                      ),
                    );
                  },
                ),
              ),
            ),
            
            // Text Content with background
            Padding(
              padding: EdgeInsets.all(30),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Upper label
                  Text(
                    'bring_your_unique_storybook_to_life'.tr.toUpperCase(),
                    textAlign: TextAlign.start,
                    style: GoogleFonts.tajawal(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      color: Color(0xFF784D9C),
                      letterSpacing: 1.5,
                    ),
                  ),
                  
                  const SizedBox(height: 16),
                  
                  // Main heading
                  Text(
                    'craft_magical_tales_where_youre_the_hero'.tr,
                    textAlign: TextAlign.start,
                    style: GoogleFonts.tajawal(
                      fontSize: 28,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF2D1B69),
                      height: 1.2,
                    ),
                  ),
                  
                  const SizedBox(height: 30),
                  
                  // View All Books Button
                  Align(
                    alignment: _localizationService.textDirection == TextDirection.rtl
                        ? Alignment.centerRight
                        : Alignment.centerLeft,
                    child: SizedBox(
                      width: 160,
                      height: 45,
                      child: ElevatedButton(
                        onPressed: () {
                          // Navigate to books tab (index 1)
                          MainNavigation.switchTab(context, 1);
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.white,
                          foregroundColor: Color(0xFF784D9C),
                          elevation: 2,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(8),
                            side: BorderSide(color: Color(0xFF784D9C), width: 2),
                          ),
                          padding: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                        ),
                        child: Text(
                          'view_all_books'.tr,
                          style: GoogleFonts.tajawal(
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                          ),
                          overflow: TextOverflow.visible,
                          textAlign: TextAlign.center,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      );
    }

    // For tablet and desktop - side by side layout (edge to edge)
    return Container(
      width: double.infinity,
      height: _isTablet(context) ? 400 : 500, // Responsive height
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            Color(0xFFE8D5FF), // Light purple
            Color(0xFFF3E8FF), // Lighter purple
            Color(0xFFE8D5FF), // Light purple
          ],
          stops: [0.0, 0.5, 1.0],
        ),
      ),
      child: Row(
        children: [
          // Left side - Image (50% width)
          Expanded(
            flex: 1,
            child: Container(
              height: double.infinity,
              child: Image.asset(
                'assets/a1.png',
                fit: BoxFit.cover,
                errorBuilder: (context, error, stackTrace) {
                  return Container(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                        colors: [Color(0xFF784D9C), Color(0xFFB39DDB)],
                      ),
                    ),
                    child: Center(
                      child: Icon(Icons.image, size: 100, color: Colors.white70),
                    ),
                  );
                },
              ),
            ),
          ),
          
          // Right side - Text content (50% width)
          Expanded(
            flex: 1,
            child: Padding(
              padding: EdgeInsets.symmetric(
                horizontal: _isTablet(context) ? 40 : 80, 
                vertical: _isTablet(context) ? 40 : 60,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  // Upper label
                  Text(
                    'bring_your_unique_storybook_to_life'.tr.toUpperCase(),
                    textAlign: TextAlign.start,
                    style: GoogleFonts.tajawal(
                      fontSize: _isTablet(context) ? 16 : 18,
                      fontWeight: FontWeight.w600,
                      color: Color(0xFF784D9C),
                      letterSpacing: 1.5,
                    ),
                  ),
                  
                  SizedBox(height: _isTablet(context) ? 16 : 20),
                  
                  // Main heading
                  Text(
                    'craft_magical_tales_where_youre_the_hero'.tr,
                    textAlign: TextAlign.start,
                    style: GoogleFonts.tajawal(
                      fontSize: _isTablet(context) ? 32 : 48,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF2D1B69),
                      height: 1.2,
                    ),
                  ),
                  
                  SizedBox(height: _isTablet(context) ? 30 : 40),
                  
                  // View All Books Button
                  Align(
                    alignment: _localizationService.textDirection == TextDirection.rtl
                        ? Alignment.centerRight
                        : Alignment.centerLeft,
                    child: SizedBox(
                      width: _isTablet(context) ? 180 : 200,
                      height: _isTablet(context) ? 45 : 50,
                      child: ElevatedButton(
                        onPressed: () {
                          // Navigate to books tab (index 1)
                          MainNavigation.switchTab(context, 1);
                        },
                        style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.white,
                        foregroundColor: Color(0xFF784D9C),
                        elevation: 2,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
                          side: BorderSide(color: Color(0xFF784D9C), width: 2),
                        ),
                        padding: EdgeInsets.symmetric(
                          horizontal: _isTablet(context) ? 16 : 20, 
                          vertical: _isTablet(context) ? 8 : 12,
                        ),
                      ),
                      child: Text(
                        'view_all_books'.tr,
                        style: GoogleFonts.tajawal(
                          fontSize: _isTablet(context) ? 14 : 16,
                          fontWeight: FontWeight.w600,
                        ),
                        textAlign: TextAlign.center,
                      ),
                    ),
                  ),
                ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBestsellersSection() {
    return Padding(
      padding: EdgeInsets.symmetric(horizontal: _isMobile(context) ? 20 : (_isTablet(context) ? 40 : 30)), // Reduced desktop padding
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // BESTSELLERS label
          Text(
            'bestsellers'.tr.toUpperCase(),
            style: GoogleFonts.tajawal(
              fontSize: 18,
              fontWeight: FontWeight.w600,
              color: Colors.grey[600],
              letterSpacing: 1.5,
            ),
          ),
          
          const SizedBox(height: 8),
          
          // Section header with title and View All button
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Expanded(
                child: Text(
                  'personalise_a_bestseller'.tr,
                  style: GoogleFonts.tajawal(
                    fontSize: _isMobile(context) ? 28 : (_isTablet(context) ? 32 : 36),
                    fontWeight: FontWeight.bold,
                    color: Colors.black87,
                    height: 1.2,
                  ),
                ),
              ),
              
              // View All button with proper styling
              Container(
                height: 40,
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                decoration: BoxDecoration(
                  color: Color(0xFF784D9C), // Purple background
                  borderRadius: BorderRadius.circular(8),
                ),
                child: InkWell(
                  onTap: () {
                    // Navigate to books tab (index 1)
                    MainNavigation.switchTab(context, 1);
                  },
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        'view_all'.tr,
                        style: GoogleFonts.tajawal(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: Colors.white,
                        ),
                      ),
                      const SizedBox(width: 6),
                      Icon(
                        _localizationService.textDirection == TextDirection.rtl 
                            ? Icons.arrow_back_ios
                            : Icons.arrow_forward_ios,
                        size: 14,
                        color: Colors.white,
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
          
          const SizedBox(height: 5),
          
          // Books Grid
          _buildBestsellersBooksGrid(),
        ],
      ),
    );
  }

  Widget _buildBestsellersBooksGrid() {
    if (_featuredBooks.isEmpty) {
      return Container(
        height: 200,
        child: Center(
          child: Text(
            'no_books_available'.tr,
            style: GoogleFonts.tajawal(
              fontSize: 16,
              color: Colors.grey[600],
            ),
          ),
        ),
      );
    }

    // Mobile and Tablet: Grid layout with 2 columns
    if (_isMobile(context) || _isTablet(context)) {
      return GridView.builder(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          childAspectRatio: _isTablet(context) ? 0.65 : 0.55,
          crossAxisSpacing: _isTablet(context) ? 12 : 12, // Reduced spacing for tablet
          mainAxisSpacing: _isTablet(context) ? 16 : 16, // Reduced spacing for tablet
        ),
        itemCount: _featuredBooks.take(8).length,
        itemBuilder: (context, index) {
          return _buildMobileBookCard(_featuredBooks[index]);
        },
      );
    }

    // Desktop: Grid layout with 4 columns (no horizontal scrolling)
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 4,
        childAspectRatio: 0.6,
        crossAxisSpacing: 16,
        mainAxisSpacing: 20,
      ),
      itemCount: _featuredBooks.take(8).length,
      itemBuilder: (context, index) {
        return _buildMobileBookCard(_featuredBooks[index]);
      },
    );
  }

  Widget _buildBestsellerBookCard(Book book) {
    final isFavorite = _favoriteIds.contains(book.id);
    
    return GestureDetector(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => ProductDetailPage(book: book),
          ),
        );
      },
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Book cover with discount badge and favorite button - NO BACKGROUND
          Expanded(
            flex: 5,
            child: Stack(
              children: [
                // Book cover image
                ClipRRect(
                  borderRadius: BorderRadius.circular(16),
                  child: Container(
                    width: double.infinity,
                    height: double.infinity,
                    color: book.coverImageUrl.isEmpty ? Color(0xFFF5F5F5) : null,
                    child: book.coverImageUrl.isNotEmpty
                        ? Image.network(
                            book.coverImageUrl,
                            fit: BoxFit.cover,
                            errorBuilder: (context, error, stackTrace) {
                              return Container(
                                color: Color(0xFFF5F5F5),
                                child: Icon(Icons.book, size: 48, color: Colors.grey[400]),
                              );
                            },
                          )
                        : Icon(Icons.book, size: 48, color: Colors.grey[400]),
                  ),
                ),
                
                // Discount badge
                if (book.discountPercentage > 0)
                  Positioned(
                    top: 8,
                    left: _localizationService.textDirection == TextDirection.rtl ? null : 8,
                    right: _localizationService.textDirection == TextDirection.rtl ? 8 : null,
                    child: Container(
                      padding: EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.green,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        '-${book.discountPercentage.toInt()}%',
                        style: GoogleFonts.tajawal(
                          color: Colors.white,
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
                
                // Favorite button
                Positioned(
                  top: 8,
                  right: _localizationService.textDirection == TextDirection.rtl ? null : 8,
                  left: _localizationService.textDirection == TextDirection.rtl ? 8 : null,
                  child: GestureDetector(
                    onTap: () => _toggleFavorite(book.id),
                    child: Container(
                      padding: EdgeInsets.all(6),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.1),
                            blurRadius: 4,
                            offset: Offset(0, 2),
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
          
          // Content section - NO BACKGROUND
          const SizedBox(height: 12),
          
          Expanded(
            flex: 4,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Book title
                Text(
                  book.title.isNotEmpty ? book.title : book.name,
                  style: GoogleFonts.tajawal(
                    fontSize: _isMobile(context) ? 14 : (_isTablet(context) ? 15 : 16),
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF2D2D2D),
                    height: 1.3,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                
                const SizedBox(height: 6),
                
                // Book description
                Expanded(
                  child: Text(
                    book.description.isNotEmpty ? book.description : book.title,
                    style: GoogleFonts.tajawal(
                      fontSize: _isMobile(context) ? 11 : (_isTablet(context) ? 12 : 13),
                      color: Colors.grey[600],
                      height: 1.4,
                    ),
                    maxLines: 3,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                
                const SizedBox(height: 8),
                
                // Customize button
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => ProductDetailPage(book: book),
                        ),
                      );
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Color(0xFF784D9C),
                      foregroundColor: Colors.white,
                      padding: EdgeInsets.symmetric(vertical: _isMobile(context) ? 8 : (_isTablet(context) ? 9 : 10)),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                      elevation: 0,
                    ),
                    child: Text(
                      'تخصيص',
                      style: GoogleFonts.tajawal(
                        fontSize: _isMobile(context) ? 12 : (_isTablet(context) ? 13 : 14),
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

}
