import 'package:dio/dio.dart';

import '../../core/network/dio_client.dart';
import '../models/notification_model.dart';

class NotificationService {
  NotificationService._();

  static final NotificationService instance = NotificationService._();

  final Dio _dio = DioClient.instance.dio;

  Future<List<NotificationModel>> getAll() async {
    final response = await _dio.get<Map<String, dynamic>>('/notifications');
    final payload = _unwrapList(response.data);
    return payload.map(NotificationModel.fromJson).toList();
  }

  Future<int> getUnreadCount() async {
    final response =
        await _dio.get<Map<String, dynamic>>('/notifications/unread-count');
    if (response.data is Map<String, dynamic>) {
      final data = response.data!;
      return (data['count'] ?? data['data'] ?? 0) as int;
    }
    return 0;
  }

  Future<void> markRead(String id) async {
    await _dio.patch<void>('/notifications/$id/read');
  }

  Future<void> markAllRead() async {
    await _dio.patch<void>('/notifications/read-all');
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
}
