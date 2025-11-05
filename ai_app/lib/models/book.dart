class Book {
  final String id;
  final String name;                // Using 'name' to match Supabase categories table
  final String description;
  final bool isActive;
  final int sortOrder;              // From Supabase categories table
  final DateTime createdAt;
  final DateTime updatedAt;
  final int? parentId;              // From Supabase categories table
  final int level;                  // From Supabase categories table
  final String path;                // From Supabase categories table
  
  // Optional fields for books functionality
  final double price;
  final int discountPercentage;
  final int ageMin;
  final int ageMax;
  final String genderTarget;
  final String coverImageUrl;
  final List<String> previewImages;
  final List<String> images;
  final List<String> videos;
  final List<String> availableLanguages;
  final String? thumbnailImage;
  final String? previewVideo;
  final bool isFeatured;
  final bool isBestseller;
  final int stockQuantity;
  final int? categoryId;
  final int? subcategoryId;
  final String? idealFor;          // e.g., "Boy", "Girl", "Boys", "Adventure Lovers"
  final List<String> characters;   // Array of character names or types
  final String? genre;             // e.g., "Adventure & Exploration", "Fantasy", "Educational"
  final String? ageRange;          // e.g., "3-6 years old", "6-12 years old"

  Book({
    required this.id,
    required this.name,
    required this.description,
    required this.price,
    required this.discountPercentage,
    required this.ageMin,
    required this.ageMax,
    required this.genderTarget,
    required this.coverImageUrl,
    required this.previewImages,
    required this.images,
    required this.videos,
    this.thumbnailImage,
    this.previewVideo,
    required this.availableLanguages,
    required this.isFeatured,
    required this.isBestseller,
    required this.isActive,
    required this.stockQuantity,
    this.categoryId,
    this.subcategoryId,
    this.idealFor,
    required this.characters,
    this.genre,
    this.ageRange,
    required this.createdAt,
    required this.updatedAt,
    this.parentId,
    required this.level,
    required this.path,
    required this.sortOrder,
  });

  factory Book.fromJson(Map<String, dynamic> json) {
    return Book(
      id: json['id'].toString(),
      name: json['name'] ?? json['title'] ?? '',
      description: json['description'] ?? '',
      price: (json['price'] ?? 0.0).toDouble(),
      discountPercentage: json['discount_percentage'] ?? 0,
      ageMin: json['age_min'] ?? 0,
      ageMax: json['age_max'] ?? 18,
      genderTarget: json['category'] ?? json['gender_target'] ?? 'any', // Use 'category' field from database
      coverImageUrl: json['cover_image_url'] ?? '',
      previewImages: json['preview_images'] != null 
          ? List<String>.from(json['preview_images']) 
          : [],
      images: json['images'] != null 
          ? List<String>.from(json['images']) 
          : [],
      videos: json['videos'] != null 
          ? List<String>.from(json['videos']) 
          : [],
      thumbnailImage: json['thumbnail_image'],
      previewVideo: json['preview_video'],
      availableLanguages: json['available_languages'] != null 
          ? List<String>.from(json['available_languages']) 
          : ['English'],
      isFeatured: json['is_featured'] ?? false,
      isBestseller: json['is_bestseller'] ?? false,
      isActive: json['is_active'] ?? true,
      stockQuantity: json['stock_quantity'] ?? 0,
      categoryId: json['category_id'],
      subcategoryId: json['subcategory_id'],
      idealFor: json['ideal_for'],
      characters: json['characters'] != null 
          ? List<String>.from(json['characters']) 
          : [],
      genre: json['genre'],
      ageRange: json['age_range'],
      createdAt: DateTime.parse(json['created_at'] ?? DateTime.now().toIso8601String()),
      updatedAt: DateTime.parse(json['updated_at'] ?? DateTime.now().toIso8601String()),
      parentId: json['parent_id'],
      level: json['level'] ?? 0,
      path: json['path'] ?? '',
      sortOrder: json['sort_order'] ?? 0,
    );
  }

  // Get the best available image for display
  String get displayImage {
    if (thumbnailImage != null && thumbnailImage!.isNotEmpty) {
      return thumbnailImage!;
    }
    if (coverImageUrl.isNotEmpty) {
      return coverImageUrl;
    }
    if (images.isNotEmpty) {
      return images.first;
    }
    return ''; // Return empty string or placeholder image URL
  }

  // Get all available images including cover image
  List<String> get allImages {
    List<String> allImgs = [];
    if (coverImageUrl.isNotEmpty) allImgs.add(coverImageUrl);
    if (thumbnailImage != null && thumbnailImage!.isNotEmpty) {
      allImgs.add(thumbnailImage!);
    }
    allImgs.addAll(images);
    allImgs.addAll(previewImages);
    return allImgs.toSet().toList(); // Remove duplicates
  }

  // Check if product has media content
  bool get hasMedia {
    return images.isNotEmpty || videos.isNotEmpty || previewVideo != null;
  }

  double get discountedPrice {
    if (discountPercentage > 0) {
      return price * (1 - discountPercentage / 100);
    }
    return price;
  }

  String get formattedPrice {
    return '\$${price.toStringAsFixed(2)}';
  }

  String get formattedDiscountedPrice {
    return '\$${discountedPrice.toStringAsFixed(2)}';
  }

  // Get the title (compatibility with existing code)
  String get title => name;

  // Get category (compatibility with existing code)
  String get category => genderTarget.isNotEmpty ? genderTarget : 'Adventure';
}
