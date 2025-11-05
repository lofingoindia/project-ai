import '../models/book.dart';

class MockDataService {
  static Book createMockBook({
    required String name,
    required String description,
    bool isFeatured = false,
    bool isBestseller = false,
    int sortOrder = 0,
    String gender = 'any',
  }) {
    return Book(
      id: 'mock_${DateTime.now().millisecondsSinceEpoch}_$sortOrder',
      name: name,
      description: description,
      price: 19.99,
      discountPercentage: 0,
      ageMin: 5,
      ageMax: 12,
      genderTarget: gender,
      coverImageUrl: '',
      previewImages: [],
      images: [],
      videos: [],
      characters: [], // Required field - empty array for mock books
      isFeatured: isFeatured,
      isBestseller: isBestseller,
      isActive: true,
      stockQuantity: 100,
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
      level: 1,
      path: '/',
      sortOrder: sortOrder,
      availableLanguages: ['en'],
    );
  }

  static List<Book> getMockGirlBooks() {
    return [
      createMockBook(
        name: 'Princess Adventure',
        description: 'A magical journey in an enchanted kingdom',
        gender: 'girl',
        sortOrder: 0,
      ),
      createMockBook(
        name: 'Space Explorer Sarah',
        description: 'Journey to the stars with brave Sarah',
        gender: 'girl',
        sortOrder: 1,
      ),
      createMockBook(
        name: 'Emma\'s Garden',
        description: 'Discover the magic of nature',
        gender: 'girl',
        sortOrder: 2,
      ),
      createMockBook(
        name: 'Dance Dreams',
        description: 'Follow your passion for dance',
        gender: 'girl',
        sortOrder: 3,
      ),
    ];
  }

  static List<Book> getMockBoyBooks() {
    return [
      createMockBook(
        name: 'Dragon Rider',
        description: 'Epic adventure with mythical creatures',
        gender: 'boy',
        sortOrder: 0,
      ),
      createMockBook(
        name: 'Robot Builders',
        description: 'Creating amazing machines',
        gender: 'boy',
        sortOrder: 1,
      ),
      createMockBook(
        name: 'Sports Champions',
        description: 'Inspiring stories of determination',
        gender: 'boy',
        sortOrder: 2,
      ),
      createMockBook(
        name: 'Pirate\'s Treasure',
        description: 'Hunt for hidden treasures',
        gender: 'boy',
        sortOrder: 3,
      ),
    ];
  }

  static List<Book> getMockFeaturedBooks() {
    return [
      createMockBook(
        name: 'Magical Dreams',
        description: 'Where imagination comes to life',
        isFeatured: true,
        sortOrder: 0,
      ),
      createMockBook(
        name: 'Adventure Quest',
        description: 'Journey through mysterious lands',
        isFeatured: true,
        sortOrder: 1,
      ),
      createMockBook(
        name: 'Forest Friends',
        description: 'Tales of friendship and courage',
        isFeatured: true,
        sortOrder: 2,
      ),
      createMockBook(
        name: 'Ocean Explorer',
        description: 'Discover underwater wonders',
        isFeatured: true,
        sortOrder: 3,
      ),
    ];
  }
}
