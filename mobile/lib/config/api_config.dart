import 'dart:io';

class ApiConfig {
  static const String _definedBaseUrl = String.fromEnvironment('API_BASE_URL');

  static String get baseUrl {
    if (_definedBaseUrl.isNotEmpty) {
      return _definedBaseUrl;
    }

    if (Platform.isAndroid) {
      return 'http://10.0.2.2:3000/api/v1';
    }

    return 'http://localhost:3000/api/v1';
  }

  static const Duration timeout = Duration(seconds: 15);
}
