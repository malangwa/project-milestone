import 'package:dio/dio.dart';

import '../../core/network/dio_client.dart';
import '../models/task_model.dart';

class TaskService {
  TaskService._();

  static final TaskService instance = TaskService._();

  final Dio _dio = DioClient.instance.dio;

  Future<List<TaskModel>> getTasksByProject(String projectId) async {
    final response =
        await _dio.get<dynamic>('/tasks/project/$projectId');
    final payload = _unwrapList(response.data);
    return payload.map(TaskModel.fromJson).toList();
  }

  Future<void> create(Map<String, dynamic> data) async {
    await _dio.post<dynamic>('/tasks', data: data);
  }

  Future<void> update(String id, Map<String, dynamic> data) async {
    await _dio.patch<dynamic>('/tasks/$id', data: data);
  }

  Future<void> delete(String id) async {
    await _dio.delete<void>('/tasks/$id');
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

  // ignore: unused_element
  Map<String, dynamic> _unwrapMap(dynamic data) {
    if (data is Map<String, dynamic>) {
      final nested = data['data'];
      if (nested is Map<String, dynamic>) return nested;
      return data;
    }
    return <String, dynamic>{};
  }
}
