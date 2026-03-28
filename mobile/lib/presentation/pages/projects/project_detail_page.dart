import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../../data/models/expense_model.dart';
import '../../../data/models/milestone_model.dart';
import '../../../data/models/project_model.dart';
import '../../../data/models/report_model.dart';
import '../../../data/models/task_model.dart';
import '../../../data/services/expense_service.dart';
import '../../../data/services/milestone_service.dart';
import '../../../data/services/project_service.dart';
import '../../../data/services/report_service.dart';
import '../../../data/services/task_service.dart';

class _Bundle {
  const _Bundle({
    required this.project,
    required this.members,
    required this.tasks,
    required this.summary,
    required this.expenses,
    required this.milestones,
  });

  final ProjectModel project;
  final List<ProjectMemberModel> members;
  final List<TaskModel> tasks;
  final ProjectSummaryModel summary;
  final List<ExpenseModel> expenses;
  final List<MilestoneModel> milestones;
}

class ProjectDetailPage extends StatefulWidget {
  const ProjectDetailPage({super.key, required this.projectId});

  final String projectId;

  @override
  State<ProjectDetailPage> createState() => _ProjectDetailPageState();
}

class _ProjectDetailPageState extends State<ProjectDetailPage> {
  late Future<_Bundle> _future;

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  Future<_Bundle> _load() async {
    final results = await Future.wait<dynamic>([
      ProjectService.instance.getProject(widget.projectId),
      ProjectService.instance.getMembers(widget.projectId),
      TaskService.instance.getTasksByProject(widget.projectId),
      ReportService.instance.getProjectSummary(widget.projectId),
      ExpenseService.instance.getByProject(widget.projectId),
      MilestoneService.instance.getByProject(widget.projectId),
    ]);

    return _Bundle(
      project: results[0] as ProjectModel,
      members: results[1] as List<ProjectMemberModel>,
      tasks: results[2] as List<TaskModel>,
      summary: results[3] as ProjectSummaryModel,
      expenses: results[4] as List<ExpenseModel>,
      milestones: results[5] as List<MilestoneModel>,
    );
  }

