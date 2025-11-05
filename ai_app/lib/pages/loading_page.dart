import 'dart:async';
import 'dart:ui';
import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:http/http.dart' as http;
import '../models/book.dart';
import '../services/ai_service.dart';
import '../config/ai_keys.dart';
import 'preview_book_page.dart';

class LoadingPage extends StatefulWidget {
  final Book book;
  final String childName;
  final int childAge;
  final String childImageUrl;

  const LoadingPage({
    Key? key,
    required this.book,
    required this.childName,
    required this.childAge,
    required this.childImageUrl,
  }) : super(key: key);

  @override
  State<LoadingPage> createState() => _LoadingPageState();
}

class _LoadingPageState extends State<LoadingPage>
    with TickerProviderStateMixin {
  late AnimationController _pulseController;
  late AnimationController _rotationController;
  late Animation<double> _pulseAnimation;
  late Animation<double> _rotationAnimation;
  
  Timer? _timer;
  int _secondsElapsed = 0;
  String _statusMessage = 'Preparing images...';

  @override
  void initState() {
    super.initState();
    
    // Pulse animation for the loading indicator
    _pulseController = AnimationController(
      duration: const Duration(milliseconds: 2000),
      vsync: this,
    );
    _pulseAnimation = Tween<double>(begin: 0.8, end: 1.1).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );
    
    // Rotation animation for the AI icon
    _rotationController = AnimationController(
      duration: const Duration(milliseconds: 3000),
      vsync: this,
    );
    _rotationAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _rotationController, curve: Curves.linear),
    );
    
    _pulseController.repeat(reverse: true);
    _rotationController.repeat();
    
    _startTimer();
    _generateCover();
  }

  void _startTimer() {
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (mounted) {
        setState(() {
          _secondsElapsed++;
        });
      }
    });
  }

  Future<void> _generateCover() async {
    try {
      if (!mounted) return;
      setState(() { _statusMessage = 'Downloading book cover...'; });
      
      // Get cover image URL - prefer coverImageUrl, then displayImage, then allImages
      String? coverUrl;
      if (widget.book.coverImageUrl.isNotEmpty) {
        coverUrl = widget.book.coverImageUrl;
      } else if (widget.book.displayImage.isNotEmpty) {
        coverUrl = widget.book.displayImage;
      } else if (widget.book.allImages.isNotEmpty) {
        coverUrl = widget.book.allImages.first;
      }
      
      if (coverUrl == null || coverUrl.isEmpty) {
        throw Exception('No cover image available for this book');
      }

      print('[LoadingPage] Cover URL: $coverUrl');
      print('[LoadingPage] Child URL: ${widget.childImageUrl}');

      // Download cover image (book cover)
      final coverResp = await http.get(Uri.parse(coverUrl));
      if (coverResp.statusCode != 200) {
        throw Exception('Failed to load book cover image (Status: ${coverResp.statusCode})');
      }
      final Uint8List coverBytes = coverResp.bodyBytes;
      print('[LoadingPage] Cover image downloaded: ${coverBytes.length} bytes');

      if (!mounted) return;
      setState(() { _statusMessage = 'Fetching child image...'; });
      
      // Download child image (reference image)
      final childResp = await http.get(Uri.parse(widget.childImageUrl));
      if (childResp.statusCode != 200) {
        throw Exception('Failed to load child image (Status: ${childResp.statusCode})');
      }
      final Uint8List childBytes = childResp.bodyBytes;
      print('[LoadingPage] Child image downloaded: ${childBytes.length} bytes');

      if (!mounted) return;
      setState(() { _statusMessage = 'AI is working its magic...'; });
      
      // Call AI service with the exact prompt from your Python example
      final ai = AiService(apiKey: geminiApiKey);
      print('[LoadingPage] Calling AI service...');
      
      final generated = await ai.generatePersonalizedCover(
        bookCoverBytes: coverBytes,
        childImageBytes: childBytes,
        childName: widget.childName,
        coverSourceHint: coverUrl,
        childSourceHint: widget.childImageUrl,
        customPrompt: """Replace the kids face in the book cover with the attached reference image. Keep the face, hairstyle, features, and camera angle exactly the same as in the reference image without any changes. The background and context must remain unchanged, and the final image should look perfectly realistic and clearly identifiable as the same kid, and even there is a text change that text into ${widget.childName} into lofingo keep face 100% same.""",
      );

      print('[LoadingPage] AI generation completed: ${generated.length} bytes');

      if (!mounted) return;
      _timer?.cancel();
      
      // Navigate to preview page
      await Navigator.of(context).pushReplacement(
        MaterialPageRoute(
          builder: (_) => PreviewBookPage(generatedCoverBytes: generated),
        ),
      );
    } catch (e, stackTrace) {
      if (!mounted) return;
      _timer?.cancel();
      
      print('[LoadingPage] Error: $e');
      print('[LoadingPage] Stack trace: $stackTrace');
      
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Failed to generate preview: $e'),
          duration: const Duration(seconds: 5),
        ),
      );
      Navigator.of(context).pop(); // Go back to personalization page
    }
  }

  @override
  void dispose() {
    _pulseController.dispose();
    _rotationController.dispose();
    _timer?.cancel();
    super.dispose();
  }

  // Get book-specific preview images
  List<String> _getBookPreviewImages() {
    // Only show these preview images for Boy's Smile book
    if (widget.book.title.toLowerCase().contains('boy') && 
        widget.book.title.toLowerCase().contains('smile')) {
      return [
        'https://miplbkihtavbnxgznudj.supabase.co/storage/v1/object/public/product-media/products/new/1AEORo0ORZ9RdJH8rFMPD9x89VzAdy-metaQ2hpbGRzLVNtaWxlLVNraW50b25lczEucG5n--blurred.png',
        'https://miplbkihtavbnxgznudj.supabase.co/storage/v1/object/public/product-media/products/new/7HT71KMqMIZrtY77mxsfT0UinRvt13-metaQ2hpbGRzLVNtaWxlLVNraW50b25lczQucG5n--blurred.png',
        'https://miplbkihtavbnxgznudj.supabase.co/storage/v1/object/public/product-media/products/new/dIdUBTa9hDyWtKvQSGsF60cTgRYx0I-metaQ2hpbGRzLVNtaWxlLVNraW50b25lczE1LnBuZw==--blurred.png',
        'https://miplbkihtavbnxgznudj.supabase.co/storage/v1/object/public/product-media/products/new/iLjIVoazmUhpB3LhhRRcKdBO9uNteD-metaQ2hpbGRzLVNtaWxlLVNraW50b25lczE0LnBuZw==--blurred.png',
        'https://miplbkihtavbnxgznudj.supabase.co/storage/v1/object/public/product-media/products/new/kRibaYdWauToH97b7gbsn9AfSMFRyQ-metaQ2hpbGRzLVNtaWxlLVNraW50b25lczIwLnBuZw==--blurred.png',
        'https://miplbkihtavbnxgznudj.supabase.co/storage/v1/object/public/product-media/products/new/l7oPCdztLdmCfiWgugqGGvl5aAFlDE-metaQ2hpbGRzLVNtaWxlLVNraW50b25lczE4LnBuZw==--blurred.png',
      ];
    }
    return [];
  }

  @override
  Widget build(BuildContext context) {
    // Resolve best cover image URL
    final String coverUrl = widget.book.coverImageUrl.isNotEmpty
        ? widget.book.coverImageUrl
        : (widget.book.displayImage.isNotEmpty
            ? widget.book.displayImage
            : (widget.book.allImages.isNotEmpty ? widget.book.allImages.first : ''));

    final previewImages = _getBookPreviewImages();

    return Scaffold(
      backgroundColor: const Color(0xFFF5F3FF),
      body: SafeArea(
        child: SingleChildScrollView(
          child: Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              children: [
                // Header with back button and title
                Row(
                  children: [
                    IconButton(
                      onPressed: () => Navigator.of(context).pop(),
                      icon: const Icon(Icons.arrow_back, color: Colors.black87),
                    ),
                    Expanded(
                      child: Text(
                        widget.book.title,
                        style: GoogleFonts.tajawal(
                          fontSize: 18,
                          fontWeight: FontWeight.w600,
                          color: Colors.black87,
                        ),
                        textAlign: TextAlign.center,
                      ),
                    ),
                    const SizedBox(width: 48), // Balance the back button
                  ],
                ),
                
                const SizedBox(height: 24),
                
                // Main generating cover section
                Container(
                  width: double.infinity,
                  height: 400,
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
                    child: Stack(
                      children: [
                        // Background cover image
                        Positioned.fill(
                          child: CachedNetworkImage(
                            imageUrl: coverUrl,
                            fit: BoxFit.cover,
                            placeholder: (context, url) => Container(
                              color: Colors.grey[200],
                              child: const Center(
                                child: CircularProgressIndicator(),
                              ),
                            ),
                            errorWidget: (context, url, error) => Container(
                              color: Colors.grey[200],
                              child: const Center(
                                child: Icon(Icons.error),
                              ),
                            ),
                          ),
                        ),
                        
                        // Overlay with loading content
                        Positioned.fill(
                          child: Container(
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                begin: Alignment.topCenter,
                                end: Alignment.bottomCenter,
                                colors: [
                                  Colors.black.withOpacity(0.3),
                                  Colors.black.withOpacity(0.6),
                                ],
                              ),
                            ),
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                // Loading animation
                                AnimatedBuilder(
                                  animation: _pulseAnimation,
                                  builder: (context, child) {
                                    return Transform.scale(
                                      scale: _pulseAnimation.value,
                                      child: Container(
                                        width: 80,
                                        height: 80,
                                        decoration: BoxDecoration(
                                          shape: BoxShape.circle,
                                          color: const Color(0xFF8B5CF6),
                                          boxShadow: [
                                            BoxShadow(
                                              color: const Color(0xFF8B5CF6).withOpacity(0.4),
                                              blurRadius: 20,
                                              spreadRadius: 5,
                                            ),
                                          ],
                                        ),
                                        child: AnimatedBuilder(
                                          animation: _rotationAnimation,
                                          builder: (context, child) {
                                            return Transform.rotate(
                                              angle: _rotationAnimation.value * 2 * 3.14159,
                                              child: const Icon(
                                                Icons.auto_awesome,
                                                color: Colors.white,
                                                size: 35,
                                              ),
                                            );
                                          },
                                        ),
                                      ),
                                    );
                                  },
                                ),
                                
                                const SizedBox(height: 24),
                                
                                // Title
                                Text(
                                  'Your book is just one moment away...',
                                  style: GoogleFonts.tajawal(
                                    fontSize: 20,
                                    fontWeight: FontWeight.w600,
                                    color: Colors.white,
                                  ),
                                  textAlign: TextAlign.center,
                                ),
                                
                                const SizedBox(height: 16),
                                
                                // Status message
                                Text(
                                  _statusMessage,
                                  style: GoogleFonts.tajawal(
                                    fontSize: 16,
                                    color: Colors.white70,
                                  ),
                                  textAlign: TextAlign.center,
                                ),
                                
                                const SizedBox(height: 20),
                                
                                // Progress bar
                                Container(
                                  width: 200,
                                  height: 4,
                                  decoration: BoxDecoration(
                                    color: Colors.white.withOpacity(0.3),
                                    borderRadius: BorderRadius.circular(2),
                                  ),
                                  child: ClipRRect(
                                    borderRadius: BorderRadius.circular(2),
                                    child: LinearProgressIndicator(
                                      backgroundColor: Colors.transparent,
                                      valueColor: const AlwaysStoppedAnimation<Color>(
                                        Color(0xFF8B5CF6),
                                      ),
                                    ),
                                  ),
                                ),
                                
                                const SizedBox(height: 16),
                                
                                // Timer
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                                  decoration: BoxDecoration(
                                    color: Colors.white.withOpacity(0.2),
                                    borderRadius: BorderRadius.circular(20),
                                  ),
                                  child: Text(
                                    '${_secondsElapsed}s elapsed',
                                    style: GoogleFonts.tajawal(
                                      fontSize: 14,
                                      color: Colors.white,
                                      fontWeight: FontWeight.w500,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                
                // Show preview images only for Boy's Smile book
                if (previewImages.isNotEmpty) ...[
                  const SizedBox(height: 32),
                  
                  // Preview images grid
                  GridView.builder(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 2,
                      crossAxisSpacing: 16,
                      mainAxisSpacing: 16,
                      childAspectRatio: 0.7,
                    ),
                    itemCount: previewImages.length,
                    itemBuilder: (context, index) {
                      return Container(
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(12),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withOpacity(0.1),
                              blurRadius: 8,
                              offset: const Offset(0, 4),
                            ),
                          ],
                        ),
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(12),
                          child: Stack(
                            children: [
                              // Blurred preview image
                              Positioned.fill(
                                child: CachedNetworkImage(
                                  imageUrl: previewImages[index],
                                  fit: BoxFit.cover,
                                  placeholder: (context, url) => Container(
                                    color: Colors.grey[200],
                                    child: const Center(
                                      child: CircularProgressIndicator(),
                                    ),
                                  ),
                                  errorWidget: (context, url, error) => Container(
                                    color: Colors.grey[200],
                                    child: const Center(
                                      child: Icon(Icons.error),
                                    ),
                                  ),
                                ),
                              ),
                              
                              // Overlay with text
                              Positioned.fill(
                                child: Container(
                                  decoration: BoxDecoration(
                                    color: Colors.black.withOpacity(0.4),
                                  ),
                                  child: Column(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      Container(
                                        width: 40,
                                        height: 40,
                                        decoration: BoxDecoration(
                                          color: Colors.white.withOpacity(0.2),
                                          shape: BoxShape.circle,
                                          border: Border.all(
                                            color: Colors.white.withOpacity(0.3),
                                            width: 1,
                                          ),
                                        ),
                                        child: const Icon(
                                          Icons.visibility_off,
                                          color: Colors.white,
                                          size: 20,
                                        ),
                                      ),
                                      
                                      const SizedBox(height: 12),
                                      
                                      Padding(
                                        padding: const EdgeInsets.symmetric(horizontal: 12.0),
                                        child: Text(
                                          'The full book will be generated completely after your purchase.',
                                          style: GoogleFonts.tajawal(
                                            fontSize: 12,
                                            color: Colors.white,
                                            fontWeight: FontWeight.w500,
                                          ),
                                          textAlign: TextAlign.center,
                                          maxLines: 3,
                                        ),
                                      ),
                                      
                                      const SizedBox(height: 8),
                                      
                                      Text(
                                        'Go ahead and unlock it.',
                                        style: GoogleFonts.tajawal(
                                          fontSize: 11,
                                          color: Colors.white70,
                                        ),
                                        textAlign: TextAlign.center,
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                ],
                
                const SizedBox(height: 32),
              ],
            ),
          ),
        ),
      ),
    );
  }
}