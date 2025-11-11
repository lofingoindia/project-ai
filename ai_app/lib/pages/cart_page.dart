import 'dart:convert';
import 'dart:async';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/order.dart';
import '../services/cart_service.dart';
import '../services/localization_service.dart';
import '../login_page.dart';
import '../main_navigation.dart';
import 'shipping_page.dart';
import '../widgets/app_footer.dart';

class CartPage extends StatefulWidget {
  const CartPage({Key? key}) : super(key: key);

  @override
  State<CartPage> createState() => _CartPageState();
}

class _CartPageState extends State<CartPage> with WidgetsBindingObserver {
  final CartService _cartService = CartService();
  final LocalizationService _localizationService = LocalizationService();
  List<CartItem> _cartItems = [];
  bool _isLoading = true;
  double _total = 0.0;
  StreamSubscription<AuthState>? _authSubscription;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _loadCart();
    _setupAuthListener();
  }

  void _setupAuthListener() {
    // Listen to auth state changes
    _authSubscription = Supabase.instance.client.auth.onAuthStateChange.listen((data) async {
      final AuthChangeEvent event = data.event;
      
      // Handle sign in - migrate local cart to server
      if (event == AuthChangeEvent.signedIn) {
        await _cartService.migrateLocalCartToServer();
        if (mounted) {
          _loadCart();
        }
      }
      
      // Handle sign out - cart items remain in local storage
      if (event == AuthChangeEvent.signedOut) {
        if (mounted) {
          _loadCart(); // This will now load from local storage
        }
      }
      
      // Handle token refresh
      if (event == AuthChangeEvent.tokenRefreshed) {
        if (mounted) {
          _loadCart();
        }
      }
    });
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _authSubscription?.cancel();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      // Refresh cart when app resumes
      _loadCart();
    }
  }

  // Public method to refresh cart (can be called from navigation)
  void refreshCart() {
    _loadCart();
  }

  Future<void> _loadCart() async {
    setState(() => _isLoading = true);
    
    try {
      final items = await _cartService.getCartItems();
      final total = await _cartService.getCartTotal();
      
      if (mounted) {
        setState(() {
          _cartItems = items;
          _total = total;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('${'cart_page_error_loading'.tr}$e')),
        );
      }
    }
  }

  Future<void> _removeItem(String cartItemId) async {
    try {
      await _cartService.removeFromCart(cartItemId);
      _loadCart(); // Reload cart
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('cart_page_item_removed'.tr),
          backgroundColor: Colors.green,
        ),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('${'cart_page_error_removing'.tr}$e')),
      );
    }
  }

  bool _isMobile(BuildContext context) => MediaQuery.of(context).size.width < 650;

  @override
  Widget build(BuildContext context) {
    final maxWidth = _isMobile(context) ? double.infinity : 1000.0;
    
    return Directionality(
      textDirection: _localizationService.textDirection,
      child: Scaffold(
        appBar: AppBar(
          title: Text('cart_page_title'.tr),
          backgroundColor: Colors.white,
          foregroundColor: Colors.black,
          elevation: 0.5,
          automaticallyImplyLeading: false,
        ),
        body: _isLoading
            ? const Center(child: CircularProgressIndicator())
            : _cartItems.isEmpty
                ? _buildEmptyCartWithFooter()
                : SingleChildScrollView(
                    child: Column(
                      children: [
                        Center(
                          child: Container(
                            constraints: BoxConstraints(maxWidth: maxWidth),
                            child: Column(
                              children: [
                                ListView.builder(
                                  shrinkWrap: true,
                                  physics: const NeverScrollableScrollPhysics(),
                                  padding: _isMobile(context)
                                      ? const EdgeInsets.all(16)
                                      : const EdgeInsets.symmetric(horizontal: 40, vertical: 16),
                                  itemCount: _cartItems.length + 1, // +1 for the add books card
                                  itemBuilder: (context, index) {
                                    if (index < _cartItems.length) {
                                      final item = _cartItems[index];
                                      return _buildCartItem(item);
                                    } else {
                                      // Add books card
                                      return _buildAddBooksCard();
                                    }
                                  },
                                ),
                                // Cart summary with checkout button
                                _buildCartSummary(),
                              ],
                            ),
                          ),
                        ),
                        // Footer for web only
                        if (!_isMobile(context)) AppFooter(),
                      ],
                    ),
                  ),
      ),
    );
  }

  Widget _buildEmptyCartWithFooter() {
    return SingleChildScrollView(
      child: Column(
        children: [
          // Empty cart content
          Container(
            height: MediaQuery.of(context).size.height - 200, // Adjust for AppBar and padding
            child: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.shopping_cart_outlined,
                    size: 80,
                    color: Colors.grey[400],
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'cart_page_empty_title'.tr,
                    style: GoogleFonts.tajawal(
                      fontSize: 20,
                      color: Colors.grey[600],
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'cart_page_empty_subtitle'.tr,
                    style: GoogleFonts.tajawal(
                      fontSize: 16,
                      color: Colors.grey[500],
                    ),
                  ),
                  const SizedBox(height: 24),
                  ElevatedButton(
                    onPressed: () {
                      // Try to switch to Shop tab (index 1) if in MainNavigation
                      MainNavigation.switchTab(context, 1);
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF784D9C),
                      padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 12),
                    ),
                    child: Text(
                      'cart_page_browse_books'.tr,
                      style: GoogleFonts.tajawal(
                        color: Colors.white,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          // Footer for web only
          if (!_isMobile(context)) AppFooter(),
        ],
      ),
    );
  }

  Widget _buildImageWidget(String imageUrl) {
    // Check if it's a data URL (base64)
    if (imageUrl.startsWith('data:image/')) {
      try {
        // Extract base64 data from data URL
        final base64Data = imageUrl.split(',')[1];
        final bytes = base64Decode(base64Data);
        
        return Image.memory(
          bytes,
          fit: BoxFit.cover,
          errorBuilder: (context, error, stackTrace) => 
              const Center(child: Icon(Icons.book)),
        );
      } catch (e) {
        return const Center(child: Icon(Icons.book));
      }
    } else {
      // Display image from URL (regular HTTP URL)
      return CachedNetworkImage(
        imageUrl: imageUrl,
        fit: BoxFit.cover,
        placeholder: (context, url) => const Center(
          child: CircularProgressIndicator(strokeWidth: 2),
        ),
        errorWidget: (context, url, error) => 
            const Center(child: Icon(Icons.book)),
      );
    }
  }

  Widget _buildCartItem(CartItem item) {
    final book = item.book;
    if (book == null) return const SizedBox.shrink();

    // Get the generated cover URL from personalization data if available
    final generatedCoverUrl = item.personalizationData['generated_cover_url'] as String?;
    final imageUrl = generatedCoverUrl?.isNotEmpty == true ? generatedCoverUrl! : book.coverImageUrl;

    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Book cover
            Container(
              width: 80,
              height: 100,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(8),
                color: Colors.grey[200],
              ),
              child: imageUrl.isNotEmpty
                  ? ClipRRect(
                      borderRadius: BorderRadius.circular(8),
                      child: Stack(
                        children: [
                          // Main image
                          Positioned.fill(
                            child: _buildImageWidget(imageUrl),
                          ),
                          // Personalized badge if this is a generated cover
                          if (generatedCoverUrl?.isNotEmpty == true)
                            Positioned(
                              top: 4,
                              right: 4,
                              child: Container(
                                padding: const EdgeInsets.all(2),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFB47AFF),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: const Icon(
                                  Icons.auto_awesome,
                                  color: Colors.white,
                                  size: 12,
                                ),
                              ),
                            ),
                        ],
                      ),
                    )
                  : const Center(child: Icon(Icons.book)),
            ),
            
            const SizedBox(width: 16),
            
            // Book details
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    book.title,
                    style: GoogleFonts.tajawal(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  
                  const SizedBox(height: 8),
                  
                  // Personalization info
                  if (item.personalizationData.isNotEmpty) ...[
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: const Color(0xFFB47AFF).withOpacity(0.1),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              const Icon(
                                Icons.auto_awesome,
                                size: 14,
                                color: Color(0xFFB47AFF),
                              ),
                              const SizedBox(width: 4),
                              Text(
                                'cart_page_personalized_for'.tr,
                                style: GoogleFonts.tajawal(
                                  fontSize: 12,
                                  color: Colors.grey[600],
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 4),
                          Text(
                            item.personalizationData['child_name'] ?? 'cart_page_unknown'.tr,
                            style: GoogleFonts.tajawal(
                              fontWeight: FontWeight.bold,
                              color: Color(0xFFB47AFF),
                            ),
                          ),
                          if (item.personalizationData['child_age'] != null) ...[
                            const SizedBox(height: 2),
                            Text(
                              '${'cart_page_age_label'.tr} ${item.personalizationData['child_age']} ${'cart_page_years'.tr}',
                              style: GoogleFonts.tajawal(
                                fontSize: 12,
                                color: Colors.grey[600],
                              ),
                            ),
                          ],
                          if (item.personalizationData['selected_language'] != null) ...[
                            const SizedBox(height: 2),
                            Text(
                              '${'cart_page_language_label'.tr} ${item.personalizationData['selected_language']}',
                              style: GoogleFonts.tajawal(
                                fontSize: 12,
                                color: Colors.grey[600],
                              ),
                            ),
                          ],
                        ],
                      ),
                    ),
                    const SizedBox(height: 8),
                  ],
                  
                  // Price and quantity
                  Row(
                    children: [
                      Text(
                        book.formattedDiscountedPrice,
                        style: GoogleFonts.tajawal(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFFB47AFF),
                        ),
                      ),
                      
                      const Spacer(),
                      
                      // Quantity controls
                      // Row(
                      //   children: [
                      //     IconButton(
                      //       onPressed: () => _updateQuantity(item.id, item.quantity - 1),
                      //       icon: const Icon(Icons.remove_circle_outline),
                      //       color: const Color(0xFFB47AFF),
                      //     ),
                      //     Text(
                      //       '${item.quantity}',
                      //       style: const TextStyle(
                      //         fontSize: 16,
                      //         fontWeight: FontWeight.bold,
                      //       ),
                      //     ),
                      //     IconButton(
                      //       onPressed: () => _updateQuantity(item.id, item.quantity + 1),
                      //       icon: const Icon(Icons.add_circle_outline),
                      //       color: const Color(0xFFB47AFF),
                      //     ),
                      //   ],
                      // ),
                    ],
                  ),
                ],
              ),
            ),
            
            // Remove button
            IconButton(
              onPressed: () => _removeItem(item.id),
              icon: const Icon(Icons.delete_outline),
              color: Colors.red,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAddBooksCard() {
    return Container(
      margin: const EdgeInsets.symmetric(vertical: 8),
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFFE8D5FF), Color(0xFFF0E6FF)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.1),
            spreadRadius: 1,
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        children: [
          Text(
            'cart_page_add_another_book'.tr,
            style: GoogleFonts.tajawal(
              fontSize: 18,
              fontWeight: FontWeight.w600,
              color: Color(0xFF6B46C1),
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton(
              onPressed: () {
                // Switch to Shop tab (index 1) if in MainNavigation
                MainNavigation.switchTab(context, 1);
              },
              style: OutlinedButton.styleFrom(
                side: const BorderSide(color: Color(0xFFB47AFF), width: 2),
                padding: const EdgeInsets.symmetric(vertical: 12),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
              child: Text(
                'cart_page_add_books'.tr,
                style: GoogleFonts.tajawal(
                  color: Color(0xFFB47AFF),
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCartSummary() {
    return Container(
      margin: _isMobile(context)
          ? const EdgeInsets.all(16)
          : const EdgeInsets.symmetric(horizontal: 40, vertical: 24),
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.shade200),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.1),
            spreadRadius: 1,
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'cart_page_total'.tr,
                style: GoogleFonts.tajawal(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                ),
              ),
              Text(
                '\$${_total.toStringAsFixed(2)}',
                style: GoogleFonts.tajawal(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFFB47AFF),
                ),
              ),
            ],
          ),
          
          const SizedBox(height: 16),
          
          SizedBox(
            width: double.infinity,
            height: 50,
            child: ElevatedButton(
              onPressed: () async {
                // Check if user is authenticated
                final user = Supabase.instance.client.auth.currentUser;
                
                if (user == null) {
                  // Show login prompt dialog
                  final shouldLogin = await showDialog<bool>(
                    context: context,
                    builder: (context) => AlertDialog(
                      title: Text('cart_page_login_required'.tr),
                      content: Text('cart_page_login_message'.tr),
                      actions: [
                        TextButton(
                          onPressed: () => Navigator.pop(context, false),
                          child: Text('cart_page_cancel'.tr),
                        ),
                        ElevatedButton(
                          onPressed: () => Navigator.pop(context, true),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF784D9C),
                          ),
                          child: Text(
                            'cart_page_login_button'.tr,
                            style: GoogleFonts.tajawal(
                              color: Colors.white,
                            ),
                          ),
                        ),
                      ],
                    ),
                  );

                  if (shouldLogin == true) {
                    // Navigate to login page
                    await Navigator.push(
                      context,
                      MaterialPageRoute(builder: (context) => const LoginPage()),
                    );
                    
                    // After returning from login, check if user is now authenticated
                    final currentUser = Supabase.instance.client.auth.currentUser;
                    if (currentUser != null) {
                      // User logged in, reload cart (migration happens automatically in CartService)
                      await _loadCart();
                      
                      if (mounted && _cartItems.isNotEmpty) {
                        // Proceed to checkout if cart has items
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (context) => ShippingPage(
                              cartTotal: _total,
                              cartItems: _cartItems,
                            ),
                          ),
                        );
                      }
                    }
                  }
                } else {
                  // User is authenticated, proceed to checkout
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => ShippingPage(
                        cartTotal: _total,
                        cartItems: _cartItems,
                      ),
                    ),
                  );
                }
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF784D9C),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
              child: Text(
                'cart_page_proceed_checkout'.tr,
                style: GoogleFonts.tajawal(
                  color: Colors.white,
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
