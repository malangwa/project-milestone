import 'package:dio/dio.dart';

import '../../core/network/dio_client.dart';
import '../models/expense_model.dart';

class ExpenseService {
  ExpenseService._();

  static final ExpenseService instance = ExpenseService._();

  final Dio _dio = DioClient.instance.dio;

  Future<List<ExpenseModel>> getByProject(String projectId) async {
    final response =
        await _dio.get<dynamic>('/expenses/project/$projectId');
    final payload = _unwrapList(response.data);
    return payload.map(ExpenseModel.fromJson).toList();
  }

  Future<ExpenseModel> getById(String id) async {
    final response = await _dio.get<dynamic>('/expenses/$id');
    final payload = _unwrapMap(response.data);
    return ExpenseModel.fromJson(payload);
  }

  Future<void> approve(String id) async {
    await _dio.patch<void>('/expenses/$id/approve');
  }

  Future<void> reject(String id) async {
    await _dio.patch<void>('/expenses/$id/reject');
  }

  Future<void> create(Map<String, dynamic> data) async {
    await _dio.post<dynamic>('/expenses', data: data);
  }

  Future<void> delete(String id) async {
    await _dio.delete<void>('/expenses/$id');
  }

  List<Map<String, dynamic>> _unwrapList(dynamic data) {
    if (data is Map<String, dynamic>) {
      final nested = data['data'];
      if (nested is List) {
        return nested.whereType<Map<String, dynamic>>().toList();
      }
    }
    if (data is List) {
      return data.whereType<Map<String, dynamic>>().toList();
    }
    return const <Map<String, dynamic>>[];
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
