import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'dart:convert';
import 'dart:io' show File;
import '../services/complete_book_service.dart';

class CompleteBookPersonalizationPage extends StatefulWidget {
  final String bookTitle;
  final List<String> bookPageUrls;
  
  const CompleteBookPersonalizationPage({
    Key? key,
    required this.bookTitle,
    required this.bookPageUrls,
  }) : super(key: key);

  @override
  State<CompleteBookPersonalizationPage> createState() => _CompleteBookPersonalizationPageState();
}

class _CompleteBookPersonalizationPageState extends State<CompleteBookPersonalizationPage> {
  final CompleteBookPersonalizationService _bookService = CompleteBookPersonalizationService();
  final ImagePicker _imagePicker = ImagePicker();
  
  // Form fields
  String _childName = '';
  XFile? _childImage; // use XFile to support web and mobile
  bool _isProcessing = false;
  bool _isAnalyzing = false;
  
  // Results
  CompleteBookResult? _bookResult;
  BookAnalysisResult? _analysisResult;
  String? _errorMessage;
  
  // Processing options
  int _batchSize = 3;
  String _quality = 'high';
  bool _styleConsistency = true;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFE8D5FF),
      appBar: AppBar(
        title: Text(
          'Complete Book Personalization',
          style: GoogleFonts.tajawal(
            fontSize: 20,
            fontWeight: FontWeight.bold,
            color: Colors.white,
          ),
        ),
        backgroundColor: const Color(0xFF784D9C),
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Book info card
            _buildBookInfoCard(),
            const SizedBox(height: 20),
            
            // Child information section
            _buildChildInfoSection(),
            const SizedBox(height: 20),
            
            // Processing options
            _buildProcessingOptions(),
            const SizedBox(height: 20),
            
            // Action buttons
            _buildActionButtons(),
            const SizedBox(height: 20),
            
            // Results section
            if (_analysisResult != null) _buildAnalysisResults(),
            if (_bookResult != null) _buildBookResults(),
            if (_errorMessage != null) _buildErrorMessage(),
          ],
        ),
      ),
    );
  }

  Widget _buildBookInfoCard() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                Icons.book,
                color: const Color(0xFF784D9C),
                size: 24,
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  widget.bookTitle,
                  style: GoogleFonts.tajawal(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: const Color(0xFF784D9C),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            'Total Pages: ${widget.bookPageUrls.length}',
            style: GoogleFonts.tajawal(
              fontSize: 14,
              color: Colors.grey[600],
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'This will create a complete personalized book where your child appears as the main character throughout the entire story.',
            style: GoogleFonts.tajawal(
              fontSize: 14,
              color: Colors.grey[700],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildChildInfoSection() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Child Information',
            style: GoogleFonts.tajawal(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: const Color(0xFF784D9C),
            ),
          ),
          const SizedBox(height: 16),
          
          // Child name input
          TextField(
            decoration: InputDecoration(
              labelText: 'Child\'s Name',
              hintText: 'Enter your child\'s name',
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
              ),
              prefixIcon: const Icon(Icons.person),
            ),
            onChanged: (value) {
              setState(() {
                _childName = value;
              });
            },
          ),
          const SizedBox(height: 16),
          
          // Child image picker
          Row(
            children: [
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: _pickChildImage,
                  icon: const Icon(Icons.camera_alt),
                  label: Text(_childImage == null ? 'Select Child Photo' : 'Change Photo'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF784D9C),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                ),
              ),
              if (_childImage != null) ...[
                const SizedBox(width: 12),
                FutureBuilder<ImageProvider>(
                  future: _childImageProvider(),
                  builder: (context, snapshot) {
                    if (snapshot.connectionState != ConnectionState.done) {
                      return Container(
                        width: 60,
                        height: 60,
                        child: const Center(child: CircularProgressIndicator(strokeWidth: 2)),
                      );
                    }
                    final provider = snapshot.data ?? const AssetImage('assets/logo.png');
                    return Container(
                      width: 60,
                      height: 60,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(12),
                        image: DecorationImage(
                          image: provider,
                          fit: BoxFit.cover,
                        ),
                      ),
                    );
                  },
                ),
              ],
            ],
          ),
        ],
      ),
    );
  }


  Future<ImageProvider> _childImageProvider() async {
    if (_childImage == null) return const AssetImage('assets/logo.png');
    if (kIsWeb) {
      final bytes = await _childImage!.readAsBytes();
      return MemoryImage(bytes);
    } else {
      return FileImage(File(_childImage!.path));
    }
  }
  Widget _buildProcessingOptions() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Processing Options',
            style: GoogleFonts.tajawal(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: const Color(0xFF784D9C),
            ),
          ),
          const SizedBox(height: 16),
          
          // Batch size
          Text(
            'Batch Size: $_batchSize pages',
            style: GoogleFonts.tajawal(fontSize: 14),
          ),
          Slider(
            value: _batchSize.toDouble(),
            min: 1,
            max: 5,
            divisions: 4,
            onChanged: (value) {
              setState(() {
                _batchSize = value.round();
              });
            },
            activeColor: const Color(0xFF784D9C),
          ),
          
          const SizedBox(height: 16),
          
          // Quality
          Text(
            'Quality: ${_quality.toUpperCase()}',
            style: GoogleFonts.tajawal(fontSize: 14),
          ),
          Row(
            children: [
              Expanded(
                child: RadioListTile<String>(
                  title: Text('High', style: GoogleFonts.tajawal(fontSize: 12)),
                  value: 'high',
                  groupValue: _quality,
                  onChanged: (value) {
                    setState(() {
                      _quality = value!;
                    });
                  },
                  activeColor: const Color(0xFF784D9C),
                ),
              ),
              Expanded(
                child: RadioListTile<String>(
                  title: Text('Medium', style: GoogleFonts.tajawal(fontSize: 12)),
                  value: 'medium',
                  groupValue: _quality,
                  onChanged: (value) {
                    setState(() {
                      _quality = value!;
                    });
                  },
                  activeColor: const Color(0xFF784D9C),
                ),
              ),
            ],
          ),
          
          const SizedBox(height: 16),
          
          // Style consistency
          CheckboxListTile(
            title: Text(
              'Maintain Style Consistency',
              style: GoogleFonts.tajawal(fontSize: 14),
            ),
            subtitle: Text(
              'Keep the same artistic style across all pages',
              style: GoogleFonts.tajawal(fontSize: 12, color: Colors.grey[600]),
            ),
            value: _styleConsistency,
            onChanged: (value) {
              setState(() {
                _styleConsistency = value!;
              });
            },
            activeColor: const Color(0xFF784D9C),
          ),
        ],
      ),
    );
  }

  Widget _buildActionButtons() {
    return Row(
      children: [
        Expanded(
          child: ElevatedButton.icon(
            onPressed: _isAnalyzing ? null : _analyzeBook,
            icon: _isAnalyzing 
                ? const SizedBox(
                    width: 16,
                    height: 16,
                    child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                  )
                : const Icon(Icons.analytics),
            label: Text(_isAnalyzing ? 'Analyzing...' : 'Analyze Book'),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.blue,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 16),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: ElevatedButton.icon(
            onPressed: _canProcessBook() && !_isProcessing ? _processCompleteBook : null,
            icon: _isProcessing 
                ? const SizedBox(
                    width: 16,
                    height: 16,
                    child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                  )
                : const Icon(Icons.auto_stories),
            label: Text(_isProcessing ? 'Processing...' : 'Create Book'),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF784D9C),
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 16),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildAnalysisResults() {
    if (_analysisResult?.bookAnalysis == null) return const SizedBox.shrink();
    
    final analysis = _analysisResult!.bookAnalysis!;
    
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.blue[50],
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.blue[200]!),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Book Analysis Results',
            style: GoogleFonts.tajawal(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: Colors.blue[800],
            ),
          ),
          const SizedBox(height: 12),
          Text('Total Pages: ${analysis.totalPages}'),
          Text('Main Character: ${analysis.mainCharacter.description}'),
          Text('Character Appearances: ${analysis.characterConsistency.totalAppearances}'),
          Text('Style: ${analysis.bookStyle.dominantStyle}'),
          Text('Consistency: ${(analysis.characterConsistency.consistency * 100).toStringAsFixed(1)}%'),
        ],
      ),
    );
  }

  Widget _buildBookResults() {
    if (_bookResult?.personalizedBook == null) return const SizedBox.shrink();
    
    final book = _bookResult!.personalizedBook!;
    
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.green[50],
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.green[200]!),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Personalized Book Created!',
            style: GoogleFonts.tajawal(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: Colors.green[800],
            ),
          ),
          const SizedBox(height: 12),
          Text('Book Title: ${book.metadata.title}'),
          Text('Child Name: ${book.metadata.childName}'),
          Text('Total Pages: ${book.metadata.totalPages}'),
          Text('Successful Pages: ${book.metadata.successfulPages}'),
          Text('Failed Pages: ${book.metadata.failedPages}'),
          Text('Processing Time: ${_bookResult!.processingTime}ms'),
          Text('Character Replacements: ${_bookResult!.characterReplacements}'),
          
          const SizedBox(height: 16),
          ElevatedButton.icon(
            onPressed: () {
              // TODO: Implement book viewing/downloading
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Book viewing feature coming soon!')),
              );
            },
            icon: const Icon(Icons.visibility),
            label: const Text('View Personalized Book'),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.green,
              foregroundColor: Colors.white,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildErrorMessage() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.red[50],
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.red[200]!),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Error',
            style: GoogleFonts.tajawal(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: Colors.red[800],
            ),
          ),
          const SizedBox(height: 8),
          Text(
            _errorMessage!,
            style: GoogleFonts.tajawal(
              fontSize: 14,
              color: Colors.red[700],
            ),
          ),
        ],
      ),
    );
  }

  bool _canProcessBook() {
    return _childName.isNotEmpty && _childImage != null;
  }

  Future<void> _pickChildImage() async {
    try {
      final XFile? image = await _imagePicker.pickImage(
        source: ImageSource.gallery,
        maxWidth: 1024,
        maxHeight: 1024,
        imageQuality: 85,
      );
      
      if (image != null) {
        setState(() {
          _childImage = image;
          _errorMessage = null;
        });
      }
    } catch (e) {
      setState(() {
        _errorMessage = 'Failed to pick image: $e';
      });
    }
  }

  Future<void> _analyzeBook() async {
    setState(() {
      _isAnalyzing = true;
      _errorMessage = null;
    });

    try {
      final result = await _bookService.analyzeBook(
        bookPageUrls: widget.bookPageUrls,
      );

      setState(() {
        _analysisResult = result;
        _isAnalyzing = false;
      });

      if (!result.success) {
        setState(() {
          _errorMessage = result.error ?? 'Analysis failed';
        });
      }
    } catch (e) {
      setState(() {
        _isAnalyzing = false;
        _errorMessage = 'Analysis failed: $e';
      });
    }
  }

  Future<void> _processCompleteBook() async {
    if (!_canProcessBook()) return;

    setState(() {
      _isProcessing = true;
      _errorMessage = null;
    });

    try {
      final childImageArg = kIsWeb
          ? base64Encode(await _childImage!.readAsBytes())
          : _childImage!.path;

      final result = await _bookService.generatePersonalizedBook(
        bookPageUrls: widget.bookPageUrls,
        childImageUrl: childImageArg, // on web this will be base64, on mobile a file path or url
        childName: _childName,
        bookTitle: widget.bookTitle,
        processingOptions: {
          'batchSize': _batchSize,
          'quality': _quality,
          'styleConsistency': _styleConsistency,
        },
      );

      setState(() {
        _bookResult = result;
        _isProcessing = false;
      });

      if (!result.success) {
        setState(() {
          _errorMessage = result.error ?? 'Book processing failed';
        });
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Book created successfully! ${result.characterReplacements} characters replaced.'),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      setState(() {
        _isProcessing = false;
        _errorMessage = 'Book processing failed: $e';
      });
    }
  }
}
