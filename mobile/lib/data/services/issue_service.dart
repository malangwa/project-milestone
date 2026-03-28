import 'package:dio/dio.dart';

import '../../core/network/dio_client.dart';
import '../models/issue_model.dart';

class IssueService {
  IssueService._();

  static final IssueService instance = IssueService._();

  final Dio _dio = DioClient.instance.dio;

  Future<List<IssueModel>> getByProject(String projectId) async {
    final response =
        await _dio.get<Map<String, dynamic>>('/issues/project/$projectId');
    final payload = _unwrapList(response.data);
    return payload.map(IssueModel.fromJson).toList();
  }

  Future<IssueModel> getById(String id) async {
    final response = await _dio.get<Map<String, dynamic>>('/issues/$id');
    final payload = _unwrapMap(response.data);
    return IssueModel.fromJson(payload);
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
