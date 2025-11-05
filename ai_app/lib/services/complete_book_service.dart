import 'dart:convert';
import 'dart:typed_data';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;

/// Service for complete book personalization
/// Processes entire books with character replacement across all pages
class CompleteBookPersonalizationService {
  static const String _baseUrl = 'http://localhost:3000'; // Update with your API URL
  
  /// Generate a complete personalized book
  Future<CompleteBookResult> generatePersonalizedBook({
    required List<String> bookPageUrls,
    required String childImageUrl,
    required String childName,
    required String bookTitle,
    Map<String, dynamic>? processingOptions,
  }) async {
    try {
      debugPrint('📚 Starting complete book personalization...');
      debugPrint('📖 Book: $bookTitle');
      debugPrint('👶 Child: $childName');
      debugPrint('📄 Total pages: ${bookPageUrls.length}');
      
      // Step 1: Download and convert all book pages
      debugPrint('⬇️ Step 1: Downloading book pages...');
      final bookPages = <String>[];
      for (int i = 0; i < bookPageUrls.length; i++) {
        debugPrint('📄 Downloading page ${i + 1}/${bookPageUrls.length}');
        final pageBytes = await _downloadImage(bookPageUrls[i]);
        final pageBase64 = base64Encode(pageBytes);
        bookPages.add(pageBase64);
      }
      
      // Step 2: Download child image
      debugPrint('👶 Step 2: Downloading child image...');
      final childImageBytes = await _downloadImage(childImageUrl);
      final childImageBase64 = base64Encode(childImageBytes);
      
      // Step 3: Call the complete book processing API
      debugPrint('🤖 Step 3: Processing complete book...');
      final response = await http.post(
        Uri.parse('$_baseUrl/process-complete-book'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'bookPages': bookPages,
          'childImage': childImageBase64,
          'childName': childName,
          'bookTitle': bookTitle,
          'processingOptions': processingOptions ?? {
            'batchSize': 3,
            'quality': 'high',
            'styleConsistency': true
          }
        }),
      );
      
      if (response.statusCode == 200) {
        final result = jsonDecode(response.body);
        debugPrint('✅ Complete book personalization successful!');
        debugPrint('📄 Total pages processed: ${result['totalPages']}');
        debugPrint('⏱️ Processing time: ${result['processingTime']}ms');
        debugPrint('👤 Character replacements: ${result['characterReplacements']}');
        
        return CompleteBookResult.fromJson(result);
      } else {
        final errorData = jsonDecode(response.body);
        throw Exception('Failed to process complete book: ${errorData['error'] ?? response.statusCode}');
      }
      
    } catch (e) {
      debugPrint('❌ Complete book personalization failed: $e');
      return CompleteBookResult(
        success: false,
        error: e.toString(),
        totalPages: 0,
        processingTime: 0,
        characterReplacements: 0,
        personalizedBook: null,
      );
    }
  }
  
  /// Analyze a book without processing (preview mode)
  Future<BookAnalysisResult> analyzeBook({
    required List<String> bookPageUrls,
  }) async {
    try {
      debugPrint('🔍 Starting book analysis...');
      
      // Download and convert all book pages
      final bookPages = <String>[];
      for (int i = 0; i < bookPageUrls.length; i++) {
        debugPrint('📄 Downloading page ${i + 1}/${bookPageUrls.length} for analysis');
        final pageBytes = await _downloadImage(bookPageUrls[i]);
        final pageBase64 = base64Encode(pageBytes);
        bookPages.add(pageBase64);
      }
      
      // Call the book analysis API
      final response = await http.post(
        Uri.parse('$_baseUrl/analyze-book'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'bookPages': bookPages,
        }),
      );
      
      if (response.statusCode == 200) {
        final result = jsonDecode(response.body);
        debugPrint('✅ Book analysis completed successfully!');
        return BookAnalysisResult.fromJson(result);
      } else {
        final errorData = jsonDecode(response.body);
        throw Exception('Failed to analyze book: ${errorData['error'] ?? response.statusCode}');
      }
      
    } catch (e) {
      debugPrint('❌ Book analysis failed: $e');
      return BookAnalysisResult(
        success: false,
        error: e.toString(),
        bookAnalysis: null,
      );
    }
  }
  
  /// Download image from URL and return bytes
  Future<Uint8List> _downloadImage(String imageUrl) async {
    try {
      final response = await http.get(Uri.parse(imageUrl));
      if (response.statusCode == 200) {
        return response.bodyBytes;
      } else {
        throw Exception('Failed to download image: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Failed to download image from $imageUrl: $e');
    }
  }
}

