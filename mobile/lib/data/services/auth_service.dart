import 'package:dio/dio.dart';

import '../../core/network/dio_client.dart';
import '../models/user_model.dart';
import 'auth_storage_service.dart';

class LoginResult {
  const LoginResult({
    required this.user,
    required this.accessToken,
    required this.refreshToken,
  });

  final UserModel user;
  final String accessToken;
  final String refreshToken;
}

class AuthService {
  AuthService._();

  static final AuthService instance = AuthService._();

  final Dio _dio = DioClient.instance.dio;

  Future<LoginResult> login({
    required String email,
    required String password,
  }) async {
    final response = await _dio.post<Map<String, dynamic>>(
      '/auth/login',
      data: {'email': email.trim(), 'password': password},
    );

    final payload = _unwrapMap(response.data);
    final user = UserModel.fromJson(payload['user'] as Map<String, dynamic>);
    final accessToken = (payload['accessToken'] ?? '').toString();
    final refreshToken = (payload['refreshToken'] ?? '').toString();

    await AuthStorageService.instance.saveSession(
      userId: user.id,
      accessToken: accessToken,
      refreshToken: refreshToken,
    );

    return LoginResult(
      user: user,
      accessToken: accessToken,
      refreshToken: refreshToken,
    );
  }

  Future<UserModel> me() async {
    final response = await _dio.get<Map<String, dynamic>>('/auth/me');
    final payload = _unwrapMap(response.data);
    return UserModel.fromJson(payload);
  }

  Future<void> logout() async {
    try {
      await _dio.post('/auth/logout');
    } on DioException {
      // Clear the local session even if the remote revoke fails.
    } finally {
      await AuthStorageService.instance.clearSession();
    }
  }

  Map<String, dynamic> _unwrapMap(dynamic data) {
    if (data is Map<String, dynamic>) {
      final nested = data['data'];
      if (nested is Map<String, dynamic>) {
        return nested;
      }
      return data;
    }
    return <String, dynamic>{};
  }
}
