import 'package:shared_preferences/shared_preferences.dart';

class FavoriteService {
  static const String _favoritesKey = 'favorite_books';

  // Get all favorite book IDs
  static Future<Set<String>> getFavoriteBookIds() async {
    final prefs = await SharedPreferences.getInstance();
    final favoritesJson = prefs.getStringList(_favoritesKey) ?? [];
    return favoritesJson.toSet();
  }

  // Check if a book is favorited
  static Future<bool> isFavorite(String bookId) async {
    final favorites = await getFavoriteBookIds();
    return favorites.contains(bookId);
  }

  // Add a book to favorites
  static Future<bool> addFavorite(String bookId) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final favorites = await getFavoriteBookIds();
      favorites.add(bookId);
      await prefs.setStringList(_favoritesKey, favorites.toList());
      return true;
    } catch (e) {
      print('Error adding favorite: $e');
      return false;
    }
  }

  // Remove a book from favorites
  static Future<bool> removeFavorite(String bookId) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final favorites = await getFavoriteBookIds();
      favorites.remove(bookId);
      await prefs.setStringList(_favoritesKey, favorites.toList());
      return true;
    } catch (e) {
      print('Error removing favorite: $e');
      return false;
    }
  }

  // Toggle favorite status
  static Future<bool> toggleFavorite(String bookId) async {
    final isFav = await isFavorite(bookId);
    if (isFav) {
      return await removeFavorite(bookId);
    } else {
      return await addFavorite(bookId);
    }
  }

  // Clear all favorites
  static Future<void> clearAllFavorites() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_favoritesKey);
  }
}
