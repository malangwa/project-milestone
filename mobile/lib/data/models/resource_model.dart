class ResourceModel {
  const ResourceModel({
    required this.id,
    required this.name,
    this.type,
    this.role,
    this.costPerUnit,
    this.unit,
    this.quantity,
    this.notes,
  });

  final String id;
  final String name;
  final String? type;
  final String? role;
  final double? costPerUnit;
  final String? unit;
  final double? quantity;
  final String? notes;

  factory ResourceModel.fromJson(Map<String, dynamic> json) {
    return ResourceModel(
      id: json['id'] as String,
      name: json['name'] as String? ?? '',
      type: json['type'] as String?,
      role: json['role'] as String?,
      costPerUnit: (json['costPerUnit'] as num?)?.toDouble(),
      unit: json['unit'] as String?,
      quantity: (json['quantity'] as num?)?.toDouble(),
      notes: json['notes'] as String?,
    );
  }
}
