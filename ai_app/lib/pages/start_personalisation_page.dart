import 'package:flutter/material.dart';
import 'dart:convert';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';
import 'dart:typed_data';
import 'package:http/http.dart' as http;
import '../services/ai_service.dart';
import '../services/ai_direct_service.dart';
import '../services/localization_service.dart';
import '../config/ai_keys.dart';
import 'preview_book_page.dart';
import 'loading_page.dart';
import 'simple_loading_page.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/book.dart';
import '../config/story_cover_images.dart';

// Responsive helper functions
bool _isMobile(BuildContext context) => MediaQuery.of(context).size.width < 650;
bool _isTablet(BuildContext context) => MediaQuery.of(context).size.width >= 650 && MediaQuery.of(context).size.width < 1100;

double _getMaxWidth(BuildContext context) {
  final width = MediaQuery.of(context).size.width;
  if (_isMobile(context)) return width;
  if (_isTablet(context)) return 900;
  return 1000;
}

EdgeInsets _getResponsivePadding(BuildContext context) {
  if (_isMobile(context)) return const EdgeInsets.symmetric(horizontal: 20);
  if (_isTablet(context)) return const EdgeInsets.symmetric(horizontal: 40);
  final width = MediaQuery.of(context).size.width;
  final padding = (width - 1000) / 2;
  return EdgeInsets.symmetric(horizontal: padding > 40 ? padding : 40);
}

class StartPersonalisationPage extends StatefulWidget {
  final Book book;
  final String bookTitle;
  final String bookDescription;
  final Color accentColor;

  const StartPersonalisationPage({
    Key? key,
    required this.book,
    required this.bookTitle,
    required this.bookDescription,
    required this.accentColor,
  }) : super(key: key);

  @override
  State<StartPersonalisationPage> createState() => _StartPersonalisationPageState();
}

class _StartPersonalisationPageState extends State<StartPersonalisationPage> {
  final TextEditingController _childNameController = TextEditingController();
  final TextEditingController _childAgeController = TextEditingController();
  String _selectedLanguage = 'Select Language'; // Set default to English to fix the enable issue
  final ImagePicker _picker = ImagePicker();
  XFile? _selectedImage;
  bool _processing = false;
  bool _uploading = false;
  Uint8List? _selectedImageBytes;
  String? _uploadedImageUrl; // Supabase public or signed URL

  bool get _isReadyToPreview {
    return _selectedImageBytes != null &&
        _selectedLanguage.isNotEmpty &&
        _childNameController.text.trim().isNotEmpty &&
        _childAgeController.text.trim().isNotEmpty &&
        !_uploading;
  }

  final List<String> _languages = [
    'Select Language',
    'English',
    'العربية'
  ];

  @override
  void dispose() {
    _childNameController.dispose();
    _childAgeController.dispose();
    super.dispose();
  }

