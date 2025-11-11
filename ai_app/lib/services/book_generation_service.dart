import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:flutter/foundation.dart';
import 'package:url_launcher/url_launcher.dart';
import 'signed_url_service.dart';

/// Service for managing book generation status and downloads
class BookGenerationService {
  final SupabaseClient _supabase = Supabase.instance.client;
  final SignedUrlService _signedUrlService = SignedUrlService();

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

    } catch (e) {
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
      } else {
        throw Exception('Failed to initiate book generation');
      }
    } catch (e) {
      await updateGenerationStatus(
        orderItemId: orderItemId,
        status: 'failed',
        errorMessage: e.toString(),
      );
      rethrow;
    }
  }

  /// Download completed book PDF with automatic URL refresh
  /// This opens the PDF in the browser/default viewer
  Future<bool> downloadBook({
    required String pdfUrl,
    required String bookTitle,
    required String childName,
    String? orderItemId, // Optional: for refreshing expired URLs
  }) async {
    try {
      String urlToUse = pdfUrl;
      
      // If order item ID provided and URL seems invalid, try refreshing
      if (orderItemId != null && (pdfUrl.isEmpty || !pdfUrl.startsWith('http'))) {
        final refreshResult = await _signedUrlService.refreshOrderUrls(orderItemId);
        
        if (refreshResult.success && refreshResult.pdfUrl != null) {
          urlToUse = refreshResult.pdfUrl!;
        } else {
        }
      }
      
      final uri = Uri.parse(urlToUse);
      
      if (await canLaunchUrl(uri)) {
        final launched = await launchUrl(
          uri,
          mode: LaunchMode.externalApplication,
        );
        
        if (launched) {
          return true;
        } else {
          
          // If launch failed and we have order item ID, try refreshing
          if (orderItemId != null) {
            final refreshResult = await _signedUrlService.refreshOrderUrls(orderItemId);
            
            if (refreshResult.success && refreshResult.pdfUrl != null) {
              final refreshedUri = Uri.parse(refreshResult.pdfUrl!);
              final retryLaunched = await launchUrl(
                refreshedUri,
                mode: LaunchMode.externalApplication,
              );
              
              if (retryLaunched) {
                return true;
              }
            }
          }
          
          return false;
        }
      } else {
        return false;
      }
    } catch (e) {
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
      return false;
    }
  }
}
