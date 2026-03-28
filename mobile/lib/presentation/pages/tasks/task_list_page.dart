import 'package:flutter/material.dart';

import '../../../data/models/project_model.dart';
import '../../../data/models/task_model.dart';
import '../../../data/services/project_service.dart';
import '../../../data/services/task_service.dart';

class TaskListPage extends StatefulWidget {
  const TaskListPage({super.key});

  @override
  State<TaskListPage> createState() => _TaskListPageState();
}

class _TaskListPageState extends State<TaskListPage> {
  late Future<List<ProjectModel>> _projectsFuture;
  Future<List<TaskModel>>? _tasksFuture;
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
      _tasksFuture = TaskService.instance.getTasksByProject(_selectedProjectId!);
    }
    return projects;
  }

  void _onProjectChanged(String? projectId) {
    if (projectId == null) return;
    setState(() {
      _selectedProjectId = projectId;
      _tasksFuture = TaskService.instance.getTasksByProject(projectId);
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
          return const Center(child: Text('Failed to load task filters'));
        }

        final projects = projectSnapshot.data ?? const <ProjectModel>[];
        if (projects.isEmpty) {
          return const Center(child: Text('Create a project before tracking tasks.'));
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
                onChanged: _onProjectChanged,
              ),
            ),
            Expanded(
              child: RefreshIndicator(
                onRefresh: () async {
                  if (_selectedProjectId == null) return;
                  setState(() {
                    _tasksFuture =
                        TaskService.instance.getTasksByProject(_selectedProjectId!);
                  });
                  await _tasksFuture!;
                },
                child: FutureBuilder<List<TaskModel>>(
                  future: _tasksFuture,
                  builder: (context, snapshot) {
                    if (snapshot.connectionState == ConnectionState.waiting) {
                      return const Center(child: CircularProgressIndicator());
                    }

                    if (snapshot.hasError) {
                      return ListView(
                        children: const [
                          SizedBox(height: 160),
                          Center(child: Text('Failed to load tasks')),
                        ],
                      );
                    }

                    final tasks = snapshot.data ?? const <TaskModel>[];
                    if (tasks.isEmpty) {
                      return ListView(
                        children: const [
                          SizedBox(height: 160),
                          Center(child: Text('No tasks in this project yet.')),
                        ],
                      );
                    }

                    return ListView.separated(
                      padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                      itemCount: tasks.length,
                      separatorBuilder: (_, _) => const SizedBox(height: 8),
                      itemBuilder: (context, index) {
                        final task = tasks[index];
                        return Card(
                          child: ListTile(
                            contentPadding: const EdgeInsets.all(16),
                            title: Text(task.title),
                            subtitle: Padding(
                              padding: const EdgeInsets.only(top: 6),
                              child: Text(
                                [
                                  task.status.replaceAll('_', ' '),
                                  task.priority,
                                  if ((task.assigneeName ?? '').isNotEmpty)
                                    task.assigneeName!,
                                ].join(' • '),
                              ),
                            ),
                            trailing: _StatusBadge(status: task.status),
                          ),
                        );
                      },
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

class _StatusBadge extends StatelessWidget {
  const _StatusBadge({required this.status});

  final String status;

  @override
  Widget build(BuildContext context) {
    final color = switch (status) {
      'done' => Colors.green,
      'blocked' => Colors.red,
      'in_progress' => Colors.blue,
      'review' => Colors.deepPurple,
      _ => Colors.grey,
    };

    return Chip(
      label: Text(status.replaceAll('_', ' ')),
      side: BorderSide.none,
      backgroundColor: color.withValues(alpha: 0.14),
      labelStyle: TextStyle(color: color),
    );
  }
}
