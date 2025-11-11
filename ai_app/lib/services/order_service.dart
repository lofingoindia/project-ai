import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:flutter/foundation.dart';
import '../models/order.dart';

class OrderService {
  final SupabaseClient _supabase = Supabase.instance.client;

  /// Create a new order with items
  Future<String> createOrder({
    required double totalAmount,
    required double subtotal,
    required double shippingCost,
    required double discountAmount,
    required String paymentMethod,
    required String shippingMethod,
    required Map<String, dynamic> shippingAddress,
    required List<Map<String, dynamic>> orderItems,
    String? appliedCoupon,
  }) async {
    try {
      final user = _supabase.auth.currentUser;
      if (user == null) {
        throw Exception('User not authenticated');
      }

      // Generate order number
      final orderNumber = _generateOrderNumber();

      // Create order
      final orderData = {
        'user_id': user.id,
        'order_number': orderNumber,
        'total_amount': totalAmount,
        'subtotal': subtotal,
        'shipping_cost': shippingCost,
        'discount_amount': discountAmount,
        'currency': 'USD',
        'status': 'paid',
        'payment_status': 'paid',
        'payment_method': paymentMethod,
        'shipping_method': shippingMethod,
        'shipping_address': shippingAddress,
        'applied_coupon': appliedCoupon,
        'created_at': DateTime.now().toIso8601String(),
      };

      final response = await _supabase
          .from('orders')
          .insert(orderData)
          .select()
          .single();

      final orderId = response['id'];

      // Create order items with generation status
      final itemsData = orderItems.map((item) {
        return {
          'order_id': orderId,
          'book_id': item['book_id'],
          'quantity': item['quantity'],
          'unit_price': item['unit_price'],
          'personalization_data': item['personalization_data'] ?? {},
          'generation_status': 'pending', // Initial status
          'created_at': DateTime.now().toIso8601String(),
        };
      }).toList();

      await _supabase.from('order_items').insert(itemsData);

      return orderId;
    } catch (e) {
      rethrow;
    }
  }

  /// Get all orders for the current user
  Future<List<Order>> getUserOrders() async {
    try {
      final user = _supabase.auth.currentUser;
      if (user == null) {
        throw Exception('User not authenticated');
      }

      // Add a small delay to ensure database has propagated changes
      await Future.delayed(const Duration(milliseconds: 100));

      // First try a simple query without joins
      final response = await _supabase
          .from('orders')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', ascending: false);

      if (kDebugMode) {
      }

      if (response.isEmpty) {
        return [];
      }

      // Get order items separately for each order
      List<Order> orders = [];
      for (var orderData in response) {
        final orderId = orderData['id'];
        
        // Get order items for this order
        final itemsResponse = await _supabase
            .from('order_items')
            .select('*')
            .eq('order_id', orderId);

        if (kDebugMode) {
        }

        // Add items to order data
        orderData['order_items'] = itemsResponse;
        
        orders.add(Order.fromJson(orderData));
      }

      return orders;
    } catch (e) {
      rethrow;
    }
  }

  /// Get a specific order by ID
  Future<Order?> getOrderById(String orderId) async {
    try {
      final user = _supabase.auth.currentUser;
      if (user == null) {
        throw Exception('User not authenticated');
      }

      final response = await _supabase
          .from('orders')
          .select('''
            *,
            order_items (
              *,
              generation_status,
              pdf_url,
              generated_at,
              generation_error
            )
          ''')
          .eq('id', orderId)
          .eq('user_id', user.id)
          .single();

      return Order.fromJson(response);
    } catch (e) {
      return null;
    }
  }

  /// Generate a unique order number
  String _generateOrderNumber() {
    final now = DateTime.now();
    final timestamp = now.millisecondsSinceEpoch.toString().substring(7);
    final random = (1000 + (now.microsecond % 9000)).toString();
    return 'ORD-$timestamp$random';
  }

  /// Cancel an order (if allowed)
  Future<void> cancelOrder(String orderId) async {
    try {
      final user = _supabase.auth.currentUser;
      if (user == null) {
        throw Exception('User not authenticated');
      }

      await _supabase
          .from('orders')
          .update({'status': 'cancelled'})
          .eq('id', orderId)
          .eq('user_id', user.id);
    } catch (e) {
      rethrow;
    }
  }
}
