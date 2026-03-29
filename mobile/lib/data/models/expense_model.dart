class ExpenseModel {
  const ExpenseModel({
    required this.id,
    required this.projectId,
    required this.category,
    required this.amount,
    required this.status,
    this.title,
    this.description,
    this.submittedByName,
    this.approvedByName,
    this.date,
    this.createdAt,
  });

  final String id;
  final String projectId;
  final String category;
  final double amount;
  final String status;
  final String? title;
  final String? description;
  final String? submittedByName;
  final String? approvedByName;
  final String? date;
  final String? createdAt;

  factory ExpenseModel.fromJson(Map<String, dynamic> json) {
    final submittedBy = json['submittedBy'] as Map<String, dynamic>?;
    final approvedBy = json['approvedBy'] as Map<String, dynamic>?;
    return ExpenseModel(
      id: (json['id'] ?? '').toString(),
      projectId: (json['projectId'] ?? '').toString(),
      title: json['title']?.toString(),
      category: (json['category'] ?? '').toString(),
      amount: double.tryParse((json['amount'] ?? 0).toString()) ?? 0,
      status: (json['status'] ?? 'pending').toString(),
      description: json['description']?.toString(),
      submittedByName: submittedBy?['name']?.toString(),
      approvedByName: approvedBy?['name']?.toString(),
      date: json['date']?.toString(),
      createdAt: json['createdAt']?.toString(),
    );
  }
}
