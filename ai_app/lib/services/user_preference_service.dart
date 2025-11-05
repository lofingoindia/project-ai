import 'package:shared_preferences/shared_preferences.dart';

class UserPreferenceService {
  static const String _selectedCategoryKey = 'selected_category';
  static const String _hasMadeCategorySelectionKey = 'has_made_category_selection';
  
  // Get the selected category (boy/girl)
  static Future<String?> getSelectedCategory() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_selectedCategoryKey);
  }
  
  // Set the selected category
  static Future<void> setSelectedCategory(String category) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_selectedCategoryKey, category);
    await prefs.setBool(_hasMadeCategorySelectionKey, true);
  }
  
  // Check if user has made a category selection before
  static Future<bool> hasMadeCategorySelection() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getBool(_hasMadeCategorySelectionKey) ?? false;
  }
  
  // Clear category selection (for testing or reset purposes)
  static Future<void> clearCategorySelection() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_selectedCategoryKey);
    await prefs.remove(_hasMadeCategorySelectionKey);
  }
  
  // Get category with fallback to 'all' if not set
  static Future<String> getSelectedCategoryWithFallback() async {
    final category = await getSelectedCategory();
    return category ?? 'all';
  }
}
