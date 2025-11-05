import 'package:flutter/material.dart';
import '../models/book.dart';
import '../services/cart_service.dart';

class BookDetailPage extends StatefulWidget {
  final Book book;

  const BookDetailPage({Key? key, required this.book}) : super(key: key);

  @override
  State<BookDetailPage> createState() => _BookDetailPageState();
}

class _BookDetailPageState extends State<BookDetailPage> {
  final CartService _cartService = CartService();
  final TextEditingController _childNameController = TextEditingController();
  int _selectedAge = 5;
  String _selectedGender = 'boy';
  bool _isAddingToCart = false;

  @override
  void dispose() {
    _childNameController.dispose();
    super.dispose();
  }

  Future<void> _addToCart() async {
    if (_childNameController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter child\'s name')),
      );
      return;
    }

    setState(() => _isAddingToCart = true);

    try {
      final personalizationData = {
        'child_name': _childNameController.text.trim(),
        'child_age': _selectedAge,
        'child_gender': _selectedGender,
        'customization_date': DateTime.now().toIso8601String(),
      };

      await _cartService.addToCart(widget.book.id, 1, personalizationData);
      
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Book added to cart!'),
          backgroundColor: Colors.green,
        ),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error adding to cart: $e')),
      );
    }

    setState(() => _isAddingToCart = false);
  }

  @override
  Widget build(BuildContext context) {
    final screenWidth = MediaQuery.of(context).size.width;
    final isMobile = screenWidth < 650;
    final maxWidth = isMobile ? double.infinity : 1000.0;
    
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.book.title),
        backgroundColor: Colors.white,
        foregroundColor: Colors.black,
        elevation: 0.5,
      ),
      body: SingleChildScrollView(
        child: Center(
          child: Container(
            constraints: BoxConstraints(maxWidth: maxWidth),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Book cover image
                Container(
              height: 300,
              width: double.infinity,
              decoration: BoxDecoration(
                color: Colors.grey[200],
              ),
              child: widget.book.coverImageUrl.isNotEmpty
                  ? Image.network(
                      widget.book.coverImageUrl,
                      fit: BoxFit.cover,
                      errorBuilder: (context, error, stackTrace) => 
                          const Center(child: Icon(Icons.book, size: 100)),
                    )
                  : const Center(child: Icon(Icons.book, size: 100)),
            ),
            
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Title and discount
                  Row(
                    children: [
                      if (widget.book.discountPercentage > 0)
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: Colors.red,
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            '-${widget.book.discountPercentage}%',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  
                  Text(
                    widget.book.title,
                    style: const TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  
                  const SizedBox(height: 8),
                  
                  // Price
                  Row(
                    children: [
                      if (widget.book.discountPercentage > 0) ...[
                        Text(
                          widget.book.formattedPrice,
                          style: const TextStyle(
                            decoration: TextDecoration.lineThrough,
                            color: Colors.grey,
                            fontSize: 16,
                          ),
                        ),
                        const SizedBox(width: 8),
                      ],
                      Text(
                        widget.book.formattedDiscountedPrice,
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          color: Color(0xFFB47AFF),
                          fontSize: 20,
                        ),
                      ),
                    ],
                  ),
                  
                  const SizedBox(height: 16),
                  
                  // Description
                  Text(
                    'Description',
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    widget.book.description,
                    style: const TextStyle(fontSize: 16),
                  ),
                  
                  const SizedBox(height: 24),
                  
                  // Personalization section
                  Text(
                    'Personalize Your Book',
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFFB47AFF),
                    ),
                  ),
                  const SizedBox(height: 16),
                  
                  // Child's name input
                  TextField(
                    controller: _childNameController,
                    decoration: InputDecoration(
                      labelText: 'Child\'s Name',
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                      prefixIcon: const Icon(Icons.person),
                    ),
                  ),
                  
                  const SizedBox(height: 16),
                  
                  // Age selection
                  Text('Child\'s Age', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w500)),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    children: List.generate(12, (index) {
                      final age = index + 1;
                      final isSelected = age == _selectedAge;
                      return FilterChip(
                        label: Text('$age'),
                        selected: isSelected,
                        onSelected: (selected) {
                          setState(() => _selectedAge = age);
                        },
                        selectedColor: const Color(0xFFB47AFF),
                        checkmarkColor: Colors.white,
                      );
                    }),
                  ),
                  
                  const SizedBox(height: 16),
                  
                  // Gender selection
                  Text('Gender', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w500)),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      FilterChip(
                        label: const Text('Boy'),
                        selected: _selectedGender == 'boy',
                        onSelected: (selected) {
                          setState(() => _selectedGender = 'boy');
                        },
                        selectedColor: const Color(0xFFB47AFF),
                        checkmarkColor: Colors.white,
                      ),
                      const SizedBox(width: 8),
                      FilterChip(
                        label: const Text('Girl'),
                        selected: _selectedGender == 'girl',
                        onSelected: (selected) {
                          setState(() => _selectedGender = 'girl');
                        },
                        selectedColor: const Color(0xFFB47AFF),
                        checkmarkColor: Colors.white,
                      ),
                    ],
                  ),
                  
                  const SizedBox(height: 32),
                  
                  // Add to cart button
                  SizedBox(
                    width: double.infinity,
                    height: 50,
                    child: ElevatedButton(
                      onPressed: _isAddingToCart ? null : _addToCart,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF784D9C),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                      ),
                      child: _isAddingToCart
                          ? const CircularProgressIndicator(color: Colors.white)
                          : const Text(
                              'Personalize & Add to Cart',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                    ),
                  ),
                  
                  const SizedBox(height: 16),
                ],
              ),
            ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
