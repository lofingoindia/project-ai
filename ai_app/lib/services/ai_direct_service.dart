import 'dart:typed_data';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:http/http.dart' as http;

/// Simple direct AI service - calls backend API directly
class AiDirectService {
  final SupabaseClient _client = Supabase.instance.client;
  
  // Backend API URL - UPDATE THIS WITH YOUR ACTUAL BACKEND URL
  static const String _backendUrl = 'http://localhost:5000'; // Change to your backend URL
  // For production: 'https://your-backend.com'
  // For local development: 'http://localhost:5000' or 'http://10.0.2.2:5000' (Android emulator)
  
  /// Generate personalized cover by calling backend API directly
  Future<String> generatePersonalizedCover({
    required String bookId,
    required String bookName,
    required String childImageUrl,
    required String childName,
    String? childImageBase64,
    String? childImageMime,
  }) async {
    try {
      debugPrint('[AiDirectService] ========================================');
      debugPrint('[AiDirectService] Calling BACKEND API directly');
      debugPrint('[AiDirectService] Backend URL: $_backendUrl');
      debugPrint('[AiDirectService] Book: $bookName (ID: $bookId)');
      debugPrint('[AiDirectService] Child: $childName');
      debugPrint('[AiDirectService] ========================================');

      // Validate we have child image data
      final hasBase64 = childImageBase64 != null && childImageBase64.isNotEmpty;
      if (!hasBase64) {
        throw Exception('Child image base64 is required');
      }

      // Step 1: Get book data from Supabase to get original cover
      debugPrint('[AiDirectService] Step 1: Fetching book data from database...');
      final bookData = await _client
          .from('books')
          .select('id, title, name, cover_image_url, genre, age_range, description, characters, ideal_for')
          .eq('id', int.parse(bookId))
          .single();

      if (bookData == null) {
        throw Exception('Book not found with ID: $bookId');
      }

      debugPrint('[AiDirectService] ✓ Book data fetched');
      debugPrint('[AiDirectService]   Title: ${bookData['title'] ?? bookData['name']}');
      debugPrint('[AiDirectService]   Cover URL: ${bookData['cover_image_url']}');

      // Step 2: Download original book cover
      debugPrint('[AiDirectService] Step 2: Downloading original book cover...');
      final coverUrl = bookData['cover_image_url'] as String?;
      if (coverUrl == null || coverUrl.isEmpty) {
        throw Exception('Book cover URL not found');
      }

      final coverResponse = await http.get(Uri.parse(coverUrl));
      if (coverResponse.statusCode != 200) {
        throw Exception('Failed to download book cover: ${coverResponse.statusCode}');
      }

      final originalCoverBase64 = base64Encode(coverResponse.bodyBytes);
      debugPrint('[AiDirectService] ✓ Book cover downloaded (${coverResponse.bodyBytes.length} bytes)');

      // Step 3: Prepare request for backend API
      debugPrint('[AiDirectService] Step 3: Preparing backend API request...');
      final requestBody = {
        'originalCoverImage': originalCoverBase64,
        'childImage': childImageBase64,
        'bookData': {
          'name': bookData['title'] ?? bookData['name'] ?? bookName,
          'description': bookData['description'] ?? '',
          'genre': bookData['genre'] ?? 'Children\'s Book',
          'ageRange': bookData['age_range'] ?? '3-12 years',
          'characters': bookData['characters'] ?? '',
          'idealFor': bookData['ideal_for'] ?? '',
        },
        'childData': {
          'name': childName,
          'age': 5, // Default age if not provided
          'gender': 'unknown', // Can be enhanced later
        },
      };

      debugPrint('[AiDirectService] Request prepared:');
      debugPrint('[AiDirectService]   Original cover: ${originalCoverBase64.length} chars');
      debugPrint('[AiDirectService]   Child image: ${childImageBase64.length} chars');
      debugPrint('[AiDirectService]   Book name: ${requestBody['bookData']['name']}');
      debugPrint('[AiDirectService]   Child name: ${requestBody['childData']['name']}');

      // Step 4: Call backend API
      debugPrint('[AiDirectService] Step 4: Calling backend API: $_backendUrl/generate-cover');
      final response = await http.post(
        Uri.parse('$_backendUrl/generate-cover'),
        headers: {
          'Content-Type': 'application/json',
        },
        body: jsonEncode(requestBody),
      ).timeout(
        const Duration(seconds: 60), // 60 second timeout for AI processing
        onTimeout: () {
          throw Exception('Backend API timeout (60 seconds). Please check if the backend is running.');
        },
      );

      debugPrint('[AiDirectService] Response received:');
      debugPrint('[AiDirectService]   Status: ${response.statusCode}');
      debugPrint('[AiDirectService]   Body length: ${response.body.length} chars');

      if (response.statusCode != 200) {
        final errorMsg = response.body.isNotEmpty ? response.body : 'Unknown error';
        throw Exception('Backend API error (${response.statusCode}): $errorMsg');
      }

      // Step 5: Parse response
      final data = jsonDecode(response.body) as Map<String, dynamic>;
      
      if (data['success'] != true) {
        final errorMsg = data['error'] ?? 'Unknown error from backend';
        throw Exception('Backend reported error: $errorMsg');
      }

      final generatedImageBase64 = data['coverImage'] as String?;
      if (generatedImageBase64 == null || generatedImageBase64.isEmpty) {
        throw Exception('Backend did not return cover image');
      }

      debugPrint('[AiDirectService] ✓ Cover generated successfully!');
      debugPrint('[AiDirectService]   Generated image: ${generatedImageBase64.length} chars');
      debugPrint('[AiDirectService] ========================================');

      // Return as data URL for Flutter to display
      return 'data:image/jpeg;base64,$generatedImageBase64';

    } catch (e, stackTrace) {
      debugPrint('[AiDirectService] ❌ ERROR: $e');
      debugPrint('[AiDirectService] Stack trace: $stackTrace');
      
      // Provide helpful error messages
      if (e.toString().contains('SocketException') || e.toString().contains('Connection refused')) {
        throw Exception('Cannot connect to backend API at $_backendUrl. Is the backend running?');
      }
      
      rethrow;
    }
  }
}
