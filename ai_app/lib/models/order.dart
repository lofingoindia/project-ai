import 'book.dart';

class CartItem {
  final String id;
  final String userId;
  final int bookId;
  final int quantity;
  final Map<String, dynamic> personalizationData;
  final DateTime createdAt;
  final Book? book; // Populated via join

  CartItem({
    required this.id,
    required this.userId,
    required this.bookId,
    required this.quantity,
    required this.personalizationData,
    required this.createdAt,
    this.book,
  });

  factory CartItem.fromJson(Map<String, dynamic> json) {
    return CartItem(
      id: json['id'],
      userId: json['user_id'],
      bookId: json['book_id'] is int ? json['book_id'] : int.parse(json['book_id'].toString()),
      quantity: json['quantity'] ?? 1,
      personalizationData: json['personalization_data'] ?? {},
      createdAt: DateTime.parse(json['created_at']),
      book: json['book'] != null ? Book.fromJson(json['book']) : null,
    );
  }
}

class Order {
  final String id;
  final String userId;
  final String orderNumber;
  final String status;
  final String paymentStatus;
  final double totalAmount;
  final double subtotal;
  final double shippingCost;
  final double discountAmount;
  final String currency;
  final String paymentMethod;
  final String shippingMethod;
  final Map<String, dynamic> shippingAddress;
  final String? appliedCoupon;
  final DateTime createdAt;
  final List<OrderItem> items;

  Order({
    required this.id,
    required this.userId,
    required this.orderNumber,
    required this.status,
    required this.paymentStatus,
    required this.totalAmount,
    required this.subtotal,
    required this.shippingCost,
    required this.discountAmount,
    required this.currency,
    required this.paymentMethod,
    required this.shippingMethod,
    required this.shippingAddress,
    this.appliedCoupon,
    required this.createdAt,
    required this.items,
  });

  factory Order.fromJson(Map<String, dynamic> json) {
    return Order(
      id: json['id'],
      userId: json['user_id'],
      orderNumber: json['order_number'] ?? '',
      status: json['status'] ?? 'pending',
      paymentStatus: json['payment_status'] ?? 'pending',
      totalAmount: (json['total_amount'] ?? 0.0).toDouble(),
      subtotal: (json['subtotal'] ?? 0.0).toDouble(),
      shippingCost: (json['shipping_cost'] ?? 0.0).toDouble(),
      discountAmount: (json['discount_amount'] ?? 0.0).toDouble(),
      currency: json['currency'] ?? 'USD',
      paymentMethod: json['payment_method'] ?? '',
      shippingMethod: json['shipping_method'] ?? '',
      shippingAddress: json['shipping_address'] ?? {},
      appliedCoupon: json['applied_coupon'],
      createdAt: DateTime.parse(json['created_at']),
      items: json['order_items'] != null
          ? (json['order_items'] as List)
              .map((item) => OrderItem.fromJson(item))
              .toList()
          : [],
    );
  }
}

class OrderItem {
  final String id;
  final String orderId;
  final int bookId;
  final int quantity;
  final double unitPrice;
  final Map<String, dynamic> personalizationData;
  final DateTime createdAt;
  final Book? book;
  
  // Book generation fields
  final String generationStatus; // 'pending', 'processing', 'completed', 'failed'
  final String? pdfUrl;
  final String? coverImageUrl;
  final DateTime? generatedAt;
  final String? generationError;

  OrderItem({
    required this.id,
    required this.orderId,
    required this.bookId,
    required this.quantity,
    required this.unitPrice,
    required this.personalizationData,
    required this.createdAt,
    this.book,
    this.generationStatus = 'pending',
    this.pdfUrl,
    this.coverImageUrl,
    this.generatedAt,
    this.generationError,
  });

  factory OrderItem.fromJson(Map<String, dynamic> json) {
    return OrderItem(
      id: json['id'],
      orderId: json['order_id'],
      bookId: json['book_id'] is int ? json['book_id'] : int.parse(json['book_id'].toString()),
      quantity: json['quantity'] ?? 1,
      unitPrice: (json['unit_price'] ?? 0.0).toDouble(),
      personalizationData: json['personalization_data'] ?? {},
      createdAt: DateTime.parse(json['created_at']),
      book: json['book'] != null ? Book.fromJson(json['book']) : null,
      generationStatus: json['generation_status'] ?? 'pending',
      pdfUrl: json['pdf_url'],
      coverImageUrl: json.containsKey('cover_image_url') ? json['cover_image_url'] : null,
      generatedAt: json['generated_at'] != null ? DateTime.parse(json['generated_at']) : null,
      generationError: json['generation_error'],
    );
  }

  double get totalPrice => unitPrice * quantity;
  
  bool get isGenerationComplete => generationStatus == 'completed' && pdfUrl != null;
  bool get isGenerationInProgress => generationStatus == 'processing' || generationStatus == 'pending';
  bool get hasGenerationFailed => generationStatus == 'failed';
  
  // Helper methods to get book info when book object is null
  String get bookTitle => book?.title ?? personalizationData['book_title']?.toString() ?? 'Unknown Book';
  String get bookCoverUrl => book?.coverImageUrl ?? personalizationData['book_cover_url']?.toString() ?? '';
  String get bookThumbnailUrl => book?.thumbnailImage ?? personalizationData['book_thumbnail_url']?.toString() ?? '';
}
