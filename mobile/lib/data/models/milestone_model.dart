class MilestoneModel {
  const MilestoneModel({
    required this.id,
    required this.projectId,
    required this.title,
    required this.status,
    this.description,
    this.dueDate,
    this.completedDate,
    this.createdAt,
  });

  final String id;
  final String projectId;
  final String title;
  final String status;
  final String? description;
  final String? dueDate;
  final String? completedDate;
  final String? createdAt;

  factory MilestoneModel.fromJson(Map<String, dynamic> json) {
    return MilestoneModel(
      id: (json['id'] ?? '').toString(),
      projectId: (json['projectId'] ?? '').toString(),
      title: (json['name'] ?? json['title'] ?? '').toString(),
      status: (json['status'] ?? 'pending').toString(),
      description: json['description']?.toString(),
      dueDate: json['dueDate']?.toString(),
      completedDate: json['completedDate']?.toString(),
      createdAt: json['createdAt']?.toString(),
    );
  }
}
