import 'package:dio/dio.dart';

import '../../core/network/dio_client.dart';
import '../models/milestone_model.dart';

class MilestoneService {
  MilestoneService._();

  static final MilestoneService instance = MilestoneService._();

  final Dio _dio = DioClient.instance.dio;

  Future<List<MilestoneModel>> getByProject(String projectId) async {
    final response = await _dio
        .get<dynamic>('/milestones/project/$projectId');
    final payload = _unwrapList(response.data);
    return payload.map(MilestoneModel.fromJson).toList();
  }

  Future<MilestoneModel> getById(String id) async {
    final response = await _dio.get<dynamic>('/milestones/$id');
    final payload = _unwrapMap(response.data);
    return MilestoneModel.fromJson(payload);
  }

  Future<void> create(Map<String, dynamic> data) async {
    await _dio.post<dynamic>('/milestones', data: data);
  }

  Future<void> update(String id, Map<String, dynamic> data) async {
    await _dio.patch<dynamic>('/milestones/$id', data: data);
  }

  Future<void> delete(String id) async {
    await _dio.delete<void>('/milestones/$id');
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
