class SupplierModel {
  const SupplierModel({
    required this.id,
    required this.name,
    this.email,
    this.phone,
  });

  final String id;
  final String name;
  final String? email;
  final String? phone;

  factory SupplierModel.fromJson(Map<String, dynamic> json) {
    return SupplierModel(
      id: (json['id'] ?? '').toString(),
      name: (json['name'] ?? '').toString(),
      email: json['email']?.toString(),
      phone: json['phone']?.toString(),
    );
  }
}

class PurchaseOrderItemModel {
  const PurchaseOrderItemModel({
    required this.name,
    required this.quantity,
    required this.unit,
    required this.unitPrice,
    required this.lineTotal,
    this.id,
    this.description,
    this.notes,
  });

  final String? id;
  final String name;
  final double quantity;
  final String unit;
  final double unitPrice;
  final double lineTotal;
  final String? description;
  final String? notes;

  factory PurchaseOrderItemModel.fromJson(Map<String, dynamic> json) {
    return PurchaseOrderItemModel(
      id: json['id']?.toString(),
      name: (json['name'] ?? '').toString(),
      description: json['description']?.toString(),
      quantity: double.tryParse((json['quantity'] ?? 0).toString()) ?? 0,
      unit: (json['unit'] ?? '').toString(),
      unitPrice: double.tryParse((json['unitPrice'] ?? 0).toString()) ?? 0,
      lineTotal: double.tryParse((json['lineTotal'] ?? 0).toString()) ?? 0,
      notes: json['notes']?.toString(),
    );
  }
}

class PurchaseOrderModel {
  const PurchaseOrderModel({
    required this.id,
    required this.projectId,
    required this.supplierId,
    required this.orderNumber,
    required this.status,
    required this.subtotal,
    required this.taxAmount,
    required this.totalAmount,
    required this.requestedById,
    required this.items,
    this.materialRequestId,
    this.title,
    this.notes,
    this.approvedById,
    this.sentAt,
    this.supplier,
    this.createdAt,
    this.updatedAt,
  });

  final String id;
  final String projectId;
  final String supplierId;
  final String orderNumber;
  final String status;
  final double subtotal;
  final double taxAmount;
  final double totalAmount;
  final String requestedById;
  final List<PurchaseOrderItemModel> items;
  final String? materialRequestId;
  final String? title;
  final String? notes;
  final String? approvedById;
  final String? sentAt;
  final SupplierModel? supplier;
  final String? createdAt;
  final String? updatedAt;

  factory PurchaseOrderModel.fromJson(Map<String, dynamic> json) {
    final supplierMap = json['supplier'] as Map<String, dynamic>?;
    return PurchaseOrderModel(
      id: (json['id'] ?? '').toString(),
      projectId: (json['projectId'] ?? '').toString(),
      supplierId: (json['supplierId'] ?? '').toString(),
      materialRequestId: json['materialRequestId']?.toString(),
      orderNumber: (json['orderNumber'] ?? '').toString(),
      title: json['title']?.toString(),
      status: (json['status'] ?? 'draft').toString(),
      subtotal: double.tryParse((json['subtotal'] ?? 0).toString()) ?? 0,
      taxAmount: double.tryParse((json['taxAmount'] ?? 0).toString()) ?? 0,
      totalAmount: double.tryParse((json['totalAmount'] ?? 0).toString()) ?? 0,
      notes: json['notes']?.toString(),
      requestedById: (json['requestedById'] ?? '').toString(),
      approvedById: json['approvedById']?.toString(),
      sentAt: json['sentAt']?.toString(),
      supplier: supplierMap == null ? null : SupplierModel.fromJson(supplierMap),
      items: ((json['items'] as List<dynamic>? ?? const [])
          .whereType<Map<String, dynamic>>()
          .map(PurchaseOrderItemModel.fromJson)
          .toList()),
      createdAt: json['createdAt']?.toString(),
      updatedAt: json['updatedAt']?.toString(),
    );
  }
}

class SupplierInvoiceModel {
  const SupplierInvoiceModel({
    required this.id,
    required this.purchaseOrderId,
    required this.supplierId,
    required this.invoiceNumber,
    required this.invoiceDate,
    required this.totalAmount,
    required this.status,
    this.dueDate,
    this.subtotal,
    this.taxAmount,
    this.notes,
    this.fileUrl,
    this.paidAt,
    this.createdAt,
  });

