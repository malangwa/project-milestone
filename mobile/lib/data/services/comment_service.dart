import 'package:dio/dio.dart';

import '../../core/network/dio_client.dart';

class CommentService {
  CommentService._();

  static final CommentService instance = CommentService._();

  final Dio _dio = DioClient.instance.dio;

  Future<List<Map<String, dynamic>>> getByEntity(
    String entityType,
    String entityId,
  ) async {
    final response = await _dio.get<dynamic>(
      '/comments',
      queryParameters: {'entityType': entityType, 'entityId': entityId},
    );
    return _unwrapList(response.data);
  }

  Future<Map<String, dynamic>> create(Map<String, dynamic> data) async {
    final response = await _dio.post<dynamic>('/comments', data: data);
    return _unwrapMap(response.data);
  }

  Future<void> delete(String id) async {
    await _dio.delete<dynamic>('/comments/$id');
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
      if (nested is Map<String, dynamic>) {
        return nested;
      }
      return data;
    }
    return <String, dynamic>{};
  }
}
