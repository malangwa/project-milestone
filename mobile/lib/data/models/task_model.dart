class TaskModel {
  const TaskModel({
    required this.id,
    required this.projectId,
    required this.title,
    required this.status,
    required this.priority,
    this.description,
    this.dueDate,
    this.assigneeName,
  });

  final String id;
  final String projectId;
  final String title;
  final String status;
  final String priority;
  final String? description;
  final String? dueDate;
  final String? assigneeName;

  factory TaskModel.fromJson(Map<String, dynamic> json) {
    final assignedTo = json['assignedTo'] as Map<String, dynamic>?;
    return TaskModel(
      id: (json['id'] ?? '').toString(),
      projectId: (json['projectId'] ?? '').toString(),
      title: (json['title'] ?? '').toString(),
      status: (json['status'] ?? 'todo').toString(),
      priority: (json['priority'] ?? 'medium').toString(),
      description: json['description']?.toString(),
      dueDate: json['dueDate']?.toString(),
      assigneeName: assignedTo?['name']?.toString(),
    );
  }
}