  @override
  Widget build(BuildContext context) {
    final currency = NumberFormat.currency(symbol: '\$');

    return Scaffold(
      appBar: AppBar(title: const Text('Project Detail')),
      body: RefreshIndicator(
        onRefresh: () async {
          setState(() => _future = _load());
          await _future;
        },
        child: FutureBuilder<_Bundle>(
          future: _future,
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return const Center(child: CircularProgressIndicator());
            }

            if (snapshot.hasError) {
              return ListView(
                padding: const EdgeInsets.all(24),
                children: const [
                  SizedBox(height: 120),
                  Text('Failed to load project detail',
                      textAlign: TextAlign.center),
                ],
              );
            }

            final data = snapshot.data!;
            final completedTasks =
                data.tasks.where((t) => t.status == 'done').length;
            final totalExpenses =
                data.expenses.fold<double>(0, (s, e) => s + e.amount);
            final completedMilestones =
                data.milestones.where((m) => m.status == 'completed').length;

            return ListView(
              padding: const EdgeInsets.all(16),
              children: [
                // Project header
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          data.project.name,
                          style: Theme.of(context).textTheme.headlineSmall,
                        ),
                        const SizedBox(height: 8),
                        Text(
                          [
                            data.project.industry,
                            data.project.status.replaceAll('_', ' '),
                            if ((data.project.location ?? '').isNotEmpty)
                              data.project.location!,
                          ].join(' • '),
                        ),
                        if ((data.project.description ?? '').isNotEmpty) ...[
                          const SizedBox(height: 12),
                          Text(data.project.description!),
                        ],
                        const SizedBox(height: 16),
                        Wrap(
                          spacing: 12,
                          runSpacing: 12,
                          children: [
                            _InfoChip(
                              label: 'Budget',
                              value: currency.format(data.project.budget),
                            ),
                            _InfoChip(
                              label: 'Tasks',
                              value: '$completedTasks/${data.tasks.length}',
                            ),
                            _InfoChip(
                              label: 'Milestones',
                              value:
                                  '$completedMilestones/${data.milestones.length}',
                            ),
                            _InfoChip(
                              label: 'Members',
                              value: '${data.members.length}',
                            ),
                            _InfoChip(
                              label: 'Expenses',
                              value: currency.format(totalExpenses),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),

                const SizedBox(height: 16),

                // Milestones
                if (data.milestones.isNotEmpty) ...[
                  _SectionCard(
                    title: 'Milestones',
                    children: data.milestones.map(
                      (m) => ListTile(
                        contentPadding: EdgeInsets.zero,
                        leading: Icon(
                          m.status == 'completed'
                              ? Icons.check_circle
                              : Icons.flag_outlined,
                          color: m.status == 'completed'
                              ? Colors.green
                              : Colors.orange,
                          size: 20,
                        ),
                        title: Text(m.title),
                        trailing: Text(
                          m.status.replaceAll('_', ' '),
                          style: const TextStyle(fontSize: 12),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                ],

                // Task summary
                _SectionCard(
                  title: 'Task Summary',
                  children: data.summary.tasks.map(
                    (item) => ListTile(
                      dense: true,
                      contentPadding: EdgeInsets.zero,
                      title: Text(item.status.replaceAll('_', ' ')),
                      trailing: Text('${item.count}'),
                    ),
                  ),
                ),
                const SizedBox(height: 16),

                // Expenses summary
                if (data.expenses.isNotEmpty) ...[
                  _SectionCard(
                    title: 'Recent Expenses',
                    children: data.expenses.take(5).map(
                          (e) => ListTile(
                            contentPadding: EdgeInsets.zero,
                            title: Text(e.category),
                            subtitle: Text(e.description ?? ''),
                            trailing: Text(currency.format(e.amount)),
                          ),
                        ),
                  ),
                  const SizedBox(height: 16),
                ],

                // Team members
                _SectionCard(
                  title: 'Team Members',
                  children: data.members.isEmpty
                      ? [const Text('No members added yet.')]
                      : data.members.map(
                          (member) => ListTile(
                            contentPadding: EdgeInsets.zero,
                            leading: CircleAvatar(
                              radius: 16,
                              child: Text(
                                (member.name?.isNotEmpty ?? false)
                                    ? member.name!.characters.first
                                        .toUpperCase()
                                    : 'U',
                                style: const TextStyle(fontSize: 12),
                              ),
                            ),
                            title: Text(
                                member.name ?? member.email ?? 'User'),
                            subtitle:
                                Text(member.email ?? member.role),
                            trailing: Chip(
                              label: Text(member.role),
                              visualDensity: VisualDensity.compact,
                            ),
                          ),
                        ),
                ),
                const SizedBox(height: 16),

                // Recent tasks
                _SectionCard(
                  title: 'Recent Tasks',
                  children: data.tasks.isEmpty
                      ? [const Text('No tasks yet.')]
                      : data.tasks.take(8).map(
                            (task) => ListTile(
                              contentPadding: EdgeInsets.zero,
                              title: Text(task.title),
                              subtitle: Text(
                                [
                                  task.priority,
                                  task.status.replaceAll('_', ' '),
                                  if ((task.assigneeName ?? '').isNotEmpty)
                                    task.assigneeName!,
                                ].join(' • '),
                              ),
                            ),
                          ),
                ),
              ],
            );
          },
        ),
      ),
    );
  }
}

class _InfoChip extends StatelessWidget {
  const _InfoChip({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: const Color(0xFFF3F4F6),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label,
              style:
                  const TextStyle(fontSize: 12, color: Color(0xFF6B7280))),
          const SizedBox(height: 4),
          Text(value,
              style: const TextStyle(fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }
}

class _SectionCard extends StatelessWidget {
  const _SectionCard({required this.title, required this.children});

  final String title;
  final Iterable<Widget> children;

  @override
  Widget build(BuildContext context) {
    return Card(
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