/// Result class for complete book personalization
class CompleteBookResult {
  final bool success;
  final String? error;
  final int totalPages;
  final int processingTime;
  final int characterReplacements;
  final PersonalizedBook? personalizedBook;
  final BookAnalysis? bookAnalysis;
  final List<CharacterMapping>? characterMapping;
  
  CompleteBookResult({
    required this.success,
    this.error,
    required this.totalPages,
    required this.processingTime,
    required this.characterReplacements,
    this.personalizedBook,
    this.bookAnalysis,
    this.characterMapping,
  });
  
  factory CompleteBookResult.fromJson(Map<String, dynamic> json) {
    return CompleteBookResult(
      success: json['success'] ?? false,
      error: json['error'],
      totalPages: json['totalPages'] ?? 0,
      processingTime: json['processingTime'] ?? 0,
      characterReplacements: json['characterReplacements'] ?? 0,
      personalizedBook: json['personalizedBook'] != null 
          ? PersonalizedBook.fromJson(json['personalizedBook']) 
          : null,
      bookAnalysis: json['bookAnalysis'] != null 
          ? BookAnalysis.fromJson(json['bookAnalysis']) 
          : null,
      characterMapping: json['characterMapping'] != null 
          ? (json['characterMapping'] as List).map((e) => CharacterMapping.fromJson(e)).toList()
          : null,
    );
  }
}

/// Result class for book analysis
class BookAnalysisResult {
  final bool success;
  final String? error;
  final BookAnalysis? bookAnalysis;
  
  BookAnalysisResult({
    required this.success,
    this.error,
    this.bookAnalysis,
  });
  
  factory BookAnalysisResult.fromJson(Map<String, dynamic> json) {
    return BookAnalysisResult(
      success: json['success'] ?? false,
      error: json['error'],
      bookAnalysis: json['bookAnalysis'] != null 
          ? BookAnalysis.fromJson(json['bookAnalysis']) 
          : null,
    );
  }
}

/// Personalized book data structure
class PersonalizedBook {
  final BookMetadata metadata;
  final List<ProcessedPage> pages;
  final bool success;
  
  PersonalizedBook({
    required this.metadata,
    required this.pages,
    required this.success,
  });
  
  factory PersonalizedBook.fromJson(Map<String, dynamic> json) {
    return PersonalizedBook(
      metadata: BookMetadata.fromJson(json['metadata']),
      pages: (json['pages'] as List).map((e) => ProcessedPage.fromJson(e)).toList(),
      success: json['success'] ?? false,
    );
  }
}

/// Book metadata
class BookMetadata {
  final String title;
  final String childName;
  final int totalPages;
  final int successfulPages;
  final int failedPages;
  final String createdAt;
  
  BookMetadata({
    required this.title,
    required this.childName,
    required this.totalPages,
    required this.successfulPages,
    required this.failedPages,
    required this.createdAt,
  });
  
  factory BookMetadata.fromJson(Map<String, dynamic> json) {
    return BookMetadata(
      title: json['title'] ?? '',
      childName: json['childName'] ?? '',
      totalPages: json['totalPages'] ?? 0,
      successfulPages: json['successfulPages'] ?? 0,
      failedPages: json['failedPages'] ?? 0,
      createdAt: json['createdAt'] ?? '',
    );
  }
}

