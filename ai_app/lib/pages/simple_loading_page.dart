import 'dart:async';
import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../services/ai_direct_service.dart';
import '../models/book.dart';
import 'preview_book_page.dart';

class SimpleLoadingPage extends StatefulWidget {
  final Book book;
  final String childName;
  final int childAge;
  final String childImageUrl;
  final String? selectedLanguage;
  final String? childImageBase64;
  final String? childImageMime;

  const SimpleLoadingPage({
    Key? key,
    required this.book,
    required this.childName,
    required this.childAge,
    required this.childImageUrl,
    this.selectedLanguage,
    this.childImageBase64,
    this.childImageMime,
  }) : super(key: key);

  @override
  State<SimpleLoadingPage> createState() => _SimpleLoadingPageState();
}

class _SimpleLoadingPageState extends State<SimpleLoadingPage>
    with TickerProviderStateMixin {
  late AnimationController _pulseController;
  late AnimationController _rotationController;
  late Animation<double> _pulseAnimation;
  late Animation<double> _rotationAnimation;
  
  Timer? _timer;
  int _secondsElapsed = 0;
  int _countdownSeconds = 60; // Start countdown from 60 seconds
  String _statusMessage = 'Please wait.';
  bool _isProcessing = true;

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
      if (mounted && _isProcessing) {
        setState(() {
          _secondsElapsed++;
          if (_countdownSeconds > 0) {
            _countdownSeconds--;
          }
        });
      }
    });
  }

  Future<void> _generateCover() async {
    try {
      setState(() {
        _statusMessage = 'Downloading images...';
      });

      await Future.delayed(const Duration(seconds: 1)); // Small delay for UX

      setState(() {
        _statusMessage = 'AI is creating your personalized cover...';
      });

      // Call the direct AI service
      final aiService = AiDirectService();
      final generatedImageUrl = await aiService.generatePersonalizedCover(
        bookId: widget.book.id,
        bookName: widget.book.name,
        childImageUrl: widget.childImageUrl,
        childName: widget.childName,
        childImageBase64: widget.childImageBase64,
        childImageMime: widget.childImageMime,
      );

      if (!mounted) return;
      
      setState(() {
        _isProcessing = false;
        _statusMessage = 'Generation completed!';
      });
      
      _timer?.cancel();
      
      // Small delay to show completion message
      await Future.delayed(const Duration(seconds: 1));
      
      // Navigate to preview page
      if (mounted) {
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(
            builder: (_) => PreviewBookPage(
              generatedImageUrl: generatedImageUrl,
              book: widget.book,
              childName: widget.childName,
              childAge: widget.childAge,
              childImageUrl: widget.childImageUrl,
              selectedLanguage: widget.selectedLanguage ?? 'English',
            ),
          ),
        );
      }
    } catch (e) {
      if (!mounted) return;
      
      setState(() {
        _isProcessing = false;
        _statusMessage = 'Generation failed';
      });
      
      _timer?.cancel();
      
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Failed to generate cover: $e'),
          duration: const Duration(seconds: 5),
        ),
      );
      
      // Go back after showing error
      await Future.delayed(const Duration(seconds: 2));
      if (mounted) {
        Navigator.of(context).pop();
      }
    }
  }

  @override
  void dispose() {
    _pulseController.dispose();
    _rotationController.dispose();
    _timer?.cancel();
    super.dispose();
  }

  String _formatTime(int seconds) {
    final minutes = seconds ~/ 60;
    final remainingSeconds = seconds % 60;
    return '${minutes.toString().padLeft(2, '0')}:${remainingSeconds.toString().padLeft(2, '0')}';
  }

  Widget _buildPreviewImage(String imageUrl) {
    return Container(
      height: 120,
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
            // Background image
            Positioned.fill(
              child: CachedNetworkImage(
                imageUrl: imageUrl,
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
                    child: Icon(Icons.error, color: Colors.grey),
                  ),
                ),
              ),
            ),
            
            // Blur overlay
            Positioned.fill(
              child: BackdropFilter(
                filter: ImageFilter.blur(sigmaX: 3, sigmaY: 3),
                child: Container(
                  decoration: BoxDecoration(
                    color: Colors.black.withOpacity(0.3),
                  ),
                ),
              ),
            ),
            
            // Eye icon overlay
            Center(
              child: Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: Colors.white.withOpacity(0.2),
                  border: Border.all(
                    color: Colors.white.withOpacity(0.5),
                    width: 1,
                  ),
                ),
                child: Icon(
                  Icons.visibility_off,
                  color: Colors.white.withOpacity(0.8),
                  size: 20,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F3FF),
      body: SafeArea(
        child: SingleChildScrollView(
          child: Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              children: [
                // Header
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
                    const SizedBox(width: 48),
                  ],
                ),
                
                const SizedBox(height: 24),
                
                // Main content
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
                        // Background gradient
                        Positioned.fill(
                          child: Container(
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                begin: Alignment.topLeft,
                                end: Alignment.bottomRight,
                                colors: [
                                  Color(0xFFE8D5FF),
                                  Color(0xFFD1B3FF),
                                ],
                              ),
                            ),
                            child: const Center(
                              child: CircularProgressIndicator(),
                            ),
                          ),
                        ),
                        
                        // Blur effect
                        Positioned.fill(
                          child: BackdropFilter(
                            filter: ImageFilter.blur(sigmaX: 8, sigmaY: 8),
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
                            ),
                          ),
                        ),
                        
                        // Content overlay
                        Positioned.fill(
                          child: Padding(
                            padding: const EdgeInsets.all(24.0),
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                const Spacer(),
                                
                                // Main message
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
                                
                                Text(
                                  _statusMessage,
                                  style: GoogleFonts.tajawal(
                                    fontSize: 16,
                                    color: Colors.white.withOpacity(0.9),
                                  ),
                                  textAlign: TextAlign.center,
                                ),
                                
                                const SizedBox(height: 40),
                                
                                // Countdown circle
                                AnimatedBuilder(
                                  animation: _pulseAnimation,
                                  builder: (context, child) {
                                    return Transform.scale(
                                      scale: _pulseAnimation.value,
                                      child: Container(
                                        width: 120,
                                        height: 120,
                                        decoration: BoxDecoration(
                                          shape: BoxShape.circle,
                                          color: Colors.white.withOpacity(0.1),
                                          border: Border.all(
                                            color: Colors.white.withOpacity(0.3),
                                            width: 2,
                                          ),
                                        ),
                                        child: Center(
                                          child: Text(
                                            '$_countdownSeconds',
                                            style: GoogleFonts.tajawal(
                                              fontSize: 36,
                                              fontWeight: FontWeight.bold,
                                              color: Colors.white,
                                            ),
                                          ),
                                        ),
                                      ),
                                    );
                                  },
                                ),
                                
                                const SizedBox(height: 40),
                                
                                // Progress bar
                                if (_isProcessing) ...[
                                  Container(
                                    width: double.infinity,
                                    height: 4,
                                    decoration: BoxDecoration(
                                      color: Colors.white.withOpacity(0.3),
                                      borderRadius: BorderRadius.circular(2),
                                    ),
                                    child: FractionallySizedBox(
                                      alignment: Alignment.centerLeft,
                                      widthFactor: _countdownSeconds > 0 ? (60 - _countdownSeconds) / 60 : 1.0,
                                      child: Container(
                                        decoration: BoxDecoration(
                                          color: Colors.white,
                                          borderRadius: BorderRadius.circular(2),
                                        ),
                                      ),
                                    ),
                                  ),
                                ],
                                
                                const Spacer(),
                                
                                // Success state
                                if (!_isProcessing && _statusMessage == 'Generation completed!') ...[
                                  const Icon(
                                    Icons.check_circle,
                                    color: Colors.green,
                                    size: 48,
                                  ),
                                ],
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                
                const SizedBox(height: 20),
                
                // Preview images section
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.95),
                    borderRadius: BorderRadius.circular(16),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.1),
                        blurRadius: 20,
                        offset: const Offset(0, 8),
                      ),
                    ],
                  ),
                  child: Column(
                    children: [
                      // Preview images grid
                      Row(
                        children: [
                          Expanded(
                            child: _buildPreviewImage(
                              'https://miplbkihtavbnxgznudj.supabase.co/storage/v1/object/public/product-media/products/new/1AEORo0ORZ9RdJH8rFMPD9x89VzAdy-metaQ2hpbGRzLVNtaWxlLVNraW50b25lczEucG5n--blurred.png',
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: _buildPreviewImage(
                              'https://miplbkihtavbnxgznudj.supabase.co/storage/v1/object/public/product-media/products/new/7HT71KMqMIZrtY77mxsfT0UinRvt13-metaQ2hpbGRzLVNtaWxlLVNraW50b25lczQucG5n--blurred.png',
                            ),
                          ),
                        ],
                      ),
                      
                      const SizedBox(height: 12),
                      
                      Row(
                        children: [
                          Expanded(
                            child: _buildPreviewImage(
                              'https://miplbkihtavbnxgznudj.supabase.co/storage/v1/object/public/product-media/products/new/dIdUBTa9hDyWtKvQSGsF60cTgRYx0I-metaQ2hpbGRzLVNtaWxlLVNraW50b25lczE1LnBuZw==--blurred.png',
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: _buildPreviewImage(
                              'https://miplbkihtavbnxgznudj.supabase.co/storage/v1/object/public/product-media/products/new/iLjIVoazmUhpB3LhhRRcKdBO9uNteD-metaQ2hpbGRzLVNtaWxlLVNraW50b25lczE0LnBuZw==--blurred.png',
                            ),
                          ),
                        ],
                      ),
                      
                      const SizedBox(height: 16),
                      
                      // Description text
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: Colors.grey.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Row(
                          children: [
                            Icon(
                              Icons.visibility_off,
                              color: Colors.grey[600],
                              size: 20,
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Text(
                                'The full book will be generated completely after your purchase. Go ahead and unlock it.',
                                style: GoogleFonts.tajawal(
                                  fontSize: 14,
                                  color: Colors.grey[700],
                                  height: 1.4,
                                ),
                                textAlign: TextAlign.left,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
