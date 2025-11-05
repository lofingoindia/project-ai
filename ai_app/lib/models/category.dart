class Category {
  final int id;
  final String name;
  final String description;
  final bool isActive;
  final int sortOrder;
  final DateTime createdAt;
  final List<Subcategory> subcategories;

  Category({
    required this.id,
    required this.name,
    required this.description,
    required this.isActive,
    required this.sortOrder,
    required this.createdAt,
    required this.subcategories,
  });

  factory Category.fromJson(Map<String, dynamic> json) {
    return Category(
      id: json['id'],
      name: json['name'] ?? '',
      description: json['description'] ?? '',
      isActive: json['is_active'] ?? true,
      sortOrder: json['sort_order'] ?? 0,
      createdAt: DateTime.parse(json['created_at']),
      subcategories: json['subcategories'] != null
          ? (json['subcategories'] as List)
              .map((subcat) => Subcategory.fromJson(subcat))
              .toList()
          : [],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'description': description,
      'is_active': isActive,
      'sort_order': sortOrder,
      'created_at': createdAt.toIso8601String(),
    };
  }
}

class Subcategory {
  final int id;
  final String name;
  final String description;
  final int categoryId;
  final bool isActive;
  final int sortOrder;
  final DateTime createdAt;
  final String? categoryName;

  Subcategory({
    required this.id,
    required this.name,
    required this.description,
    required this.categoryId,
    required this.isActive,
    required this.sortOrder,
    required this.createdAt,
    this.categoryName,
  });

  factory Subcategory.fromJson(Map<String, dynamic> json) {
    return Subcategory(
      id: json['id'],
      name: json['name'] ?? '',
      description: json['description'] ?? '',
      categoryId: json['category_id'],
      isActive: json['is_active'] ?? true,
      sortOrder: json['sort_order'] ?? 0,
      createdAt: DateTime.parse(json['created_at']),
      categoryName: json['category_name'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'description': description,
      'category_id': categoryId,
      'is_active': isActive,
      'sort_order': sortOrder,
      'created_at': createdAt.toIso8601String(),
    };
  }
}
