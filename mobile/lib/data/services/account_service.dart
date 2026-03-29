import 'package:dio/dio.dart';

import '../../core/network/dio_client.dart';
import '../models/user_model.dart';

class AccountService {
  AccountService._();

  static final AccountService instance = AccountService._();

  final Dio _dio = DioClient.instance.dio;

  Future<UserModel> updateProfile({required String name}) async {
    final response = await _dio.patch<dynamic>(
      '/users/me',
      data: {'name': name.trim()},
    );
    return UserModel.fromJson(_unwrapMap(response.data));
  }

  Future<void> changePassword({
    required String currentPassword,
    required String newPassword,
  }) async {
    await _dio.patch<dynamic>(
      '/auth/change-password',
      data: {
        'currentPassword': currentPassword,
        'newPassword': newPassword,
      },
    );
  }

  Map<String, dynamic> _unwrapMap(dynamic data) {
    if (data is Map<String, dynamic>) {
      final nested = data['data'];
      if (nested is Map<String, dynamic>) return nested;
      return data;
    }
    return <String, dynamic>{};
  }
}
