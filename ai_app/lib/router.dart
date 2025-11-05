import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'auth_wrapper.dart';
import 'main_navigation.dart';
import 'pages/privacy_policy_page.dart';
import 'pages/customer_support_page.dart';
import 'home_page.dart';
import 'pages/books_page.dart';
import 'pages/cart_page.dart';
import 'my_account_page.dart';

// GoRouter configuration
final GoRouter router = GoRouter(
  initialLocation: '/',
  routes: [
    // Main app routes
    GoRoute(
      path: '/',
      builder: (context, state) => const AuthWrapper(),
    ),
    GoRoute(
      path: '/app',
      builder: (context, state) => const MainNavigation(),
    ),
    
    // Direct page routes for web access
    GoRoute(
      path: '/home',
      builder: (context, state) => Scaffold(
        appBar: _buildAppBar('Hero Kids - Home'),
        body: HomePage(),
      ),
    ),
    GoRoute(
      path: '/books',
      builder: (context, state) => Scaffold(
        appBar: _buildAppBar('Hero Kids - Books'),
        body: BooksPage(),
      ),
    ),
    GoRoute(
      path: '/cart',
      builder: (context, state) => Scaffold(
        appBar: _buildAppBar('Hero Kids - Cart'),
        body: CartPage(),
      ),
    ),
    GoRoute(
      path: '/account',
      builder: (context, state) => Scaffold(
        appBar: _buildAppBar('Hero Kids - My Account'),
        body: MyAccountPage(),
      ),
    ),
    
    // Legal and support pages - these are the important ones for Apple Store
    GoRoute(
      path: '/privacy-policy',
      builder: (context, state) => const PrivacyPolicyPage(),
      pageBuilder: (context, state) => MaterialPage(
        key: state.pageKey,
        child: const PrivacyPolicyPage(),
      ),
    ),
    GoRoute(
      path: '/customer-support',
      builder: (context, state) => const CustomerSupportPage(),
      pageBuilder: (context, state) => MaterialPage(
        key: state.pageKey,
        child: const CustomerSupportPage(),
      ),
    ),
    
    // Alternative routes for Apple Store submission
    GoRoute(
      path: '/privacy',
      redirect: (context, state) => '/privacy-policy',
    ),
    GoRoute(
      path: '/support',
      redirect: (context, state) => '/customer-support',
    ),
    GoRoute(
      path: '/help',
      redirect: (context, state) => '/customer-support',
    ),
  ],
  errorBuilder: (context, state) => Scaffold(
    appBar: _buildAppBar('Page Not Found'),
    body: Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.error_outline,
            size: 64,
            color: Colors.grey[400],
          ),
          SizedBox(height: 16),
          Text(
            '404 - Page Not Found',
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: Colors.grey[700],
            ),
          ),
          SizedBox(height: 8),
          Text(
            'The page you are looking for does not exist.',
            style: TextStyle(
              fontSize: 16,
              color: Colors.grey[600],
            ),
          ),
          SizedBox(height: 24),
          ElevatedButton(
            onPressed: () => context.go('/'),
            style: ElevatedButton.styleFrom(
              backgroundColor: Color(0xFF784D9C),
              foregroundColor: Colors.white,
            ),
            child: Text('Go Home'),
          ),
        ],
      ),
    ),
  ),
);

// Helper function to build app bar for web pages
PreferredSizeWidget _buildAppBar(String title) {
  return AppBar(
    backgroundColor: Colors.white,
    elevation: 1,
    shadowColor: Colors.black.withOpacity(0.1),
    title: Row(
      children: [
        Container(
          padding: EdgeInsets.all(8),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [Color(0xFF784D9C), Color(0xFF9B6BBF)],
            ),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(
            Icons.menu_book,
            color: Colors.white,
            size: 20,
          ),
        ),
        SizedBox(width: 12),
        Text(
          title,
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.w600,
            color: Color(0xFF784D9C),
          ),
        ),
      ],
    ),
    actions: [
      TextButton(
        onPressed: () {
          // This will be handled by go_router
        },
        child: Text(
          'Back to App',
          style: TextStyle(
            color: Color(0xFF784D9C),
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
      SizedBox(width: 16),
    ],
  );
}
