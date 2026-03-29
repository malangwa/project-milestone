class AuditLogModel {
  const AuditLogModel({
    required this.id,
    required this.action,
    required this.entityType,
    this.entityId,
    this.userName,
    this.userEmail,
    this.before,
    this.after,
    this.createdAt,
  });

  final String id;
  final String action;
  final String entityType;
  final String? entityId;
  final String? userName;
  final String? userEmail;
  final Map<String, dynamic>? before;
  final Map<String, dynamic>? after;
  final String? createdAt;

  factory AuditLogModel.fromJson(Map<String, dynamic> json) {
    final user = json['user'] as Map<String, dynamic>?;
    return AuditLogModel(
      id: json['id'] as String,
      action: json['action'] as String? ?? '',
      entityType: json['entityType'] as String? ?? '',
      entityId: json['entityId'] as String?,
      userName: user?['name'] as String?,
      userEmail: user?['email'] as String?,
      before: json['before'] as Map<String, dynamic>?,
      after: json['after'] as Map<String, dynamic>?,
      createdAt: json['createdAt'] as String?,
    );
  }
}
