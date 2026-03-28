class InventoryOverviewModel {
  const InventoryOverviewModel({
    required this.items,
    required this.projects,
  });

  final List<InventoryItemModel> items;
  final List<InventoryProjectModel> projects;

  factory InventoryOverviewModel.fromJson(Map<String, dynamic> json) {
    return InventoryOverviewModel(
      items: ((json['items'] as List<dynamic>? ?? const [])
          .whereType<Map<String, dynamic>>()
          .map(InventoryItemModel.fromJson)
          .toList()),
      projects: ((json['projects'] as List<dynamic>? ?? const [])
          .whereType<Map<String, dynamic>>()
          .map(InventoryProjectModel.fromJson)
          .toList()),
    );
  }
}

class InventoryItemModel {
  const InventoryItemModel({
    required this.id,
    required this.projectId,
    required this.projectName,
    required this.name,
    required this.unit,
    required this.currentQuantity,
    required this.reorderLevel,
    this.location,
  });

  final String id;
  final String projectId;
  final String projectName;
  final String name;
  final String unit;
  final double currentQuantity;
  final double reorderLevel;
  final String? location;

  bool get isLowStock => currentQuantity <= reorderLevel;

  factory InventoryItemModel.fromJson(Map<String, dynamic> json) {
    return InventoryItemModel(
      id: (json['id'] ?? '').toString(),
      projectId: (json['projectId'] ?? '').toString(),
      projectName: (json['projectName'] ?? 'Unknown Project').toString(),
      name: (json['name'] ?? '').toString(),
      unit: (json['unit'] ?? '').toString(),
      currentQuantity:
          double.tryParse((json['currentQuantity'] ?? 0).toString()) ?? 0,
      reorderLevel:
          double.tryParse((json['reorderLevel'] ?? 0).toString()) ?? 0,
      location: json['location']?.toString(),
    );
  }
}

class InventoryProjectModel {
  const InventoryProjectModel({required this.id, required this.name});

  final String id;
  final String name;

  factory InventoryProjectModel.fromJson(Map<String, dynamic> json) {
    return InventoryProjectModel(
      id: (json['id'] ?? '').toString(),
      name: (json['name'] ?? '').toString(),
    );
  }
}
