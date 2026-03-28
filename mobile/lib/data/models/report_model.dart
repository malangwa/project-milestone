class OverviewSummaryModel {
  const OverviewSummaryModel({
    required this.projectCount,
    required this.taskGroups,
    required this.approvedExpenses,
    required this.issueGroups,
  });

  final int projectCount;
  final List<StatusCount> taskGroups;
  final double approvedExpenses;
  final List<StatusCount> issueGroups;

  factory OverviewSummaryModel.fromJson(Map<String, dynamic> json) {
    return OverviewSummaryModel(
      projectCount: int.tryParse((json['projects'] ?? 0).toString()) ?? 0,
      taskGroups: ((json['tasks'] as List<dynamic>? ?? const [])
          .whereType<Map<String, dynamic>>()
          .map(StatusCount.fromJson)
          .toList()),
      approvedExpenses:
          double.tryParse((json['approvedExpenses'] ?? 0).toString()) ?? 0,
      issueGroups: ((json['issues'] as List<dynamic>? ?? const [])
          .whereType<Map<String, dynamic>>()
          .map(StatusCount.fromJson)
          .toList()),
    );
  }
}

class ProjectSummaryModel {
  const ProjectSummaryModel({
    required this.projectId,
    required this.tasks,
    required this.expenses,
    required this.issues,
    required this.milestones,
  });

  final String projectId;
  final List<StatusCount> tasks;
  final List<StatusTotal> expenses;
  final List<StatusCount> issues;
  final List<MilestoneSummary> milestones;

  factory ProjectSummaryModel.fromJson(Map<String, dynamic> json) {
    return ProjectSummaryModel(
      projectId: (json['projectId'] ?? '').toString(),
      tasks: ((json['tasks'] as List<dynamic>? ?? const [])
          .whereType<Map<String, dynamic>>()
          .map(StatusCount.fromJson)
          .toList()),
      expenses: ((json['expenses'] as List<dynamic>? ?? const [])
          .whereType<Map<String, dynamic>>()
          .map(StatusTotal.fromJson)
          .toList()),
      issues: ((json['issues'] as List<dynamic>? ?? const [])
          .whereType<Map<String, dynamic>>()
          .map(StatusCount.fromJson)
          .toList()),
      milestones: ((json['milestones'] as List<dynamic>? ?? const [])
          .whereType<Map<String, dynamic>>()
          .map(MilestoneSummary.fromJson)
          .toList()),
    );
  }
}

class StatusCount {
  const StatusCount({required this.status, required this.count});

  final String status;
  final int count;

  factory StatusCount.fromJson(Map<String, dynamic> json) {
    return StatusCount(
      status: (json['status'] ?? '').toString(),
      count: int.tryParse((json['count'] ?? 0).toString()) ?? 0,
    );
  }
}

class StatusTotal {
  const StatusTotal({required this.status, required this.total});

  final String status;
  final double total;

  factory StatusTotal.fromJson(Map<String, dynamic> json) {
    return StatusTotal(
      status: (json['status'] ?? '').toString(),
      total: double.tryParse((json['total'] ?? 0).toString()) ?? 0,
    );
  }
}

class MilestoneSummary {
  const MilestoneSummary({
    required this.status,
    required this.count,
    required this.averageProgress,
  });

  final String status;
  final int count;
  final double averageProgress;

  factory MilestoneSummary.fromJson(Map<String, dynamic> json) {
    return MilestoneSummary(
      status: (json['status'] ?? '').toString(),
      count: int.tryParse((json['count'] ?? 0).toString()) ?? 0,
      averageProgress:
          double.tryParse((json['avg_progress'] ?? 0).toString()) ?? 0,
    );
  }
}
