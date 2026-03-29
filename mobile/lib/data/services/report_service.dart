import 'package:dio/dio.dart';

import '../../core/network/dio_client.dart';
import '../models/report_model.dart';

class ReportService {
  ReportService._();

  static final ReportService instance = ReportService._();

  final Dio _dio = DioClient.instance.dio;

  Future<OverviewSummaryModel> getOverview() async {
    final response = await _dio.get<dynamic>('/reports/overview');
    final payload = _unwrapMap(response.data);
    return OverviewSummaryModel.fromJson(payload);
  }

  Future<ProjectSummaryModel> getProjectSummary(String projectId) async {
    final response =
        await _dio.get<dynamic>('/reports/project/$projectId');
    final payload = _unwrapMap(response.data);
    return ProjectSummaryModel.fromJson(payload);
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
