import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../../app/routes.dart';
import '../../../config/app_theme.dart';
import '../../../data/models/project_model.dart';
import '../../../data/models/report_model.dart';
import '../../../data/services/project_service.dart';
import '../../../data/services/report_service.dart';
import '../../widgets/empty_state.dart';
import '../../widgets/loading_indicator.dart';

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

    try {
      projects = await ProjectService.instance.getProjects();
    } catch (_) {}

    try {
      overview = await ReportService.instance.getOverview();
    } catch (_) {}

    return DashboardBundle(
      projects: projects,
      overview: overview,
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
            return const LoadingIndicator(message: 'Loading dashboard...');
          }

          if (snapshot.hasError) {
            return ListView(
              physics: const AlwaysScrollableScrollPhysics(),
              children: [
                EmptyState(
                  icon: Icons.folder_open,
                  title: 'No projects yet.',
                  subtitle: 'Create your first project',
                  onRetry: () => setState(() => _future = _load()),
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
                    icon: Icons.folder_rounded,
                    gradient: const LinearGradient(
                      colors: [Color(0xFF6366F1), Color(0xFF4F46E5)],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                  ),
                  _MetricCard(
                    label: 'Active',
                    value: activeProjects.toString(),
                    icon: Icons.bolt_rounded,
                    gradient: const LinearGradient(
                      colors: [Color(0xFF10B981), Color(0xFF059669)],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                  ),
                  if (overview != null) ...[
                    _MetricCard(
                      label: 'Tasks Done',
                      value: '$doneTasks/$totalTasks',
                      icon: Icons.check_circle_rounded,
                      gradient: const LinearGradient(
                        colors: [Color(0xFF8B5CF6), Color(0xFF7C3AED)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                    ),
                    _MetricCard(
                      label: 'Open Issues',
                      value: openIssues.toString(),
                      icon: Icons.error_rounded,
                      gradient: const LinearGradient(
                        colors: [Color(0xFFF43F5E), Color(0xFFE11D48)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                    ),
                    _MetricCard(
                      label: 'Approved Spend',
                      value: currency.format(approvedExpenses),
                      icon: Icons.attach_money_rounded,
                      gradient: const LinearGradient(
                        colors: [Color(0xFFF59E0B), Color(0xFFD97706)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                    ),
                  ],
                ],
              ),
              const SizedBox(height: 24),
              const Text(
                'Recent Projects',
                style: TextStyle(
                  fontSize: 17,
                  fontWeight: FontWeight.w700,
                  color: AppTheme.textPrimary,
                ),
              ),
              const SizedBox(height: 12),
              if (data.projects.isEmpty)
                const EmptyState(
                  icon: Icons.folder_open,
                  title: 'No projects yet.',
                  subtitle: 'Create your first project',
                )
              else
                ...data.projects.take(5).map(
                      (project) => Padding(
                        padding: const EdgeInsets.only(bottom: 10),
                        child: Card(
                          child: InkWell(
                            borderRadius: BorderRadius.circular(20),
                            onTap: () => Navigator.of(context).pushNamed(
                              AppRoutes.projectDetail,
                              arguments: project.id,
                            ),
                            child: Padding(
                              padding: const EdgeInsets.all(14),
                              child: Row(
                                children: [
                                  Container(
                                    width: 44,
                                    height: 44,
                                    decoration: BoxDecoration(
                                      gradient: AppTheme.primaryGradient,
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                    child: Center(
                                      child: Text(
                                        project.name.isNotEmpty
                                            ? project.name.characters.first.toUpperCase()
                                            : '?',
                                        style: const TextStyle(
                                          color: Colors.white,
                                          fontWeight: FontWeight.bold,
                                          fontSize: 16,
                                        ),
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          project.name,
                                          style: const TextStyle(
                                            fontSize: 14,
                                            fontWeight: FontWeight.w600,
                                            color: AppTheme.textPrimary,
                                          ),
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                        const SizedBox(height: 2),
                                        Text(
                                          [
                                            project.industry,
                                            if ((project.location ?? '').isNotEmpty)
                                              project.location!,
                                          ].join(' • '),
                                          style: const TextStyle(
                                            fontSize: 12,
                                            color: AppTheme.textMuted,
                                          ),
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                      ],
                                    ),
                                  ),
                                  _StatusChip(status: project.status),
                                ],
                              ),
                            ),
                          ),
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
    required this.icon,
    required this.gradient,
  });

  final String label;
  final String value;
  final IconData icon;
  final Gradient gradient;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 168,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          gradient: gradient,
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.06),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.22),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(icon, color: Colors.white, size: 20),
            ),
            const SizedBox(height: 14),
            Text(
              label,
              style: TextStyle(
                color: Colors.white.withValues(alpha: 0.85),
                fontSize: 12,
                fontWeight: FontWeight.w500,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              value,
              style: const TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.w800,
                color: Colors.white,
                letterSpacing: -0.4,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _StatusChip extends StatelessWidget {
  const _StatusChip({required this.status});

  final String status;

  @override
  Widget build(BuildContext context) {
    final colors = switch (status) {
      'active' => (AppTheme.emerald50, AppTheme.emerald600),
      'completed' => (AppTheme.indigo50, AppTheme.primary),
      'on_hold' => (AppTheme.amber50, AppTheme.amber600),
      'cancelled' => (AppTheme.red50, AppTheme.red600),
      _ => (AppTheme.slate100, AppTheme.textSecondary),
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: colors.$1,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        status.replaceAll('_', ' '),
        style: TextStyle(
          color: colors.$2,
          fontSize: 11,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}
