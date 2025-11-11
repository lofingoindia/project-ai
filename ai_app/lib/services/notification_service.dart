import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:flutter/foundation.dart';

/// Service for handling notifications (email and push notifications)
class NotificationService {
  final SupabaseClient _supabase = Supabase.instance.client;

  /// Send email notification when book generation is completed
  Future<void> sendBookCompletionEmail({
    required String userEmail,
    required String userName,
    required String bookTitle,
    required String childName,
    required String pdfUrl,
    required String orderNumber,
  }) async {
    try {
      // Call Supabase Edge Function to send email
      final response = await _supabase.functions.invoke(
        'send-book-completion-email',
        body: {
          'user_email': userEmail,
          'user_name': userName,
          'book_title': bookTitle,
          'child_name': childName,
          'pdf_url': pdfUrl,
          'order_number': orderNumber,
        },
      );

      if (response.status == 200) {
      } else {
      }
    } catch (e) {
      // Don't throw error - notification failure shouldn't break the flow
    }
  }

  /// Send push notification when book generation is completed
  Future<void> sendBookCompletionPushNotification({
    required String userId,
    required String bookTitle,
    required String childName,
  }) async {
    try {
      // Call Supabase Edge Function to send push notification
      final response = await _supabase.functions.invoke(
        'send-push-notification',
        body: {
          'user_id': userId,
          'title': 'Your Book is Ready! 📚',
          'message': 'The personalized book "$bookTitle" for $childName is ready to download!',
          'data': {
            'type': 'book_completed',
            'book_title': bookTitle,
            'child_name': childName,
          },
        },
      );

      if (response.status == 200) {
      } else {
      }
    } catch (e) {
      // Don't throw error - notification failure shouldn't break the flow
    }
  }

  /// Create in-app notification record
  Future<void> createInAppNotification({
    required String userId,
    required String title,
    required String message,
    required String type,
    Map<String, dynamic>? metadata,
  }) async {
    try {
      await _supabase.from('notifications').insert({
        'user_id': userId,
        'title': title,
        'message': message,
        'type': type,
        'metadata': metadata ?? {},
        'is_read': false,
        'created_at': DateTime.now().toIso8601String(),
      });

    } catch (e) {
    }
  }

  /// Send all notifications for book completion
  Future<void> notifyBookCompletion({
    required String userId,
    required String userEmail,
    required String userName,
    required String bookTitle,
    required String childName,
    required String pdfUrl,
    required String orderNumber,
  }) async {
    try {
      // Send email notification
      await sendBookCompletionEmail(
        userEmail: userEmail,
        userName: userName,
        bookTitle: bookTitle,
        childName: childName,
        pdfUrl: pdfUrl,
        orderNumber: orderNumber,
      );

      // Send push notification
      await sendBookCompletionPushNotification(
        userId: userId,
        bookTitle: bookTitle,
        childName: childName,
      );

      // Create in-app notification
      await createInAppNotification(
        userId: userId,
        title: 'Your Book is Ready! 📚',
        message: 'The personalized book "$bookTitle" for $childName is ready to download!',
        type: 'book_completed',
        metadata: {
          'book_title': bookTitle,
          'child_name': childName,
          'pdf_url': pdfUrl,
          'order_number': orderNumber,
        },
      );

    } catch (e) {
    }
  }

  /// Get unread notifications for the current user
  Future<List<Map<String, dynamic>>> getUnreadNotifications() async {
    try {
      final user = _supabase.auth.currentUser;
      if (user == null) return [];

      final response = await _supabase
          .from('notifications')
          .select()
          .eq('user_id', user.id)
          .eq('is_read', false)
          .order('created_at', ascending: false);

      return (response as List).map((e) => e as Map<String, dynamic>).toList();
    } catch (e) {
      return [];
    }
  }

  /// Mark notification as read
  Future<void> markAsRead(String notificationId) async {
    try {
      await _supabase
          .from('notifications')
          .update({'is_read': true, 'read_at': DateTime.now().toIso8601String()})
          .eq('id', notificationId);
    } catch (e) {
    }
  }

  /// Listen to real-time notifications
  Stream<List<Map<String, dynamic>>> watchNotifications() {
    final user = _supabase.auth.currentUser;
    if (user == null) {
      return Stream.value([]);
    }

    return _supabase
        .from('notifications')
        .stream(primaryKey: ['id'])
        .eq('user_id', user.id)
        .order('created_at', ascending: false);
  }
}
