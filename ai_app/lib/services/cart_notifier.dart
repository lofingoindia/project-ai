import 'package:flutter/material.dart';
import 'cart_service.dart';

class CartNotifier extends ChangeNotifier {
  final CartService _cartService = CartService();
  int _cartCount = 0;

  int get cartCount => _cartCount;

  CartNotifier() {
    _loadCartCount();
  }

  Future<void> _loadCartCount() async {
    try {
      final count = await _cartService.getCartCount();
      _cartCount = count;
      notifyListeners();
    } catch (e) {
      // Handle error silently
    }
  }

  Future<void> addToCart(String bookId, int quantity, Map<String, dynamic> personalizationData) async {
    await _cartService.addToCart(bookId, quantity, personalizationData);
    await _loadCartCount(); // Refresh count
  }

  Future<void> removeFromCart(String cartItemId) async {
    await _cartService.removeFromCart(cartItemId);
    await _loadCartCount(); // Refresh count
  }

  Future<void> updateQuantity(String cartItemId, int quantity) async {
    await _cartService.updateCartItemQuantity(cartItemId, quantity);
    await _loadCartCount(); // Refresh count
  }

  Future<void> refresh() async {
    await _loadCartCount();
  }
}
