import 'dart:typed_data';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../models/book.dart';
import '../services/cart_service.dart';
import '../pages/cart_page.dart';
import '../main_navigation.dart';

class PreviewBookPage extends StatefulWidget {
  final Uint8List? generatedCoverBytes;
  final String? generatedImageUrl;
  final Book? book;
  final String? childName;
  final int? childAge;
  final String? childGender;
  final String? selectedLanguage;
  final String? childImageUrl;

  const PreviewBookPage({
    Key? key, 
    this.generatedCoverBytes,
    this.generatedImageUrl,
    this.book,
    this.childName,
    this.childAge,
    this.childGender,
    this.selectedLanguage,
    this.childImageUrl,
  }) : super(key: key);

  @override
  State<PreviewBookPage> createState() => _PreviewBookPageState();
}

class _PreviewBookPageState extends State<PreviewBookPage> {
  final CartService _cartService = CartService();
  bool _isAddingToCart = false;

  Future<void> _addToCart() async {
    if (widget.book == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Unable to add to cart: Book information missing'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    setState(() {
      _isAddingToCart = true;
    });

    try {
      // Prepare personalization data
      final personalizationData = {
        'child_name': widget.childName ?? 'Unknown',
        'child_age': widget.childAge ?? 0,
        'child_gender': widget.childGender ?? 'unknown',
        'selected_language': widget.selectedLanguage ?? 'English',
        'child_image_url': widget.childImageUrl ?? '',
        'generated_cover_url': widget.generatedImageUrl ?? '',
        'personalized_at': DateTime.now().toIso8601String(),
      };

      await _cartService.addToCart(
        widget.book!.id,
        1, // Default quantity
        personalizationData,
      );

      if (!mounted) return;

      // Show success message
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Row(
            children: [
              const Icon(Icons.check_circle, color: Colors.white),
              const SizedBox(width: 8),
              Text('Added to cart successfully!'),
            ],
          ),
          backgroundColor: Colors.green,
          behavior: SnackBarBehavior.floating,
          duration: const Duration(seconds: 2),
        ),
      );

      // Navigate to cart tab in the main navigation
      // Wait a moment for the snackbar to be visible
      await Future.delayed(const Duration(milliseconds: 500));
      
      if (!mounted) return;
      
      // Pop back to the main navigation and switch to cart tab (index 2)
      Navigator.of(context).popUntil((route) => route.isFirst);
      
      // Use a post-frame callback to ensure navigation is complete
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) {
          MainNavigation.switchTab(context, 2);
        }
      });

    } catch (e) {
      if (!mounted) return;
      
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Failed to add to cart: $e'),
          backgroundColor: Colors.red,
        ),
      );
    } finally {
      if (mounted) {
        setState(() {
          _isAddingToCart = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    // Check if we're on web
    final bool isWeb = kIsWeb;
    final screenWidth = MediaQuery.of(context).size.width;
    
    // For web, constrain the width like other pages
    final double maxWidth = isWeb ? 600 : double.infinity;
    final EdgeInsets bodyPadding = isWeb 
        ? EdgeInsets.symmetric(
            horizontal: screenWidth > 800 ? (screenWidth - maxWidth) / 2 : 16,
            vertical: 16,
          )
        : const EdgeInsets.all(16);

    return Scaffold(
      appBar: AppBar(
        title: Text('Preview', style: GoogleFonts.tajawal()),
        backgroundColor: const Color(0xFFF5F3FF),
        elevation: 0,
        centerTitle: isWeb, // Center title on web
      ),
      backgroundColor: const Color(0xFFF5F3FF),
      body: Center(
        child: SingleChildScrollView(
          padding: bodyPadding,
          child: Container(
            width: isWeb ? maxWidth : double.infinity,
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  'Personalized Cover',
                  style: GoogleFonts.tajawal(
                    fontSize: isWeb ? 28 : 24, // Larger on web
                    fontWeight: FontWeight.w600,
                    color: Colors.black87,
                  ),
                ),
                SizedBox(height: isWeb ? 32 : 24), // More space on web
                
                // Display the generated image
                Container(
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(16),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.1),
                        blurRadius: 20,
                        offset: const Offset(0, 8),
                      ),
                    ],
                  ),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(16),
                    child: _buildImage(isWeb),
                  ),
                ),
                
                SizedBox(height: isWeb ? 40 : 32), // More space on web
                
                // Show personalization details if available
                if (widget.childName != null) ...[
                  Container(
                    width: double.infinity,
                    padding: EdgeInsets.all(isWeb ? 20 : 16), // More padding on web
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.8),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFFB47AFF).withOpacity(0.3)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Personalized for:',
                          style: GoogleFonts.tajawal(
                            fontSize: isWeb ? 16 : 14, // Larger on web
                            color: Colors.grey[600],
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        SizedBox(height: isWeb ? 12 : 8), // More space on web
                        Text(
                          widget.childName!,
                          style: GoogleFonts.tajawal(
                            fontSize: isWeb ? 22 : 18, // Larger on web
                            fontWeight: FontWeight.bold,
                            color: const Color(0xFFB47AFF),
                          ),
                        ),
                        if (widget.childAge != null) ...[
                          SizedBox(height: isWeb ? 6 : 4), // More space on web
                          Text(
                            'Age: ${widget.childAge} years old',
                            style: GoogleFonts.tajawal(
                              fontSize: isWeb ? 16 : 14, // Larger on web
                              color: Colors.grey[600],
                            ),
                          ),
                        ],
                        if (widget.selectedLanguage != null) ...[
                          SizedBox(height: isWeb ? 6 : 4), // More space on web
                          Text(
                            'Language: ${widget.selectedLanguage}',
                            style: GoogleFonts.tajawal(
                              fontSize: isWeb ? 16 : 14, // Larger on web
                              color: Colors.grey[600],
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                  SizedBox(height: isWeb ? 32 : 24), // More space on web
                ],
                
                Text(
                  'Your personalized book cover is ready!',
                  style: GoogleFonts.tajawal(
                    fontSize: isWeb ? 18 : 16, // Larger on web
                    color: Colors.grey[600],
                  ),
                  textAlign: TextAlign.center,
                ),
                
                SizedBox(height: isWeb ? 32 : 24), // More space on web
                
                // Action buttons
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton(
                        onPressed: () => Navigator.of(context).pop(),
                        style: OutlinedButton.styleFrom(
                          padding: EdgeInsets.symmetric(
                            vertical: isWeb ? 20 : 16, // More padding on web
                          ),
                          side: BorderSide(color: Theme.of(context).primaryColor),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(8),
                          ),
                        ),
                        child: Text(
                          'Back',
                          style: GoogleFonts.tajawal(
                            fontSize: isWeb ? 18 : 16, // Larger on web
                            fontWeight: FontWeight.w600,
                            color: Theme.of(context).primaryColor,
                          ),
                        ),
                      ),
                    ),
                    SizedBox(width: isWeb ? 20 : 16), // More space on web
                    Expanded(
                      child: ElevatedButton(
                        onPressed: _isAddingToCart ? null : _addToCart,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF784D9C),
                          padding: EdgeInsets.symmetric(
                            vertical: isWeb ? 20 : 16, // More padding on web
                          ),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(8),
                          ),
                        ),
                        child: _isAddingToCart
                            ? SizedBox(
                                width: isWeb ? 24 : 20, // Larger on web
                                height: isWeb ? 24 : 20,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                                ),
                              )
                            : Text(
                                'Add to Cart',
                                style: GoogleFonts.tajawal(
                                  fontSize: isWeb ? 18 : 16, // Larger on web
                                  fontWeight: FontWeight.w600,
                                  color: Colors.white,
                                ),
                              ),
                      ),
                    ),
                  ],
                ),
                
                // Add bottom padding for web
                if (isWeb) const SizedBox(height: 32),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildImage([bool isWeb = false]) {
    // Set appropriate image constraints for web vs mobile
    final double? imageHeight = isWeb ? 500 : 400;
    final BoxFit imageFit = BoxFit.contain;

    if (widget.generatedImageUrl != null) {
      // Check if it's a data URL (base64)
      if (widget.generatedImageUrl!.startsWith('data:image/')) {
        try {
          // Extract base64 data from data URL
          final base64Data = widget.generatedImageUrl!.split(',')[1];
          final bytes = base64Decode(base64Data);
          
          return Container(
            height: imageHeight,
            child: Image.memory(
              bytes,
              fit: imageFit,
            ),
          );
        } catch (e) {
          print('Error decoding base64 image: $e');
          return Container(
            height: imageHeight,
            color: Colors.grey[200],
            child: Center(
              child: Icon(
                Icons.error, 
                color: Colors.grey, 
                size: isWeb ? 56 : 48, // Larger icon on web
              ),
            ),
          );
        }
      } else {
        // Display image from URL (regular HTTP URL)
        return Container(
          height: imageHeight,
          child: CachedNetworkImage(
            imageUrl: widget.generatedImageUrl!,
            fit: imageFit,
            placeholder: (context, url) => Container(
              height: imageHeight,
              color: Colors.grey[200],
              child: const Center(
                child: CircularProgressIndicator(),
              ),
            ),
            errorWidget: (context, url, error) => Container(
              height: imageHeight,
              color: Colors.grey[200],
              child: Center(
                child: Icon(
                  Icons.error, 
                  color: Colors.grey, 
                  size: isWeb ? 56 : 48, // Larger icon on web
                ),
              ),
            ),
          ),
        );
      }
    } else if (widget.generatedCoverBytes != null) {
      // Display image from bytes (local processing - fallback)
      return Container(
        height: imageHeight,
        child: Image.memory(
          widget.generatedCoverBytes!,
          fit: imageFit,
        ),
      );
    } else {
      // No image available
      return Container(
        height: imageHeight,
        color: Colors.grey[200],
        child: Center(
          child: Text(
            'No image available',
            style: GoogleFonts.tajawal(
              fontSize: isWeb ? 18 : 16, // Larger text on web
              color: Colors.grey[600],
            ),
          ),
        ),
      );
    }
  }
}


