// import 'package:flutter/material.dart';
// import '../models/category.dart';
// import '../services/category_service.dart';
// import 'books_by_category_page.dart';

// class CategoriesPage extends StatefulWidget {
//   const CategoriesPage({Key? key}) : super(key: key);

//   @override
//   State<CategoriesPage> createState() => _CategoriesPageState();
// }

// class _CategoriesPageState extends State<CategoriesPage> {
//   final CategoryService _categoryService = CategoryService();
  
//   List<Category> _categories = [];
//   bool _isLoading = true;

//   @override
//   void initState() {
//     super.initState();
//     _loadCategories();
//   }

//   Future<void> _loadCategories() async {
//     setState(() => _isLoading = true);
    
//     try {
//       final categories = await _categoryService.getCategories();
//       setState(() {
//         _categories = categories;
//         _isLoading = false;
//       });
//     } catch (e) {
//       setState(() => _isLoading = false);
//       ScaffoldMessenger.of(context).showSnackBar(
//         SnackBar(content: Text('Error loading categories: $e')),
//       );
//     }
//   }

//   @override
//   Widget build(BuildContext context) {
//     return Scaffold(
//       appBar: AppBar(
//         title: const Text('Categories'),
//         backgroundColor: Colors.white,
//         foregroundColor: Colors.black,
//         elevation: 0.5,
//       ),
//       body: _isLoading
//           ? const Center(child: CircularProgressIndicator())
//           : _categories.isEmpty
//               ? const Center(child: Text('No categories available'))
//               : RefreshIndicator(
//                   onRefresh: _loadCategories,
//                   child: ListView.builder(
//                     padding: const EdgeInsets.all(16),
//                     itemCount: _categories.length,
//                     itemBuilder: (context, index) {
//                       final category = _categories[index];
//                       return _buildCategoryCard(category);
//                     },
//                   ),
//                 ),
//     );
//   }

//   Widget _buildCategoryCard(Category category) {
//     return Card(
//       margin: const EdgeInsets.only(bottom: 16),
//       elevation: 2,
//       shape: RoundedRectangleBorder(
//         borderRadius: BorderRadius.circular(12),
//       ),
//       child: InkWell(
//         onTap: () {
//           Navigator.of(context).push(
//             MaterialPageRoute(
//               builder: (context) => BooksByCategoryPage(
//                 categoryId: category.id,
//                 categoryName: category.name,
//               ),
//             ),
//           );
//         },
//         borderRadius: BorderRadius.circular(12),
//         child: Padding(
//           padding: const EdgeInsets.all(16),
//           child: Column(
//             crossAxisAlignment: CrossAxisAlignment.start,
//             children: [
//               Row(
//                 children: [
//                   Container(
//                     width: 60,
//                     height: 60,
//                     decoration: BoxDecoration(
//                       color: const Color(0xFF9C4DFF).withOpacity(0.1),
//                       borderRadius: BorderRadius.circular(12),
//                     ),
//                     child: const Icon(
//                       Icons.category,
//                       color: Color(0xFF9C4DFF),
//                       size: 30,
//                     ),
//                   ),
//                   const SizedBox(width: 16),
//                   Expanded(
//                     child: Column(
//                       crossAxisAlignment: CrossAxisAlignment.start,
//                       children: [
//                         Text(
//                           category.name,
//                           style: const TextStyle(
//                             fontSize: 18,
//                             fontWeight: FontWeight.bold,
//                           ),
//                         ),
//                         if (category.description.isNotEmpty)
//                           Padding(
//                             padding: const EdgeInsets.only(top: 4),
//                             child: Text(
//                               category.description,
//                               style: TextStyle(
//                                 fontSize: 14,
//                                 color: Colors.grey[600],
//                               ),
//                               maxLines: 2,
//                               overflow: TextOverflow.ellipsis,
//                             ),
//                           ),
//                       ],
//                     ),
//                   ),
//                   const Icon(
//                     Icons.arrow_forward_ios,
//                     color: Colors.grey,
//                     size: 16,
//                   ),
//                 ],
//               ),
              
//               if (category.subcategories.isNotEmpty) ...[
//                 const SizedBox(height: 16),
//                 const Text(
//                   'Subcategories:',
//                   style: TextStyle(
//                     fontSize: 14,
//                     fontWeight: FontWeight.w600,
//                     color: Colors.black87,
//                   ),
//                 ),
//                 const SizedBox(height: 8),
//                 Wrap(
//                   spacing: 8,
//                   runSpacing: 4,
//                   children: category.subcategories.take(3).map((subcategory) {
//                     return Container(
//                       padding: const EdgeInsets.symmetric(
//                         horizontal: 12,
//                         vertical: 6,
//                       ),
//                       decoration: BoxDecoration(
//                         color: const Color(0xFF9C4DFF).withOpacity(0.1),
//                         borderRadius: BorderRadius.circular(16),
//                       ),
//                       child: Text(
//                         subcategory.name,
//                         style: const TextStyle(
//                           fontSize: 12,
//                           color: Color(0xFF9C4DFF),
//                           fontWeight: FontWeight.w500,
//                         ),
//                       ),
//                     );
//                   }).toList(),
//                 ),
//                 if (category.subcategories.length > 3)
//                   Padding(
//                     padding: const EdgeInsets.only(top: 4),
//                     child: Text(
//                       '+${category.subcategories.length - 3} more',
//                       style: TextStyle(
//                         fontSize: 12,
//                         color: Colors.grey[600],
//                         fontStyle: FontStyle.italic,
//                       ),
//                     ),
//                   ),
//               ],
//             ],
//           ),
//         ),
//       ),
//     );
//   }
// }
