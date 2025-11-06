import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:video_player/video_player.dart';
import '../models/book.dart';
import '../services/book_service.dart';
import '../services/user_preference_service.dart';
import '../services/favorite_service.dart';
import '../services/localization_service.dart';
import '../utils/notification_helper.dart';
import 'product_detail_page.dart';
import '../widgets/app_footer.dart';

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
  return EdgeInsets.symmetric(horizontal: padding > 40 ? padding : 40);
}

int _getGridColumns(BuildContext context) {
  if (_isMobile(context)) return 2;
  if (_isTablet(context)) return 3;
  return 4;
}

class BooksPage extends StatefulWidget {
  final String? initialAgeFilter;
  
  const BooksPage({Key? key, this.initialAgeFilter}) : super(key: key);

  @override
  State<BooksPage> createState() => _BooksPageState();
}

class _BooksPageState extends State<BooksPage> {
  final BookService _bookService = BookService();
  final LocalizationService _localizationService = LocalizationService();
  List<Book> _books = [];
  List<Book> _filteredBooks = [];
  bool _isLoading = true;
  VideoPlayerController? _videoController;
  bool _isVideoInitialized = false;
  Set<String> _favoriteIds = {};
  
  // Filter states
  String? _selectedGender;
  String? _selectedAge;
  String? _selectedCategory; // Genre/Category filter
  
  // All available age ranges - predefined to show all options
  final List<String> _ageRanges = [
    '0-2',
    '3-5',
    '6-8',
    '9-12',
    '13+',
    // 'All ages'
  ];

  // Available categories/genres from backend
  List<String> _categories = [];

  @override
  void initState() {
    super.initState();
    
    // Set initial age filter FIRST before loading anything
    if (widget.initialAgeFilter != null) {
      _selectedAge = widget.initialAgeFilter;
    }
    
    _initializeVideo();
    _loadUserPreferencesAndBooks();
    _loadFavorites();
    _loadCategories(); // Load categories from backend
  }

  Future<void> _loadFavorites() async {
    final favorites = await FavoriteService.getFavoriteBookIds();
    setState(() {
      _favoriteIds = favorites;
    });
  }

  Future<void> _loadCategories() async {
    try {
      final genres = await _bookService.getGenres();
      setState(() {
        _categories = genres;
      });
    } catch (e) {
      print('Error loading categories: $e');
      // Keep empty list if error
    }
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
        controller.play();
        controller.setLooping(true);
        controller.setVolume(0); // Mute the video
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
    _videoController?.dispose();
    super.dispose();
  }

  Future<void> _loadUserPreferencesAndBooks() async {
    try {
      final selectedCategory = await UserPreferenceService.getSelectedCategoryWithFallback();
      // Pre-set the gender filter based on selected category
      if (selectedCategory == 'girl') {
        setState(() {
          _selectedGender = 'Girl';
        });
      } else if (selectedCategory == 'boy') {
        setState(() {
          _selectedGender = 'Boy';
        });
      }
      _loadBooks();
    } catch (e) {
      _loadBooks();
    }
  }

