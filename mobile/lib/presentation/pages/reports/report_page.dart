import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../../data/models/project_model.dart';
import '../../../data/models/report_model.dart';
import '../../../data/services/comment_service.dart';
import '../../../data/services/project_service.dart';
import '../../../data/services/report_service.dart';
import '../../widgets/empty_state.dart';
import '../../widgets/loading_indicator.dart';

class _ProjectReportBundle {
  const _ProjectReportBundle({
    required this.project,
    required this.summary,
    required this.updates,
  });

  final ProjectModel project;
  final ProjectSummaryModel summary;
  final List<Map<String, dynamic>> updates;
}

class ReportPage extends StatefulWidget {
  const ReportPage({super.key});

  @override
  State<ReportPage> createState() => _ReportPageState();
}

class _ReportPageState extends State<ReportPage> {
  late Future<List<ProjectModel>> _projectsFuture;
  Future<_ProjectReportBundle>? _reportFuture;
  String? _selectedProjectId;

  @override
  void initState() {
    super.initState();
    _projectsFuture = _loadProjects();
  }

  Future<List<ProjectModel>> _loadProjects() async {
    try {
      final projects = await ProjectService.instance.getProjects();
      if (projects.isNotEmpty && _selectedProjectId == null) {
        _selectedProjectId = projects.first.id;
        _reportFuture = _loadReport(projects.first);
      }
      return projects;
    } catch (_) {
      return [];
    }
  }

  Future<_ProjectReportBundle> _loadReport(ProjectModel project) async {
    final results = await Future.wait<dynamic>([
      ReportService.instance.getProjectSummary(project.id),
      CommentService.instance.getByEntity('project', project.id),
    ]);
    return _ProjectReportBundle(
      project: project,
      summary: results[0] as ProjectSummaryModel,
      updates: results[1] as List<Map<String, dynamic>>,
    );
  }

