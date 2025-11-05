import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';
import '../models/order.dart';

class CartService {
  final SupabaseClient _client = Supabase.instance.client;
  static const String _localCartKey = 'local_cart_items';

  // Check if user is authenticated
  bool get _isAuthenticated => _client.auth.currentUser != null;

  // Get local cart items from SharedPreferences
  Future<List<Map<String, dynamic>>> _getLocalCartItems() async {
    final prefs = await SharedPreferences.getInstance();
    final cartJson = prefs.getString(_localCartKey);
    if (cartJson == null) return [];
    
    try {
      final List<dynamic> decoded = json.decode(cartJson);
      return decoded.cast<Map<String, dynamic>>();
    } catch (e) {
      return [];
    }
  }

  // Save local cart items to SharedPreferences
  Future<void> _saveLocalCartItems(List<Map<String, dynamic>> items) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_localCartKey, json.encode(items));
  }

  // Migrate local cart to server when user logs in
  Future<void> migrateLocalCartToServer() async {
    if (!_isAuthenticated) return;
    
    try {
      final localItems = await _getLocalCartItems();
      if (localItems.isEmpty) return;

      final user = _client.auth.currentUser!;
      
      for (var item in localItems) {
        // Check if item already exists in server cart
        final existingItems = await _client
            .from('cart_items')
            .select('id, quantity')
            .eq('user_id', user.id)
            .eq('book_id', item['book_id']);

        if (existingItems.isNotEmpty) {
          // Update existing item
          final existingItem = existingItems.first;
          final newQuantity = (existingItem['quantity'] as int) + (item['quantity'] as int);
          
          await _client.from('cart_items').update({
            'quantity': newQuantity,
            'personalization_data': item['personalization_data'],
          }).eq('id', existingItem['id']);
        } else {
          // Insert new item
          await _client.from('cart_items').insert({
            'user_id': user.id,
            'book_id': item['book_id'],
            'quantity': item['quantity'],
            'personalization_data': item['personalization_data'],
          });
        }
      }

      // Keep local cart as backup (don't clear it)
      // User might log out later and we want to preserve their cart
    } catch (e) {
      print('Error migrating local cart: $e');
    }
  }

  // Copy server cart to local storage when user logs out
  Future<void> copyServerCartToLocal() async {
    if (_isAuthenticated) return; // Only call this when user is logged out
    
    try {
      // This should be called just before logout with user still authenticated
      // So we'll create a separate method for that
    } catch (e) {
      print('Error copying server cart to local: $e');
    }
  }

  // Prepare for logout - copy server cart to local storage before logging out
  Future<void> prepareForLogout() async {
    if (!_isAuthenticated) return;
    
    try {
      final user = _client.auth.currentUser!;
      
      // Get server cart items
      final response = await _client
          .from('cart_items')
          .select('book_id, quantity, personalization_data, created_at')
          .eq('user_id', user.id);

      if (response.isEmpty) return;

      // Convert to local cart format and save
      final localItems = (response as List).map((item) {
        return {
          'id': DateTime.now().millisecondsSinceEpoch.toString() + '_' + item['book_id'].toString(),
          'book_id': item['book_id'],
          'quantity': item['quantity'],
          'personalization_data': item['personalization_data'] ?? {},
          'created_at': item['created_at'] ?? DateTime.now().toIso8601String(),
        };
      }).toList();

      await _saveLocalCartItems(localItems);
    } catch (e) {
      print('Error preparing for logout: $e');
    }
  }

  // Add item to cart (works for both authenticated and guest users)
  Future<void> addToCart(String bookId, int quantity, Map<String, dynamic> personalizationData) async {
    try {
      if (_isAuthenticated) {
        // Add to server cart for authenticated users
        final user = _client.auth.currentUser!;

        // Check if item already exists in cart
        final existingItems = await _client
            .from('cart_items')
            .select('id, quantity')
            .eq('user_id', user.id)
            .eq('book_id', int.parse(bookId));

        if (existingItems.isNotEmpty) {
          // Update existing item quantity
          final existingItem = existingItems.first;
          final newQuantity = (existingItem['quantity'] as int) + quantity;
          
          await _client.from('cart_items').update({
            'quantity': newQuantity,
            'personalization_data': personalizationData,
          }).eq('id', existingItem['id']);
        } else {
          // Insert new item
          await _client.from('cart_items').insert({
            'user_id': user.id,
            'book_id': int.parse(bookId),
            'quantity': quantity,
            'personalization_data': personalizationData,
          });
        }
      } else {
        // Add to local cart for guest users
        final localItems = await _getLocalCartItems();
        
        // Check if item already exists
        final existingIndex = localItems.indexWhere(
          (item) => item['book_id'] == int.parse(bookId),
        );

        if (existingIndex >= 0) {
          // Update existing item
          localItems[existingIndex]['quantity'] = 
              (localItems[existingIndex]['quantity'] as int) + quantity;
          localItems[existingIndex]['personalization_data'] = personalizationData;
        } else {
          // Add new item
          localItems.add({
            'id': DateTime.now().millisecondsSinceEpoch.toString(), // Generate temporary ID
            'book_id': int.parse(bookId),
            'quantity': quantity,
            'personalization_data': personalizationData,
            'created_at': DateTime.now().toIso8601String(),
          });
        }

        await _saveLocalCartItems(localItems);
      }
    } catch (e) {
      throw Exception('Failed to add item to cart: $e');
    }
  }

  // Get cart items for current user (works for both authenticated and guest users)
  Future<List<CartItem>> getCartItems() async {
    try {
      if (_isAuthenticated) {
        // Get from server for authenticated users
        final user = _client.auth.currentUser!;

        final response = await _client
            .from('cart_items')
            .select('''
              id,
              user_id,
              book_id,
              quantity,
              personalization_data,
              created_at,
              books!inner(*)
            ''')
            .eq('user_id', user.id)
            .order('created_at', ascending: false);

        return (response as List)
            .map((json) {
              // Rename 'books' to 'book' for consistency with the model
              if (json['books'] != null) {
                json['book'] = json['books'];
                json.remove('books');
              }
              return CartItem.fromJson(json);
            })
            .toList();
      } else {
        // Get from local storage for guest users
        final localItems = await _getLocalCartItems();
        final List<CartItem> cartItems = [];

        for (var item in localItems) {
          try {
            // Fetch book details from server
            final bookResponse = await _client
                .from('books')
                .select()
                .eq('id', item['book_id'])
                .single();

            final cartItemJson = {
              'id': item['id'],
              'user_id': 'guest',
              'book_id': item['book_id'],
              'quantity': item['quantity'],
              'personalization_data': item['personalization_data'],
              'created_at': item['created_at'],
              'book': bookResponse,
            };

            cartItems.add(CartItem.fromJson(cartItemJson));
          } catch (e) {
            print('Error fetching book for cart item: $e');
            // Skip items with errors
            continue;
          }
        }

        return cartItems;
      }
    } catch (e) {
      throw Exception('Failed to fetch cart items: $e');
    }
  }

  // Update cart item quantity (works for both authenticated and guest users)
  Future<void> updateCartItemQuantity(String cartItemId, int quantity) async {
    try {
      if (quantity <= 0) {
        await removeFromCart(cartItemId);
        return;
      }

      if (_isAuthenticated) {
        // Update on server
        await _client
            .from('cart_items')
            .update({'quantity': quantity})
            .eq('id', cartItemId);
      } else {
        // Update in local storage
        final localItems = await _getLocalCartItems();
        final itemIndex = localItems.indexWhere((item) => item['id'] == cartItemId);
        
        if (itemIndex >= 0) {
          localItems[itemIndex]['quantity'] = quantity;
          await _saveLocalCartItems(localItems);
        }
      }
    } catch (e) {
      throw Exception('Failed to update cart item: $e');
    }
  }

  // Remove item from cart (works for both authenticated and guest users)
  Future<void> removeFromCart(String cartItemId) async {
    try {
      if (_isAuthenticated) {
        // Remove from server
        await _client
            .from('cart_items')
            .delete()
            .eq('id', cartItemId);
      } else {
        // Remove from local storage
        final localItems = await _getLocalCartItems();
        localItems.removeWhere((item) => item['id'] == cartItemId);
        await _saveLocalCartItems(localItems);
      }
    } catch (e) {
      throw Exception('Failed to remove item from cart: $e');
    }
  }

  // Clear cart (works for both authenticated and guest users)
  Future<void> clearCart() async {
    try {
      if (_isAuthenticated) {
        // Clear server cart
        final user = _client.auth.currentUser!;

        await _client
            .from('cart_items')
            .delete()
            .eq('user_id', user.id);
      } else {
        // Clear local cart
        await _saveLocalCartItems([]);
      }
    } catch (e) {
      throw Exception('Failed to clear cart: $e');
    }
  }

  // Get cart count (works for both authenticated and guest users)
  Future<int> getCartCount() async {
    try {
      if (_isAuthenticated) {
        // Get count from server
        final user = _client.auth.currentUser!;

        final response = await _client
            .from('cart_items')
            .select('quantity')
            .eq('user_id', user.id);

        int totalCount = 0;
        for (var item in response) {
          totalCount += (item['quantity'] as int? ?? 0);
        }
        return totalCount;
      } else {
        // Get count from local storage
        final localItems = await _getLocalCartItems();
        int totalCount = 0;
        for (var item in localItems) {
          totalCount += (item['quantity'] as int? ?? 0);
        }
        return totalCount;
      }
    } catch (e) {
      return 0;
    }
  }

  // Calculate cart total
  Future<double> getCartTotal() async {
    try {
      final cartItems = await getCartItems();
      double total = 0.0;
      
      for (var item in cartItems) {
        if (item.book != null) {
          total += item.book!.discountedPrice * item.quantity;
        }
      }
      
      return total;
    } catch (e) {
      return 0.0;
    }
  }
}
