import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/banner.dart';

class BannerService {
  final SupabaseClient _client = Supabase.instance.client;

  // Get all active banners
  Future<List<Banner>> getActiveBanners() async {
    try {
      final response = await _client
          .from('banners')
          .select()
          .eq('is_active', true)
          .order('priority', ascending: false);

      final banners = (response as List)
          .map((json) => Banner.fromJson(json))
          .toList();

      // Filter by date range
      return banners.where((banner) => banner.isCurrentlyActive).toList();
    } catch (e) {
      throw Exception('Failed to fetch banners: $e');
    }
  }

  // Get banner by ID
  Future<Banner?> getBannerById(int bannerId) async {
    try {
      final response = await _client
          .from('banners')
          .select()
          .eq('id', bannerId)
          .single();

      return Banner.fromJson(response);
    } catch (e) {
      throw Exception('Failed to fetch banner: $e');
    }
  }

  // Get banners for specific priority level
  Future<List<Banner>> getBannersByPriority(int priority) async {
    try {
      final response = await _client
          .from('banners')
          .select()
          .eq('is_active', true)
          .eq('priority', priority)
          .order('created_at', ascending: false);

      final banners = (response as List)
          .map((json) => Banner.fromJson(json))
          .toList();

      return banners.where((banner) => banner.isCurrentlyActive).toList();
    } catch (e) {
      throw Exception('Failed to fetch banners by priority: $e');
    }
  }

  // Get featured banners (high priority)
  Future<List<Banner>> getFeaturedBanners() async {
    try {
      final response = await _client
          .from('banners')
          .select()
          .eq('is_active', true)
          .gte('priority', 5) // High priority banners
          .order('priority', ascending: false)
          .limit(3);

      final banners = (response as List)
          .map((json) => Banner.fromJson(json))
          .toList();

      return banners.where((banner) => banner.isCurrentlyActive).toList();
    } catch (e) {
      throw Exception('Failed to fetch featured banners: $e');
    }
  }
}