  @override
  Widget build(BuildContext context) {
    final currency = NumberFormat.currency(symbol: '\$');

    return FutureBuilder<List<ProjectModel>>(
      future: _projectsFuture,
      builder: (context, projectSnapshot) {
        if (projectSnapshot.connectionState == ConnectionState.waiting) {
          return const LoadingIndicator(message: 'Loading report...');
        }

        final projects = projectSnapshot.data ?? const <ProjectModel>[];
        if (projectSnapshot.hasError || projects.isEmpty) {
          return EmptyState(
            icon: Icons.bar_chart_outlined,
            title: 'Select a project to view its report.',
            onRetry: () => setState(() => _projectsFuture = _loadProjects()),
          );
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
                    .map(
                      (project) => DropdownMenuItem<String>(
                        value: project.id,
                        child: Text(project.name),
                      ),
                    )
                    .toList(),
                onChanged: (value) {
                  if (value == null) return;
                  final project = projects.where((item) => item.id == value).first;
                  setState(() {
                    _selectedProjectId = value;
                    _reportFuture = _loadReport(project);
                  });
                },
              ),
            ),
            Expanded(
              child: RefreshIndicator(
                onRefresh: () async {
                  if (_selectedProjectId == null) return;
                  final project =
                      projects.where((item) => item.id == _selectedProjectId).first;
                  setState(() {
                    _reportFuture = _loadReport(project);
                  });
                  await _reportFuture!;
                },
                child: FutureBuilder<_ProjectReportBundle>(
                  future: _reportFuture,
                  builder: (context, snapshot) {
                    if (snapshot.connectionState == ConnectionState.waiting) {
                      return const LoadingIndicator(message: 'Loading report...');
                    }

                    if (snapshot.hasError || !snapshot.hasData) {
                      return ListView(
                        physics: const AlwaysScrollableScrollPhysics(),
                        children: [
                          EmptyState(
                            icon: Icons.bar_chart_outlined,
                            title: 'Select a project to view its report.',
                            onRetry: () {
                              if (_selectedProjectId == null) return;
                              final project = projects
                                  .where((item) => item.id == _selectedProjectId)
                                  .first;
                              setState(() {
                                _reportFuture = _loadReport(project);
                              });
                            },
                          ),
                        ],
                      );
                    }

                    final bundle = snapshot.data!;
                    final summary = bundle.summary;
                    final project = bundle.project;
                    final recentUpdates = bundle.updates.reversed.take(5).toList();
                    return ListView(
                      padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                      children: [
                        _ReportCard(
                          title: 'Progress Updates',
                          children: [
                            _RowValue(
                              label: 'Total updates',
                              value: '${bundle.updates.length}',
                            ),
                            _RowValue(
                              label: 'Given cash',
                              value: currency.format(project.givenCash),
                            ),
                            _RowValue(
                              label: 'Remaining budget',
                              value: currency.format(
                                (project.budget - project.givenCash) < 0
                                    ? 0
                                    : (project.budget - project.givenCash),
                              ),
                            ),
                            if (recentUpdates.isNotEmpty) ...[
                              const SizedBox(height: 8),
                              ...recentUpdates.map(
                                (item) => _UpdatePreview(
                                  author:
                                      ((item['author'] as Map?)?['name'] ??
                                              'Unknown')
                                          .toString(),
                                  content:
                                      (item['content'] ?? '').toString(),
                                  createdAt:
                                      (item['createdAt'] ?? '').toString(),
                                ),
                              ),
                            ] else
                              const Text(
                                'No progress updates yet.',
                                style: TextStyle(color: Color(0xFF9CA3AF)),
                              ),
                          ],
                        ),
                        _ReportCard(
                          title: 'Tasks',
                          children: summary.tasks
                              .map(
                                (item) => _RowValue(
                                  label: item.status.replaceAll('_', ' '),
                                  value: '${item.count}',
                                ),
                              )
                              .toList(),
                        ),
                        _ReportCard(
                          title: 'Expenses',
                          children: summary.expenses
                              .map(
                                (item) => _RowValue(
                                  label: item.status.replaceAll('_', ' '),
                                  value: currency.format(item.total),
                                ),
                              )
                              .toList(),
                        ),
                        _ReportCard(
                          title: 'Issues',
                          children: summary.issues
                              .map(
                                (item) => _RowValue(
                                  label: item.status.replaceAll('_', ' '),
                                  value: '${item.count}',
                                ),
                              )
                              .toList(),
                        ),
                        _ReportCard(
                          title: 'Milestones',
                          children: summary.milestones
                              .map(
                                (item) => _RowValue(
                                  label: '${item.status.replaceAll('_', ' ')} (${item.count})',
                                  value: '${item.averageProgress.toStringAsFixed(0)}%',
                                ),
                              )
                              .toList(),
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
}

class _UpdatePreview extends StatelessWidget {
  const _UpdatePreview({
    required this.author,
    required this.content,
    required this.createdAt,
  });

  final String author;
  final String content;
  final String createdAt;

  @override
  Widget build(BuildContext context) {
    final parsed = DateTime.tryParse(createdAt);
    return Padding(
      padding: const EdgeInsets.only(top: 8),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: const Color(0xFFF9FAFB),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: const Color(0xFFE5E7EB)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(author, style: const TextStyle(fontWeight: FontWeight.w600)),
            if (parsed != null)
              Padding(
                padding: const EdgeInsets.only(top: 2),
                child: Text(
                  DateFormat.yMMMd().add_jm().format(parsed),
                  style: const TextStyle(
                    fontSize: 12,
                    color: Color(0xFF9CA3AF),
                  ),
                ),
              ),
            const SizedBox(height: 6),
            Text(content.isEmpty ? 'No details provided.' : content),
          ],
        ),
      ),
    );
  }
}

class _ReportCard extends StatelessWidget {
  const _ReportCard({required this.title, required this.children});

  final String title;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 12),
            ...children,
          ],
        ),
      ),
    );
  }
}

class _RowValue extends StatelessWidget {
  const _RowValue({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label),
          Text(value, style: const TextStyle(fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }
}
