class NotificationModel {
  const NotificationModel({
    required this.id,
    required this.message,
    required this.isRead,
    this.type,
    this.entityType,
    this.entityId,
    this.createdAt,
  });

  final String id;
  final String message;
  final bool isRead;
  final String? type;
  final String? entityType;
  final String? entityId;
  final String? createdAt;

  factory NotificationModel.fromJson(Map<String, dynamic> json) {
    return NotificationModel(
      id: (json['id'] ?? '').toString(),
      message: (json['message'] ?? '').toString(),
      isRead: json['isRead'] as bool? ?? false,
      type: json['type']?.toString(),
      entityType: json['entityType']?.toString(),
      entityId: json['entityId']?.toString(),
      createdAt: json['createdAt']?.toString(),
    );
  }
}
