class MaterialRequestItemModel {
  const MaterialRequestItemModel({
    required this.name,
    required this.quantity,
    required this.unit,
    required this.unitPrice,
    this.id,
    this.materialRequestId,
    this.notes,
  });

  final String? id;
  final String? materialRequestId;
  final String name;
  final double quantity;
  final String unit;
  final double unitPrice;
  final String? notes;

  double get lineTotal => quantity * unitPrice;

  factory MaterialRequestItemModel.fromJson(Map<String, dynamic> json) {
    return MaterialRequestItemModel(
      id: json['id']?.toString(),
      materialRequestId: json['materialRequestId']?.toString(),
      name: (json['name'] ?? '').toString(),
      quantity: double.tryParse((json['quantity'] ?? 0).toString()) ?? 0,
      unit: (json['unit'] ?? '').toString(),
      unitPrice: double.tryParse((json['unitPrice'] ?? json['estimatedCost'] ?? 0).toString()) ?? 0,
      notes: json['notes']?.toString(),
    );
  }
}

class MaterialRequestModel {
  const MaterialRequestModel({
    required this.id,
    required this.projectId,
    required this.title,
    required this.requestedAmount,
    required this.status,
    required this.requestedById,
    required this.items,
    this.purpose,
    this.reviewedById,
    this.reviewedAt,
    this.notes,
    this.requestedByName,
    this.reviewedByName,
    this.createdAt,
    this.updatedAt,
  });

  final String id;
  final String projectId;
  final String title;
  final double requestedAmount;
  final String status;
  final String requestedById;
  final List<MaterialRequestItemModel> items;
  final String? purpose;
  final String? reviewedById;
  final String? reviewedAt;
  final String? notes;
  final String? requestedByName;
  final String? reviewedByName;
  final String? createdAt;
  final String? updatedAt;

  factory MaterialRequestModel.fromJson(Map<String, dynamic> json) {
    final requestedBy = json['requestedBy'] as Map<String, dynamic>?;
    final reviewedBy = json['reviewedBy'] as Map<String, dynamic>?;
    return MaterialRequestModel(
      id: (json['id'] ?? '').toString(),
      projectId: (json['projectId'] ?? '').toString(),
      title: (json['title'] ?? '').toString(),
      purpose: json['purpose']?.toString(),
      requestedAmount:
          double.tryParse((json['requestedAmount'] ?? 0).toString()) ?? 0,
      status: (json['status'] ?? 'pending').toString(),
      requestedById: (json['requestedById'] ?? '').toString(),
      reviewedById: json['reviewedById']?.toString(),
      reviewedAt: json['reviewedAt']?.toString(),
      notes: json['notes']?.toString(),
      items: ((json['items'] as List<dynamic>? ?? const [])
          .whereType<Map<String, dynamic>>()
          .map(MaterialRequestItemModel.fromJson)
          .toList()),
      requestedByName: requestedBy?['name']?.toString(),
      reviewedByName: reviewedBy?['name']?.toString(),
      createdAt: json['createdAt']?.toString(),
      updatedAt: json['updatedAt']?.toString(),
    );
  }
}