/// Processed page data
class ProcessedPage {
  final int pageNumber;
  final String processedImage;
  final bool success;
  final String? error;
  final String? character;
  
  ProcessedPage({
    required this.pageNumber,
    required this.processedImage,
    required this.success,
    this.error,
    this.character,
  });
  
  factory ProcessedPage.fromJson(Map<String, dynamic> json) {
    return ProcessedPage(
      pageNumber: json['pageNumber'] ?? 0,
      processedImage: json['processedImage'] ?? '',
      success: json['success'] ?? false,
      error: json['error'],
      character: json['character'],
    );
  }
}

/// Book analysis data
class BookAnalysis {
  final int totalPages;
  final List<PageAnalysis> pages;
  final MainCharacter mainCharacter;
  final BookStyle bookStyle;
  final CharacterConsistency characterConsistency;
  
  BookAnalysis({
    required this.totalPages,
    required this.pages,
    required this.mainCharacter,
    required this.bookStyle,
    required this.characterConsistency,
  });
  
  factory BookAnalysis.fromJson(Map<String, dynamic> json) {
    return BookAnalysis(
      totalPages: json['totalPages'] ?? 0,
      pages: (json['pages'] as List).map((e) => PageAnalysis.fromJson(e)).toList(),
      mainCharacter: MainCharacter.fromJson(json['mainCharacter']),
      bookStyle: BookStyle.fromJson(json['bookStyle']),
      characterConsistency: CharacterConsistency.fromJson(json['characterConsistency']),
    );
  }
}

/// Page analysis data
class PageAnalysis {
  final int pageNumber;
  final List<Character> characters;
  final Scene scene;
  final TextContent text;
  final Layout layout;
  
  PageAnalysis({
    required this.pageNumber,
    required this.characters,
    required this.scene,
    required this.text,
    required this.layout,
  });
  
  factory PageAnalysis.fromJson(Map<String, dynamic> json) {
    return PageAnalysis(
      pageNumber: json['pageNumber'] ?? 0,
      characters: (json['characters'] as List).map((e) => Character.fromJson(e)).toList(),
      scene: Scene.fromJson(json['scene']),
      text: TextContent.fromJson(json['text']),
      layout: Layout.fromJson(json['layout']),
    );
  }
}

/// Character data
class Character {
  final bool isMainCharacter;
  final String description;
  final String position;
  final String size;
  final String emotion;
  final String pose;
  
  Character({
    required this.isMainCharacter,
    required this.description,
    required this.position,
    required this.size,
    required this.emotion,
    required this.pose,
  });
  
  factory Character.fromJson(Map<String, dynamic> json) {
    return Character(
      isMainCharacter: json['isMainCharacter'] ?? false,
      description: json['description'] ?? '',
      position: json['position'] ?? '',
      size: json['size'] ?? '',
      emotion: json['emotion'] ?? '',
      pose: json['pose'] ?? '',
    );
  }
}

/// Scene data
class Scene {
  final String action;
  final String setting;
  final String mood;
  
  Scene({
    required this.action,
    required this.setting,
    required this.mood,
  });
  
  factory Scene.fromJson(Map<String, dynamic> json) {
    return Scene(
      action: json['action'] ?? '',
      setting: json['setting'] ?? '',
      mood: json['mood'] ?? '',
    );
  }
}

/// Text content data
class TextContent {
  final String content;
  final List<String> characterNames;
  final String context;
  
  TextContent({
    required this.content,
    required this.characterNames,
    required this.context,
  });
  
  factory TextContent.fromJson(Map<String, dynamic> json) {
    return TextContent(
      content: json['content'] ?? '',
      characterNames: (json['characterNames'] as List).map((e) => e.toString()).toList(),
      context: json['context'] ?? '',
    );
  }
}

/// Layout data
class Layout {
  final String composition;
  final List<String> characterPositions;
  final String visualFocus;
  
