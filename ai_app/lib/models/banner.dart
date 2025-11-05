class Banner {
  final int id;
  final String title;
  final String description;
  final String? imageUrl;
  final String? linkUrl;
  final bool isActive;
  final int priority;
  final DateTime? startDate;
  final DateTime? endDate;
  final DateTime createdAt;

  Banner({
    required this.id,
    required this.title,
    required this.description,
    this.imageUrl,
    this.linkUrl,
    required this.isActive,
    required this.priority,
    this.startDate,
    this.endDate,
    required this.createdAt,
  });

  factory Banner.fromJson(Map<String, dynamic> json) {
    return Banner(
      id: json['id'],
      title: json['title'] ?? '',
      description: json['description'] ?? '',
      imageUrl: json['image_url'],
      linkUrl: json['link_url'],
      isActive: json['is_active'] ?? true,
      priority: json['priority'] ?? 0,
      startDate: json['start_date'] != null 
          ? DateTime.parse(json['start_date'])
          : null,
      endDate: json['end_date'] != null 
          ? DateTime.parse(json['end_date'])
          : null,
      createdAt: DateTime.parse(json['created_at']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'description': description,
      'image_url': imageUrl,
      'link_url': linkUrl,
      'is_active': isActive,
      'priority': priority,
      'start_date': startDate?.toIso8601String(),
      'end_date': endDate?.toIso8601String(),
      'created_at': createdAt.toIso8601String(),
    };
  }

  // Check if banner is currently active (within date range)
  bool get isCurrentlyActive {
    if (!isActive) return false;
    
    final now = DateTime.now();
    
    // Check start date
    if (startDate != null && now.isBefore(startDate!)) {
      return false;
    }
    
    // Check end date
    if (endDate != null && now.isAfter(endDate!)) {
      return false;
    }
    
    return true;
  }
}
