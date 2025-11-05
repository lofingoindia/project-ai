# Flutter Web Setup & Build Instructions

This document explains how to build and run the `ai_project_app` Flutter application for web.

## Prerequisites

- **Flutter SDK**: 3.8.1 or higher (stable channel recommended)
- **Chrome** or **Edge** for local testing
- **Dart SDK**: Included with Flutter
- Check your setup:
  ```bash
  flutter --version
  flutter doctor
  ```

## Enable Web Support

If web support is not already enabled, run:

```bash
flutter config --enable-web
```

Verify web devices are available:

```bash
flutter devices
```

You should see `Chrome (web-javascript)` and/or `Web Server (web-javascript)` listed.

## Installing Dependencies

From the `ai_app` directory, fetch all dependencies:

```bash
cd ai-project/ai_app
flutter pub get
```

## Running the Web App in Development Mode

### Option 1: Run in Chrome (recommended for development)

```bash
flutter run -d chrome
```f

This will launch a Chrome browser window with hot-reload enabled. Any code changes will trigger automatic rebuilds.

### Option 2: Run on a web server (headless mode)

```bash
flutter run -d web-server
```

This starts a local web server (default: `http://localhost:<port>`). Open the printed URL in your browser. Hot-reload is supported.

### Option 3: Run with a custom port

```bash
flutter run -d web-server --web-port=8080
```

Open `http://localhost:8080` in your browser.

## Building for Production

To compile the app for production, run:

```bash
flutter build web
```

### Build Output

- Compiled files are output to: `build/web/`
- This folder contains:
  - `index.html` – Entry point
  - `flutter_bootstrap.js` – Flutter web engine bootstrap
  - `assets/`, `canvaskit/`, etc. – Static assets
  
### Build with Custom Options

**Optimize for size (smaller output):**

```bash
flutter build web --release --web-renderer canvaskit
```

**Use HTML renderer (better compatibility, faster initial load):**

```bash
flutter build web --release --web-renderer html
```

**Use auto renderer (Flutter chooses based on device):**

```bash
flutter build web --release --web-renderer auto
```

### Recommended production build:

```bash
flutter build web --release --web-renderer auto --base-href=/
```

> **Note**: If deploying to a subdirectory (e.g., `https://example.com/myapp/`), use `--base-href=/myapp/`.

## Serving the Built App Locally

After building, you can serve the `build/web` directory with any static web server.

### Using Python 3:

```bash
cd build/web
python3 -m http.server 8080
```

Open `http://localhost:8080` in your browser.

### Using Node.js (http-server):

```bash
npm install -g http-server
cd build/web
http-server -p 8080
```

Open `http://localhost:8080`.

## Deploying to Production

### Hosting Platforms

The `build/web` folder can be deployed to any static site host:

- **Firebase Hosting**: `firebase deploy`
- **Netlify**: Drag and drop `build/web` or use CLI
- **Vercel**: Import project or use `vercel` CLI
- **GitHub Pages**: Push `build/web` to `gh-pages` branch
- **AWS S3 + CloudFront**: Upload to S3 bucket with static website hosting

### Example: Firebase Hosting

1. Install Firebase CLI:
   ```bash
   npm install -g firebase-tools
   ```

2. Initialize Firebase in your project:
   ```bash
   firebase init hosting
   ```
   - Select `build/web` as your public directory
   - Configure as single-page app: **Yes**
   - Don't overwrite `index.html`

3. Deploy:
   ```bash
   firebase deploy
   ```

## Troubleshooting

### Issue: "Unsupported platform" or plugin errors

Some plugins (e.g., `image_picker`, `google_sign_in`) have web implementations, but others may not. The app has been updated to use `kIsWeb` checks and web-compatible fallbacks.

If you encounter plugin errors:
- Check plugin documentation for web support
- Use conditional imports or `kIsWeb` guards in code
- Replace with web-compatible alternatives (e.g., `html.FileUploadInputElement` for file selection)

### Issue: CORS errors when calling APIs

Web apps enforce CORS (Cross-Origin Resource Sharing). Ensure your backend API includes appropriate CORS headers:

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE
Access-Control-Allow-Headers: Content-Type, Authorization
```

For local development, you can run Chrome with CORS disabled (not recommended for production):

```bash
flutter run -d chrome --web-browser-flag="--disable-web-security"
```

### Issue: Assets not loading

Ensure all assets are listed in `pubspec.yaml` under `flutter: assets:` and run `flutter pub get` after changes.

### Issue: Large bundle size

- Use `--split-debug-info` and `--obfuscate` for smaller builds:
  ```bash
  flutter build web --release --split-debug-info=build/debug-info --obfuscate
  ```
- Use tree-shaking and minimize asset sizes
- Consider lazy-loading large assets

## Additional Resources

- [Flutter Web Documentation](https://docs.flutter.dev/platform-integration/web)
- [Web Renderers](https://docs.flutter.dev/platform-integration/web/renderers)
- [Building a web application with Flutter](https://docs.flutter.dev/get-started/web)
- [Flutter Web FAQ](https://docs.flutter.dev/platform-integration/web/faq)

---

**Last Updated**: 30 October 2025
