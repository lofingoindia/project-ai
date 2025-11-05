import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/book.dart';

class BookService {
  final SupabaseClient _client = Supabase.instance.client;

  // Get featured books for home page
  Future<List<Book>> getFeaturedBooks({int limit = 6}) async {
    try {
      final response = await _client
          .from('books')
          .select('''
            *,
            categories(id, name),
            subcategories(id, name)
          ''')
          .eq('is_active', true)
          .eq('is_featured', true)
          .order('created_at', ascending: false)
          .limit(limit);

      return (response as List)
          .map((json) => Book.fromJson(json))
          .toList();
    } catch (e) {
      // Fallback to basic query if relations don't exist
      try {
        final response = await _client
            .from('books')
            .select()
            .eq('is_featured', true)
            .order('created_at', ascending: false)
            .limit(limit);

        return (response as List)
            .map((json) => Book.fromJson(json))
            .toList();
      } catch (e2) {
        throw Exception('Failed to fetch featured books: $e');
      }
    }
  }

  // Get bestseller books
  Future<List<Book>> getBestsellers({int limit = 10}) async {
    try {
      final response = await _client
          .from('books')
          .select('''
            *,
            categories(id, name),
            subcategories(id, name)
          ''')
          .eq('is_active', true)
          .order('created_at', ascending: false)
          .limit(limit);

      return (response as List)
          .map((json) => Book.fromJson(json))
          .toList();
    } catch (e) {
      // Fallback to basic query
      try {
        final response = await _client
            .from('books')
            .select()
            .eq('is_bestseller', true)
            .order('created_at', ascending: false)
            .limit(limit);

        return (response as List)
            .map((json) => Book.fromJson(json))
            .toList();
      } catch (e2) {
        throw Exception('Failed to fetch bestsellers: $e');
      }
    }
  }

  // Get books by gender target
  Future<List<Book>> getBooksByGender(String gender, {int limit = 20}) async {
    try {
      final response = await _client
          .from('books')
          .select('''
            *,
            categories(id, name),
            subcategories(id, name)
          ''')
          .eq('is_active', true)
          .or('gender_target.eq.$gender,gender_target.eq.any')
          .order('created_at', ascending: false)
          .limit(limit);

      return (response as List)
          .map((json) => Book.fromJson(json))
          .toList();
    } catch (e) {
      throw Exception('Failed to fetch books by gender: $e');
    }
  }

  // Get books by category name
  Future<List<Book>> getBooksByCategory(String category, {int limit = 20}) async {
    try {
      final response = await _client
          .from('books')
          .select('''
            *,
            categories!inner(id, name),
            subcategories(id, name)
          ''')
          .eq('is_active', true)
          .eq('categories.name', category)
          .order('created_at', ascending: false)
          .limit(limit);

      return (response as List)
          .map((json) => Book.fromJson(json))
          .toList();
    } catch (e) {
      // Fallback to category field search
      try {
        final response = await _client
            .from('books')
            .select()
            .eq('category', category)
            .order('created_at', ascending: false)
            .limit(limit);

        return (response as List)
            .map((json) => Book.fromJson(json))
            .toList();
      } catch (e2) {
        throw Exception('Failed to fetch books by category: $e');
      }
    }
  }

  // Get books by category ID
  Future<List<Book>> getBooksByCategoryId(int categoryId, {int limit = 20}) async {
    try {
      final response = await _client
          .from('books')
          .select('''
            *,
            categories(id, name),
            subcategories(id, name)
          ''')
          .eq('is_active', true)
          .eq('category_id', categoryId)
          .order('created_at', ascending: false)
          .limit(limit);

      return (response as List)
          .map((json) => Book.fromJson(json))
          .toList();
    } catch (e) {
      throw Exception('Failed to fetch books by category ID: $e');
    }
  }

  // Get books by subcategory ID
  Future<List<Book>> getBooksBySubcategoryId(int subcategoryId, {int limit = 20}) async {
    try {
      final response = await _client
          .from('books')
          .select('''
            *,
            categories(id, name),
            subcategories(id, name)
          ''')
          .eq('is_active', true)
          .eq('subcategory_id', subcategoryId)
          .order('created_at', ascending: false)
          .limit(limit);

      return (response as List)
          .map((json) => Book.fromJson(json))
          .toList();
    } catch (e) {
      throw Exception('Failed to fetch books by subcategory ID: $e');
    }
  }

