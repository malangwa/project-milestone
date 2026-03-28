import 'package:flutter/material.dart';

import '../../../data/models/issue_model.dart';
import '../../../data/models/project_model.dart';
import '../../../data/services/issue_service.dart';
import '../../../data/services/project_service.dart';

class IssueListPage extends StatefulWidget {
  const IssueListPage({super.key});

  @override
  State<IssueListPage> createState() => _IssueListPageState();
}

class _IssueListPageState extends State<IssueListPage> {
  late Future<List<ProjectModel>> _projectsFuture;
  Future<List<IssueModel>>? _issuesFuture;
  String? _selectedProjectId;

  @override
  void initState() {
    super.initState();
    _projectsFuture = _loadProjects();
  }

  Future<List<ProjectModel>> _loadProjects() async {
    final projects = await ProjectService.instance.getProjects();
    if (projects.isNotEmpty && _selectedProjectId == null) {
      _selectedProjectId = projects.first.id;
      _issuesFuture =
          IssueService.instance.getByProject(_selectedProjectId!);
    }
    return projects;
  }

  void _onProjectChanged(String? projectId) {
    if (projectId == null) return;
    setState(() {
      _selectedProjectId = projectId;
      _issuesFuture = IssueService.instance.getByProject(projectId);
    });
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<List<ProjectModel>>(
      future: _projectsFuture,
      builder: (context, projectSnapshot) {
        if (projectSnapshot.connectionState == ConnectionState.waiting) {
          return const Center(child: CircularProgressIndicator());
        }
        if (projectSnapshot.hasError) {
          return const Center(child: Text('Failed to load projects'));
        }

        final projects = projectSnapshot.data ?? const <ProjectModel>[];
        if (projects.isEmpty) {
          return const Center(child: Text('No projects available.'));
        }

        return Column(
          children: [
            Padding(
              padding: const EdgeInsets.all(16),
              child: DropdownButtonFormField<String>(
                initialValue: _selectedProjectId,
                decoration: const InputDecoration(
                  labelText: 'Project',
                  border: OutlineInputBorder(),
                ),
                items: projects
                    .map((p) =>
                        DropdownMenuItem(value: p.id, child: Text(p.name)))
                    .toList(),
                onChanged: _onProjectChanged,
              ),
            ),
            Expanded(
              child: RefreshIndicator(
                onRefresh: () async {
                  if (_selectedProjectId == null) return;
                  setState(() {
                    _issuesFuture = IssueService.instance
                        .getByProject(_selectedProjectId!);
                  });
                  await _issuesFuture;
                },
                child: FutureBuilder<List<IssueModel>>(
                  future: _issuesFuture,
                  builder: (context, snapshot) {
                    if (snapshot.connectionState == ConnectionState.waiting) {
                      return const Center(child: CircularProgressIndicator());
                    }
                    if (snapshot.hasError) {
                      return ListView(
                        children: const [
                          SizedBox(height: 160),
                          Center(child: Text('Failed to load issues')),
                        ],
                      );
                    }

                    final issues = snapshot.data ?? const <IssueModel>[];
                    if (issues.isEmpty) {
                      return ListView(
                        children: const [
                          SizedBox(height: 160),
                          Center(
                            child: Text('No issues reported for this project.'),
                          ),
                        ],
                      );
                    }

                    final openCount =
                        issues.where((i) => i.status == 'open').length;

                    return ListView(
                      padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                      children: [
                        Card(
                          child: Padding(
                            padding: const EdgeInsets.all(16),
                            child: Row(
                              children: [
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      const Text('Total Issues'),
                                      Text(
                                        '${issues.length}',
                                        style: Theme.of(context)
                                            .textTheme
                                            .headlineMedium,
                                      ),
                                    ],
                                  ),
                                ),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      const Text('Open'),
                                      Text(
                                        '$openCount',
                                        style: Theme.of(context)
                                            .textTheme
                                            .headlineMedium
                                            ?.copyWith(color: Colors.red),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(height: 8),
                        ...issues.map(
                          (issue) => Card(
                            child: ListTile(
                              contentPadding: const EdgeInsets.all(16),
                              leading: Icon(
                                Icons.bug_report,
                                color: _severityColor(issue.severity),
                              ),
                              title: Text(issue.title),
                              subtitle: Padding(
                                padding: const EdgeInsets.only(top: 6),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    if ((issue.description ?? '').isNotEmpty)
                                      Text(
                                        issue.description!,
                                        maxLines: 2,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    const SizedBox(height: 4),
                                    Text(
                                      [
                                        issue.severity,
                                        if ((issue.reportedByName ?? '')
                                            .isNotEmpty)
                                          'by ${issue.reportedByName}',
                                        if ((issue.assignedToName ?? '')
                                            .isNotEmpty)
                                          '→ ${issue.assignedToName}',
                                      ].join(' • '),
                                      style: const TextStyle(fontSize: 12),
                                    ),
                                  ],
                                ),
                              ),
                              trailing:
                                  _IssueStatusChip(status: issue.status),
                            ),
                          ),
                        ),
                      ],
                    );
                  },
                ),
              ),
            ),
          ],
        );
      },
    );
  }

  Color _severityColor(String severity) {
    return switch (severity) {
      'critical' => Colors.red.shade800,
      'high' => Colors.red,
      'medium' => Colors.orange,
      'low' => Colors.blue,
      _ => Colors.grey,
    };
  }
}

class _IssueStatusChip extends StatelessWidget {
  const _IssueStatusChip({required this.status});

  final String status;

  @override
  Widget build(BuildContext context) {
    final (color, label) = switch (status) {
      'open' => (Colors.red, 'Open'),
      'in_progress' => (Colors.blue, 'In Progress'),
      'resolved' => (Colors.green, 'Resolved'),
      'closed' => (Colors.grey, 'Closed'),
      _ => (Colors.orange, status),
    };

    return Chip(
      label: Text(label),
      side: BorderSide.none,
      backgroundColor: color.withValues(alpha: 0.14),
      labelStyle: TextStyle(color: color, fontSize: 12),
    );
  }
}
