import 'package:dio/dio.dart';
import '../../config/api_config.dart';
import '../../data/services/auth_storage_service.dart';

class DioClient {
  DioClient._() {
    _dio = Dio(
      BaseOptions(
        baseUrl: ApiConfig.baseUrl,
        connectTimeout: ApiConfig.timeout,
        receiveTimeout: ApiConfig.timeout,
        headers: {'Content-Type': 'application/json'},
      ),
    );

    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final session = await AuthStorageService.instance.readSession();
          if (session != null) {
            options.headers['Authorization'] = 'Bearer ${session.accessToken}';
          }
          handler.next(options);
        },
        onError: (error, handler) async {
          if (error.response?.statusCode != 401 ||
              error.requestOptions.path.contains('/auth/login') ||
              error.requestOptions.path.contains('/auth/refresh')) {
            handler.next(error);
            return;
          }

          final refreshedToken = await _refreshAccessToken();
          if (refreshedToken == null) {
            handler.next(error);
            return;
          }

          final requestOptions = error.requestOptions;
          requestOptions.headers['Authorization'] = 'Bearer $refreshedToken';

          try {
            final response = await _dio.fetch<dynamic>(requestOptions);
            handler.resolve(response);
          } on DioException catch (retryError) {
            handler.next(retryError);
          }
        },
      ),
    );
  }

  static final DioClient instance = DioClient._();

  late final Dio _dio;

  Future<String?> _refreshAccessToken() async {
    final session = await AuthStorageService.instance.readSession();
    if (session == null) {
      return null;
    }

    final refreshDio = Dio(
      BaseOptions(
        baseUrl: ApiConfig.baseUrl,
        connectTimeout: ApiConfig.timeout,
        receiveTimeout: ApiConfig.timeout,
        headers: {'Content-Type': 'application/json'},
      ),
    );

    try {
      final response = await refreshDio.post<Map<String, dynamic>>(
        '/auth/refresh',
        data: {
          'userId': session.userId,
          'refreshToken': session.refreshToken,
        },
      );

      final payload = _unwrapMap(response.data);
      final accessToken = (payload['accessToken'] ?? '').toString();
      final refreshToken =
          (payload['refreshToken'] ?? session.refreshToken).toString();

      if (accessToken.isEmpty) {
        return null;
      }

      await AuthStorageService.instance.updateTokens(
        accessToken: accessToken,
        refreshToken: refreshToken,
      );

      return accessToken;
    } catch (_) {
      await AuthStorageService.instance.clearSession();
      return null;
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

  Dio get dio => _dio;
}
