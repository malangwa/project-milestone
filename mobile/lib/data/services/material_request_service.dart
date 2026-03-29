import 'package:dio/dio.dart';

import '../../core/network/dio_client.dart';
import '../models/material_request_model.dart';

class MaterialRequestService {
  MaterialRequestService._();

  static final MaterialRequestService instance = MaterialRequestService._();

  final Dio _dio = DioClient.instance.dio;

  Future<List<MaterialRequestModel>> getByProject(String projectId) async {
    final response = await _dio.get<dynamic>('/projects/$projectId/material-requests');
    return _unwrapList(response.data).map(MaterialRequestModel.fromJson).toList();
  }

  Future<MaterialRequestModel> create(
    String projectId,
    Map<String, dynamic> data,
  ) async {
    final response = await _dio.post<dynamic>(
      '/projects/$projectId/material-requests',
      data: data,
    );
    return MaterialRequestModel.fromJson(_unwrapMap(response.data));
  }

  Future<void> approve(String id) async {
    await _dio.patch<dynamic>('/material-requests/$id/approve');
  }

  Future<void> reject(String id) async {
    await _dio.patch<dynamic>('/material-requests/$id/reject');
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
