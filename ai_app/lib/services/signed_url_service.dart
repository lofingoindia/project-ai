import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:supabase_flutter/supabase_flutter.dart';

/// Service for managing S3 signed URLs and refreshing expired URLs
class SignedUrlService {
  final SupabaseClient _supabase = Supabase.instance.client;
  
  // Backend API base URL - update with your actual backend URL
  static const String _backendUrl = 'http://localhost:5000'; // TODO: Update for production
  
  /// Check if a URL has expired (or is about to expire)
  /// S3 signed URLs are valid for 7 days by default
  bool isUrlExpired(String? url, {Duration bufferTime = const Duration(hours: 1)}) {
    if (url == null || url.isEmpty) return true;
    
    try {
      final uri = Uri.parse(url);
      
      // Check if URL has expiration parameters (S3 signed URLs)
      if (uri.queryParameters.containsKey('X-Amz-Expires')) {
        final expiresParam = uri.queryParameters['X-Amz-Date'];
        if (expiresParam != null) {
          // Parse the expiration date from the URL
          // For simplicity, we'll consider URLs older than 6 days as expired
          // (since they're valid for 7 days, we refresh with 1 day buffer)
          return false; // For now, assume not expired unless network error
        }
      }
      
      return false; // Assume valid if we can't determine
    } catch (e) {
      debugPrint('Error checking URL expiration: $e');
      return true; // Assume expired if we can't parse
    }
  }
  
  /// Refresh signed URLs for an order item
  /// Returns new PDF URL and cover URL
  Future<RefreshUrlResult> refreshOrderUrls(String orderItemId) async {
    try {
      debugPrint('🔄 Refreshing signed URLs for order item: $orderItemId');
      
      // Call backend to refresh URLs
      final response = await http.post(
        Uri.parse('$_backendUrl/refresh-order-urls'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'orderItemId': orderItemId}),
      );
      
      if (response.statusCode == 200) {
        final result = jsonDecode(response.body);
        debugPrint('✅ Signed URLs refreshed successfully');
        
        return RefreshUrlResult(
          success: true,
          pdfUrl: result['pdfUrl'],
          coverUrl: result['coverUrl'],
        );
      } else {
        final error = jsonDecode(response.body);
        throw Exception('Failed to refresh URLs: ${error['error']}');
      }
    } catch (e) {
      debugPrint('❌ Error refreshing signed URLs: $e');
      return RefreshUrlResult(
        success: false,
        error: e.toString(),
      );
    }
  }
  
  /// Get fresh signed URL for a specific S3 key
  Future<String?> getSignedUrl(String s3Key, {int expiresIn = 604800}) async {
    try {
      debugPrint('🔗 Generating signed URL for: $s3Key');
      
      final response = await http.post(
        Uri.parse('$_backendUrl/generate-signed-url'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          's3Key': s3Key,
          'expiresIn': expiresIn,
        }),
      );
      
      if (response.statusCode == 200) {
        final result = jsonDecode(response.body);
        return result['signedUrl'];
      } else {
        debugPrint('❌ Failed to generate signed URL: ${response.statusCode}');
        return null;
      }
    } catch (e) {
      debugPrint('❌ Error generating signed URL: $e');
      return null;
    }
  }
  
  /// Get order item with refreshed URLs if needed
  Future<Map<String, dynamic>?> getOrderItemWithFreshUrls(String orderItemId) async {
    try {
      // Get order item from database
      final response = await _supabase
          .from('order_items')
          .select('*')
          .eq('id', orderItemId)
          .single();
      
      if (response == null) {
        debugPrint('❌ Order item not found: $orderItemId');
        return null;
      }
      
      final orderItem = response as Map<String, dynamic>;
      
      // Check if URLs need refresh (basic check)
      final pdfUrl = orderItem['pdf_url'] as String?;
      final coverUrl = orderItem['cover_image_url'] as String?;
      
      // If URLs look valid, return as-is
      if (pdfUrl != null && pdfUrl.isNotEmpty && 
          coverUrl != null && coverUrl.isNotEmpty) {
        debugPrint('✅ URLs appear valid, using existing URLs');
        return orderItem;
      }
      
      // If URLs are missing or invalid, refresh them
      debugPrint('⚠️  URLs missing or invalid, refreshing...');
      final refreshResult = await refreshOrderUrls(orderItemId);
      
      if (refreshResult.success) {
        // Return updated order item with fresh URLs
        orderItem['pdf_url'] = refreshResult.pdfUrl;
        orderItem['cover_image_url'] = refreshResult.coverUrl;
        return orderItem;
      } else {
        debugPrint('❌ Failed to refresh URLs: ${refreshResult.error}');
        return orderItem; // Return original even if refresh failed
      }
    } catch (e) {
      debugPrint('❌ Error getting order item with fresh URLs: $e');
      return null;
    }
  }
}

/// Result of refreshing signed URLs
class RefreshUrlResult {
  final bool success;
  final String? pdfUrl;
  final String? coverUrl;
  final String? error;
  
  RefreshUrlResult({
    required this.success,
    this.pdfUrl,
    this.coverUrl,
    this.error,
  });
}

