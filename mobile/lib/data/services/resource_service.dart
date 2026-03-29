import 'package:dio/dio.dart';

import '../../core/network/dio_client.dart';
import '../models/resource_model.dart';

class ResourceService {
  ResourceService._();
  static final ResourceService instance = ResourceService._();
  final Dio _dio = DioClient.instance.dio;

  Future<List<ResourceModel>> getByProject(String projectId) async {
    final res = await _dio.get<dynamic>('/resources/project/$projectId');
    return _unwrapList(res.data).map((e) => ResourceModel.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<void> create(Map<String, dynamic> body) async {
    await _dio.post<void>('/resources', data: body);
  }

  Future<void> update(String id, Map<String, dynamic> body) async {
    await _dio.patch<void>('/resources/$id', data: body);
  }

  Future<void> remove(String id) async {
    await _dio.delete<void>('/resources/$id');
  }

  List<dynamic> _unwrapList(dynamic data) {
    if (data is List) return data;
    if (data is Map && data['data'] is List) return data['data'] as List;
    return [];
  }
}
