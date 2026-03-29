import 'package:dio/dio.dart';

import '../../core/network/dio_client.dart';
import '../models/user_model.dart';

class UserManagementService {
  UserManagementService._();
  static final UserManagementService instance = UserManagementService._();
  final Dio _dio = DioClient.instance.dio;

  Future<List<UserModel>> getAll() async {
    final res = await _dio.get<dynamic>('/users');
    return _unwrapList(res.data).map((e) => UserModel.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<UserModel> createUser(Map<String, dynamic> body) async {
    final res = await _dio.post<dynamic>('/users', data: body);
    final data = res.data is Map && (res.data as Map).containsKey('data')
        ? res.data['data']
        : res.data;
    return UserModel.fromJson(data as Map<String, dynamic>);
  }

  Future<void> updateRole(String id, String role) async {
    await _dio.patch<void>('/users/$id', data: {'role': role});
  }

  List<dynamic> _unwrapList(dynamic data) {
    if (data is List) return data;
    if (data is Map && data['data'] is List) return data['data'] as List;
    return [];
  }
}
