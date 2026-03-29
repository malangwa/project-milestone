import 'package:dio/dio.dart';

import '../../core/network/dio_client.dart';
import '../models/inventory_model.dart';
import '../models/procurement_model.dart';

class ProcurementService {
  ProcurementService._();

  static final ProcurementService instance = ProcurementService._();

  final Dio _dio = DioClient.instance.dio;

  Future<List<SupplierModel>> getSuppliers() async {
    final response = await _dio.get<dynamic>('/suppliers');
    return _unwrapList(response.data).map(SupplierModel.fromJson).toList();
  }

  Future<SupplierModel> createSupplier(Map<String, dynamic> data) async {
    final response = await _dio.post<dynamic>('/suppliers', data: data);
    return SupplierModel.fromJson(_unwrapMap(response.data));
  }

  Future<List<PurchaseOrderModel>> getPurchaseOrdersByProject(
    String projectId,
  ) async {
    final response = await _dio.get<dynamic>('/projects/$projectId/purchase-orders');
    return _unwrapList(response.data).map(PurchaseOrderModel.fromJson).toList();
  }

  Future<PurchaseOrderModel> createPurchaseOrder(
    String projectId,
    Map<String, dynamic> data,
  ) async {
    final response = await _dio.post<dynamic>(
      '/projects/$projectId/purchase-orders',
      data: data,
    );
    return PurchaseOrderModel.fromJson(_unwrapMap(response.data));
  }

  Future<void> approvePurchaseOrder(String id) async {
    await _dio.patch<dynamic>('/purchase-orders/$id/approve');
  }

  Future<void> sendPurchaseOrder(String id) async {
    await _dio.patch<dynamic>('/purchase-orders/$id/send');
  }

  Future<void> cancelPurchaseOrder(String id) async {
    await _dio.patch<dynamic>('/purchase-orders/$id/cancel');
  }

  Future<List<SupplierInvoiceModel>> getInvoicesByPurchaseOrder(
    String purchaseOrderId,
  ) async {
    final response =
        await _dio.get<dynamic>('/purchase-orders/$purchaseOrderId/invoices');
    return _unwrapList(response.data).map(SupplierInvoiceModel.fromJson).toList();
  }

  Future<SupplierInvoiceModel> createInvoice(
    String purchaseOrderId,
    Map<String, dynamic> data,
  ) async {
    final response = await _dio.post<dynamic>(
      '/purchase-orders/$purchaseOrderId/invoices',
      data: data,
    );
    return SupplierInvoiceModel.fromJson(_unwrapMap(response.data));
  }

  Future<void> verifyInvoice(String id) async {
    await _dio.patch<dynamic>('/invoices/$id/verify');
  }

  Future<void> approveInvoice(String id) async {
    await _dio.patch<dynamic>('/invoices/$id/approve');
  }

  Future<void> payInvoice(String id) async {
    await _dio.patch<dynamic>('/invoices/$id/pay');
  }

  Future<void> rejectInvoice(String id) async {
    await _dio.patch<dynamic>('/invoices/$id/reject');
  }

  Future<List<GoodsReceiptModel>> getReceiptsByPurchaseOrder(
    String purchaseOrderId,
  ) async {
    final response =
        await _dio.get<dynamic>('/purchase-orders/$purchaseOrderId/receipts');
    return _unwrapList(response.data).map(GoodsReceiptModel.fromJson).toList();
  }

  Future<GoodsReceiptModel> createReceipt(
    String purchaseOrderId,
    Map<String, dynamic> data,
  ) async {
    final response = await _dio.post<dynamic>(
      '/purchase-orders/$purchaseOrderId/receipts',
      data: data,
    );
    return GoodsReceiptModel.fromJson(_unwrapMap(response.data));
  }

  Future<List<InventoryItemModel>> getInventoryByProject(String projectId) async {
    final response = await _dio.get<dynamic>('/projects/$projectId/inventory');
    return _unwrapList(response.data).map(InventoryItemModel.fromJson).toList();
  }

  Future<void> adjustInventory(
    String projectId,
    Map<String, dynamic> data,
  ) async {
    await _dio.post<dynamic>('/projects/$projectId/inventory/adjust', data: data);
  }

  Future<void> transferInventory(
    String projectId,
    String stockItemId,
    Map<String, dynamic> data,
  ) async {
    await _dio.post<dynamic>(
      '/projects/$projectId/inventory/$stockItemId/transfer',
      data: data,
    );
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
