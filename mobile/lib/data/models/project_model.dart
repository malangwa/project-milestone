class ProjectModel {
  const ProjectModel({
    required this.id,
    required this.name,
    required this.status,
    required this.industry,
    required this.budget,
    required this.givenCash,
    this.description,
    this.location,
    this.startDate,
    this.endDate,
  });

  final String id;
  final String name;
  final String? description;
  final String? location;
  final String status;
  final String industry;
  final double budget;
  final double givenCash;
  final String? startDate;
  final String? endDate;

  factory ProjectModel.fromJson(Map<String, dynamic> json) {
    return ProjectModel(
      id: (json['id'] ?? '').toString(),
      name: (json['name'] ?? '').toString(),
      description: json['description']?.toString(),
      location: json['location']?.toString(),
      status: (json['status'] ?? 'planning').toString(),
      industry: (json['industry'] ?? 'other').toString(),
      budget: double.tryParse((json['budget'] ?? 0).toString()) ?? 0,
      givenCash: double.tryParse((json['givenCash'] ?? 0).toString()) ?? 0,
      startDate: json['startDate']?.toString(),
      endDate: json['endDate']?.toString(),
    );
  }
}

class ProjectMemberModel {
  const ProjectMemberModel({
    required this.id,
    required this.projectId,
    required this.userId,
    required this.role,
    this.name,
    this.email,
  });

  final String id;
  final String projectId;
  final String userId;
  final String role;
  final String? name;
  final String? email;

  factory ProjectMemberModel.fromJson(Map<String, dynamic> json) {
    final user = json['user'] as Map<String, dynamic>?;
    return ProjectMemberModel(
      id: (json['id'] ?? '').toString(),
      projectId: (json['projectId'] ?? '').toString(),
      userId: (json['userId'] ?? '').toString(),
      role: (json['role'] ?? 'viewer').toString(),
      name: user?['name']?.toString(),
      email: user?['email']?.toString(),
    );
  }
}
