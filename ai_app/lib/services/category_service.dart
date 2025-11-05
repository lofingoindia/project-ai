import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/category.dart';

class CategoryService {
  final SupabaseClient _client = Supabase.instance.client;

  // Get all active categories
  Future<List<Category>> getCategories() async {
    try {
      final response = await _client
          .from('categories')
          .select('''
            *,
            subcategories(*)
          ''')
          .eq('is_active', true)
          .order('sort_order', ascending: true);

      return (response as List)
          .map((json) => Category.fromJson(json))
          .toList();
    } catch (e) {
      throw Exception('Failed to fetch categories: $e');
    }
  }

  // Get subcategories by category ID
  Future<List<Subcategory>> getSubcategoriesByCategory(String categoryId) async {
    try {
      final response = await _client
          .from('subcategories')
          .select()
          .eq('category_id', categoryId)
          .eq('is_active', true)
          .order('sort_order', ascending: true);

      return (response as List)
          .map((json) => Subcategory.fromJson(json))
          .toList();
    } catch (e) {
      throw Exception('Failed to fetch subcategories: $e');
    }
  }

  // Get books by category
  Future<List<String>> getBooksByCategory(String categoryId) async {
    try {
      final response = await _client
          .from('books')
          .select('id')
          .eq('category_id', categoryId)
          .eq('is_active', true);

      return (response as List)
          .map((item) => item['id'] as String)
          .toList();
    } catch (e) {
      throw Exception('Failed to fetch books by category: $e');
    }
  }

  // Get books by subcategory
  Future<List<String>> getBooksBySubcategory(String subcategoryId) async {
    try {
      final response = await _client
          .from('books')
          .select('id')
          .eq('subcategory_id', subcategoryId)
          .eq('is_active', true);

      return (response as List)
          .map((item) => item['id'] as String)
          .toList();
    } catch (e) {
      throw Exception('Failed to fetch books by subcategory: $e');
    }
  }
}
