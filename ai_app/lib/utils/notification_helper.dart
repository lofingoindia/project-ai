import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:google_fonts/google_fonts.dart';

/// Utility class for showing platform-appropriate notifications
/// Uses Toast notifications for web and SnackBar for mobile/tablet
class NotificationHelper {
  /// Show a success notification with platform-appropriate style
  static void showSuccess(BuildContext context, String message) {
    _showNotification(
      context: context,
      message: message,
      backgroundColor: Colors.green,
      isSuccess: true,
    );
  }

  /// Show an error notification with platform-appropriate style
  static void showError(BuildContext context, String message) {
    _showNotification(
      context: context,
      message: message,
      backgroundColor: Colors.red,
      isSuccess: false,
    );
  }

  /// Show an info notification with platform-appropriate style
  static void showInfo(BuildContext context, String message) {
    _showNotification(
      context: context,
      message: message,
      backgroundColor: Colors.grey[700]!,
      isSuccess: null,
    );
  }

  /// Show wishlist added notification
  static void showWishlistAdded(BuildContext context, String message) {
    _showNotification(
      context: context,
      message: message,
      backgroundColor: Colors.green,
      isSuccess: true,
    );
  }

  /// Show wishlist removed notification
  static void showWishlistRemoved(BuildContext context, String message) {
    _showNotification(
      context: context,
      message: message,
      backgroundColor: Colors.grey[700]!,
      isSuccess: false,
    );
  }

  /// Private method to show the actual notification
  static void _showNotification({
    required BuildContext context,
    required String message,
    required Color backgroundColor,
    bool? isSuccess,
  }) {
    if (kIsWeb) {
      // Use toast notification for web
      Fluttertoast.showToast(
        msg: message,
        toastLength: Toast.LENGTH_SHORT,
        gravity: ToastGravity.TOP,
        timeInSecForIosWeb: 2,
        backgroundColor: backgroundColor,
        textColor: Colors.white,
        fontSize: 14.0,
        webBgColor: _getWebBgColor(backgroundColor),
        webPosition: "center",
        webShowClose: true,
      );
    } else {
      // Use SnackBar for mobile/tablet
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              message,
              style: GoogleFonts.tajawal(color: Colors.white),
            ),
            backgroundColor: backgroundColor,
            duration: const Duration(seconds: 2),
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(8),
            ),
            margin: const EdgeInsets.all(16),
          ),
        );
      }
    }
  }

  /// Convert Flutter Color to web-compatible color string
  static String _getWebBgColor(Color color) {
    return '#${color.value.toRadixString(16).padLeft(8, '0').substring(2).toUpperCase()}';
  }
}