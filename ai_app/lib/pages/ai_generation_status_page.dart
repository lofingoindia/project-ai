import 'dart:async';
import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../services/ai_queue_service.dart';
import '../models/book.dart';
import 'preview_book_page.dart';

class AiGenerationStatusPage extends StatefulWidget {
  final Book book;
  final String childName;
  final int childAge;
  final String queueId;

  const AiGenerationStatusPage({
    Key? key,
    required this.book,
    required this.childName,
    required this.childAge,
    required this.queueId,
  }) : super(key: key);

  @override
  State<AiGenerationStatusPage> createState() => _AiGenerationStatusPageState();
}

class _AiGenerationStatusPageState extends State<AiGenerationStatusPage>
    with TickerProviderStateMixin {
  final AiQueueService _aiService = AiQueueService();
  
  late AnimationController _pulseController;
  late AnimationController _rotationController;
  late Animation<double> _pulseAnimation;
  late Animation<double> _rotationAnimation;
  
  StreamSubscription? _statusSubscription;
  Timer? _timer;
  int _secondsElapsed = 0;
  
  String _status = 'pending';
  String _statusMessage = 'Your request is in queue...';
  String? _generatedImageUrl;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    
    // Setup animations
    _pulseController = AnimationController(
      duration: const Duration(milliseconds: 2000),
      vsync: this,
    );
    _pulseAnimation = Tween<double>(begin: 0.8, end: 1.1).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );
    
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
    _watchStatus();
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

  void _watchStatus() {
    _statusSubscription = _aiService
        .watchGenerationStatus(widget.queueId)
        .listen((data) {
      if (mounted) {
        setState(() {
          _status = data['status'] ?? 'pending';
          _generatedImageUrl = data['generated_image_url'];
          _errorMessage = data['error_message'];
          
          switch (_status) {
            case 'pending':
              _statusMessage = 'Your request is in queue...';
              break;
            case 'processing':
              _statusMessage = 'AI is working its magic...';
              break;
            case 'completed':
              _statusMessage = 'Generation completed!';
              _timer?.cancel();
              _navigateToPreview();
              break;
            case 'failed':
              _statusMessage = 'Generation failed';
              _timer?.cancel();
              break;
          }
        });
      }
    });
  }

  void _navigateToPreview() {
    if (_generatedImageUrl != null) {
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(
          builder: (_) => PreviewBookPage(
            generatedImageUrl: _generatedImageUrl!,
          ),
        ),
      );
    }
  }

  void _retryGeneration() async {
    try {
      await _aiService.retryGeneration(widget.queueId);
      setState(() {
        _status = 'pending';
        _statusMessage = 'Retrying generation...';
        _errorMessage = null;
      });
      _startTimer();
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to retry: $e')),
      );
    }
  }

  @override
  void dispose() {
    _pulseController.dispose();
    _rotationController.dispose();
    _statusSubscription?.cancel();
    _timer?.cancel();
    super.dispose();
  }

  String _formatTime(int seconds) {
    final minutes = seconds ~/ 60;
    final remainingSeconds = seconds % 60;
    return '${minutes.toString().padLeft(2, '0')}:${remainingSeconds.toString().padLeft(2, '0')}';
  }

  @override
  Widget build(BuildContext context) {
    final String coverUrl = widget.book.coverImageUrl.isNotEmpty
        ? widget.book.coverImageUrl
        : (widget.book.displayImage.isNotEmpty
            ? widget.book.displayImage
            : (widget.book.allImages.isNotEmpty ? widget.book.allImages.first : ''));

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
                        // Background image
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
                                child: Icon(Icons.error, color: Colors.grey),
                              ),
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
                                // AI Icon with animation
                                AnimatedBuilder(
                                  animation: _pulseAnimation,
                                  child: AnimatedBuilder(
                                    animation: _rotationAnimation,
                                    child: Container(
                                      width: 80,
                                      height: 80,
                                      decoration: BoxDecoration(
                                        color: Colors.white.withOpacity(0.2),
                                        shape: BoxShape.circle,
                                        border: Border.all(
                                          color: Colors.white.withOpacity(0.3),
                                          width: 2,
                                        ),
                                      ),
                                      child: const Icon(
                                        Icons.auto_awesome,
                                        color: Colors.white,
                                        size: 40,
                                      ),
                                    ),
                                    builder: (context, child) {
                                      return Transform.rotate(
                                        angle: _rotationAnimation.value * 2 * 3.14159,
                                        child: child,
                                      );
                                    },
                                  ),
                                  builder: (context, child) {
                                    return Transform.scale(
                                      scale: _pulseAnimation.value,
                                      child: child,
                                    );
                                  },
                                ),
                                
                                const SizedBox(height: 24),
                                
                                Text(
                                  'Your book is just one moment away...',
                                  style: GoogleFonts.tajawal(
                                    fontSize: 18,
                                    fontWeight: FontWeight.w600,
                                    color: Colors.white,
                                  ),
                                  textAlign: TextAlign.center,
                                ),
                                
                                const SizedBox(height: 8),
                                
                                Text(
                                  _statusMessage,
                                  style: GoogleFonts.tajawal(
                                    fontSize: 14,
                                    color: Colors.white.withOpacity(0.8),
                                  ),
                                  textAlign: TextAlign.center,
                                ),
                                
                                const SizedBox(height: 24),
                                
                                // Progress indicator
                                if (_status == 'pending' || _status == 'processing') ...[
                                  Container(
                                    width: double.infinity,
                                    height: 6,
                                    decoration: BoxDecoration(
                                      color: Colors.white.withOpacity(0.2),
                                      borderRadius: BorderRadius.circular(3),
                                    ),
                                    child: LinearProgressIndicator(
                                      backgroundColor: Colors.transparent,
                                      valueColor: AlwaysStoppedAnimation<Color>(
                                        Theme.of(context).primaryColor,
                                      ),
                                    ),
                                  ),
                                  
                                  const SizedBox(height: 16),
                                  
                                  Text(
                                    'Elapsed: ${_formatTime(_secondsElapsed)}',
                                    style: GoogleFonts.tajawal(
                                      fontSize: 12,
                                      color: Colors.white.withOpacity(0.7),
                                    ),
                                  ),
                                ],
                                
                                // Error state
                                if (_status == 'failed') ...[
                                  const Icon(
                                    Icons.error_outline,
                                    color: Colors.redAccent,
                                    size: 48,
                                  ),
                                  const SizedBox(height: 16),
                                  Text(
                                    _errorMessage ?? 'Generation failed',
                                    style: GoogleFonts.tajawal(
                                      fontSize: 14,
                                      color: Colors.redAccent,
                                    ),
                                    textAlign: TextAlign.center,
                                  ),
                                  const SizedBox(height: 16),
                                  ElevatedButton(
                                    onPressed: _retryGeneration,
                                    child: const Text('Retry'),
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
                
                const SizedBox(height: 24),
                
                // Info card
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.05),
                        blurRadius: 10,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: Column(
                    children: [
                      Text(
                        'Personalizing for ${widget.childName}',
                        style: GoogleFonts.tajawal(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                          color: Colors.black87,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Our AI is carefully creating a personalized version of this book just for ${widget.childName}. This process usually takes 30-60 seconds.',
                        style: GoogleFonts.tajawal(
                          fontSize: 14,
                          color: Colors.grey[600],
                        ),
                        textAlign: TextAlign.center,
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

