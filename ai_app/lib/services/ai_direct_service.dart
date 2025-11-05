import 'dart:typed_data';
import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:http/http.dart' as http;

/// Simple direct AI service - no queue, direct processing
class AiDirectService {
  final SupabaseClient _client = Supabase.instance.client;
  
  /// Generate personalized cover directly
  Future<String> generatePersonalizedCover({
    required String bookId,
    required String bookName,
    required String childImageUrl,
    required String childName,
    String? childImageBase64,
    String? childImageMime,
  }) async {
    try {
      final user = _client.auth.currentUser;
      
      // User login is optional - use a guest placeholder if not authenticated
      final userId = user?.id ?? 'guest-${DateTime.now().millisecondsSinceEpoch}';

      debugPrint('[AiDirectService] Starting direct generation...');
      debugPrint('[AiDirectService] User authenticated: ${user != null}');
      debugPrint('[AiDirectService] User ID: $userId');
      debugPrint('[AiDirectService] Child URL: $childImageUrl');
      debugPrint('[AiDirectService] Child Name: $childName');
      debugPrint('[AiDirectService] Has base64 image: ${childImageBase64 != null && childImageBase64.isNotEmpty}');

      // Validate that we have some form of child image (either URL or base64)
      final hasUrl = childImageUrl.isNotEmpty;
      final hasBase64 = childImageBase64 != null && childImageBase64.isNotEmpty;
      
      if (!hasUrl && !hasBase64) {
        throw Exception('No child image data available (neither URL nor base64)');
      }

      debugPrint('[AiDirectService] Image source - URL: $hasUrl, Base64: $hasBase64');

      // Prepare request body with child image data
      // If we have base64 but no URL, create a data URI that backend might accept
      String effectiveChildImageUrl = childImageUrl;
      if (childImageUrl.isEmpty && hasBase64) {
        // Create a proper data URI
        effectiveChildImageUrl = 'data:${childImageMime ?? 'image/jpeg'};base64,$childImageBase64';
        debugPrint('[AiDirectService] Using data URI instead of empty URL');
      }
      
      final requestBody = {
        'bookId': bookId.toString(), // Ensure string format
        'bookName': bookName,
        'childName': childName,
        'userId': userId, // Always include userId (real or guest)
        'childImageUrl': effectiveChildImageUrl, // Use data URI if no URL available
        // Also send base64 separately in case backend prefers it
        if (childImageBase64 != null && childImageBase64.isNotEmpty) ...{
          'childImageBase64': childImageBase64,
          'childImageMime': childImageMime ?? 'image/jpeg',
        },
      };

      debugPrint('[AiDirectService] ============ REQUEST DETAILS ============');
      debugPrint('[AiDirectService] Request body keys: ${requestBody.keys.toList()}');
      debugPrint('[AiDirectService] bookId: "${requestBody['bookId']}" (type: ${requestBody['bookId'].runtimeType})');
      debugPrint('[AiDirectService] bookName: "${requestBody['bookName']}"');
      debugPrint('[AiDirectService] childName: "${requestBody['childName']}"');
      debugPrint('[AiDirectService] userId: "${requestBody['userId']}"');
      
      final urlValue = requestBody['childImageUrl'] as String;
      final isDataUri = urlValue.startsWith('data:');
      debugPrint('[AiDirectService] childImageUrl type: ${isDataUri ? 'DATA_URI' : 'HTTP_URL'}');
      if (isDataUri) {
        debugPrint('[AiDirectService] childImageUrl: data URI (${urlValue.length} chars total)');
      } else {
        debugPrint('[AiDirectService] childImageUrl: "$urlValue"');
      }
      
      debugPrint('[AiDirectService] childImageBase64 present: ${requestBody.containsKey('childImageBase64')}');
      if (requestBody.containsKey('childImageBase64')) {
        final base64Data = requestBody['childImageBase64'] as String;
        debugPrint('[AiDirectService] childImageBase64 length: ${base64Data.length} chars');
      }
      debugPrint('[AiDirectService] ======================================');

      // Call Supabase Edge Function directly
      final response = await _client.functions.invoke(
        'smooth-endpoint',
        body: requestBody,
      );

      debugPrint('[AiDirectService] Raw response: ${response.toString()}');
      debugPrint('[AiDirectService] Response status: ${response.status}');
      debugPrint('[AiDirectService] Response data: ${response.data}');

      if (response.status != 200) {
        final errorMsg = response.data != null ? response.data.toString() : 'Unknown error';
        throw Exception('Function call failed with status ${response.status}: $errorMsg');
      }

      if (response.data == null) {
        throw Exception('Function returned null data');
      }

      final data = response.data as Map<String, dynamic>?;
      if (data == null) {
        throw Exception('Function returned invalid data format');
      }

      if (data['success'] != true) {
        final errorMsg = data['error'] ?? 'Unknown error from function';
        throw Exception('Function reported error: $errorMsg');
      }

      // Check if we have base64 image data
      final generatedImageBase64 = data['generated_image_base64'] as String?;
      if (generatedImageBase64 != null && generatedImageBase64.isNotEmpty) {
        // Return base64 data URL that Flutter can handle
        final dataUrl = 'data:image/jpeg;base64,$generatedImageBase64';
        debugPrint('[AiDirectService] Generated image as base64 data URL');
        return dataUrl;
      }

      // Fallback to URL if available
      final generatedImageUrl = data['generated_image_url'] as String?;
      if (generatedImageUrl != null && generatedImageUrl.isNotEmpty) {
        debugPrint('[AiDirectService] Generated image URL: $generatedImageUrl');
        return generatedImageUrl;
      }

      throw Exception('Function did not return image data or URL');

    } catch (e) {
      debugPrint('[AiDirectService] Detailed error: $e');
      debugPrint('[AiDirectService] Error type: ${e.runtimeType}');
      rethrow;
    }
  }
}
