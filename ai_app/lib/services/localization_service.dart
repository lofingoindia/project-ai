import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:shared_preferences/shared_preferences.dart';

class LocalizationService {
  static const String _languageKey = 'selected_language';
  static const String defaultLanguage = 'ar';
  
  static final LocalizationService _instance = LocalizationService._internal();
  factory LocalizationService() => _instance;
  LocalizationService._internal();

  Map<String, String> _localizedStrings = {};
  String _currentLanguage = defaultLanguage;

  String get currentLanguage => _currentLanguage;

  // Get saved language from SharedPreferences
  Future<String> getSavedLanguage() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      return prefs.getString(_languageKey) ?? defaultLanguage;
    } catch (e) {
      return defaultLanguage;
    }
  }

  // Save language to SharedPreferences
  Future<void> saveLanguage(String languageCode) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_languageKey, languageCode);
    } catch (e) {
    }
  }

  // Load translations from JSON file
  Future<void> load(String languageCode) async {
    try {
      _currentLanguage = languageCode;
      String jsonString = await rootBundle.loadString('assets/translations/$languageCode.json');
      Map<String, dynamic> jsonMap = json.decode(jsonString);
      
      _localizedStrings = jsonMap.map((key, value) {
        return MapEntry(key, value.toString());
      });
      
      await saveLanguage(languageCode);
    } catch (e) {
      // Fallback to English if loading fails
      if (languageCode != defaultLanguage) {
        await load(defaultLanguage);
      }
    }
  }

  // Get translated string
  String translate(String key) {
    return _localizedStrings[key] ?? key;
  }

  // Check if current language is RTL (Right-to-Left)
  bool get isRTL => _currentLanguage == 'ar';

  // Get text direction based on current language
  TextDirection get textDirection => isRTL ? TextDirection.rtl : TextDirection.ltr;

  // Get locale based on current language
  Locale get locale {
    switch (_currentLanguage) {
      case 'ar':
        return const Locale('ar', 'SA');
      case 'en':
      default:
        return const Locale('en', 'US');
    }
  }

  // Toggle between English and Arabic
  Future<void> toggleLanguage() async {
    final newLanguage = _currentLanguage == 'en' ? 'ar' : 'en';
    await load(newLanguage);
  }

  // Change to specific language
  Future<void> changeLanguage(String languageCode) async {
    if (languageCode != _currentLanguage) {
      await load(languageCode);
    }
  }
}

// Extension method for easy access to translations
extension TranslationExtension on String {
  String get tr => LocalizationService().translate(this);
}
