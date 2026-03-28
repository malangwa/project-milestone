import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../../data/models/milestone_model.dart';
import '../../../data/models/project_model.dart';
import '../../../data/services/milestone_service.dart';
import '../../../data/services/project_service.dart';

class MilestoneListPage extends StatefulWidget {
  const MilestoneListPage({super.key});

  @override
  State<MilestoneListPage> createState() => _MilestoneListPageState();
}

class _MilestoneListPageState extends State<MilestoneListPage> {
  late Future<List<ProjectModel>> _projectsFuture;
  Future<List<MilestoneModel>>? _milestonesFuture;
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
      _milestonesFuture =
          MilestoneService.instance.getByProject(_selectedProjectId!);
    }
    return projects;
  }

  void _onProjectChanged(String? projectId) {
    if (projectId == null) return;
    setState(() {
      _selectedProjectId = projectId;
      _milestonesFuture = MilestoneService.instance.getByProject(projectId);
    });
  }

  @override
  Widget build(BuildContext context) {
    final dateFormat = DateFormat('MMM d, y');

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
                    _milestonesFuture = MilestoneService.instance
                        .getByProject(_selectedProjectId!);
                  });
                  await _milestonesFuture;
                },
                child: FutureBuilder<List<MilestoneModel>>(
                  future: _milestonesFuture,
                  builder: (context, snapshot) {
                    if (snapshot.connectionState == ConnectionState.waiting) {
                      return const Center(child: CircularProgressIndicator());
                    }
                    if (snapshot.hasError) {
                      return ListView(
                        children: const [
                          SizedBox(height: 160),
                          Center(child: Text('Failed to load milestones')),
                        ],
                      );
                    }

                    final milestones =
                        snapshot.data ?? const <MilestoneModel>[];
                    if (milestones.isEmpty) {
                      return ListView(
                        children: const [
                          SizedBox(height: 160),
                          Center(
                            child: Text('No milestones for this project.'),
                          ),
                        ],
                      );
                    }

                    final completed = milestones
                        .where((m) => m.status == 'completed')
                        .length;
                    final progress = milestones.isEmpty
                        ? 0.0
                        : completed / milestones.length;

                    return ListView(
                      padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                      children: [
                        Card(
                          child: Padding(
                            padding: const EdgeInsets.all(16),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  '$completed of ${milestones.length} completed',
                                  style:
                                      Theme.of(context).textTheme.titleMedium,
                                ),
                                const SizedBox(height: 12),
                                ClipRRect(
                                  borderRadius: BorderRadius.circular(8),
                                  child: LinearProgressIndicator(
                                    value: progress,
                                    minHeight: 10,
                                    backgroundColor:
                                        Colors.grey.withValues(alpha: 0.2),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(height: 8),
                        ...milestones.map(
                          (milestone) {
                            String? dueDateStr;
                            if (milestone.dueDate != null) {
                              final parsed =
                                  DateTime.tryParse(milestone.dueDate!);
                              if (parsed != null) {
                                dueDateStr = dateFormat.format(parsed);
                              }
                            }

                            return Card(
                              child: ListTile(
                                contentPadding: const EdgeInsets.all(16),
                                leading: Icon(
                                  milestone.status == 'completed'
                                      ? Icons.check_circle
                                      : Icons.flag_outlined,
                                  color: milestone.status == 'completed'
                                      ? Colors.green
                                      : Colors.orange,
                                ),
                                title: Text(milestone.title),
                                subtitle: Padding(
                                  padding: const EdgeInsets.only(top: 6),
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      if ((milestone.description ?? '')
                                          .isNotEmpty)
                                        Text(milestone.description!),
                                      if (dueDateStr != null)
                                        Padding(
                                          padding:
                                              const EdgeInsets.only(top: 4),
                                          child:
                                              Text('Due: $dueDateStr'),
                                        ),
                                    ],
                                  ),
                                ),
                                trailing: _MilestoneStatusChip(
                                  status: milestone.status,
                                ),
                              ),
                            );
                          },
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

class _MilestoneStatusChip extends StatelessWidget {
  const _MilestoneStatusChip({required this.status});

  final String status;

  @override
  Widget build(BuildContext context) {
    final (color, label) = switch (status) {
      'completed' => (Colors.green, 'Done'),
      'in_progress' => (Colors.blue, 'Active'),
      'overdue' => (Colors.red, 'Overdue'),
      _ => (Colors.orange, 'Pending'),
    };

    return Chip(
      label: Text(label),
      side: BorderSide.none,
      backgroundColor: color.withValues(alpha: 0.14),
      labelStyle: TextStyle(color: color, fontSize: 12),
    );
  }
}