  Future<void> _pickImage() async {
    try {
      final XFile? image = await _picker.pickImage(
        source: ImageSource.gallery,
        maxWidth: 1024,
        maxHeight: 1024,
        imageQuality: 80,
      );
      
      if (image != null) {
        final bytes = await image.readAsBytes();
        setState(() {
          _selectedImage = image;
          _selectedImageBytes = bytes;
        });
        await _uploadToSupabase(bytes, image.path.split('.').last.toLowerCase());
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('${'start_personalisation_error_picking_image'.tr}$e')),
      );
    }
  }

  String _inferContentTypeFromExt(String ext) {
    switch (ext) {
      case 'png':
        return 'image/png';
      case 'webp':
        return 'image/webp';
      case 'gif':
        return 'image/gif';
      case 'bmp':
        return 'image/bmp';
      case 'heic':
      case 'heif':
        return 'image/heic';
      default:
        return 'image/jpeg';
    }
  }

  Future<void> _uploadToSupabase(Uint8List bytes, String ext) async {
    setState(() { _uploading = true; });
    final supabase = Supabase.instance.client;
    
    // Check if user is authenticated before attempting upload
    final userId = supabase.auth.currentUser?.id;
    
    if (userId == null) {
      // User not logged in - skip upload but keep local bytes for AI processing
      debugPrint('User not authenticated - skipping upload to Supabase');
      if (mounted) setState(() { _uploading = false; });
      return;
    }
    
    final bucket = 'user_uploads';
    final filePath = 'users/${DateTime.now().millisecondsSinceEpoch}.${ext.isEmpty ? 'jpg' : ext}';
    try {
      await supabase.storage.from(bucket).uploadBinary(
        filePath,
        bytes,
        fileOptions: FileOptions(contentType: _inferContentTypeFromExt(ext)),
      );
      // Try public URL first
      String url = supabase.storage.from(bucket).getPublicUrl(filePath);
      if (url.isEmpty) {
        // Fallback to signed URL for 1 hour
        url = await supabase.storage.from(bucket).createSignedUrl(filePath, 3600);
      }
      setState(() { _uploadedImageUrl = url; });
    } catch (e) {
      // Surface error but keep local bytes for AI flow
      debugPrint('Upload failed: $e');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('${'start_personalisation_upload_failed'.tr}$e')),
      );
    } finally {
      if (mounted) setState(() { _uploading = false; });
    }
  }

  void _showPhotoInfo() {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: Text(
            'start_personalisation_photo_info_title'.tr,
            style: GoogleFonts.tajawal(fontWeight: FontWeight.bold),
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('start_personalisation_recommended_formats'.tr, style: GoogleFonts.tajawal(fontWeight: FontWeight.w600)),
              Text('start_personalisation_formats_list'.tr, style: GoogleFonts.tajawal()),
              SizedBox(height: 8),
              Text('start_personalisation_recommended_dimensions'.tr, style: GoogleFonts.tajawal(fontWeight: FontWeight.w600)),
              Text('start_personalisation_min_dimensions'.tr, style: GoogleFonts.tajawal()),
              Text('start_personalisation_max_dimensions'.tr, style: GoogleFonts.tajawal()),
              SizedBox(height: 8),
              Text('start_personalisation_tips_best_results'.tr, style: GoogleFonts.tajawal(fontWeight: FontWeight.w600)),
              Text('start_personalisation_tip_clear_photos'.tr, style: GoogleFonts.tajawal()),
              Text('start_personalisation_tip_face_visible'.tr, style: GoogleFonts.tajawal()),
              Text('start_personalisation_tip_avoid_blurry'.tr, style: GoogleFonts.tajawal()),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: Text('start_personalisation_got_it'.tr, style: GoogleFonts.tajawal(color: widget.accentColor)),
            ),
          ],
        );
      },
    );
  }

  // Helper function to get the correct cover image for each story
  String _getStoryCoverImage() {
    return StoryCoverImages.getCoverImage(widget.book.name, widget.book.id);
  }

  Future<void> _previewBook() async {
    if (_selectedImage == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('start_personalisation_please_upload_image'.tr)),
      );
      return;
    }

    if (_childNameController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('start_personalisation_please_enter_name'.tr)),
      );
      return;
    }

    if (_childAgeController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('start_personalisation_please_enter_age'.tr)),
      );
      return;
    }

    if (_selectedLanguage.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('start_personalisation_please_select_language'.tr)),
      );
      return;
    }
    setState(() { _processing = true; });
    try {
      print('📚 Book: ${widget.book.name} (ID: ${widget.book.id})');
      print('🎨 Generating custom cover with child image and story-specific prompt');

      // 3) Read child image bytes
      final Uint8List childBytes = await _selectedImage!.readAsBytes();

      // 3a) Ensure we have an uploaded image URL in Supabase (upload already attempted on pick)
      // This is optional - if user is not logged in, we'll still have local bytes for AI processing
      if (_uploadedImageUrl == null) {
        await _uploadToSupabase(childBytes, _selectedImage!.path.split('.').last.toLowerCase());
      }
      
      // Even if upload failed, we can still proceed with local image bytes

      // 3b) Save a record to Supabase DB (child_image table) - only if user is logged in
      try {
        final supabase = Supabase.instance.client;
        final userId = supabase.auth.currentUser?.id;
        
        // Only save to database if user is authenticated
        if (userId != null) {
          await supabase.from('child_image').insert({
            'user_id': userId,
            'book_id': widget.book.id.toString(),
            'child_image_url': _uploadedImageUrl ?? '',
            'child_name': _childNameController.text.trim(),
            'child_age': int.tryParse(_childAgeController.text.trim()) ?? 0,
          });
        } else {
          debugPrint('User not authenticated - skipping database save for preview');
        }
      } catch (e) {
        // Non-blocking for preview flow
        debugPrint('Failed to insert child_image record: $e');
      }

      // 4) Prepare image data for AI processing
      final String imageBase64 = base64Encode(childBytes);
      final String imageMime = (() {
        final ext = _selectedImage!.path.split('.').last.toLowerCase();
        if (ext == 'jpg' || ext == 'jpeg') return 'image/jpeg';
        if (ext == 'png') return 'image/png';
        if (ext == 'webp') return 'image/webp';
        return 'image/jpeg';
      })();
      
      debugPrint('📤 Navigating to loading page with data:');
      debugPrint('   - Child Name: ${_childNameController.text.trim()}');
      debugPrint('   - Child Age: ${_childAgeController.text.trim()}');
      debugPrint('   - Image URL: ${_uploadedImageUrl ?? "(none - using base64)"}');
      debugPrint('   - Has Base64: ${imageBase64.isNotEmpty}');
      debugPrint('   - Language: ${_selectedLanguage == 'Select Language' ? 'English' : _selectedLanguage}');
      
      // 5) Navigate directly to simple loading page
      if (!mounted) return;
      await Navigator.of(context).push(
        MaterialPageRoute(
          builder: (_) => SimpleLoadingPage(
            book: widget.book,
            childName: _childNameController.text.trim(),
            childAge: int.tryParse(_childAgeController.text.trim()) ?? 0,
            childImageUrl: _uploadedImageUrl ?? '', // Can be empty if not logged in
            selectedLanguage: _selectedLanguage == 'Select Language' ? 'English' : _selectedLanguage,
            // ALWAYS pass base64 and mime - this is the primary image source
            childImageBase64: imageBase64,
            childImageMime: imageMime,
          ),
        ),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('${'start_personalisation_failed_generate_preview'.tr}$e')),
      );
    } finally {
      if (mounted) {
        setState(() { _processing = false; });
      }
    }
  }

  // Load customizable admin prompt from Supabase (optional table: admin_prompts)
  Future<String?> _loadAdminPrompt() async {
    try {
      final client = Supabase.instance.client;
      final res = await client.from('admin_prompts')
          .select('prompt')
          .eq('key', 'personalize_cover')
          .maybeSingle();
      if (res != null && res['prompt'] is String && (res['prompt'] as String).trim().isNotEmpty) {
        return res['prompt'] as String;
      }
    } catch (_) {}
    return null;
  }

  @override
  Widget build(BuildContext context) {
    final isMobile = _isMobile(context);
    final maxWidth = _getMaxWidth(context);
    
    return Scaffold(
      backgroundColor: isMobile ? Color.fromARGB(255, 188, 145, 240) : Colors.grey[50],
      appBar: AppBar(
        backgroundColor: isMobile ? Color.fromARGB(255, 185, 139, 240) : Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back, color: Colors.black),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          'start_personalisation_title'.tr,
          style: GoogleFonts.tajawal(
            color: Colors.black,
            fontSize: 18,
            fontWeight: FontWeight.w600,
          ),
        ),
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        child: Center(
          child: Container(
            constraints: BoxConstraints(maxWidth: maxWidth),
            padding: isMobile 
              ? EdgeInsets.all(20)
              : EdgeInsets.symmetric(horizontal: 40, vertical: 32),
            child: isMobile 
              ? _buildMobileLayout()
              : _buildWebLayout(),
          ),
        ),
      ),
    );
  }

  Widget _buildMobileLayout() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Tips section
        _buildTipsSection(),
        
        SizedBox(height: 32),
        
        // Upload photo section
        _buildUploadPhotoSection(),
        
        SizedBox(height: 32),
        
        // Name and age section
        Row(
          children: [
            Expanded(
              child: _buildInputField(
                'start_personalisation_child_first_name'.tr,
                _childNameController,
                'start_personalisation_enter_name'.tr,
              ),
            ),
            SizedBox(width: 16),
            Expanded(
              child: _buildInputField(
                'start_personalisation_child_age'.tr,
                _childAgeController,
                'start_personalisation_age_placeholder'.tr,
                isNumber: true,
              ),
            ),
          ],
        ),
        
        SizedBox(height: 24),
        
        // Language section
        _buildLanguageSection(),
        
        SizedBox(height: 32),
        
        // Preview button
        _buildPreviewButton(),
      ],
    );
  }

  Widget _buildWebLayout() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Page title
        Text(
          'start_personalisation_title'.tr,
          style: GoogleFonts.libreBaskerville(
            fontSize: 32,
            fontWeight: FontWeight.w600,
            color: Colors.black87,
          ),
        ),
        SizedBox(height: 8),
        Text(
          'Fill in the details below to personalize your child\'s story',
          style: GoogleFonts.tajawal(
            fontSize: 16,
            color: Colors.grey[600],
          ),
        ),
        
        SizedBox(height: 40),
        
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Left column - Tips and Upload
            Expanded(
              flex: 1,
              child: Column(
                children: [
                  _buildTipsSection(),
                  SizedBox(height: 24),
                  _buildUploadPhotoSection(),
                ],
              ),
            ),
            
            SizedBox(width: 32),
            
            // Right column - Form inputs
            Expanded(
              flex: 1,
              child: Container(
                padding: EdgeInsets.all(32),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.05),
                      blurRadius: 10,
                      offset: Offset(0, 4),
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Child Information',
                      style: GoogleFonts.tajawal(
                        fontSize: 20,
                        fontWeight: FontWeight.w600,
                        color: Colors.black87,
                      ),
                    ),
                    
                    SizedBox(height: 24),
                    
                    // Name field
                    _buildInputField(
                      'start_personalisation_child_first_name'.tr,
                      _childNameController,
                      'start_personalisation_enter_name'.tr,
                    ),
                    
                    SizedBox(height: 20),
                    
                    // Age field
                    _buildInputField(
                      'start_personalisation_child_age'.tr,
                      _childAgeController,
                      'start_personalisation_age_placeholder'.tr,
                      isNumber: true,
                    ),
                    
                    SizedBox(height: 20),
                    
                    // Language section
                    _buildLanguageSection(),
                    
                    SizedBox(height: 32),
                    
                    // Preview button
                    _buildPreviewButtonInline(),
                  ],
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildTipsSection() {
    final isMobile = _isMobile(context);
    
    return Container(
      padding: EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: isMobile 
          ? Border.all(color: Colors.grey[300]!, width: 2, style: BorderStyle.solid)
          : null,
        boxShadow: isMobile ? null : [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          Text(
            'start_personalisation_tips'.tr,
            style: GoogleFonts.tajawal(
              fontWeight: FontWeight.bold,
              fontSize: 16,
              color: Colors.black87,
            ),
          ),
          
          SizedBox(height: 20),
          
          // Bad examples (cross icons) - upper portion
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: [
              _buildExamplePhoto(
                Color(0xFFFFE6E6), // Light red background
                Colors.red,
                Icons.close,
                false,
                'assets/1c copy.png',
              ),
              _buildExamplePhoto(
                Color(0xFFFFE6E6), // Light red background
                Colors.red,
                Icons.close,
                false,
                'assets/2c copy.png',
              ),
              _buildExamplePhoto(
                Color(0xFFFFE6E6), // Light red background
                Colors.red,
                Icons.close,
                false,
                'assets/33c copy.png',
              ),
            ],
          ),
          
          SizedBox(height: 16),
          
          // Good examples (tick icons) - lower portion
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: [
              _buildExamplePhoto(
                Color(0xFFE6F7E6), // Light green background
                Colors.green,
                Icons.check,
                true,
                'assets/1t copy.png',
              ),
              _buildExamplePhoto(
                Color(0xFFE6F7E6), // Light green background
                Colors.green,
                Icons.check,
                true,
                'assets/22t copy.png',
              ),
              _buildExamplePhoto(
                Color(0xFFE6F7E6), // Light green background
                Colors.green,
                Icons.check,
                true,
                'assets/3t copy.png',
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildExamplePhoto(Color backgroundColor, Color iconColor, IconData icon, bool isGood, String imagePath) {
    return Container(
      width: 60,
      height: 60,
      decoration: BoxDecoration(
        color: backgroundColor,
        shape: BoxShape.circle,
        border: Border.all(color: Colors.grey[300]!, width: 1),
      ),
      child: Stack(
        children: [
          // Photo placeholder with actual image
          Center(
            child: Container(
              width: 56,
              height: 56,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                image: DecorationImage(
                  image: AssetImage(imagePath),
                  fit: BoxFit.cover,
                ),
              ),
            ),
          ),
          // Check/X icon
          Positioned(
            top: -2,
            right: -2,
            child: Container(
              width: 20,
              height: 20,
              decoration: BoxDecoration(
                color: iconColor,
                shape: BoxShape.circle,
                border: Border.all(color: Colors.white, width: 2),
              ),
              child: Icon(
                icon,
                size: 12,
                color: Colors.white,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildUploadPhotoSection() {
    final isMobile = _isMobile(context);
    
    return Container(
      width: double.infinity,
      padding: EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: isMobile 
          ? Border.all(color: Colors.grey[300]!, width: 2, style: BorderStyle.solid)
          : null,
        boxShadow: isMobile ? null : [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          Text(
            'start_personalisation_upload_photo'.tr,
            style: GoogleFonts.tajawal(
              fontSize: 16,
              fontWeight: FontWeight.w600,
              color: Colors.black87,
            ),
          ),
          
          SizedBox(height: 20),
          
          // Upload button
          ElevatedButton.icon(
            onPressed: _pickImage,
            icon: Icon(Icons.file_upload_outlined, color: Colors.white),
            label: Text(
              'start_personalisation_choose_image'.tr,
              style: GoogleFonts.tajawal(
                color: Colors.white,
                fontWeight: FontWeight.w600,
              ),
            ),
            style: ElevatedButton.styleFrom(
              backgroundColor: Color(0xFF784D9C),
              padding: EdgeInsets.symmetric(horizontal: 24, vertical: 12),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
              ),
            ),
          ),
          
          SizedBox(height: 16),
          
          // Photo info button
          TextButton.icon(
            onPressed: _showPhotoInfo,
            icon: Icon(Icons.info_outline, color: Colors.grey[600], size: 16),
            label: Text(
              'start_personalisation_photo_info'.tr,
              style: GoogleFonts.tajawal(
                color: Colors.grey[600],
                fontSize: 14,
                decoration: TextDecoration.underline,
              ),
            ),
          ),
          
          // Show selected image or uploaded preview if any
          if (_selectedImageBytes != null || _uploadedImageUrl != null) ...[
            SizedBox(height: 16),
            Container(
              width: 100,
              height: 100,
              decoration: BoxDecoration(
                color: Colors.grey[200],
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.grey[300]!),
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    if (_uploadedImageUrl != null)
                      Image.network(_uploadedImageUrl!, fit: BoxFit.cover)
                    else if (_selectedImageBytes != null)
                      Image.memory(_selectedImageBytes!, fit: BoxFit.cover),
                    if (_uploading)
                      Container(
                        color: Colors.black26,
                        child: Center(
                          child: SizedBox(
                            width: 22,
                            height: 22,
                            child: CircularProgressIndicator(strokeWidth: 2.0),
                          ),
                        ),
                      )
                    else
                      Positioned(
                        top: 4,
                        right: 4,
                        child: Container(
                          width: 20,
                          height: 20,
                          decoration: BoxDecoration(
                            color: Colors.green,
                            shape: BoxShape.circle,
                          ),
                          child: Icon(
                            Icons.check,
                            color: Colors.white,
                            size: 12,
                          ),
                        ),
                      ),
                  ],
                ),
              ),
            ),
            SizedBox(height: 8),
            Text(
              _uploading ? 'start_personalisation_uploading'.tr : 'start_personalisation_image_ready'.tr,
              style: GoogleFonts.tajawal(
                color: Colors.green,
                fontSize: 12,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildLanguageSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'start_personalisation_language'.tr,
          style: GoogleFonts.tajawal(
            fontSize: 16,
            fontWeight: FontWeight.w600,
            color: Colors.black87,
          ),
        ),
        
        SizedBox(height: 8),
        
        Container(
          width: double.infinity,
          padding: EdgeInsets.symmetric(horizontal: 16, vertical: 4),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: Colors.grey[300]!),
          ),
          child: DropdownButtonHideUnderline(
            child: DropdownButton<String>(
              value: _selectedLanguage,
              isExpanded: true,
              onChanged: (String? newValue) {
                if (newValue != null) {
                  setState(() {
                    _selectedLanguage = newValue;
                  });
                }
              },
              items: _languages.map<DropdownMenuItem<String>>((String value) {
                return DropdownMenuItem<String>(
                  value: value,
                  child: Text(
                    value == 'Select Language' ? 'start_personalisation_select_language'.tr : value,
                    style: GoogleFonts.tajawal(
                      fontSize: 16,
                      color: Colors.black87,
                    ),
                  ),
                );
              }).toList(),
              icon: Icon(Icons.keyboard_arrow_down, color: Colors.grey[600]),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildInputField(String label, TextEditingController controller, String hint, {bool isNumber = false}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: GoogleFonts.tajawal(
            fontSize: 16,
            fontWeight: FontWeight.w600,
            color: Colors.black87,
          ),
        ),
        
        SizedBox(height: 8),
        
        TextField(
          controller: controller,
          keyboardType: isNumber ? TextInputType.number : TextInputType.text,
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: GoogleFonts.tajawal(
              color: Colors.grey[500],
              fontSize: 16,
            ),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: BorderSide(color: Colors.grey[300]!),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: BorderSide(color: widget.accentColor, width: 2),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: BorderSide(color: Colors.grey[300]!),
            ),
            contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 16),
            filled: true,
            fillColor: Colors.white,
          ),
          style: GoogleFonts.tajawal(
            fontSize: 16,
            color: Colors.black87,
          ),
        ),
      ],
    );
  }

  Widget _buildPreviewButton() {
    return SizedBox(
      width: double.infinity,
      child: ElevatedButton(
        onPressed: _isReadyToPreview && !_processing && !_uploading ? _previewBook : null,
        style: ElevatedButton.styleFrom(
          backgroundColor: _isReadyToPreview && !_processing && !_uploading
              ?  const Color.fromARGB(255, 120, 77, 156)
              : Colors.grey[400],
          padding: EdgeInsets.symmetric(vertical: 16),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          elevation: 0,
        ),
        child: _processing
            ? SizedBox(
                width: 22,
                height: 22,
                child: CircularProgressIndicator(
                  strokeWidth: 2.4,
                  valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                ),
              )
            : Text(
                'start_personalisation_preview_book'.tr,
                style: GoogleFonts.tajawal(
                  color: Colors.white,
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                ),
              ),
      ),
    );
  }

  Widget _buildPreviewButtonInline() {
    return SizedBox(
      width: double.infinity,
      child: ElevatedButton(
        onPressed: _isReadyToPreview && !_processing && !_uploading ? _previewBook : null,
        style: ElevatedButton.styleFrom(
          backgroundColor: _isReadyToPreview && !_processing && !_uploading
              ?  const Color.fromARGB(255, 120, 77, 156)
              : Colors.grey[400],
          padding: EdgeInsets.symmetric(vertical: 18),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          elevation: 0,
        ),
        child: _processing
            ? SizedBox(
                width: 22,
                height: 22,
                child: CircularProgressIndicator(
                  strokeWidth: 2.4,
                  valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                ),
              )
            : Text(
                'start_personalisation_preview_book'.tr,
                style: GoogleFonts.tajawal(
                  color: Colors.white,
                  fontSize: 18,
                  fontWeight: FontWeight.w600,
                ),
              ),
      ),
    );
  }
}