  Layout({
    required this.composition,
    required this.characterPositions,
    required this.visualFocus,
  });
  
  factory Layout.fromJson(Map<String, dynamic> json) {
    return Layout(
      composition: json['composition'] ?? '',
      characterPositions: (json['characterPositions'] as List).map((e) => e.toString()).toList(),
      visualFocus: json['visualFocus'] ?? '',
    );
  }
}

/// Main character data
class MainCharacter {
  final String description;
  final int frequency;
  final int totalPages;
  
  MainCharacter({
    required this.description,
    required this.frequency,
    required this.totalPages,
  });
  
  factory MainCharacter.fromJson(Map<String, dynamic> json) {
    return MainCharacter(
      description: json['description'] ?? '',
      frequency: json['frequency'] ?? 0,
      totalPages: json['totalPages'] ?? 0,
    );
  }
}

/// Book style data
class BookStyle {
  final String dominantStyle;
  final List<String> colorPalette;
  final String lighting;
  final String consistency;
  
  BookStyle({
    required this.dominantStyle,
    required this.colorPalette,
    required this.lighting,
    required this.consistency,
  });
  
  factory BookStyle.fromJson(Map<String, dynamic> json) {
    return BookStyle(
      dominantStyle: json['dominantStyle'] ?? '',
      colorPalette: (json['colorPalette'] as List).map((e) => e.toString()).toList(),
      lighting: json['lighting'] ?? '',
      consistency: json['consistency'] ?? '',
    );
  }
}

/// Character consistency data
class CharacterConsistency {
  final int totalAppearances;
  final double consistency;
  final bool needsReplacement;
  
  CharacterConsistency({
    required this.totalAppearances,
    required this.consistency,
    required this.needsReplacement,
  });
  
  factory CharacterConsistency.fromJson(Map<String, dynamic> json) {
    return CharacterConsistency(
      totalAppearances: json['totalAppearances'] ?? 0,
      consistency: (json['consistency'] ?? 0.0).toDouble(),
      needsReplacement: json['needsReplacement'] ?? false,
    );
  }
}

/// Character mapping data
class CharacterMapping {
  final int pageNumber;
  final Character character;
  final bool replacementNeeded;
  final ReplacementStrategy replacementStrategy;
  
  CharacterMapping({
    required this.pageNumber,
    required this.character,
    required this.replacementNeeded,
    required this.replacementStrategy,
  });
  
  factory CharacterMapping.fromJson(Map<String, dynamic> json) {
    return CharacterMapping(
      pageNumber: json['pageNumber'] ?? 0,
      character: Character.fromJson(json['character']),
      replacementNeeded: json['replacementNeeded'] ?? false,
      replacementStrategy: ReplacementStrategy.fromJson(json['replacementStrategy']),
    );
  }
}

/// Replacement strategy data
class ReplacementStrategy {
  final bool faceReplacement;
  final bool fullBodyReplacement;
  final String styleAdaptation;
  final String positionPreservation;
  final String sizeMaintenance;
  final String emotionPreservation;
  final String posePreservation;
  
  ReplacementStrategy({
    required this.faceReplacement,
    required this.fullBodyReplacement,
    required this.styleAdaptation,
    required this.positionPreservation,
    required this.sizeMaintenance,
    required this.emotionPreservation,
    required this.posePreservation,
  });
  
  factory ReplacementStrategy.fromJson(Map<String, dynamic> json) {
    return ReplacementStrategy(
      faceReplacement: json['faceReplacement'] ?? false,
      fullBodyReplacement: json['fullBodyReplacement'] ?? false,
      styleAdaptation: json['styleAdaptation'] ?? '',
      positionPreservation: json['positionPreservation'] ?? '',
      sizeMaintenance: json['sizeMaintenance'] ?? '',
      emotionPreservation: json['emotionPreservation'] ?? '',
      posePreservation: json['posePreservation'] ?? '',
    );
  }
}
