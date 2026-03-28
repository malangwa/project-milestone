class ActivityModel {
  const ActivityModel({
    required this.id,
    required this.action,
    required this.entityType,
    required this.entityId,
    this.userName,
    this.details,
    this.createdAt,
  });

  final String id;
  final String action;
  final String entityType;
  final String entityId;
  final String? userName;
  final String? details;
  final String? createdAt;

  factory ActivityModel.fromJson(Map<String, dynamic> json) {
    final user = json['user'] as Map<String, dynamic>?;
    return ActivityModel(
      id: (json['id'] ?? '').toString(),
      action: (json['action'] ?? '').toString(),
      entityType: (json['entityType'] ?? '').toString(),
      entityId: (json['entityId'] ?? '').toString(),
      userName: user?['name']?.toString() ?? json['userName']?.toString(),
      details: json['details']?.toString() ?? json['description']?.toString(),
      createdAt: json['createdAt']?.toString(),
    );
  }
}
