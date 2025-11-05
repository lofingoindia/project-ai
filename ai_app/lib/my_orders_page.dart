import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'main_navigation.dart';
import 'services/localization_service.dart';
import 'services/order_service.dart';
import 'services/book_generation_service.dart';
import 'models/order.dart';

// Responsive helper functions
bool _isMobile(BuildContext context) => MediaQuery.of(context).size.width < 650;

double _getMaxWidth(BuildContext context) {
  final width = MediaQuery.of(context).size.width;
  if (_isMobile(context)) return width;
  return 1000;
}

class MyOrdersPage extends StatefulWidget {
  @override
  State<MyOrdersPage> createState() => _MyOrdersPageState();
}

class _MyOrdersPageState extends State<MyOrdersPage> {
  final OrderService _orderService = OrderService();
  final BookGenerationService _generationService = BookGenerationService();
  List<Order> _orders = [];
  bool _isLoading = true;
  final Map<String, bool> _downloadingItems = {};

  @override
  void initState() {
    super.initState();
    _loadOrders();
  }

  Future<void> _loadOrders() async {
    setState(() => _isLoading = true);
    try {
      final orders = await _orderService.getUserOrders();
      
      // Debug logging
      if (kDebugMode && orders.isNotEmpty) {
        print('📦 Loaded ${orders.length} orders');
        for (var order in orders) {
          print('Order ${order.orderNumber}: ${order.items.length} items');
          for (var item in order.items) {
            print('  - ${item.book?.title ?? "Unknown"}: status=${item.generationStatus}, pdfUrl=${item.pdfUrl != null ? "✓" : "✗"}');
          }
        }
      }
      
      setState(() {
        _orders = orders;
        _isLoading = false;
      });
    } catch (e) {
      print('Error loading orders: $e');
      setState(() => _isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('${'my_orders_page_failed_to_load'.tr}$e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final localizationService = LocalizationService();
    
    return Directionality(
      textDirection: localizationService.textDirection,
      child: Scaffold(
        backgroundColor: const Color(0xFFF9F7FC),
        appBar: AppBar(
          backgroundColor: Colors.white,
          elevation: 0.5,
          iconTheme: const IconThemeData(color: Colors.black),
          title: Text(
            'my_orders_page_title'.tr,
            style: GoogleFonts.tajawal(
              color: Colors.black,
              fontWeight: FontWeight.bold,
              fontSize: 18,
            ),
          ),
          leading: IconButton(
            icon: const Icon(Icons.arrow_back),
            onPressed: () => Navigator.of(context).pop(),
          ),
        ),
        body: _isLoading
            ? const Center(child: CircularProgressIndicator())
            : _orders.isEmpty
                ? _buildEmptyState()
                : _buildOrdersList(),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Container(
        margin: const EdgeInsets.all(24),
        padding: const EdgeInsets.symmetric(vertical: 32, horizontal: 16),
        decoration: BoxDecoration(
          color: const Color(0xFFF7F0FC),
          borderRadius: BorderRadius.circular(16),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.receipt_long,
              size: 64,
              color: Colors.grey[400],
            ),
            const SizedBox(height: 16),
            Text(
              'my_orders_page_no_orders'.tr,
              style: GoogleFonts.tajawal(
                fontSize: 18,
                fontWeight: FontWeight.w600,
                color: Colors.black87,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Text(
              'my_orders_page_add_personalised_book'.tr,
              style: GoogleFonts.tajawal(
                fontSize: 14,
                color: Colors.grey[600],
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            OutlinedButton(
              style: OutlinedButton.styleFrom(
                side: const BorderSide(color: Color(0xFFB47AFF)),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
                padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 14),
                backgroundColor: Colors.white,
              ),
              onPressed: () {
                Navigator.of(context).pop();
                MainNavigation.switchTab(context, 1);
              },
              child: Text(
                'my_orders_page_add_books'.tr,
                style: GoogleFonts.tajawal(
                  color: Colors.black,
                  fontWeight: FontWeight.w500,
                  fontSize: 16,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildOrdersList() {
    final maxWidth = _getMaxWidth(context);
    
    return RefreshIndicator(
      onRefresh: _loadOrders,
      child: Center(
        child: Container(
          constraints: BoxConstraints(maxWidth: maxWidth),
          child: ListView.builder(
            padding: EdgeInsets.symmetric(
              horizontal: _isMobile(context) ? 16 : 40,
              vertical: 16
            ),
            itemCount: _orders.length,
            itemBuilder: (context, index) {
              final order = _orders[index];
              return _buildOrderCard(order);
            },
          ),
        ),
      ),
    );
  }

  Widget _buildOrderCard(Order order) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.shade200),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Order Header
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFFF7F0FC),
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(12),
                topRight: Radius.circular(12),
              ),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '${'my_orders_page_order_number'.tr}${order.orderNumber}',
                      style: GoogleFonts.tajawal(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: Colors.black87,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      _formatDate(order.createdAt),
                      style: GoogleFonts.tajawal(
                        fontSize: 12,
                        color: Colors.grey[600],
                      ),
                    ),
                  ],
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: _getStatusColor(order.status),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    _getStatusText(order.status),
                    style: GoogleFonts.tajawal(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: Colors.white,
                    ),
                  ),
                ),
              ],
            ),
          ),

          // Order Items
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                ...order.items.map((item) => _buildOrderItem(item)),
                const SizedBox(height: 12),
                const Divider(),
                const SizedBox(height: 12),
                
                // Order Summary
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'my_orders_page_subtotal'.tr,
                      style: GoogleFonts.tajawal(
                        fontSize: 14,
                        color: Colors.grey[700],
                      ),
                    ),
                    Text(
                      '\$${order.subtotal.toStringAsFixed(2)}',
                      style: GoogleFonts.tajawal(
                        fontSize: 14,
                        color: Colors.black87,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'my_orders_page_shipping'.tr,
                      style: GoogleFonts.tajawal(
                        fontSize: 14,
                        color: Colors.grey[700],
                      ),
                    ),
                    Text(
                      '\$${order.shippingCost.toStringAsFixed(2)}',
                      style: GoogleFonts.tajawal(
                        fontSize: 14,
                        color: Colors.black87,
                      ),
                    ),
                  ],
                ),
                if (order.discountAmount > 0) ...[
                  const SizedBox(height: 8),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        '${'my_orders_page_discount'.tr}${order.appliedCoupon != null ? " (${order.appliedCoupon})" : ""}',
                        style: GoogleFonts.tajawal(
                          fontSize: 14,
                          color: Colors.green[700],
                        ),
                      ),
                      Text(
                        '-\$${order.discountAmount.toStringAsFixed(2)}',
                        style: GoogleFonts.tajawal(
                          fontSize: 14,
                          color: Colors.green[700],
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ],
                const SizedBox(height: 12),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'my_orders_page_total'.tr,
                      style: GoogleFonts.tajawal(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: Colors.black87,
                      ),
                    ),
                    Text(
                      '\$${order.totalAmount.toStringAsFixed(2)}',
                      style: GoogleFonts.tajawal(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: const Color(0xFF784D9C),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildOrderItem(OrderItem item) {
    // Debug: print item data to understand what's available
    if (kDebugMode) {
      print('🔍 Order item data:');
      print('   bookTitle: ${item.bookTitle}');
      print('   bookId: ${item.bookId}');
      print('   generationStatus: ${item.generationStatus}');
      print('   pdfUrl: ${item.pdfUrl ?? "null"}');
      print('   personalizationData: ${item.personalizationData}');
    }
    
    // Use the helper methods from OrderItem
    String bookTitle = item.bookTitle;
    String imageUrl = item.bookCoverUrl.isNotEmpty ? item.bookCoverUrl : item.bookThumbnailUrl;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Book Cover
          Container(
            width: 60,
            height: 80,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: Colors.grey.shade200),
            ),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: imageUrl.isNotEmpty
                  ? CachedNetworkImage(
                      imageUrl: imageUrl,
                      fit: BoxFit.cover,
                      placeholder: (context, url) => Container(
                        color: Colors.grey[200],
                        child: const Center(
                          child: SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          ),
                        ),
                      ),
                      errorWidget: (context, url, error) {
                        return Container(
                          color: Colors.grey[200],
                          child: const Icon(Icons.book, color: Colors.grey, size: 30),
                        );
                      },
                    )
                  : Container(
                      color: Colors.grey[200],
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(Icons.book, color: Colors.grey, size: 30),
                          const SizedBox(height: 4),
                          Text(
                            'my_orders_page_no_image'.tr,
                            style: GoogleFonts.tajawal(
                              fontSize: 8,
                              color: Colors.grey[600],
                            ),
                          ),
                        ],
                      ),
                    ),
            ),
          ),
          const SizedBox(width: 12),

          // Book Details
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  bookTitle,
                  style: GoogleFonts.tajawal(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: Colors.black87,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 4),
                if (item.personalizationData.isNotEmpty &&
                    item.personalizationData['child_name'] != null) ...[
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: const Color(0xFF784D9C).withOpacity(0.1),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(
                      '${'my_orders_page_personalized_for'.tr}${item.personalizationData['child_name']}',
                      style: GoogleFonts.tajawal(
                        fontSize: 11,
                        color: const Color(0xFF784D9C),
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                  const SizedBox(height: 4),
                ],
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      '${'my_orders_page_qty'.tr}${item.quantity}',
                      style: GoogleFonts.tajawal(
                        fontSize: 12,
                        color: Colors.grey[600],
                      ),
                    ),
                    Text(
                      '\$${item.unitPrice.toStringAsFixed(2)}',
                      style: GoogleFonts.tajawal(
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                        color: Colors.black87,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                
                // Book Generation Status and Download Button
                _buildGenerationStatusSection(item),
              ],
            ),
          ),
        ],
      ),
    );
  }

  String _formatDate(DateTime date) {
    final months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    return '${months[date.month - 1]} ${date.day}, ${date.year}';
  }

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'paid':
      case 'processing':
        return Colors.blue;
      case 'shipped':
        return Colors.orange;
      case 'delivered':
        return Colors.green;
      case 'cancelled':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  String _getStatusText(String status) {
    final statusKey = 'my_orders_page_${status.toLowerCase()}';
    // Try to get translation, fallback to capitalized status
    try {
      return statusKey.tr;
    } catch (e) {
      return status.charAt(0).toUpperCase() + status.substring(1).toLowerCase();
    }
  }

  /// Build generation status section with download button
  Widget _buildGenerationStatusSection(OrderItem item) {
    // Debug logging
    if (kDebugMode) {
      print('🔍 Building status section for ${item.book?.title ?? "Unknown"}');
      print('   Status: ${item.generationStatus}');
      print('   PDF URL: ${item.pdfUrl ?? "null"}');
      print('   isGenerationComplete: ${item.isGenerationComplete}');
    }

    final bool canDownload = item.generationStatus.toLowerCase() == 'completed' && item.pdfUrl != null;

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: _getGenerationStatusBackgroundColor(item.generationStatus),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(
          color: _getGenerationStatusBorderColor(item.generationStatus),
          width: 1,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Status Header Row
          Row(
            children: [
              _buildGenerationStatusIcon(item.generationStatus),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  _getGenerationStatusTitle(item.generationStatus),
                  style: GoogleFonts.tajawal(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: _getGenerationStatusTextColor(item.generationStatus),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          // Status Description
          Padding(
            padding: const EdgeInsets.only(left: 34),
            child: Text(
              _getGenerationStatusDescription(item.generationStatus),
              style: GoogleFonts.tajawal(
                fontSize: 12,
                color: Colors.grey[600],
              ),
            ),
          ),
          // Download Button - Always visible but enabled only when completed
          const SizedBox(height: 12),
          // If generation failed, show Try Again button instead of disabled download
          if (item.generationStatus.toLowerCase() == 'failed')
            SizedBox(
              width: double.infinity,
              child: OutlinedButton(
                onPressed: () => _retryGeneration(item),
                style: OutlinedButton.styleFrom(
                  side: BorderSide(color: Colors.red.shade300),
                  foregroundColor: Colors.red.shade700,
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
                child: Text(
                  'my_orders_page_try_again'.tr,
                  style: GoogleFonts.tajawal(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: Colors.red.shade700,
                  ),
                ),
              ),
            )
          else
            _buildDownloadButton(item, enabled: canDownload),
        ],
      ),
    );
  }

  Widget _buildGenerationStatusIcon(String status) {
    IconData iconData;
    Color iconColor;

    switch (status.toLowerCase()) {
      case 'completed':
        iconData = Icons.check_circle;
        iconColor = Colors.green;
        break;
      case 'processing':
        iconData = Icons.autorenew;
        iconColor = Colors.orange;
        break;
      case 'failed':
        iconData = Icons.error;
        iconColor = Colors.red;
        break;
      case 'pending':
      default:
        iconData = Icons.schedule;
        iconColor = Colors.blue;
        break;
    }

    return Icon(iconData, color: iconColor, size: 24);
  }

  Color _getGenerationStatusBackgroundColor(String status) {
    switch (status.toLowerCase()) {
      case 'completed':
        return Colors.green.withOpacity(0.1);
      case 'processing':
        return Colors.orange.withOpacity(0.1);
      case 'failed':
        return Colors.red.withOpacity(0.1);
      case 'pending':
      default:
        return Colors.blue.withOpacity(0.1);
    }
  }

  Color _getGenerationStatusBorderColor(String status) {
    switch (status.toLowerCase()) {
      case 'completed':
        return Colors.green.withOpacity(0.3);
      case 'processing':
        return Colors.orange.withOpacity(0.3);
      case 'failed':
        return Colors.red.withOpacity(0.3);
      case 'pending':
      default:
        return Colors.blue.withOpacity(0.3);
    }
  }

  Color _getGenerationStatusTextColor(String status) {
    switch (status.toLowerCase()) {
      case 'completed':
        return Colors.green[800]!;
      case 'processing':
        return Colors.orange[800]!;
      case 'failed':
        return Colors.red[800]!;
      case 'pending':
      default:
        return Colors.blue[800]!;
    }
  }

  String _getGenerationStatusTitle(String status) {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'my_orders_page_generation_completed'.tr;
      case 'processing':
        return 'my_orders_page_generation_processing'.tr;
      case 'failed':
        return 'my_orders_page_generation_failed'.tr;
      case 'pending':
      default:
        return 'my_orders_page_generation_pending'.tr;
    }
  }

  String _getGenerationStatusDescription(String status) {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'my_orders_page_generation_completed_desc'.tr;
      case 'processing':
        return 'my_orders_page_generation_processing_desc'.tr;
      case 'failed':
        return 'my_orders_page_generation_failed_desc'.tr;
      case 'pending':
      default:
        return 'my_orders_page_generation_pending_desc'.tr;
    }
  }

  Widget _buildDownloadButton(OrderItem item, {required bool enabled}) {
    final isDownloading = _downloadingItems[item.id] ?? false;
    final canClick = enabled && !isDownloading;

    return SizedBox(
      width: double.infinity,
      child: ElevatedButton.icon(
        onPressed: canClick ? () => _handleDownload(item) : null,
        style: ElevatedButton.styleFrom(
          backgroundColor: enabled ? const Color(0xFF784D9C) : Colors.grey,
          foregroundColor: Colors.white,
          disabledBackgroundColor: Colors.grey[300],
          disabledForegroundColor: Colors.grey[600],
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
          ),
          elevation: enabled ? 2 : 0,
          minimumSize: const Size(double.infinity, 40),
        ),
        icon: isDownloading
            ? const SizedBox(
                width: 16,
                height: 16,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  color: Colors.white,
                ),
              )
            : Icon(
                enabled ? Icons.download : Icons.lock,
                size: 18,
              ),
        label: Text(
          isDownloading 
              ? 'my_orders_page_downloading'.tr 
              : enabled
                  ? 'my_orders_page_download'.tr
                  : 'my_orders_page_waiting_generation'.tr,
          style: GoogleFonts.tajawal(
            fontSize: 13,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
    );
  }

  Future<void> _handleDownload(OrderItem item) async {
    if (item.pdfUrl == null) return;

    setState(() {
      _downloadingItems[item.id] = true;
    });

    try {
      final childName = item.personalizationData['child_name'] ?? 'Child';
      final bookTitle = item.bookTitle;

      final success = await _generationService.downloadBook(
        pdfUrl: item.pdfUrl!,
        bookTitle: bookTitle,
        childName: childName,
      );

      if (mounted) {
        if (success) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('my_orders_page_download_success'.tr),
              backgroundColor: Colors.green,
              duration: const Duration(seconds: 3),
            ),
          );
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('my_orders_page_download_failed'.tr),
              backgroundColor: Colors.red,
              duration: const Duration(seconds: 3),
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('${'my_orders_page_download_error'.tr}$e'),
            backgroundColor: Colors.red,
            duration: const Duration(seconds: 3),
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _downloadingItems[item.id] = false;
        });
      }
    }
  }

  Future<void> _retryGeneration(OrderItem item) async {
    // Prevent multiple retries at once
    if ((_downloadingItems[item.id] ?? false)) return;

    setState(() {
      _downloadingItems[item.id] = true;
    });

    try {
      // Initiate generation via service
      await _generationService.initiateBookGeneration(
        orderItemId: item.id,
        bookId: item.bookId,
        personalizationData: item.personalizationData,
      );

      // Optimistically update UI to processing
      setState(() {
        // update local model
        for (var order in _orders) {
          for (var i = 0; i < order.items.length; i++) {
            if (order.items[i].id == item.id) {
              order.items[i] = OrderItem(
                id: order.items[i].id,
                orderId: order.items[i].orderId,
                bookId: order.items[i].bookId,
                quantity: order.items[i].quantity,
                unitPrice: order.items[i].unitPrice,
                personalizationData: order.items[i].personalizationData,
                createdAt: order.items[i].createdAt,
                book: order.items[i].book,
                generationStatus: 'processing',
                pdfUrl: order.items[i].pdfUrl,
                coverImageUrl: order.items[i].coverImageUrl,
                generatedAt: order.items[i].generatedAt,
                generationError: null,
              );
              break;
            }
          }
        }
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('my_orders_page_retry_started'.tr)),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('${'my_orders_page_retry_failed'.tr}$e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _downloadingItems[item.id] = false;
        });
      }
    }
  }
}

extension StringExtension on String {
  String charAt(int index) {
    if (index >= 0 && index < length) {
      return this[index];
    }
    return '';
  }
}
