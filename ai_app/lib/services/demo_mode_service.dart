import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:flutter/foundation.dart';

/// Demo/Testing service for cycling through book generation statuses
/// This is for DEMO purposes only - should not be used in production!
class DemoModeService {
  final SupabaseClient _supabase = Supabase.instance.client;
  static const bool enableDemoMode = kDebugMode; // Only in debug mode

  /// Cycle an order item through all statuses with delays
  Future<void> demonstrateStatusFlow(String orderItemId) async {
    if (!enableDemoMode) {
      return;
    }

    try {

      // Step 1: Set to Pending
      await _updateStatus(orderItemId, 'pending', null);
      await Future.delayed(const Duration(seconds: 3));

      // Step 2: Set to Processing
      await _updateStatus(orderItemId, 'processing', null);
      await Future.delayed(const Duration(seconds: 5));

      // Step 3: Set to Completed with demo PDF
      await _updateStatus(
        orderItemId,
        'completed',
        'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      );

    } catch (e) {
      rethrow;
    }
  }

  /// Update order item status
  Future<void> _updateStatus(String orderItemId, String status, String? pdfUrl) async {
    final updateData = <String, dynamic>{
      'generation_status': status,
      'updated_at': DateTime.now().toIso8601String(),
    };

    if (status == 'completed' && pdfUrl != null) {
      updateData['pdf_url'] = pdfUrl;
      updateData['generated_at'] = DateTime.now().toIso8601String();
    } else if (status == 'pending') {
      updateData['pdf_url'] = null;
      updateData['generated_at'] = null;
      updateData['generation_error'] = null;
    }

    await _supabase.from('order_items').update(updateData).eq('id', orderItemId);
  }

  /// Quick status updates for manual testing
  Future<void> setToPending(String orderItemId) async {
    if (!enableDemoMode) return;
    await _updateStatus(orderItemId, 'pending', null);
  }

  Future<void> setToProcessing(String orderItemId) async {
    if (!enableDemoMode) return;
    await _updateStatus(orderItemId, 'processing', null);
  }

  Future<void> setToCompleted(String orderItemId, {String? pdfUrl}) async {
    if (!enableDemoMode) return;
    await _updateStatus(
      orderItemId,
      'completed',
      pdfUrl ?? 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    );
  }

  Future<void> setToFailed(String orderItemId, {String? errorMessage}) async {
    if (!enableDemoMode) return;
    await _supabase.from('order_items').update({
      'generation_status': 'failed',
      'generation_error': errorMessage ?? 'Demo error message',
      'updated_at': DateTime.now().toIso8601String(),
    }).eq('id', orderItemId);
  }

  /// Get all order items for current user (for demo selection)
  Future<List<Map<String, dynamic>>> getOrderItemsForDemo() async {
    if (!enableDemoMode) return [];

    final user = _supabase.auth.currentUser;
    if (user == null) return [];

    final response = await _supabase
        .from('order_items')
        .select('''
          id,
          generation_status,
          order_id,
          book:books(title)
        ''')
        .eq('order_id', _supabase
            .from('orders')
            .select('id')
            .eq('user_id', user.id));

    return (response as List).map((e) => e as Map<String, dynamic>).toList();
  }
}
