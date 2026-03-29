import 'package:dio/dio.dart';

import '../../core/network/dio_client.dart';
import '../models/activity_model.dart';

class ActivityService {
  ActivityService._();

  static final ActivityService instance = ActivityService._();

  final Dio _dio = DioClient.instance.dio;

  Future<List<ActivityModel>> getByProject(String projectId) async {
    final response = await _dio
        .get<dynamic>('/activities/project/$projectId');
    final payload = _unwrapList(response.data);
    return payload.map(ActivityModel.fromJson).toList();
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
