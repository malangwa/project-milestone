class IssueModel {
  const IssueModel({
    required this.id,
    required this.projectId,
    required this.title,
    required this.status,
    required this.severity,
    this.description,
    this.reportedByName,
    this.assignedToName,
    this.createdAt,
  });

  final String id;
  final String projectId;
  final String title;
  final String status;
  final String severity;
  final String? description;
  final String? reportedByName;
  final String? assignedToName;
  final String? createdAt;

  factory IssueModel.fromJson(Map<String, dynamic> json) {
    final reportedBy = json['reportedBy'] as Map<String, dynamic>?;
    final assignedTo = json['assignedTo'] as Map<String, dynamic>?;
    return IssueModel(
      id: (json['id'] ?? '').toString(),
      projectId: (json['projectId'] ?? '').toString(),
      title: (json['title'] ?? '').toString(),
      status: (json['status'] ?? 'open').toString(),
      severity: (json['priority'] ?? json['severity'] ?? 'medium').toString(),
      description: json['description']?.toString(),
      reportedByName: reportedBy?['name']?.toString(),
      assignedToName: assignedTo?['name']?.toString(),
      createdAt: json['createdAt']?.toString(),
    );
  }
}
