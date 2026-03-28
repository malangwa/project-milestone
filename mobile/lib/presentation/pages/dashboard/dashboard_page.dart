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
    required this.overview,
  });

  final List<ProjectModel> projects;
  final OverviewSummaryModel overview;
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
    final results = await Future.wait<dynamic>([
      ProjectService.instance.getProjects(),
      ReportService.instance.getOverview(),
    ]);

    return DashboardBundle(
      projects: results[0] as List<ProjectModel>,
      overview: results[1] as OverviewSummaryModel,
    );
  }

  @override
  Widget build(BuildContext context) {
    final currency = NumberFormat.currency(symbol: '\$');

    return RefreshIndicator(
      onRefresh: () async {
        setState(() => _future = _load());
        await _future;
      },
      child: FutureBuilder<DashboardBundle>(
        future: _future,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }

          if (snapshot.hasError) {
            return ListView(
              padding: const EdgeInsets.all(24),
              children: [
                const SizedBox(height: 120),
                Text(
                  'Failed to load dashboard',
                  textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.titleMedium,
                ),
              ],
            );
          }

          final data = snapshot.data!;
          final activeProjects =
              data.projects.where((project) => project.status == 'active').length;
          final totalTasks =
              data.overview.taskGroups.fold<int>(0, (sum, item) => sum + item.count);
          final doneTasks = data.overview.taskGroups
              .where((item) => item.status == 'done')
              .fold<int>(0, (sum, item) => sum + item.count);
          final openIssues = data.overview.issueGroups
              .where((item) => item.status == 'open')
              .fold<int>(0, (sum, item) => sum + item.count);

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
                    value: currency.format(data.overview.approvedExpenses),
                    color: Colors.indigo,
                  ),
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
