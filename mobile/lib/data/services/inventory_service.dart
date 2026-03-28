import 'package:dio/dio.dart';

import '../../core/network/dio_client.dart';
import '../models/inventory_model.dart';

class InventoryService {
  InventoryService._();

  static final InventoryService instance = InventoryService._();

  final Dio _dio = DioClient.instance.dio;

  Future<InventoryOverviewModel> getGlobalInventory() async {
    final response = await _dio.get<Map<String, dynamic>>('/inventory/global');
    final payload = _unwrapMap(response.data);
    return InventoryOverviewModel.fromJson(payload);
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