  // Get books by age range
  Future<List<Book>> getBooksByAge(int childAge, {int limit = 20}) async {
    try {
      final response = await _client
          .from('books')
          .select('''
            *,
            categories(id, name),
            subcategories(id, name)
          ''')
          .eq('is_active', true)
          .lte('age_min', childAge)
          .gte('age_max', childAge)
          .order('created_at', ascending: false)
          .limit(limit);

      return (response as List)
          .map((json) => Book.fromJson(json))
          .toList();
    } catch (e) {
      throw Exception('Failed to fetch books by age: $e');
    }
  }

  // Search books
  Future<List<Book>> searchBooks(String query, {int limit = 20}) async {
    try {
      final response = await _client
          .from('books')
          .select('''
            *,
            categories(id, name),
            subcategories(id, name)
          ''')
          .eq('is_active', true)
          .or('title.ilike.%$query%,description.ilike.%$query%,category.ilike.%$query%')
          .order('created_at', ascending: false)
          .limit(limit);

      return (response as List)
          .map((json) => Book.fromJson(json))
          .toList();
    } catch (e) {
      throw Exception('Failed to search books: $e');
    }
  }

  // Get all books with pagination
  Future<List<Book>> getAllBooks({int page = 0, int limit = 20}) async {
    try {
      final response = await _client
          .from('books')
          .select('''
            *,
            categories(id, name),
            subcategories(id, name)
          ''')
          .eq('is_active', true)
          .order('created_at', ascending: false)
          .range(page * limit, (page * limit) + limit - 1);

      return (response as List)
          .map((json) => Book.fromJson(json))
          .toList();
    } catch (e) {
      // Fallback to basic query
      try {
        final response = await _client
            .from('books')
            .select()
            .order('created_at', ascending: false)
            .range(page * limit, (page * limit) + limit - 1);

        return (response as List)
            .map((json) => Book.fromJson(json))
            .toList();
      } catch (e2) {
        throw Exception('Failed to fetch books: $e');
      }
    }
  }

  // Get single book by ID
  Future<Book?> getBookById(String bookId) async {
    try {
      final response = await _client
          .from('books')
          .select('''
            *,
            categories(id, name),
            subcategories(id, name)
          ''')
          .eq('id', bookId)
          .single();

      return Book.fromJson(response);
    } catch (e) {
      // Fallback to basic query
      try {
        final response = await _client
            .from('books')
            .select()
            .eq('id', bookId)
            .single();

        return Book.fromJson(response);
      } catch (e2) {
        throw Exception('Failed to fetch book: $e');
      }
    }
  }

  // Get available categories
  Future<List<String>> getCategories() async {
    try {
      final response = await _client
          .from('books')
          .select('category')
          .not('category', 'is', null);

      final categories = (response as List)
          .map((item) => item['category'] as String)
          .toSet()
          .toList();

      return categories;
    } catch (e) {
      throw Exception('Failed to fetch categories: $e');
    }
  }

  // Get books with media content
  Future<List<Book>> getBooksWithMedia({int limit = 20}) async {
    try {
      final response = await _client
          .from('books')
          .select('''
            *,
            categories(id, name),
            subcategories(id, name)
          ''')
          .eq('is_active', true)
          .not('thumbnail_image', 'is', null)
          .order('created_at', ascending: false)
          .limit(limit);

      return (response as List)
          .map((json) => Book.fromJson(json))
          .toList();
    } catch (e) {
      throw Exception('Failed to fetch books with media: $e');
    }
  }

  // Get recently added books
  Future<List<Book>> getRecentBooks({int limit = 10}) async {
    try {
      final response = await _client
          .from('books')
          .select('''
            *,
            categories(id, name),
            subcategories(id, name)
          ''')
          .eq('is_active', true)
          .order('created_at', ascending: false)
          .limit(limit);

      return (response as List)
          .map((json) => Book.fromJson(json))
          .toList();
    } catch (e) {
      throw Exception('Failed to fetch recent books: $e');
    }
  }
}
