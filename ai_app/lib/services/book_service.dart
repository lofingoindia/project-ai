import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/book.dart';
import 'user_preference_service.dart';

class BookService {
  final SupabaseClient _client = Supabase.instance.client;

  // Get featured books for home page
  Future<List<Book>> getFeaturedBooks({int limit = 6}) async {
    try {
      final selectedCategory = await UserPreferenceService.getSelectedCategoryWithFallback();
      
      var query = _client
          .from('books')
          .select()
          .eq('is_active', true);
          
      // Apply category filter if not 'all'
      if (selectedCategory != 'all') {
        query = query.eq('category', selectedCategory.toLowerCase() == 'girl' ? 'Girl' : 'Boy');
      }
      
      final response = await query
          .order('created_at', ascending: false)
          .limit(limit);

      return (response as List)
          .map((json) => Book.fromJson(json))
          .toList();
    } catch (e) {
      throw Exception('Failed to fetch featured books: $e');
    }
  }

  // Get bestseller books
  Future<List<Book>> getBestsellers({int limit = 10}) async {
    try {
      final selectedCategory = await UserPreferenceService.getSelectedCategoryWithFallback();
      
      var query = _client
          .from('books')
          .select('''
            *,
            categories(id, name),
            subcategories(id, name)
          ''')
          .eq('is_active', true);
          
      // Apply category filter if not 'all'
      if (selectedCategory != 'all') {
        query = query.eq('category', selectedCategory.toLowerCase() == 'girl' ? 'Girl' : 'Boy');
      }
      
      final response = await query
          .order('created_at', ascending: false)
          .limit(limit);

      return (response as List)
          .map((json) => Book.fromJson(json))
          .toList();
    } catch (e) {
      // Fallback to basic query
      try {
        final selectedCategory = await UserPreferenceService.getSelectedCategoryWithFallback();
        
        var query = _client
            .from('books')
            .select()
            .eq('is_bestseller', true);
            
        // Apply category filter if not 'all'
        if (selectedCategory != 'all') {
          query = query.eq('category', selectedCategory.toLowerCase() == 'girl' ? 'Girl' : 'Boy');
        }
        
        final response = await query
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
      String categoryFilter = gender.toLowerCase() == 'girl' ? 'Girl' : 
                             gender.toLowerCase() == 'boy' ? 'Boy' : gender;
      
      final response = await _client
          .from('books')
          .select()
          .eq('is_active', true)
          .eq('category', categoryFilter)
          .order('created_at', ascending: false)
          .limit(limit);

      return (response as List)
          .map((json) => Book.fromJson(json))
          .toList();
    } catch (e) {
      // Fallback to fetch all books if category filter fails
      try {
        final response = await _client
            .from('books')
            .select()
            .eq('is_active', true)
            .order('created_at', ascending: false)
            .limit(limit);

        return (response as List)
            .map((json) => Book.fromJson(json))
            .where((book) => book.genderTarget.toLowerCase() == gender.toLowerCase())
            .toList();
      } catch (e2) {
        throw Exception('Failed to fetch books by gender: $e');
      }
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
      // Normalize the search query
      final searchQuery = query.trim();
      
      // print('Searching for: $searchQuery');
      
      // Search in title, description, and category fields (case-insensitive)
      // Note: The database column is 'title', not 'name'
      final response = await _client
          .from('books')
          .select()
          .eq('is_active', true)
          .or('title.ilike.%$searchQuery%,description.ilike.%$searchQuery%,category.ilike.%$searchQuery%')
          .order('created_at', ascending: false)
          .limit(limit);

      // print('Search query: $searchQuery, Results count: ${(response as List).length}');
      
      final books = (response as List)
          .map((json) => Book.fromJson(json))
          .toList();
          
      // print('Parsed books count: ${books.length}');
      if (books.isNotEmpty) {
        print('First book: ${books.first.title}, category: ${books.first.category}');
      }
      
      return books;
    } catch (e) {
      print('Search error: $e');
      throw Exception('Failed to search books: $e');
    }
  }

  // Get all books with pagination
  Future<List<Book>> getAllBooks({int page = 0, int limit = 20}) async {
    try {
      final selectedCategory = await UserPreferenceService.getSelectedCategoryWithFallback();
      
      var query = _client
          .from('books')
          .select('''
            *,
            categories(id, name),
            subcategories(id, name)
          ''')
          .eq('is_active', true);
          
      // Apply category filter if not 'all'
      if (selectedCategory != 'all') {
        query = query.eq('category', selectedCategory.toLowerCase() == 'girl' ? 'Girl' : 'Boy');
      }
      
      final response = await query
          .order('created_at', ascending: false)
          .range(page * limit, (page * limit) + limit - 1);

      return (response as List)
          .map((json) => Book.fromJson(json))
          .toList();
    } catch (e) {
      // Fallback to basic query
      try {
        final selectedCategory = await UserPreferenceService.getSelectedCategoryWithFallback();
        
        var query = _client
            .from('books')
            .select();
            
        // Apply category filter if not 'all'
        if (selectedCategory != 'all') {
          query = query.eq('category', selectedCategory.toLowerCase() == 'girl' ? 'Girl' : 'Boy');
        }
        
        final response = await query
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

  // Get available genres (book categories like Adventure, Fantasy, etc.)
  Future<List<String>> getGenres() async {
    try {
      final response = await _client
          .from('books')
          .select('genre')
          .eq('is_active', true)
          .not('genre', 'is', null);

      final genres = (response as List)
          .map((item) => item['genre'] as String?)
          .where((genre) => genre != null && genre.isNotEmpty)
          .cast<String>()
          .toSet()
          .toList();

      genres.sort(); // Sort alphabetically
      return genres;
    } catch (e) {
      print('Failed to fetch genres: $e');
      return []; // Return empty list on error
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
      final selectedCategory = await UserPreferenceService.getSelectedCategoryWithFallback();
      
      var query = _client
          .from('books')
          .select('''
            *,
            categories(id, name),
            subcategories(id, name)
          ''')
          .eq('is_active', true);
          
      // Apply category filter if not 'all'
      if (selectedCategory != 'all') {
        query = query.eq('category', selectedCategory.toLowerCase() == 'girl' ? 'Girl' : 'Boy');
      }
      
      final response = await query
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
