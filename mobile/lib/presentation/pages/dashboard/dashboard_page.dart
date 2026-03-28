import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../../app/routes.dart';
import '../../../data/models/project_model.dart';
import '../../../data/models/report_model.dart';
import '../../../data/services/project_service.dart';
import '../../../data/services/report_service.dart';

class DashboardBundle {
  const DashboardBundle({
    required this.projects,
    this.overview,
    this.error,
  });

  final List<ProjectModel> projects;
  final OverviewSummaryModel? overview;
  final String? error;
}

class DashboardPage extends StatefulWidget {
  const DashboardPage({super.key});

  @override
  State<DashboardPage> createState() => _DashboardPageState();
}

class _DashboardPageState extends State<DashboardPage> {
  late Future<DashboardBundle> _future;

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  Future<DashboardBundle> _load() async {
    List<ProjectModel> projects = [];
    OverviewSummaryModel? overview;
    String? error;

    try {
      projects = await ProjectService.instance.getProjects();
    } catch (e) {
      error = 'Could not load projects: $e';
    }

    try {
      overview = await ReportService.instance.getOverview();
    } catch (_) {
      // Overview is optional - dashboard still works without it
    }

    if (projects.isEmpty && overview == null && error != null) {
      throw Exception(error);
    }

    return DashboardBundle(
      projects: projects,
      overview: overview,
      error: error,
    );
  }

  @override
  Widget build(BuildContext context) {
    final currency = NumberFormat.currency(symbol: '\$');

    return RefreshIndicator(
      onRefresh: () async {
        setState(() => _future = _load());
        await _future.catchError((_) => DashboardBundle(projects: []));
      },
      child: FutureBuilder<DashboardBundle>(
        future: _future,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  CircularProgressIndicator(),
                  SizedBox(height: 16),
                  Text('Loading dashboard...'),
                  SizedBox(height: 8),
                  Text(
                    'First load may take up to 30s\n(server waking up)',
                    textAlign: TextAlign.center,
                    style: TextStyle(fontSize: 12, color: Color(0xFF9CA3AF)),
                  ),
                ],
              ),
            );
          }

          if (snapshot.hasError) {
            return ListView(
              padding: const EdgeInsets.all(24),
              children: [
                const SizedBox(height: 100),
                const Icon(Icons.cloud_off, size: 48, color: Color(0xFF9CA3AF)),
                const SizedBox(height: 16),
                Text(
                  'Failed to load dashboard',
                  textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                const SizedBox(height: 8),
                Text(
                  '${snapshot.error}',
                  textAlign: TextAlign.center,
                  style: const TextStyle(fontSize: 12, color: Color(0xFF9CA3AF)),
                ),
                const SizedBox(height: 24),
                Center(
                  child: FilledButton.icon(
                    onPressed: () => setState(() => _future = _load()),
                    icon: const Icon(Icons.refresh),
                    label: const Text('Retry'),
                  ),
                ),
              ],
            );
          }

          final data = snapshot.data!;
          final overview = data.overview;
          final activeProjects =
              data.projects.where((p) => p.status == 'active').length;

          int totalTasks = 0;
          int doneTasks = 0;
          int openIssues = 0;
          double approvedExpenses = 0;

          if (overview != null) {
            totalTasks =
                overview.taskGroups.fold<int>(0, (s, i) => s + i.count);
            doneTasks = overview.taskGroups
                .where((i) => i.status == 'done')
                .fold<int>(0, (s, i) => s + i.count);
            openIssues = overview.issueGroups
                .where((i) => i.status == 'open')
                .fold<int>(0, (s, i) => s + i.count);
            approvedExpenses = overview.approvedExpenses;
          }

          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Wrap(
                spacing: 12,
                runSpacing: 12,
                children: [
                  _MetricCard(
                    label: 'Projects',
                    value: data.projects.length.toString(),
                    color: Colors.blue,
                  ),
                  _MetricCard(
                    label: 'Active',
                    value: activeProjects.toString(),
                    color: Colors.green,
                  ),
                  if (overview != null) ...[
                    _MetricCard(
                      label: 'Tasks Done',
                      value: '$doneTasks/$totalTasks',
                      color: Colors.deepPurple,
                    ),
                    _MetricCard(
                      label: 'Open Issues',
                      value: openIssues.toString(),
                      color: Colors.red,
                    ),
                    _MetricCard(
                      label: 'Approved Spend',
                      value: currency.format(approvedExpenses),
                      color: Colors.indigo,
                    ),
                  ],
                ],
              ),
              const SizedBox(height: 20),
              Text(
                'Recent Projects',
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: 12),
              if (data.projects.isEmpty)
                const Card(
                  child: Padding(
                    padding: EdgeInsets.all(24),
                    child: Text('No projects available yet.'),
                  ),
                )
              else
                ...data.projects.take(5).map(
                      (project) => Card(
                        child: ListTile(
                          title: Text(project.name),
                          subtitle: Text(
                            [
                              project.industry,
                              if ((project.location ?? '').isNotEmpty)
                                project.location!,
                            ].join(' • '),
                          ),
                          trailing: Chip(
                            label: Text(project.status.replaceAll('_', ' ')),
                          ),
                          onTap: () {
                            Navigator.of(context).pushNamed(
                              AppRoutes.projectDetail,
                              arguments: project.id,
                            );
                          },
                        ),
                      ),
                    ),
            ],
          );
        },
      ),
    );
  }
}

class _MetricCard extends StatelessWidget {
  const _MetricCard({
    required this.label,
    required this.value,
    required this.color,
  });

  final String label;
  final String value;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 160,
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label, style: const TextStyle(color: Color(0xFF6B7280))),
              const SizedBox(height: 8),
              Text(
                value,
                style: TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.bold,
                  color: color,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
