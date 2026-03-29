import 'package:dio/dio.dart';

import '../../core/network/dio_client.dart';
import '../models/attachment_model.dart';

class AttachmentService {
  AttachmentService._();
  static final AttachmentService instance = AttachmentService._();

  final Dio _dio = DioClient.instance.dio;

  List<AttachmentModel> _unwrapList(dynamic data) {
    if (data is Map<String, dynamic> && data.containsKey('data')) {
      final nested = data['data'];
      if (nested is List) {
        return nested
            .whereType<Map<String, dynamic>>()
            .map(AttachmentModel.fromJson)
            .toList();
      }
    }
    if (data is List) {
      return data
          .whereType<Map<String, dynamic>>()
          .map(AttachmentModel.fromJson)
          .toList();
    }
    return [];
  }

  AttachmentModel _unwrapOne(dynamic data) {
    if (data is Map<String, dynamic> && data.containsKey('data')) {
      final nested = data['data'];
      if (nested is Map<String, dynamic>) {
        return AttachmentModel.fromJson(nested);
      }
    }
    if (data is Map<String, dynamic>) {
      return AttachmentModel.fromJson(data);
    }
    throw Exception('Unexpected response format');
  }

  Future<List<AttachmentModel>> getByEntity(
    String entityType,
    String entityId,
  ) async {
    try {
      final response = await _dio.get<dynamic>(
        '/attachments',
        queryParameters: {'entityType': entityType, 'entityId': entityId},
      );
      return _unwrapList(response.data);
    } catch (_) {
      return [];
    }
  }

  Future<AttachmentModel> upload(
    String filePath,
    String fileName,
    String entityType,
    String entityId,
    String? description,
  ) async {
    final formData = FormData.fromMap({
      'file': await MultipartFile.fromFile(filePath, filename: fileName),
      if (description != null && description.trim().isNotEmpty)
        'description': description.trim(),
    });
    final response = await _dio.post<dynamic>(
      '/attachments/upload',
      data: formData,
      queryParameters: {'entityType': entityType, 'entityId': entityId},
      options: Options(
        contentType: 'multipart/form-data',
        receiveTimeout: const Duration(seconds: 120),
        sendTimeout: const Duration(seconds: 120),
      ),
    );
    return _unwrapOne(response.data);
  }

  Future<String> getDownloadUrl(String id) async {
    final response = await _dio.get<dynamic>('/attachments/$id/download-url');
    final data = response.data;
    if (data is Map<String, dynamic>) {
      return (data['url'] ?? data['data']?['url'] ?? '').toString();
    }
    return '';
  }

  Future<void> delete(String id) async {
    await _dio.delete<dynamic>('/attachments/$id');
  }
}
