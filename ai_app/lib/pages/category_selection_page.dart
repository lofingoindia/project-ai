import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/user_preference_service.dart';
import '../main_navigation.dart';

class CategorySelectionPage extends StatefulWidget {
  const CategorySelectionPage({Key? key}) : super(key: key);

  @override
  State<CategorySelectionPage> createState() => _CategorySelectionPageState();
}

class _CategorySelectionPageState extends State<CategorySelectionPage> with TickerProviderStateMixin {
  late AnimationController _animationController;
  late Animation<double> _fadeAnimation;
  late Animation<Offset> _slideAnimation;
  
  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 1000),
      vsync: this,
    );
    
    _fadeAnimation = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _animationController,
      curve: const Interval(0.0, 0.6, curve: Curves.easeOut),
    ));
    
    _slideAnimation = Tween<Offset>(
      begin: const Offset(0.0, 0.5),
      end: Offset.zero,
    ).animate(CurvedAnimation(
      parent: _animationController,
      curve: const Interval(0.2, 0.8, curve: Curves.easeOut),
    ));
    
    _animationController.forward();
  }
  
  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  Future<void> _selectCategory(String category) async {
    // Clear any previous selection and set new one
    await UserPreferenceService.clearCategorySelection();
    await UserPreferenceService.setSelectedCategory(category);
    
    if (mounted) {
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(
          builder: (context) => const MainNavigation(),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final screenWidth = MediaQuery.of(context).size.width;
    
    return Scaffold(
      body: Container(
        width: double.infinity,
        height: double.infinity,
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              Color(0xFF9C4DFF),
              Color(0xFFB47AFF),
              Color(0xFFC284E9),
            ],
          ),
        ),
        child: SafeArea(
          child: FadeTransition(
            opacity: _fadeAnimation,
            child: Padding(
              padding: EdgeInsets.symmetric(
                horizontal: screenWidth < 500 ? 20 : 40,
                vertical: 20,
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  // App Logo and Welcome Text
                  SlideTransition(
                    position: _slideAnimation,
                    child: Column(
                      children: [
                        // Logo
                        // Image.asset(
                        //   'assets/logo.png',
                        //   width: 300,
                        //   height: 200,
                        //   fit: BoxFit.contain,
                        //   errorBuilder: (context, error, stackTrace) {
                        //     return Icon(
                        //       Icons.auto_stories,
                        //       size: 80,
                        //       color: Colors.white,
                        //     );
                        //   },
                        // ),
                        
                        // SizedBox(height: 5),
                        
                        // Welcome Text
                        Text(
                          'Welcome',
                          style: GoogleFonts.libreBaskerville(
                            fontSize: screenWidth < 500 ? 28 : 32,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                          textAlign: TextAlign.center,
                        ),
                        
                        SizedBox(height: 12),
                        
                        Text(
                          'Let\'s personalize your reading experience',
                          style: GoogleFonts.tajawal(
                            fontSize: screenWidth < 500 ? 16 : 18,
                            color: Colors.white.withOpacity(0.9),
                          ),
                          textAlign: TextAlign.center,
                        ),
                      ],
                    ),
                  ),
                  
                  SizedBox(height: 20),
                  
                  // Category Selection Question
                  SlideTransition(
                    position: _slideAnimation,
                    child: Column(
                      children: [
                        Text(
                          'Who are you shopping for?',
                          style: GoogleFonts.tajawal(
                            fontSize: screenWidth < 500 ? 22 : 26,
                            fontWeight: FontWeight.w600,
                            color: Colors.white,
                          ),
                          textAlign: TextAlign.center,
                        ),
                        
                        SizedBox(height: 8),
                        
                        Text(
                          'Choose a category to see personalized books',
                          style: GoogleFonts.tajawal(
                            fontSize: 14,
                            color: Colors.white.withOpacity(0.8),
                          ),
                          textAlign: TextAlign.center,
                        ),
                      ],
                    ),
                  ),
                  
                  SizedBox(height: 30),
                  
                  // Category Selection Cards
                  SlideTransition(
                    position: _slideAnimation,
                    child: Row(
                      children: [
                        // Girl Category
                        Expanded(
                          child: _buildCategoryCard(
                            title: 'Girl',
                            colors: [
                              Color(0xFFEC4899),
                              Color(0xFFF472B6),
                            ],
                            imageAssetPath: 'assets/girlui copy.png',
                            onTap: () => _selectCategory('girl'),
                          ),
                        ),
                        SizedBox(width: 20),
                        // Boy Category
                        Expanded(
                          child: _buildCategoryCard(
                            title: 'Boy',
                            colors: [
                              Color(0xFF3B82F6),
                              Color(0xFF60A5FA),
                            ],
                            imageAssetPath: 'assets/boyui copy.png',
                            onTap: () => _selectCategory('boy'),
                          ),
                        ),
                      ],
                    ),
                  ),
                  
                  SizedBox(height: 40),
                  
                  // Skip for now option
                  SlideTransition(
                    position: _slideAnimation,
                    child: TextButton(
                      onPressed: () => _selectCategory('all'),
                      style: TextButton.styleFrom(
                        padding: EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                      ),
                      child: Text(
                        'Show all books',
                        style: GoogleFonts.tajawal(
                          fontSize: 16,
                          color: Colors.white.withOpacity(0.8),
                          decoration: TextDecoration.underline,
                          decorationColor: Colors.white.withOpacity(0.8),
                        ),
                      ),
                    ),
                  ),
                  
                  SizedBox(height: 40),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildCategoryCard({
    required String title,
    required List<Color> colors,
    String? imageAssetPath,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        height: 220,
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: colors,
          ),
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(
              color: colors.first.withOpacity(0.3),
              blurRadius: 15,
              offset: Offset(0, 8),
            ),
          ],
        ),
        child: Material(
          color: Colors.transparent,
          child: InkWell(
            borderRadius: BorderRadius.circular(20),
            onTap: onTap,
            child: Padding(
              padding: EdgeInsets.all(20),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  if (imageAssetPath != null)
                    Container(
                      width: 100,
                      height: 120,
                      child: Image.asset(
                        imageAssetPath,
                        fit: BoxFit.contain,
                        errorBuilder: (context, error, stackTrace) {
                          return Icon(
                            Icons.person,
                            size: 80,
                            color: Colors.white,
                          );
                        },
                      ),
                    ),
                  SizedBox(height: 16),
                  Text(
                    title,
                    style: GoogleFonts.tajawal(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
  