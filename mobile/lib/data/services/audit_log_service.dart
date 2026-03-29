import 'package:dio/dio.dart';

import '../../core/network/dio_client.dart';
import '../models/audit_log_model.dart';

class AuditLogService {
  AuditLogService._();
  static final AuditLogService instance = AuditLogService._();
  final Dio _dio = DioClient.instance.dio;

  Future<List<AuditLogModel>> getAll({int limit = 200}) async {
    final res = await _dio.get<dynamic>('/audit-logs?limit=$limit');
    return _unwrapList(res.data).map((e) => AuditLogModel.fromJson(e as Map<String, dynamic>)).toList();
  }

  List<dynamic> _unwrapList(dynamic data) {
    if (data is List) return data;
    if (data is Map && data['data'] is List) return data['data'] as List;
    return [];
  }
}
