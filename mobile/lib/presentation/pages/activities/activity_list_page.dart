import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../../data/models/activity_model.dart';
import '../../../data/models/project_model.dart';
import '../../../data/services/activity_service.dart';
import '../../../data/services/project_service.dart';

class ActivityListPage extends StatefulWidget {
  const ActivityListPage({super.key});

  @override
  State<ActivityListPage> createState() => _ActivityListPageState();
}

class _ActivityListPageState extends State<ActivityListPage> {
  late Future<List<ProjectModel>> _projectsFuture;
  Future<List<ActivityModel>>? _activitiesFuture;
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
      _activitiesFuture =
          ActivityService.instance.getByProject(_selectedProjectId!);
    }
    return projects;
  }

  void _onProjectChanged(String? projectId) {
    if (projectId == null) return;
    setState(() {
      _selectedProjectId = projectId;
      _activitiesFuture = ActivityService.instance.getByProject(projectId);
    });
  }

  IconData _actionIcon(String action) {
    return switch (action.toLowerCase()) {
      'create' || 'created' => Icons.add_circle_outline,
      'update' || 'updated' => Icons.edit_outlined,
      'delete' || 'deleted' => Icons.delete_outline,
      'approve' || 'approved' => Icons.check_circle_outline,
      'reject' || 'rejected' => Icons.cancel_outlined,
      'assign' || 'assigned' => Icons.person_add_outlined,
      'comment' || 'commented' => Icons.comment_outlined,
      _ => Icons.info_outline,
    };
  }

  Color _actionColor(String action) {
    return switch (action.toLowerCase()) {
      'create' || 'created' => Colors.green,
      'update' || 'updated' => Colors.blue,
      'delete' || 'deleted' => Colors.red,
      'approve' || 'approved' => Colors.teal,
      'reject' || 'rejected' => Colors.orange,
      _ => Colors.grey,
    };
  }

  @override
  Widget build(BuildContext context) {
    final dateFormat = DateFormat('MMM d, h:mm a');

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
                    _activitiesFuture = ActivityService.instance
                        .getByProject(_selectedProjectId!);
                  });
                  await _activitiesFuture;
                },
                child: FutureBuilder<List<ActivityModel>>(
                  future: _activitiesFuture,
                  builder: (context, snapshot) {
                    if (snapshot.connectionState == ConnectionState.waiting) {
                      return const Center(child: CircularProgressIndicator());
                    }
                    if (snapshot.hasError) {
                      return ListView(
                        children: const [
                          SizedBox(height: 160),
                          Center(child: Text('Failed to load activity feed')),
                        ],
                      );
                    }

                    final activities =
                        snapshot.data ?? const <ActivityModel>[];
                    if (activities.isEmpty) {
                      return ListView(
                        children: const [
                          SizedBox(height: 160),
                          Center(
                            child:
                                Text('No activity recorded for this project.'),
                          ),
                        ],
                      );
                    }

                    return ListView.separated(
                      padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                      itemCount: activities.length,
                      separatorBuilder: (_, _) => const Divider(height: 1),
                      itemBuilder: (context, index) {
                        final activity = activities[index];
                        String? timeStr;
                        if (activity.createdAt != null) {
                          final parsed =
                              DateTime.tryParse(activity.createdAt!);
                          if (parsed != null) {
                            timeStr = dateFormat.format(parsed.toLocal());
                          }
                        }

                        return ListTile(
                          leading: CircleAvatar(
                            backgroundColor: _actionColor(activity.action)
                                .withValues(alpha: 0.14),
                            child: Icon(
                              _actionIcon(activity.action),
                              color: _actionColor(activity.action),
                              size: 20,
                            ),
                          ),
                          title: Text(
                            '${activity.userName ?? 'Someone'} ${activity.action} ${activity.entityType}',
                          ),
                          subtitle: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              if ((activity.details ?? '').isNotEmpty)
                                Text(
                                  activity.details!,
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              if (timeStr != null)
                                Padding(
                                  padding: const EdgeInsets.only(top: 2),
                                  child: Text(
                                    timeStr,
                                    style: const TextStyle(
                                      fontSize: 11,
                                      color: Color(0xFF9CA3AF),
                                    ),
                                  ),
                                ),
                            ],
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