  final String id;
  final String purchaseOrderId;
  final String supplierId;
  final String invoiceNumber;
  final String invoiceDate;
  final double totalAmount;
  final String status;
  final String? dueDate;
  final double? subtotal;
  final double? taxAmount;
  final String? notes;
  final String? fileUrl;
  final String? paidAt;
  final String? createdAt;

  factory SupplierInvoiceModel.fromJson(Map<String, dynamic> json) {
    return SupplierInvoiceModel(
      id: (json['id'] ?? '').toString(),
      purchaseOrderId: (json['purchaseOrderId'] ?? '').toString(),
      supplierId: (json['supplierId'] ?? '').toString(),
      invoiceNumber: (json['invoiceNumber'] ?? '').toString(),
      invoiceDate: (json['invoiceDate'] ?? '').toString(),
      dueDate: json['dueDate']?.toString(),
      subtotal: double.tryParse((json['subtotal'] ?? 0).toString()) ?? 0,
      taxAmount: double.tryParse((json['taxAmount'] ?? 0).toString()) ?? 0,
      totalAmount: double.tryParse((json['totalAmount'] ?? 0).toString()) ?? 0,
      status: (json['status'] ?? 'received').toString(),
      notes: json['notes']?.toString(),
      fileUrl: json['fileUrl']?.toString(),
      paidAt: json['paidAt']?.toString(),
      createdAt: json['createdAt']?.toString(),
    );
  }
}

class GoodsReceiptItemModel {
  const GoodsReceiptItemModel({
    required this.name,
    required this.unit,
    required this.orderedQuantity,
    required this.receivedQuantity,
    required this.damagedQuantity,
    required this.acceptedQuantity,
    this.id,
    this.purchaseOrderItemId,
    this.notes,
  });

  final String? id;
  final String? purchaseOrderItemId;
  final String name;
  final String unit;
  final double orderedQuantity;
  final double receivedQuantity;
  final double damagedQuantity;
  final double acceptedQuantity;
  final String? notes;

  factory GoodsReceiptItemModel.fromJson(Map<String, dynamic> json) {
    return GoodsReceiptItemModel(
      id: json['id']?.toString(),
      purchaseOrderItemId: json['purchaseOrderItemId']?.toString(),
      name: (json['name'] ?? '').toString(),
      unit: (json['unit'] ?? '').toString(),
      orderedQuantity:
          double.tryParse((json['orderedQuantity'] ?? 0).toString()) ?? 0,
      receivedQuantity:
          double.tryParse((json['receivedQuantity'] ?? 0).toString()) ?? 0,
      damagedQuantity:
          double.tryParse((json['damagedQuantity'] ?? 0).toString()) ?? 0,
      acceptedQuantity:
          double.tryParse((json['acceptedQuantity'] ?? 0).toString()) ?? 0,
      notes: json['notes']?.toString(),
    );
  }
}

class GoodsReceiptModel {
  const GoodsReceiptModel({
    required this.id,
    required this.purchaseOrderId,
    required this.status,
    required this.receivedById,
    required this.receivedAt,
    required this.destinationType,
    required this.items,
    this.destinationLabel,
    this.notes,
  });

  final String id;
  final String purchaseOrderId;
  final String status;
  final String receivedById;
  final String receivedAt;
  final String destinationType;
  final String? destinationLabel;
  final List<GoodsReceiptItemModel> items;
  final String? notes;

  factory GoodsReceiptModel.fromJson(Map<String, dynamic> json) {
    return GoodsReceiptModel(
      id: (json['id'] ?? '').toString(),
      purchaseOrderId: (json['purchaseOrderId'] ?? '').toString(),
      status: (json['status'] ?? 'pending').toString(),
      receivedById: (json['receivedById'] ?? '').toString(),
      receivedAt: (json['receivedAt'] ?? '').toString(),
      destinationType: (json['destinationType'] ?? 'store').toString(),
      destinationLabel: json['destinationLabel']?.toString(),
      notes: json['notes']?.toString(),
      items: ((json['items'] as List<dynamic>? ?? const [])
          .whereType<Map<String, dynamic>>()
          .map(GoodsReceiptItemModel.fromJson)
          .toList()),
    );
  }
}
