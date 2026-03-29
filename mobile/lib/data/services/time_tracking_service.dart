import 'package:dio/dio.dart';

import '../../core/network/dio_client.dart';
import '../models/time_entry_model.dart';

class TimeTrackingService {
  TimeTrackingService._();
  static final TimeTrackingService instance = TimeTrackingService._();
  final Dio _dio = DioClient.instance.dio;

  Future<List<TimeEntryModel>> getByProject(String projectId) async {
    final res = await _dio.get<dynamic>('/time-tracking/project/$projectId');
    return _unwrapList(res.data).map((e) => TimeEntryModel.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<double> getProjectTotal(String projectId) async {
    final res = await _dio.get<dynamic>('/time-tracking/project/$projectId/total');
    final data = _unwrapMap(res.data);
    return (data['total'] as num?)?.toDouble() ?? 0;
  }

  Future<void> create(Map<String, dynamic> body) async {
    await _dio.post<void>('/time-tracking', data: body);
  }

  Future<void> remove(String id) async {
    await _dio.delete<void>('/time-tracking/$id');
  }

  List<dynamic> _unwrapList(dynamic data) {
    if (data is List) return data;
    if (data is Map && data['data'] is List) return data['data'] as List;
    return [];
  }

  Map<String, dynamic> _unwrapMap(dynamic data) {
    if (data is Map<String, dynamic>) {
      if (data.containsKey('data') && data['data'] is Map) {
        return data['data'] as Map<String, dynamic>;
      }
      return data;
    }
    return {};
  }
}
