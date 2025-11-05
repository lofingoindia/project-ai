import 'dart:async';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:flutter/foundation.dart';

/// Service for managing AI generation queue using Supabase Functions
class AiQueueService {
  final SupabaseClient _client = Supabase.instance.client;
  
  /// Submit an AI generation request to the queue
  Future<String> submitGenerationRequest({
    required String bookId,
    required String coverImageUrl,
    required String childImageUrl,
    required String childName,
  }) async {
    try {
      final user = _client.auth.currentUser;
      if (user == null) {
        throw Exception('User must be logged in');
      }

      // Insert into queue
      final response = await _client
          .from('ai_generation_queue')
          .insert({
            'user_id': user.id,
            'book_id': bookId,
            'child_name': childName,
            'child_image_url': childImageUrl,
            'cover_image_url': coverImageUrl,
            'status': 'pending',
          })
          .select()
          .single();

      final queueId = response['id'] as String;
      debugPrint('[AiQueueService] Request submitted with ID: $queueId');

      // Trigger the Edge Function
      await _triggerAiGeneration(
        bookId: bookId,
        coverImageUrl: coverImageUrl,
        childImageUrl: childImageUrl,
        childName: childName,
        userId: user.id,
      );

      return queueId;
    } catch (e) {
      debugPrint('[AiQueueService] Failed to submit request: $e');
      rethrow;
    }
  }

  /// Trigger the AI generation Edge Function
  Future<void> _triggerAiGeneration({
    required String bookId,
    required String coverImageUrl,
    required String childImageUrl,
    required String childName,
    required String userId,
  }) async {
    try {
      final payload = {
        'bookId': bookId,
        'coverImageUrl': coverImageUrl,
        'childImageUrl': childImageUrl,
        'childName': childName,
        'userId': userId,
      };
      debugPrint('[AiQueueService] Calling function with payload: $payload');
      
      final response = await _client.functions.invoke(
        // Use the actual deployed function slug
        'smooth-endpoint',
        body: payload,
      );

      if (response.status != 200) {
        throw Exception('Function call failed: ${response.status} ${response.data}');
      }

      debugPrint('[AiQueueService] AI function triggered successfully: ${response.data}');
    } catch (e) {
      debugPrint('[AiQueueService] Failed to trigger AI function: $e');
      // Don't rethrow here - the queue entry exists and can be retried
    }
  }

  /// Get the status of a generation request
  Future<Map<String, dynamic>?> getGenerationStatus(String queueId) async {
    try {
      final response = await _client
          .from('ai_generation_queue')
          .select()
          .eq('id', queueId)
          .single();

      return response;
    } catch (e) {
      debugPrint('[AiQueueService] Failed to get status: $e');
      return null;
    }
  }

  /// Stream for real-time updates on generation status
  Stream<Map<String, dynamic>> watchGenerationStatus(String queueId) {
    return _client
        .from('ai_generation_queue')
        .stream(primaryKey: ['id'])
        .eq('id', queueId)
        .map((data) => data.first);
  }

  /// Get all generation requests for current user
  Future<List<Map<String, dynamic>>> getUserGenerations() async {
    try {
      final user = _client.auth.currentUser;
      if (user == null) {
        throw Exception('User must be logged in');
      }

      final response = await _client
          .from('ai_generation_queue')
          .select('''
            id,
            book_id,
            child_name,
            status,
            generated_image_url,
            error_message,
            created_at,
            completed_at,
            books!inner(title, cover_image_url)
          ''')
          .eq('user_id', user.id)
          .order('created_at', ascending: false);

      return List<Map<String, dynamic>>.from(response);
    } catch (e) {
      debugPrint('[AiQueueService] Failed to get user generations: $e');
      return [];
    }
  }

  /// Retry a failed generation
  Future<void> retryGeneration(String queueId) async {
    try {
      final generation = await getGenerationStatus(queueId);
      if (generation == null) {
        throw Exception('Generation request not found');
      }

      // Reset status to pending
      await _client
          .from('ai_generation_queue')
          .update({
            'status': 'pending',
            'error_message': null,
            'started_at': null,
            'completed_at': null,
          })
          .eq('id', queueId);

      // Trigger the function again
      await _triggerAiGeneration(
        bookId: generation['book_id'],
        coverImageUrl: generation['cover_image_url'] ?? '',
        childImageUrl: generation['child_image_url'],
        childName: generation['child_name'],
        userId: generation['user_id'],
      );

      debugPrint('[AiQueueService] Generation retry triggered for: $queueId');
    } catch (e) {
      debugPrint('[AiQueueService] Failed to retry generation: $e');
      rethrow;
    }
  }

  /// Delete a generation request
  Future<void> deleteGeneration(String queueId) async {
    try {
      await _client
          .from('ai_generation_queue')
          .delete()
          .eq('id', queueId);

      debugPrint('[AiQueueService] Generation deleted: $queueId');
    } catch (e) {
      debugPrint('[AiQueueService] Failed to delete generation: $e');
      rethrow;
    }
  }
}
