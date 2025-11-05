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
  return EdgeInsets.symmetric(horizontal: padding > 20 ? padding : 20);
}

EdgeInsets _getResponsivePaddingNoLeft(BuildContext context) {
  if (_isMobile(context)) return const EdgeInsets.symmetric(horizontal: 20);
  if (_isTablet(context)) return const EdgeInsets.only(left: 0, right: 40);
  final width = MediaQuery.of(context).size.width;
  final padding = (width - 1200) / 2;
  return EdgeInsets.only(left: 0, right: padding > 20 ? padding : 20);
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
  bool _isLoading = true;
  bool _categoriesLoading = true;
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
      print('Starting video initialization...');
      final controller = VideoPlayerController.asset('assets/vd.mp4');
      _videoController = controller;
      print('VideoController created');
      
      await controller.initialize();
      print('Video initialized successfully');
      
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
        print('Video is now playing');
      }
    } catch (error) {
      print('Error initializing video: $error');
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
      List<Book> books;

      if (_selectedCategory == 'all') {
        books = await _bookService.getFeaturedBooks(limit: 6);
      } else if (_selectedCategory == 'boy' || _selectedCategory == 'girl') {
        books = await _bookService.getBooksByGender(
          _selectedCategory,
          limit: 6,
        );
      } else {
        books = await _bookService.getBooksByCategory(
          _selectedCategory,
          limit: 6,
        );
      }

      setState(() {
        _featuredBooks = books;
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _loadCategories() async {
    try {
      final categories = await _bookService.getCategories();
      final validCategories = categories
          .where(
            (c) =>
                c.toLowerCase() == 'boy' ||
                c.toLowerCase() == 'girl' ||
                c.toLowerCase() == 'fiction' ||
                c.toLowerCase() == 'fantasy' ||
                c.toLowerCase() == 'mystery',
          )
          .map((c) => c.toLowerCase())
          .toList();

      final allCategories = ['all', ...validCategories];
      setState(() {
        _categories = allCategories;
        _categoriesLoading = false;
      });
    } catch (e) {
      setState(() {
        _categoriesLoading = false;
        _categories = ['all', 'boy', 'girl'];
      });
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
      print('Error loading genre categories: $e');
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
      final allBooks = await _bookService.getAllBooks();
      final Map<String, List<Book>> genreBooks = {};
      
      for (String genre in _genreCategories) {
        var booksInGenre = allBooks.where((book) => book.genre == genre);
        
        // Apply gender filter based on selected category
        if (_selectedCategory == 'boy' || _selectedCategory == 'girl') {
          booksInGenre = booksInGenre.where((book) {
            final bookGender = book.genderTarget.toLowerCase();
            final selectedGender = _selectedCategory.toLowerCase();
            
            // Show book if it matches selected gender or is for 'all' genders
            return bookGender == selectedGender || 
                   bookGender == 'all' || 
                   bookGender == 'any' || 
                   bookGender == 'both' ||
                   bookGender.isEmpty;
          });
        }
        
        final filteredBooks = booksInGenre.take(6).toList();
        if (filteredBooks.isNotEmpty) {
          genreBooks[genre] = filteredBooks;
        }
      }
      
      setState(() {
        _booksByGenre = genreBooks;
        _genreBooksLoading = false;
      });
    } catch (e) {
      print('Error loading books for genres: $e');
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
                                      style: TextStyle(fontSize: _isMobile(context) ? 24 : 32),
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

                    const SizedBox(height: 20),
                  ],
                ),
              ),
            ),
            
            // Edge-to-Edge Image Section (Web Only) - Right after age cards
            if (!_isMobile(context))
              Container(
                width: double.infinity,
                padding: EdgeInsets.symmetric(
                  horizontal: _isTablet(context) ? 40.0 : 60.0,
                  vertical: 30.0,
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(24),
                  child: Container(
                    height: _isTablet(context) ? 600.0 : 800.0,
                    child: Image.asset(
                      'assets/a2.png', // You can change this to any image from your assets
                      fit: BoxFit.cover,
                      errorBuilder: (context, error, stackTrace) {
                        return Container(
                          color: Colors.grey[300],
                          child: Center(
                            child: Icon(Icons.image, size: 100, color: Colors.grey[600]),
                          ),
                        );
                      },
                    ),
                  ),
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

                    // Popular Places Section
                    _buildPopularPlacesSection(),

                    const SizedBox(height: 30),
                  ],
                ),
              ),
            ),
            
            // Edge-to-Edge Image Section (Web/Tablet Only)
            if (!_isMobile(context))
              Container(
                width: double.infinity,
                height: _isTablet(context) ? 400.0 : 500.0,
                child: Image.asset(
                  'assets/a3.png', // You can change this to any image from your assets
                  fit: BoxFit.cover,
                  errorBuilder: (context, error, stackTrace) {
                    return Container(
                      color: Colors.grey[300],
                      child: Center(
                        child: Icon(Icons.image, size: 100, color: Colors.grey[600]),
                      ),
                    );
                  },
                ),
              ),
            
            // Genre Categories with magical princess banner - dynamically built
            ..._buildGenreWithBannerSections(),
            
            // Edge-to-Edge Image Section (Web Only) - Above review carousel
            if (!_isMobile(context))
              Container(
                width: double.infinity,
                height: _isTablet(context) ? 400.0 : 700.0,
                child: Image.asset(
                  'assets/a1.png', // You can change this to any image from your assets
                  fit: BoxFit.cover,
                  errorBuilder: (context, error, stackTrace) {
                    return Container(
                      color: Colors.grey[300],
                      child: Center(
                        child: Icon(Icons.image, size: 100, color: Colors.grey[600]),
                      ),
                    );
                  },
                ),
              ),
            
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
                                        style: GoogleFonts.poppins(
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
                                      style: GoogleFonts.poppins(
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
    final bannerHeight = _isTablet(context) ? 400.0 : 500.0;
    
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
                
                // Books horizontal scroll
                Container(
                  height: _isMobile(context) ? 380 : (_isTablet(context) ? 420 : 450),
                  child: _isMobile(context)
                      ? ListView.builder(
                          scrollDirection: Axis.horizontal,
                          padding: const EdgeInsets.symmetric(horizontal: 20),
                          itemCount: booksInGenre.length > 8 ? 8 : booksInGenre.length,
                          itemBuilder: (context, index) {
                            return _buildBookCard(booksInGenre[index], index);
                          },
                        )
                      : ScrollConfiguration(
                          behavior: ScrollConfiguration.of(context).copyWith(
                            dragDevices: {
                              PointerDeviceKind.touch,
                              PointerDeviceKind.mouse,
                            },
                            scrollbars: false,
                          ),
                          child: ListView.builder(
                            scrollDirection: Axis.horizontal,
                            padding: _getResponsivePaddingNoLeft(context),
                            itemCount: booksInGenre.length > 8 ? 8 : booksInGenre.length,
                            physics: const BouncingScrollPhysics(),
                            itemBuilder: (context, index) {
                              return _buildBookCard(booksInGenre[index], index);
                            },
                          ),
                        ),
                ),
                const SizedBox(height: 15),
              ],
            ),
          ),
        ),
      );
      
      // Insert magical princess banner after 2nd genre (web only) - EDGE TO EDGE
      if (displayedGenreCount == 2 && !_isMobile(context)) {
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
                  print('Menu tapped');
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
                  print('Cart tapped');
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
            Text(
              'home_page_categories'.tr,
              style: GoogleFonts.tajawal(
                fontSize: 22,
                fontWeight: FontWeight.bold,
                color: const Color.fromARGB(221, 0, 0, 0),
              ),
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

    // Show Boy and Girl categories as small buttons next to title
    final displayCategories = _categories.where((c) => c == 'boy' || c == 'girl').toList();
    
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
            children: displayCategories.map((category) {
              final isSelected = category == _selectedCategory;
              return Container(
                margin: const EdgeInsets.only(left: 8),
                child: GestureDetector(
                  onTap: () async {
                    setState(() {
                      _selectedCategory = category;
                    });
                    await UserPreferenceService.setSelectedCategory(category);
                    _loadFeaturedBooks();
                    _loadBooksForAllGenres(); // Reload genre books with new filter
                  },
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                    decoration: BoxDecoration(
                      gradient: isSelected
                          ? LinearGradient(
                              begin: Alignment.topLeft,
                              end: Alignment.bottomRight,
                              colors: [Color(0xFF784D9C), Color(0xFF784D9C)],
                            )
                          : null,
                      color: isSelected ? null : Colors.white,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                        color: isSelected
                            ? Colors.transparent
                            : Color.fromARGB(255, 200, 200, 200),
                        width: 1.5,
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.08),
                          blurRadius: 4,
                          offset: Offset(0, 2),
                        ),
                      ],
                    ),
                    child: Text(
                      category.tr,
                      style: GoogleFonts.tajawal(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: isSelected ? Colors.white : Color.fromARGB(255, 100, 100, 100),
                      ),
                    ),
                  ),
                ),
              );
            }).toList(),
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
                print('🎯 Age card tapped: ${ageRanges[index]}');
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
                        style: GoogleFonts.poppins(
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
          crossAxisCount: _isTablet(context) ? 3 : 4,
          childAspectRatio: 0.85,
          crossAxisSpacing: 16,
          mainAxisSpacing: 16,
        ),
        itemCount: ageRanges.length,
        itemBuilder: (context, index) {
          return GestureDetector(
            onTap: () {
              print('🎯 Age card tapped: ${ageRanges[index]}');
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
                      style: GoogleFonts.poppins(
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
              child: CircularProgressIndicator(color: Color(0xFF6C63FF)),
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
                style: GoogleFonts.poppins(
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
                style: GoogleFonts.poppins(
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
    final booksToShow = _featuredBooks.isNotEmpty
        ? _featuredBooks
        : _getDummyBooks();

    if (booksToShow.isEmpty) {
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

    // Mobile: horizontal scroll (unchanged)
    if (_isMobile(context)) {
      return Container(
        height: 380,
        child: ListView.builder(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.symmetric(horizontal: 20),
          itemCount: booksToShow.length,
          itemBuilder: (context, index) {
            return _buildBookCard(booksToShow[index], index);
          },
        ),
      );
    }

    // Tablet/Desktop: Grid layout
    return Padding(
      padding: _getResponsivePaddingNoLeft(context),
      child: GridView.builder(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: _isTablet(context) ? 3 : 4,
          childAspectRatio: _isTablet(context) ? 0.95 : 0.9,
          crossAxisSpacing: 16,
          mainAxisSpacing: 20,
        ),
        itemCount: booksToShow.length,
        itemBuilder: (context, index) {
          return _buildPopularBookGridCard(booksToShow[index]);
        },
      ),
    );
  }

  Widget _buildBookCard(Book book, int index) {
    final isFavorite = _favoriteIds.contains(book.id);
    final isMobile = _isMobile(context);
    final isTablet = _isTablet(context);
    
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
        width: isMobile ? 300 : (isTablet ? 320 : 350), // Fixed widths for all screen sizes
        margin: EdgeInsets.only(right: 16), // Right margin for all
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Book cover image
            Stack(
              children: [
                Container(
                  width: isMobile ? 300 : (isTablet ? 320 : 350),
                  height: isMobile ? 300 : (isTablet ? 320 : 350),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(16),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.15),
                        blurRadius: 12,
                        offset: Offset(0, 4),
                      ),
                    ],
                  ),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(16),
                    child: Container(
                      width: isMobile ? 250 : double.infinity,
                      height: isMobile ? 250 : null,
                      color: _getBookColors()[book.hashCode % _getBookColors().length],
                      child: book.displayImage.isNotEmpty
                          ? Image.network(
                              book.displayImage,
                              fit: BoxFit.cover,
                              width: 250,
                              height: 220,
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
            // Book title
            Text(
              book.title.isNotEmpty
                  ? book.title
                  : _getDummyTitles()[book.hashCode % _getDummyTitles().length],
              style: GoogleFonts.tajawal(
                color: Colors.black87,
                fontSize: 15,
                fontWeight: FontWeight.w600,
              ),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 4),
            // Location
            // Row(
            //   children: [
            //     Icon(
            //       Icons.location_on,
            //       size: 14,
            //       color: Colors.grey.shade600,
            //     ),
            //     const SizedBox(width: 4),
            //     Text(
            //       'London, UK',
            //       style: GoogleFonts.tajawal(
            //         fontSize: 12,
            //         color: Colors.grey.shade600,
            //       ),
            //     ),
            //   ],
            // ),
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
          // Book cover image
          Expanded(
            child: Stack(
              children: [
                Container(
                  width: double.infinity,
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
                      color: _getBookColors()[book.hashCode % _getBookColors().length],
                      child: book.displayImage.isNotEmpty
                          ? Image.network(
                              book.displayImage,
                              fit: BoxFit.cover,
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
          ),
          const SizedBox(height: 12),
          // Book title
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 4),
            child: Text(
              book.title.isNotEmpty ? book.title : book.name,
              style: GoogleFonts.tajawal(
                color: Colors.black87,
                fontSize: 15,
                fontWeight: FontWeight.w600,
              ),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
          ),
          const SizedBox(height: 4),
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

  List<Book> _getDummyBooks() {
    return List.generate(
      6,
      (index) => Book(
        id: 'dummy-$index',
        name: _getDummyTitles()[index % _getDummyTitles().length],
        description:
            _getDummyDescriptions()[index % _getDummyDescriptions().length],
        price: 19.99,
        discountPercentage: 0,
        ageMin: 3,
        ageMax: 8,
        genderTarget: 'all',
        coverImageUrl: '',
        previewImages: [],
        images: [],
        videos: [],
        availableLanguages: ['English'],
        isFeatured: true,
        isBestseller: false,
        isActive: true,
        stockQuantity: 10,
        characters: [], // Required field - empty array for dummy books
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
        level: 1,
        path: '1',
        sortOrder: index,
      ),
    );
  }

  List<String> _getDummyTitles() {
    return [
      'The Book Cellar',
      'Shakespeare and Company',
      'Atlantis Books',
      'Libreria Acqua Alta',
      'El Ateneo Grand Splendid',
      'Livraria Lello',
    ];
  }

  List<String> _getDummyDescriptions() {
    return [
      'An enchanting bookstore filled with literary treasures',
      'Historic bookshop in the heart of Paris',
      'A charming bookstore on a Greek island',
      'Venice\'s most beautiful floating bookshop',
      'A stunning theatre converted into a bookstore',
      'One of the world\'s most beautiful bookstores',
    ];
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
            
            // Books horizontal scroll
            Container(
              height: _isMobile(context) ? 380 : (_isTablet(context) ? 420 : 450),
              child: _isMobile(context)
                  ? ListView.builder(
                      scrollDirection: Axis.horizontal,
                      padding: const EdgeInsets.symmetric(horizontal: 20),
                      itemCount: booksInGenre.length > 8 ? 8 : booksInGenre.length,
                      itemBuilder: (context, index) {
                        return _buildBookCard(booksInGenre[index], index);
                      },
                    )
                  : ScrollConfiguration(
                      behavior: ScrollConfiguration.of(context).copyWith(
                        dragDevices: {
                          PointerDeviceKind.touch,
                          PointerDeviceKind.mouse,
                        },
                        scrollbars: false,
                      ),
                      child: ListView.builder(
                        scrollDirection: Axis.horizontal,
                        padding: _getResponsivePaddingNoLeft(context),
                        itemCount: booksInGenre.length > 8 ? 8 : booksInGenre.length,
                        physics: const BouncingScrollPhysics(),
                        itemBuilder: (context, index) {
                          return _buildBookCard(booksInGenre[index], index);
                        },
                      ),
                    ),
            ),
            const SizedBox(height: 15),
          ],
        ),
      );
      
      // Insert magical princess banner after 2nd genre (web only)
      if (displayedGenreCount == 2 && !_isMobile(context)) {
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
                              errorBuilder: (context, error, stackTrace) {
                                return Center(
                                  child: Icon(
                                    Icons.book,
                                    size: 50,
                                    color: Colors.white.withOpacity(0.7),
                                  ),
                                );
                              },
                            )
                          : Center(
                              child: Icon(
                                Icons.book,
                                size: 50,
                                color: Colors.white.withOpacity(0.7),
                              ),
                            ),
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
                        size: 22,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 4),
          // Book title
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 4),
            child: Text(
              book.title.isNotEmpty ? book.title : book.name,
              style: GoogleFonts.tajawal(
                color: Colors.black87,
                fontSize: 13,
                fontWeight: FontWeight.w600,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
          const SizedBox(height: 4),
        ],
      ),
    );
  }

  // Helper methods for responsive design
  bool _isMobile(BuildContext context) {
    return MediaQuery.of(context).size.width < 600;
  }

  bool _isTablet(BuildContext context) {
    return MediaQuery.of(context).size.width >= 600 && MediaQuery.of(context).size.width < 1024;
  }

  double _getMaxWidth(BuildContext context) {
    if (_isMobile(context)) {
      return double.infinity;
    } else if (_isTablet(context)) {
      return 1024;
    } else {
      return 1440; // Desktop max width
    }
  }

  EdgeInsets _getResponsivePaddingNoLeft(BuildContext context) {
    if (_isMobile(context)) {
      return const EdgeInsets.symmetric(horizontal: 20);
    } else if (_isTablet(context)) {
      return const EdgeInsets.symmetric(horizontal: 40);
    } else {
      return const EdgeInsets.symmetric(horizontal: 40);
    }
  }
}
