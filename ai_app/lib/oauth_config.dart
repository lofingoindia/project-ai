// OAuth Configuration
// Replace these with your actual OAuth credentials

class OAuthConfig {
  // Google OAuth Configuration
  // Get these from Google Cloud Console: https://console.cloud.google.com/
  static const String googleWebClientId = 'YOUR_GOOGLE_WEB_CLIENT_ID.apps.googleusercontent.com';
  static const String googleIosClientId = 'YOUR_GOOGLE_IOS_CLIENT_ID.apps.googleusercontent.com';
  
  // Facebook OAuth Configuration  
  // Get these from Facebook Developers: https://developers.facebook.com/
  static const String facebookAppId = 'YOUR_FACEBOOK_APP_ID';
  static const String facebookClientToken = 'YOUR_FACEBOOK_CLIENT_TOKEN';
}

// SETUP INSTRUCTIONS:
//
// For Google Sign-In:
// 1. Go to Google Cloud Console (https://console.cloud.google.com/)
// 2. Create a new project or select existing one
// 3. Enable Google+ API
// 4. Create OAuth 2.0 credentials
// 5. Add your bundle ID for iOS and package name for Android
// 6. Replace the clientId values above
//
// For Facebook Login:
// 1. Go to Facebook Developers (https://developers.facebook.com/)
// 2. Create a new app
// 3. Add Facebook Login product
// 4. Configure OAuth redirect URIs
// 5. Replace the app ID and client token above
//
// Don't forget to configure your Supabase project to accept OAuth from these providers!
