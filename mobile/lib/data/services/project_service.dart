import 'package:dio/dio.dart';

import '../../core/network/dio_client.dart';
import '../models/project_model.dart';

class ProjectService {
  ProjectService._();

  static final ProjectService instance = ProjectService._();

  final Dio _dio = DioClient.instance.dio;

  Future<List<ProjectModel>> getProjects() async {
    final response = await _dio.get<dynamic>('/projects');
    final payload = _unwrapList(response.data);
    return payload.map(ProjectModel.fromJson).toList();
  }

  Future<ProjectModel> getProject(String id) async {
    final response = await _dio.get<dynamic>('/projects/$id');
    final payload = _unwrapMap(response.data);
    return ProjectModel.fromJson(payload);
  }

  Future<List<ProjectMemberModel>> getMembers(String projectId) async {
    final response = await _dio.get<dynamic>(
      '/projects/$projectId/members',
    );
    final payload = _unwrapList(response.data);
    return payload.map(ProjectMemberModel.fromJson).toList();
  }

  Future<ProjectModel> create(Map<String, dynamic> data) async {
    final response = await _dio.post<dynamic>(
      '/projects',
      data: data,
    );
    final payload = _unwrapMap(response.data);
    return ProjectModel.fromJson(payload);
  }

  Future<ProjectModel> update(String id, Map<String, dynamic> data) async {
    final response = await _dio.patch<dynamic>(
      '/projects/$id',
      data: data,
    );
    final payload = _unwrapMap(response.data);
    return ProjectModel.fromJson(payload);
  }

  Future<void> delete(String id) async {
    await _dio.delete<void>('/projects/$id');
  }

  Future<void> addMember(String projectId, String email, {String? role}) async {
    await _dio.post<void>('/projects/$projectId/members', data: {
      'email': email,
      if (role != null) 'role': role,
    });
  }

  Future<void> removeMember(String projectId, String memberUserId) async {
    await _dio.delete<void>('/projects/$projectId/members/$memberUserId');
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