  Future<void> _loadBooks() async {
    try {
      final books = await _bookService.getAllBooks();
      setState(() {
        _books = books;
        _filteredBooks = books;
        _isLoading = false;
      });
      // Apply initial filters based on category preference
      _applyFilters();
    } catch (e) {
      setState(() => _isLoading = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('${'books_page_error_loading'.tr}$e')),
      );
    }
  }

  void _applyFilters() {
    setState(() {
      _filteredBooks = _books.where((book) {
        // Gender filter - improved to handle Supabase 'category' field
        if (_selectedGender != null && _selectedGender!.isNotEmpty) {
          final bookGender = book.genderTarget.toLowerCase().trim();
          final selectedGender = _selectedGender!.toLowerCase().trim();
          
          // Show book if:
          // 1. It matches the selected gender (girl/boy)
          // 2. OR book is marked as 'all', 'any', or 'both'
          // 3. OR book category is empty (show all when no specific category)
          if (bookGender.isNotEmpty && 
              bookGender != selectedGender && 
              bookGender != 'all' && 
              bookGender != 'any' &&
              bookGender != 'both') {
            return false;
          }
        }

        // Age filter
        if (_selectedAge != null && _selectedAge!.isNotEmpty && _selectedAge != 'All ages') {
          // Parse selected age range (e.g., "3-5" -> minAge: 3, maxAge: 5)
          int selectedMinAge = 0;
          int selectedMaxAge = 100;
          
          if (_selectedAge!.contains('+')) {
            // Handle "13+" format
            selectedMinAge = int.tryParse(_selectedAge!.replaceAll('+', '').trim()) ?? 0;
            selectedMaxAge = 100;
          } else if (_selectedAge!.contains('-')) {
            // Handle "0-2", "3-5", etc. format
            List<String> parts = _selectedAge!.split('-');
            selectedMinAge = int.tryParse(parts[0].trim()) ?? 0;
            selectedMaxAge = int.tryParse(parts[1].trim()) ?? 100;
          }

          // Debug print
          print('🎯 Selected age filter: $_selectedAge -> Min: $selectedMinAge, Max: $selectedMaxAge');

          bool ageMatches = false;

          // Try to extract numeric ages from the book's age_range field (supports Arabic and English)
          if (book.ageRange != null && book.ageRange!.isNotEmpty) {
            print('📖 Book: ${book.title}, ageRange field: "${book.ageRange}"');
            
            // Convert Arabic numerals to English numerals and extract numbers
            String normalizedAgeRange = book.ageRange!
                .replaceAll('٠', '0').replaceAll('١', '1').replaceAll('٢', '2')
                .replaceAll('٣', '3').replaceAll('٤', '4').replaceAll('٥', '5')
                .replaceAll('٦', '6').replaceAll('٧', '7').replaceAll('٨', '8')
                .replaceAll('٩', '9');
            
            print('📝 Normalized age range: "$normalizedAgeRange"');
            
            // Extract numbers from normalized text
            RegExp numberRegex = RegExp(r'\d+');
            List<String> numbers = numberRegex.allMatches(normalizedAgeRange).map((m) => m.group(0)!).toList();
            
            print('🔢 Extracted numbers: $numbers');
            
            if (numbers.length >= 2) {
              // If we found at least 2 numbers, assume they are min and max ages
              int bookMinAge = int.tryParse(numbers[0]) ?? 0;
              int bookMaxAge = int.tryParse(numbers[1]) ?? 100;
              
              print('📊 Extracted from ageRange: Min: $bookMinAge, Max: $bookMaxAge');
              
              // Check if the book's age range matches exactly with the selected range
              if (bookMinAge == selectedMinAge && bookMaxAge == selectedMaxAge) {
                ageMatches = true;
                print('✅ Exact age range match');
              } else {
                print('❌ Age range mismatch: Book($bookMinAge-$bookMaxAge) vs Selected($selectedMinAge-$selectedMaxAge)');
              }
            } else if (numbers.length == 1) {
              // Single number in age range, check if it falls within selected range
              int bookAge = int.tryParse(numbers[0]) ?? 0;
              if (bookAge >= selectedMinAge && bookAge <= selectedMaxAge) {
                ageMatches = true;
                print('✅ Single age $bookAge falls within selected range');
              } else {
                print('❌ Single age $bookAge outside selected range');
              }
            } else {
              print('⚠️ No numbers found in age range, trying fallback');
            }
          }
          
          // If no match from ageRange field, try numeric age_min and age_max fields
          if (!ageMatches) {
            print('🔄 Trying fallback with ageMin: ${book.ageMin}, ageMax: ${book.ageMax}');
            
            // Check if book's numeric age range matches selected range
            if (book.ageMin == selectedMinAge && book.ageMax == selectedMaxAge) {
              ageMatches = true;
              print('✅ Fallback exact match');
            } else if (selectedMinAge <= book.ageMin && book.ageMax <= selectedMaxAge) {
              // Book's range is within selected range
              ageMatches = true;
              print('✅ Book range within selected range');
            } else {
              print('❌ Fallback mismatch: Book(${book.ageMin}-${book.ageMax}) vs Selected($selectedMinAge-$selectedMaxAge)');
            }
          }
          
          if (!ageMatches) {
            print('🚫 Book filtered out: ${book.title}');
            return false;
          } else {
            print('✅ Book passed age filter: ${book.title}');
          }
        }

        // Category/Genre filter
        if (_selectedCategory != null && _selectedCategory!.isNotEmpty) {
          if (book.genre == null || book.genre != _selectedCategory) {
            return false;
          }
        }

        return true;
      }).toList();
      
      // Debug: Print filter results
      print('======= FILTER APPLIED =======');
      print('Gender: $_selectedGender, Age: $_selectedAge, Category: $_selectedCategory');
      print('Total books: ${_books.length}, Filtered books: ${_filteredBooks.length}');
      if (_filteredBooks.isNotEmpty) {
        print('Sample filtered books:');
        _filteredBooks.take(3).forEach((b) {
          print('  - ${b.title} (Age: ${b.ageMin}-${b.ageMax}, Gender: ${b.genderTarget})');
        });
      } else {
        print('No books matched the filters');
        if (_selectedAge != null) {
          print('Sample of all books age ranges:');
          _books.take(5).forEach((b) {
            print('  - ${b.title}: Age ${b.ageMin}-${b.ageMax}');
          });
        }
      }
      print('==============================');
    });
  }

  @override
  Widget build(BuildContext context) {
    final maxWidth = _getMaxWidth(context);
    final gridColumns = _getGridColumns(context);
    
    return Scaffold(
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : Directionality(
              textDirection: _localizationService.textDirection,
              child: SingleChildScrollView(
                child: Column(
                  children: [
                    // Header section with video - Edge to Edge for Web
                    Container(
                      height: _isMobile(context) ? 340 : (_isTablet(context) ? 450 : 550),
                      width: double.infinity,
                      child: Stack(
                        children: [
                          // Video or fallback image
                          Container(
                            height: _isMobile(context) ? 340 : (_isTablet(context) ? 450 : 550),
                            width: double.infinity,
                            decoration: _isMobile(context) ? BoxDecoration(
                              borderRadius: BorderRadius.only(
                                bottomLeft: Radius.circular(30),
                                bottomRight: Radius.circular(30),
                              ),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withOpacity(0.15),
                                  blurRadius: 15,
                                  offset: Offset(0, 8),
                                ),
                              ],
                            ) : null,
                            child: ClipRRect(
                              borderRadius: _isMobile(context) 
                                  ? BorderRadius.only(
                                      bottomLeft: Radius.circular(30),
                                      bottomRight: Radius.circular(30),
                                    )
                                  : BorderRadius.zero,
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
                                : Image.asset(
                                    'assets/aibn.png',
                                    fit: BoxFit.cover,
                                    width: double.infinity,
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
                                        ),
                                        child: Center(
                                          child: Icon(
                                            Icons.video_library,
                                            size: 60,
                                            color: Colors.white.withOpacity(0.7),
                                          ),
                                        ),
                                      );
                                    },
                                  ),
                          ),
                        ),
                      ],
                    ),
                  ),

                    // Filters section - wrapped in Center with maxWidth for web
                    Center(
                      child: Container(
                        constraints: BoxConstraints(maxWidth: maxWidth),
                        child: Container(
                          color: Colors.white,
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                        // Show active filters indicator
                        // if (_selectedGender != null || _selectedAge != null || _selectedLanguage != 'English')
                        //   Container(
                        //     margin: const EdgeInsets.only(bottom: 12),
                        //     padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        //     decoration: BoxDecoration(
                        //       color: Color(0xFF784D9C).withOpacity(0.1),
                        //       borderRadius: BorderRadius.circular(8),
                        //       border: Border.all(color: Color(0xFF784D9C).withOpacity(0.3)),
                        //     ),
                        //     child: Row(
                        //       mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        //       children: [
                        //         Row(
                        //           children: [
                        //             Icon(Icons.filter_list, size: 16, color: Color(0xFF784D9C)),
                        //             SizedBox(width: 8),
                        //             // Text(
                        //             //   'Active filters',
                        //             //   style: GoogleFonts.tajawal(
                        //             //     fontSize: 12,
                        //             //     fontWeight: FontWeight.w500,
                        //             //     color: Color(0xFF784D9C),
                        //             //   ),
                        //             // ),
                        //             if (_selectedGender != null) ...[
                        //               SizedBox(width: 8),
                        //               Container(
                        //                 padding: EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                        //                 decoration: BoxDecoration(
                        //                   color: Color(0xFF784D9C),
                        //                   borderRadius: BorderRadius.circular(12),
                        //                 ),
                        //                 child: Text(
                        //                   _selectedGender!,
                        //                   style: GoogleFonts.tajawal(
                        //                     fontSize: 10,
                        //                     color: Colors.white,
                        //                   ),
                        //                 ),
                        //               ),
                        //             ],
                        //             if (_selectedAge != null) ...[
                        //               SizedBox(width: 4),
                        //               Container(
                        //                 padding: EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                        //                 decoration: BoxDecoration(
                        //                   color: Color(0xFF784D9C),
                        //                   borderRadius: BorderRadius.circular(12),
                        //                 ),
                        //                 child: Text(
                        //                   _selectedAge!,
                        //                   style: GoogleFonts.tajawal(
                        //                     fontSize: 10,
                        //                     color: Colors.white,
                        //                   ),
                        //                 ),
                        //               ),
                        //             ],
                        //           ],
                        //         ),
                        //         TextButton(
                        //           onPressed: () {
                        //             setState(() {
                        //               _selectedGender = null;
                        //               _selectedAge = null;
                        //               _selectedLanguage = 'English';
                        //               _applyFilters();
                        //             });
                        //           },
                        //           style: TextButton.styleFrom(
                        //             padding: EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        //             minimumSize: Size(0, 0),
                        //           ),
                        //           child: Text(
                        //             'Clear all',
                        //             style: GoogleFonts.tajawal(
                        //               fontSize: 12,
                        //               color: Color(0xFF784D9C),
                        //               fontWeight: FontWeight.w600,
                        //             ),
                        //           ),
                        //         ),
                        //       ],
                        //     ),
                        //   ),
                        
                        // Gender filter
                        // Row(
                        //   children: [
                        //     Icon(Icons.person_outline, size: 18, color: Colors.grey[600]),
                        //     const SizedBox(width: 8),
                        //     Text(
                        //       'books_page_gender'.tr,
                        //       style: GoogleFonts.tajawal(
                        //         fontSize: 14,
                        //         fontWeight: FontWeight.w500,
                        //         color: Colors.black87,
                        //       ),
                        //     ),
                        //   ],
                        // ),
                        // const SizedBox(height: 8),
                        // Wrap(
                        //   spacing: 8,
                        //   children: [
                        //     _buildFilterChip(
                        //       'boy'.tr,
                        //       _selectedGender == 'Boy',
                        //       () {
                        //         setState(() {
                        //           // Toggle: if already selected, clear filter; otherwise select Boy
                        //           if (_selectedGender == 'Boy') {
                        //             _selectedGender = null;
                        //           } else {
                        //             _selectedGender = 'Boy';
                        //           }
                        //           _applyFilters();
                        //         });
                        //       },
                        //     ),
                        //     _buildFilterChip(
                        //       'girl'.tr,
                        //       _selectedGender == 'Girl',
                        //       () {
                        //         setState(() {
                        //           // Toggle: if already selected, clear filter; otherwise select Girl
                        //           if (_selectedGender == 'Girl') {
                        //             _selectedGender = null;
                        //           } else {
                        //             _selectedGender = 'Girl';
                        //           }
                        //           _applyFilters();
                        //         });
                        //       },
                        //     ),
                        //   ],
                        // ),

                        const SizedBox(height: 16),

                        // Age filter
                        Row(
                          children: [
                            Icon(Icons.child_care, size: 18, color: Colors.grey[600]),
                            const SizedBox(width: 8),
                            Text(
                              'books_page_child_age'.tr,
                              style: GoogleFonts.tajawal(
                                fontSize: 14,
                                fontWeight: FontWeight.w500,
                                color: Colors.black87,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Wrap(
                          spacing: 8,
                          children: [
                            ..._ageRanges.map((age) {
                              final isSelected = _selectedAge == age;
                              return _buildFilterChip(
                                age,
                                isSelected,
                                () {
                                  setState(() {
                                    _selectedAge = _selectedAge == age ? null : age;
                                    _applyFilters();
                                  });
                                },
                              );
                            }),
                          ],
                        ),

                        const SizedBox(height: 16),

                        // Category/Genre filter
                        if (_categories.isNotEmpty) ...[
                          Row(
                            children: [
                              Icon(Icons.category_outlined, size: 18, color: Colors.grey[600]),
                              const SizedBox(width: 8),
                              Text(
                                'books_page_category'.tr,
                                style: GoogleFonts.tajawal(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w500,
                                  color: Colors.black87,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Wrap(
                            spacing: 8,
                            runSpacing: 8,
                            children: [
                              ..._categories.map((category) {
                                final isSelected = _selectedCategory == category;
                                return _buildFilterChip(
                                  category,
                                  isSelected,
                                  () {
                                    setState(() {
                                      _selectedCategory = _selectedCategory == category ? null : category;
                                      _applyFilters();
                                    });
                                  },
                                );
                              }),
                            ],
                          ),
                        ],
                      ],
                    ),
                  ),
                ),
              ),

                  // Books grid section - wrapped in Center with maxWidth for web
                  Center(
                    child: Container(
                      constraints: BoxConstraints(maxWidth: maxWidth),
                      child: Padding(
                        padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                    child: _filteredBooks.isEmpty
                        ? Container(
                            padding: const EdgeInsets.all(40),
                            child: Column(
                              children: [
                                Icon(
                                  Icons.search_off,
                                  size: 60,
                                  color: Colors.grey[400],
                                ),
                                const SizedBox(height: 16),
                                Text(
                                  'books_page_no_books_found'.tr,
                                  style: GoogleFonts.tajawal(
                                    fontSize: 18,
                                    fontWeight: FontWeight.w600,
                                    color: Colors.grey[600],
                                  ),
                                ),
                                const SizedBox(height: 8),
                                Text(
                                  'books_page_try_adjusting_filters'.tr,
                                  style: GoogleFonts.tajawal(
                                    fontSize: 14,
                                    color: Colors.grey[500],
                                  ),
                                ),
                              ],
                            ),
                          )
                        : GridView.builder(
                            shrinkWrap: true,
                            physics: const NeverScrollableScrollPhysics(),
                            gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                              crossAxisCount: gridColumns,
                              childAspectRatio: 0.65, // Adjusted for larger cards
                              crossAxisSpacing: 6,
                              mainAxisSpacing: 20,
                            ),
                            itemCount: _filteredBooks.length,
                            itemBuilder: (context, index) {
                              final book = _filteredBooks[index];
                              return _buildBookCard(book);
                            },
                          ),
                      ),
                    ),
                  ),

                  // Browse Stories by Age section - wrapped in Center with maxWidth for web
                  Center(
                    child: Container(
                      constraints: BoxConstraints(maxWidth: maxWidth),
                      child: Column(
                        children: [
                          SizedBox(height: 40),
                          Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: Text(
                      'books_page_browse_stories_by_age'.tr,
                      style: GoogleFonts.tajawal(
                        fontSize: MediaQuery.of(context).size.width < 500 ? 24 : 28,
                        fontWeight: FontWeight.w400,
                        color: Colors.black87,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ),
                  
                  SizedBox(height: 10),
                  
                  // Age groups - horizontal scroll for web, 2x2 grid for mobile
                  _buildAgeCardsSection(),
                  
                  SizedBox(height: 60),
                        ],
                      ),
                    ),
                  ),
                    
                    // Add imagination section for web only, just above footer
                    if (!_isMobile(context)) _buildImaginationSection(),
                    
                    // Add footer at the bottom (scrollable)
                    AppFooter(),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildFilterChip(String label, bool isSelected, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFF784D9C) : Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected ? const Color(0xFF784D9C) : Colors.grey[300]!,
          ),
        ),
        child: Text(
          label,
          style: GoogleFonts.tajawal(
            fontSize: 13,
            fontWeight: FontWeight.w500,
            color: isSelected ? Colors.white : Colors.black87,
          ),
        ),
      ),
    );
  }

  Widget _buildAgeCardsSection() {
    final ageRanges = ['0-2', '3-5', '6-8', '9-12'];
    final imageAssets = [
      'assets/11 copy.png',
      'assets/22 copy.png',
      'assets/33 copy.png',
      'assets/44444 copy.png',
    ];

    // Mobile: 2x2 grid
    if (_isMobile(context)) {
      return Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16),
        child: Container(
          constraints: BoxConstraints(maxWidth: 700),
          child: GridView.builder(
            shrinkWrap: true,
            physics: NeverScrollableScrollPhysics(),
            gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              childAspectRatio: 0.8,
              crossAxisSpacing: 20,
              mainAxisSpacing: 20,
            ),
            itemCount: ageRanges.length,
            itemBuilder: (context, index) {
              return _buildAgeGroupCard(ageRanges[index], imageAssets[index]);
            },
          ),
        ),
      );
    }

    // Web/Tablet: Grid layout to show all 4 cards
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Center(
        child: Container(
          constraints: BoxConstraints(maxWidth: _getMaxWidth(context)),
          child: GridView.builder(
            shrinkWrap: true,
            physics: NeverScrollableScrollPhysics(),
            gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 4,
              childAspectRatio: 0.75,
              crossAxisSpacing: 16,
              mainAxisSpacing: 16,
            ),
            itemCount: ageRanges.length,
            itemBuilder: (context, index) {
              return _buildAgeGroupCard(ageRanges[index], imageAssets[index]);
            },
          ),
        ),
      ),
    );
  }

  Widget _buildBookCard(Book book) {
    final isFavorite = _favoriteIds.contains(book.id);
    
    return GestureDetector(
      onTap: () => Navigator.push(
        context,
        MaterialPageRoute(
          builder: (context) => ProductDetailPage(book: book),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Book Image - using Expanded to fit within grid
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
                        offset: Offset(0, 4),
                      ),
                    ],
                  ),
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
                                      Color(0xFF6C63FF),
                                      Color(0xFF5A52A0),
                                    ],
                                  ),
                                ),
                                child: Center(
                                  child: Icon(
                                    Icons.book,
                                    size: 60,
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
                                  Color(0xFF6C63FF),
                                  Color(0xFF5A52A0),
                                ],
                              ),
                            ),
                            child: Center(
                              child: Icon(
                                Icons.book,
                                size: 60,
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
                        size: 16,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
          
          // Title below the image - matching home screen style
          const SizedBox(height: 12),
          Text(
            book.title,
            style: GoogleFonts.tajawal(
              fontSize: 15,
              fontWeight: FontWeight.w600,
              color: Colors.black87,
            ),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }

  // Helper method to build age group cards with images
  Widget _buildAgeGroupCard(String ageRange, String imagePath) {
    return GestureDetector(
      onTap: () {
        // Apply age filter and scroll to books
        setState(() {
          _selectedAge = ageRange;
          _applyFilters();
        });
        // Scroll to top to show filtered results
        Scrollable.ensureVisible(
          context,
          duration: Duration(milliseconds: 500),
          curve: Curves.easeInOut,
        );
      },
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Image section
            Expanded(
              child: ClipRRect(
                borderRadius: const BorderRadius.vertical(
                  top: Radius.circular(16)
                ),
                child: Image.asset(
                  imagePath,
                  width: double.infinity,
                  fit: BoxFit.cover,
                  errorBuilder: (context, error, stackTrace) {
                    return Container(
                      color: Colors.grey[300],
                      child: Icon(
                        Icons.image_not_supported,
                        color: Colors.grey[600],
                        size: 50,
                      ),
                    );
                  },
                ),
              ),
            ),
            // Label section
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 12),
              child: Text(
                ' ${'age'.tr} $ageRange',
                style: GoogleFonts.tajawal(
                  fontSize: 15,
                  fontWeight: FontWeight.w600,
                  color: const Color(0xFF784D9C),
                ),
                textAlign: TextAlign.left,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildImaginationSection() {
    // Responsive heights and font sizes
    final containerHeight = _isTablet(context) ? 350.0 : 400.0;
    final titleFontSize = _isTablet(context) ? 28.0 : 36.0;
    final descFontSize = _isTablet(context) ? 16.0 : 18.0;
    final horizontalPadding = _isTablet(context) ? 30.0 : 60.0;
    final buttonPadding = _isTablet(context) 
        ? const EdgeInsets.symmetric(horizontal: 30, vertical: 14) 
        : const EdgeInsets.symmetric(horizontal: 40, vertical: 18);
    final buttonFontSize = _isTablet(context) ? 14.0 : 16.0;
    
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(bottom: 60), // Add space before footer
      child: Row(
        children: [
          // Left side - Image
          Expanded(
            flex: 5,
            child: Image.asset(
              'assets/banner copy.png',
              fit: BoxFit.cover,
              height: containerHeight,
              errorBuilder: (context, error, stackTrace) {
                return Container(
                  height: containerHeight,
                  color: Colors.grey[300],
                  child: const Center(
                    child: Icon(Icons.image, size: 60, color: Colors.grey),
                  ),
                );
              },
            ),
          ),
          
          // Right side - Purple gradient with text
          Expanded(
            flex: 5,
            child: Container(
              height: containerHeight,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [
                    Color(0xFF784D9C),
                    Color(0xFF784D9C),
                  ],
                ),
              ),
              padding: EdgeInsets.symmetric(
                horizontal: horizontalPadding, 
                vertical: horizontalPadding
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'books_page_imagination_heading'.tr,
                    style: GoogleFonts.tajawal(
                      fontSize: titleFontSize,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                      height: 1.3,
                    ),
                  ),
                  SizedBox(height: _isTablet(context) ? 15 : 20),
                  Text(
                    'books_page_imagination_description'.tr,
                    style: GoogleFonts.tajawal(
                      fontSize: descFontSize,
                      fontWeight: FontWeight.w400,
                      color: Colors.white,
                      height: 1.5,
                    ),
                  ),
                  SizedBox(height: _isTablet(context) ? 25 : 40),
                  ElevatedButton(
                    onPressed: () {
                      // Already on books page, just scroll to top
                      Scrollable.ensureVisible(
                        context,
                        duration: Duration(milliseconds: 500),
                        curve: Curves.easeInOut,
                      );
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.white,
                      foregroundColor: Color(0xFF9B59B6),
                      padding: buttonPadding,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                      elevation: 0,
                    ),
                    child: Text(
                      'books_page_view_all_books'.tr,
                      style: GoogleFonts.tajawal(
                        fontSize: buttonFontSize,
                        fontWeight: FontWeight.w600,
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
}
