import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../../data/models/project_model.dart';
import '../../../data/models/report_model.dart';
import '../../../data/services/project_service.dart';
import '../../../data/services/report_service.dart';

class ReportPage extends StatefulWidget {
  const ReportPage({super.key});

  @override
  State<ReportPage> createState() => _ReportPageState();
}

class _ReportPageState extends State<ReportPage> {
  late Future<List<ProjectModel>> _projectsFuture;
  Future<ProjectSummaryModel>? _summaryFuture;
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
      _summaryFuture =
          ReportService.instance.getProjectSummary(_selectedProjectId!);
    }
    return projects;
  }

  @override
  Widget build(BuildContext context) {
    final currency = NumberFormat.currency(symbol: '\$');

    return FutureBuilder<List<ProjectModel>>(
      future: _projectsFuture,
      builder: (context, projectSnapshot) {
        if (projectSnapshot.connectionState == ConnectionState.waiting) {
          return const Center(child: CircularProgressIndicator());
        }

        final projects = projectSnapshot.data ?? const <ProjectModel>[];
        if (projects.isEmpty) {
          return const Center(child: Text('No projects available for reporting.'));
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
                  setState(() {
                    _selectedProjectId = value;
                    _summaryFuture =
                        ReportService.instance.getProjectSummary(value);
                  });
                },
              ),
            ),
            Expanded(
              child: RefreshIndicator(
                onRefresh: () async {
                  if (_selectedProjectId == null) return;
                  setState(() {
                    _summaryFuture = ReportService.instance
                        .getProjectSummary(_selectedProjectId!);
                  });
                  await _summaryFuture!;
                },
                child: FutureBuilder<ProjectSummaryModel>(
                  future: _summaryFuture,
                  builder: (context, snapshot) {
                    if (snapshot.connectionState == ConnectionState.waiting) {
                      return const Center(child: CircularProgressIndicator());
                    }

                    if (snapshot.hasError || !snapshot.hasData) {
                      return ListView(
                        children: const [
                          SizedBox(height: 160),
                          Center(child: Text('Failed to load project report')),
                        ],
                      );
                    }

                    final summary = snapshot.data!;
                    return ListView(
                      padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                      children: [
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
