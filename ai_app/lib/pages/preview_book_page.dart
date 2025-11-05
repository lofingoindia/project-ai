import 'dart:typed_data';
import 'dart:convert';
import 'package:flutter/material.dart';
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
    return Scaffold(
      appBar: AppBar(
        title: Text('Preview', style: GoogleFonts.tajawal()),
        backgroundColor: const Color(0xFFF5F3FF),
        elevation: 0,
      ),
      backgroundColor: const Color(0xFFF5F3FF),
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                'Personalized Cover',
                style: GoogleFonts.tajawal(
                  fontSize: 24,
                  fontWeight: FontWeight.w600,
                  color: Colors.black87,
                ),
              ),
              const SizedBox(height: 24),
              
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
                  child: _buildImage(),
                ),
              ),
              
              const SizedBox(height: 32),
              
              // Show personalization details if available
              if (widget.childName != null) ...[
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(16),
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
                          fontSize: 14,
                          color: Colors.grey[600],
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        widget.childName!,
                        style: GoogleFonts.tajawal(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: const Color(0xFFB47AFF),
                        ),
                      ),
                      if (widget.childAge != null) ...[
                        const SizedBox(height: 4),
                        Text(
                          'Age: ${widget.childAge} years old',
                          style: GoogleFonts.tajawal(
                            fontSize: 14,
                            color: Colors.grey[600],
                          ),
                        ),
                      ],
                      if (widget.selectedLanguage != null) ...[
                        const SizedBox(height: 4),
                        Text(
                          'Language: ${widget.selectedLanguage}',
                          style: GoogleFonts.tajawal(
                            fontSize: 14,
                            color: Colors.grey[600],
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
                const SizedBox(height: 24),
              ],
              
              Text(
                'Your personalized book cover is ready!',
                style: GoogleFonts.tajawal(
                  fontSize: 16,
                  color: Colors.grey[600],
                ),
                textAlign: TextAlign.center,
              ),
              
              const SizedBox(height: 24),
              
              // Action buttons
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => Navigator.of(context).pop(),
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        side: BorderSide(color: Theme.of(context).primaryColor),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                      ),
                      child: Text(
                        'Back',
                        style: GoogleFonts.tajawal(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                          color: Theme.of(context).primaryColor,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: _isAddingToCart ? null : _addToCart,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF784D9C),
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                      ),
                      child: _isAddingToCart
                          ? const SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                              ),
                            )
                          : Text(
                              'Add to Cart',
                              style: GoogleFonts.tajawal(
                                fontSize: 16,
                                fontWeight: FontWeight.w600,
                                color: Colors.white,
                              ),
                            ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildImage() {
    if (widget.generatedImageUrl != null) {
      // Check if it's a data URL (base64)
      if (widget.generatedImageUrl!.startsWith('data:image/')) {
        try {
          // Extract base64 data from data URL
          final base64Data = widget.generatedImageUrl!.split(',')[1];
          final bytes = base64Decode(base64Data);
          
          return Image.memory(
            bytes,
            fit: BoxFit.contain,
          );
        } catch (e) {
          print('Error decoding base64 image: $e');
          return Container(
            height: 400,
            color: Colors.grey[200],
            child: const Center(
              child: Icon(Icons.error, color: Colors.grey, size: 48),
            ),
          );
        }
      } else {
        // Display image from URL (regular HTTP URL)
        return CachedNetworkImage(
          imageUrl: widget.generatedImageUrl!,
          fit: BoxFit.contain,
          placeholder: (context, url) => Container(
            height: 400,
            color: Colors.grey[200],
            child: const Center(
              child: CircularProgressIndicator(),
            ),
          ),
          errorWidget: (context, url, error) => Container(
            height: 400,
            color: Colors.grey[200],
            child: const Center(
              child: Icon(Icons.error, color: Colors.grey, size: 48),
            ),
          ),
        );
      }
    } else if (widget.generatedCoverBytes != null) {
      // Display image from bytes (local processing - fallback)
      return Image.memory(
        widget.generatedCoverBytes!,
        fit: BoxFit.contain,
      );
    } else {
      // No image available
      return Container(
        height: 400,
        color: Colors.grey[200],
        child: const Center(
          child: Text('No image available'),
        ),
      );
    }
  }
}


