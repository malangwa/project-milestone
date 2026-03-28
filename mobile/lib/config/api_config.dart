import 'dart:io';

class ApiConfig {
  static const String _definedBaseUrl = String.fromEnvironment('API_BASE_URL');

  static const String productionUrl =
      'https://project-milestone-api.onrender.com/api/v1';

  static String get baseUrl {
    if (_definedBaseUrl.isNotEmpty) {
      return _definedBaseUrl;
    }

    // Use production Render backend by default.
    // For local development, build with:
    //   flutter run --dart-define=API_BASE_URL=http://10.0.2.2:3000/api/v1
    if (Platform.isAndroid) {
      return productionUrl;
    }

    return productionUrl;
  }

  // Render free tier can be slow on cold starts
  static const Duration timeout = Duration(seconds: 60);
}
