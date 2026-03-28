import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class StoredSession {
  const StoredSession({
    required this.userId,
    required this.accessToken,
    required this.refreshToken,
  });

  final String userId;
  final String accessToken;
  final String refreshToken;
}

class AuthStorageService {
  AuthStorageService._();

  static final AuthStorageService instance = AuthStorageService._();

  static const _storage = FlutterSecureStorage();
  static const _userIdKey = 'user_id';
  static const _accessTokenKey = 'access_token';
  static const _refreshTokenKey = 'refresh_token';

  Future<void> saveSession({
    required String userId,
    required String accessToken,
    required String refreshToken,
  }) async {
    await _storage.write(key: _userIdKey, value: userId);
    await _storage.write(key: _accessTokenKey, value: accessToken);
    await _storage.write(key: _refreshTokenKey, value: refreshToken);
  }

  Future<StoredSession?> readSession() async {
    final userId = await _storage.read(key: _userIdKey);
    final accessToken = await _storage.read(key: _accessTokenKey);
    final refreshToken = await _storage.read(key: _refreshTokenKey);

    if (userId == null || accessToken == null || refreshToken == null) {
      return null;
    }

    return StoredSession(
      userId: userId,
      accessToken: accessToken,
      refreshToken: refreshToken,
    );
  }

  Future<void> updateTokens({
    required String accessToken,
    required String refreshToken,
  }) async {
    await _storage.write(key: _accessTokenKey, value: accessToken);
    await _storage.write(key: _refreshTokenKey, value: refreshToken);
  }

  Future<void> clearSession() async {
    await _storage.delete(key: _userIdKey);
    await _storage.delete(key: _accessTokenKey);
    await _storage.delete(key: _refreshTokenKey);
  }
}
