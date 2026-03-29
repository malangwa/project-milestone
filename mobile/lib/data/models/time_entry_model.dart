class TimeEntryModel {
  const TimeEntryModel({
    required this.id,
    required this.hours,
    this.date,
    this.description,
    this.userName,
    this.projectId,
  });

  final String id;
  final double hours;
  final String? date;
  final String? description;
  final String? userName;
  final String? projectId;

  factory TimeEntryModel.fromJson(Map<String, dynamic> json) {
    return TimeEntryModel(
      id: json['id'] as String,
      hours: (json['hours'] as num).toDouble(),
      date: json['date'] as String?,
      description: json['description'] as String?,
      userName: (json['user'] as Map<String, dynamic>?)?['name'] as String?,
      projectId: json['projectId'] as String?,
    );
  }
}
