import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:flutter/foundation.dart';
import 'package:url_launcher/url_launcher.dart';

/// Service for managing book generation status and downloads
class BookGenerationService {
  final SupabaseClient _supabase = Supabase.instance.client;

  /// Update generation status for an order item
  Future<void> updateGenerationStatus({
    required String orderItemId,
    required String status,
    String? pdfUrl,
    String? errorMessage,
  }) async {
    try {
      final updateData = <String, dynamic>{
        'generation_status': status,
        'updated_at': DateTime.now().toIso8601String(),
      };

      if (pdfUrl != null) {
        updateData['pdf_url'] = pdfUrl;
        updateData['generated_at'] = DateTime.now().toIso8601String();
      }

      if (errorMessage != null) {
        updateData['generation_error'] = errorMessage;
      }

      await _supabase
          .from('order_items')
          .update(updateData)
          .eq('id', orderItemId);

      debugPrint('Generation status updated: $status for item $orderItemId');
    } catch (e) {
      debugPrint('Error updating generation status: $e');
      rethrow;
    }
  }

  /// Get generation status for a specific order item
  Future<Map<String, dynamic>?> getGenerationStatus(String orderItemId) async {
    try {
      final response = await _supabase
          .from('order_items')
          .select('generation_status, pdf_url, generated_at, generation_error')
          .eq('id', orderItemId)
          .single();

      return response;
    } catch (e) {
      debugPrint('Error getting generation status: $e');
      return null;
    }
  }

  /// Initiate book generation for an order item
  Future<void> initiateBookGeneration({
    required String orderItemId,
    required int bookId,
    required Map<String, dynamic> personalizationData,
  }) async {
    try {
      // Update status to processing
      await updateGenerationStatus(
        orderItemId: orderItemId,
        status: 'processing',
      );

      // Call backend service to generate the book
      // This would typically call your backend API that generates the PDF
      final response = await _supabase.functions.invoke(
        'generate-personalized-book',
        body: {
          'order_item_id': orderItemId,
          'book_id': bookId,
          'personalization_data': personalizationData,
        },
      );

      if (response.status == 200) {
        debugPrint('Book generation initiated successfully');
      } else {
        throw Exception('Failed to initiate book generation');
      }
    } catch (e) {
      debugPrint('Error initiating book generation: $e');
      await updateGenerationStatus(
        orderItemId: orderItemId,
        status: 'failed',
        errorMessage: e.toString(),
      );
      rethrow;
    }
  }

  /// Download completed book PDF
  /// This opens the PDF in the browser/default viewer
  Future<bool> downloadBook({
    required String pdfUrl,
    required String bookTitle,
    required String childName,
  }) async {
    try {
      final uri = Uri.parse(pdfUrl);
      
      if (await canLaunchUrl(uri)) {
        final launched = await launchUrl(
          uri,
          mode: LaunchMode.externalApplication,
        );
        
        if (launched) {
          debugPrint('Successfully opened PDF: $bookTitle for $childName');
          return true;
        } else {
          debugPrint('Failed to launch PDF URL');
          return false;
        }
      } else {
        debugPrint('Cannot launch URL: $pdfUrl');
        return false;
      }
    } catch (e) {
      debugPrint('Error downloading book: $e');
      return false;
    }
  }

  /// Listen to generation status changes for real-time updates
  Stream<Map<String, dynamic>> watchGenerationStatus(String orderItemId) {
    return _supabase
        .from('order_items')
        .stream(primaryKey: ['id'])
        .eq('id', orderItemId)
        .map((data) => data.first);
  }

  /// Check if all items in an order are completed
  Future<bool> areAllItemsCompleted(String orderId) async {
    try {
      final response = await _supabase
          .from('order_items')
          .select('generation_status')
          .eq('order_id', orderId);

      final items = response as List;
      return items.every((item) => item['generation_status'] == 'completed');
    } catch (e) {
      debugPrint('Error checking order completion: $e');
      return false;
    }
  }
}
