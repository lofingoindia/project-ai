import 'dart:typed_data';
import 'package:flutter/foundation.dart';
import 'package:google_generative_ai/google_generative_ai.dart';

/// Service that calls Gemini to blend child's face into the book cover.
/// It mirrors the logic from `image.py` using the `gemini-2.5-flash-image-preview` model.
class AiService {
  final String apiKey;

  AiService({required this.apiKey});

  /// Best-effort MIME detection from a URL/file extension.
  String _inferImageMime(String? hintUrlOrPath) {
    if (hintUrlOrPath == null) return 'image/jpeg';
    final lower = hintUrlOrPath.toLowerCase();
    if (lower.endsWith('.png')) return 'image/png';
    if (lower.endsWith('.webp')) return 'image/webp';
    if (lower.endsWith('.gif')) return 'image/gif';
    if (lower.endsWith('.bmp')) return 'image/bmp';
    if (lower.endsWith('.heic') || lower.endsWith('.heif')) return 'image/heic';
    return 'image/jpeg';
  }

  GenerativeModel _buildFixedModel() => GenerativeModel(
        model: 'gemini-2.5-flash-image-preview',
        apiKey: apiKey,
      );

  /// Runs the image-to-image generation.
  ///
  /// - [bookCoverBytes]: bytes of the original book cover image
  /// - [childImageBytes]: bytes of the uploaded child reference image
  /// - [childName]: used in prompt text (optional)
  ///
  /// Returns the generated image bytes (PNG/JPEG) from Gemini.
  Future<Uint8List> generatePersonalizedCover({
    required Uint8List bookCoverBytes,
    required Uint8List childImageBytes,
    required String childName,
    String? coverSourceHint,
    String? childSourceHint,
    String? customPrompt,
  }) async {
    // Log basic diagnostics
    debugPrint('[AiService] Starting generation: coverBytes=${bookCoverBytes.length}, childBytes=${childImageBytes.length}, name="$childName"');

    // Build prompt exactly matching the Python example
    final prompt = (customPrompt != null && customPrompt.trim().isNotEmpty)
        ? customPrompt
        : '''Replace the kids face in the book cover with the attached reference image. Keep the face, hairstyle, features, and camera angle exactly the same as in the reference image without any changes. The background and context must remain unchanged, and the final image should look perfectly realistic and clearly identifiable as the same kid, and even there is a text change that text into $childName into lofingo keep face 100% same.''';

    // Prepare image parts - matching Python order: dress_image (cover), model_image (child), text_input
    final coverMime = _inferImageMime(coverSourceHint);
    final childMime = _inferImageMime(childSourceHint);
    final coverPart = DataPart(coverMime, bookCoverBytes);
    final childPart = DataPart(childMime, childImageBytes);

    try {
      debugPrint('[AiService] Calling model: gemini-2.5-flash-image-preview');
      debugPrint('[AiService] Cover MIME: $coverMime, Child MIME: $childMime');
      debugPrint('[AiService] Prompt: $prompt');
      
      final model = GenerativeModel(
        model: 'gemini-2.5-flash-image-preview',
        apiKey: apiKey,
      );

      // Match Python order exactly: [dress_image, model_image, text_input]
      final response = await model.generateContent([
        Content.multi([coverPart, childPart, TextPart(prompt)])
      ]);

      debugPrint('[AiService] Response received');
      
      if (response.candidates == null || response.candidates!.isEmpty) {
        throw Exception('No candidates returned by model');
      }

      final candidate = response.candidates!.first;
      if (candidate.content.parts.isEmpty) {
        throw Exception('No parts in response content');
      }

      for (final part in candidate.content.parts) {
        if (part is DataPart) {
          debugPrint('[AiService] Found DataPart with ${part.bytes.length} bytes');
          return Uint8List.fromList(part.bytes);
        }
      }
      
      throw Exception('No image data found in response');
    } catch (e) {
      debugPrint('[AiService] Error details: $e');
      if (e.toString().contains('API_KEY_INVALID')) {
        throw Exception('Invalid API key. Please check your Gemini API key.');
      }
      if (e.toString().contains('PERMISSION_DENIED')) {
        throw Exception('Permission denied. Please check API key permissions.');
      }
      if (e.toString().contains('QUOTA_EXCEEDED')) {
        throw Exception('API quota exceeded. Please try again later.');
      }
      rethrow;
    }
  }
}


