import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../data/models/attachment_model.dart';
import '../../../data/models/project_model.dart';
import '../../../data/models/task_model.dart';
import '../../../data/services/attachment_service.dart';
import '../../../data/services/project_service.dart';
import '../../../data/services/task_service.dart';
import '../../widgets/empty_state.dart';
import '../../widgets/loading_indicator.dart';

class TaskListPage extends StatefulWidget {
  const TaskListPage({super.key});

  @override
  State<TaskListPage> createState() => _TaskListPageState();
}

const _taskStatuses = [
  'todo',
  'in_progress',
  'review',
  'done',
  'blocked',
];

const _taskPriorities = ['low', 'medium', 'high', 'urgent'];

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
    try {
      final projects = await ProjectService.instance.getProjects();
      if (projects.isNotEmpty && _selectedProjectId == null) {
        _selectedProjectId = projects.first.id;
        _tasksFuture = TaskService.instance.getTasksByProject(_selectedProjectId!);
      }
      return projects;
    } catch (_) {
      return [];
    }
  }

  void _onProjectChanged(String? projectId) {
    if (projectId == null) return;
    setState(() {
      _selectedProjectId = projectId;
      _tasksFuture = TaskService.instance.getTasksByProject(projectId);
    });
  }

  void _refreshTasks() {
    final id = _selectedProjectId;
    if (id == null) return;
    setState(() {
      _tasksFuture = TaskService.instance.getTasksByProject(id);
    });
  }

  String _statusLabel(String status) =>
      status.replaceAll('_', ' ').split(' ').map((w) {
        if (w.isEmpty) return w;
        return w[0].toUpperCase() + w.substring(1);
      }).join(' ');

  Future<void> _showCreateTaskSheet() async {
    final projectId = _selectedProjectId;
    if (projectId == null) return;
    final created = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      builder: (sheetContext) => Padding(
        padding: EdgeInsets.only(
          bottom: MediaQuery.viewInsetsOf(sheetContext).bottom,
        ),
        child: _CreateTaskBottomSheet(projectId: projectId),
      ),
    );
    if (!mounted) return;
    if (created == true) {
      _refreshTasks();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Task created')),
      );
    }
  }

  Future<void> _updateTaskStatus(TaskModel task, String newStatus) async {
    try {
      await TaskService.instance.update(task.id, {'status': newStatus});
      if (!mounted) return;
      _refreshTasks();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Status updated')),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to update status: $e')),
      );
    }
  }

  Future<void> _confirmDeleteTask(TaskModel task) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete task'),
        content: Text('Delete "${task.title}"?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
    if (ok != true || !mounted) return;
    try {
      await TaskService.instance.delete(task.id);
      if (!mounted) return;
      _refreshTasks();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Task deleted')),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to delete: $e')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<List<ProjectModel>>(
      future: _projectsFuture,
      builder: (context, projectSnapshot) {
        if (projectSnapshot.connectionState == ConnectionState.waiting) {
          return const LoadingIndicator(message: 'Loading tasks...');
        }

        final projects = projectSnapshot.data ?? const <ProjectModel>[];
        if (projectSnapshot.hasError || projects.isEmpty) {
          return EmptyState(
            icon: Icons.folder_open,
            title: 'No projects yet.',
            subtitle: 'Create your first project to start tracking tasks',
            onRetry: () => setState(() => _projectsFuture = _loadProjects()),
          );
        }

        return Scaffold(
          floatingActionButton: _selectedProjectId == null
              ? null
              : FloatingActionButton(
                  onPressed: _showCreateTaskSheet,
                  child: const Icon(Icons.add),
                ),
          body: Column(
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
                        return const LoadingIndicator(message: 'Loading tasks...');
                      }

                      final tasks = snapshot.data ?? const <TaskModel>[];
                      if (snapshot.hasError || tasks.isEmpty) {
                        return ListView(
                          physics: const AlwaysScrollableScrollPhysics(),
                          children: [
                            EmptyState(
                              icon: Icons.checklist,
                              title: 'No tasks found.',
                              onRetry: _selectedProjectId == null
                                  ? null
                                  : () => _refreshTasks(),
                            ),
                          ],
                        );
                      }

                      return ListView.separated(
                        padding: const EdgeInsets.fromLTRB(16, 0, 16, 88),
                        itemCount: tasks.length,
                        separatorBuilder: (context, index) =>
                            const SizedBox(height: 8),
                        itemBuilder: (context, index) {
                          final task = tasks[index];
                          return _TaskCard(
                            task: task,
                            statusLabel: _statusLabel,
                            onStatusChange: (s) => _updateTaskStatus(task, s),
                            onDelete: () => _confirmDeleteTask(task),
                          );
                        },
                      );
                    },
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

class _TaskCard extends StatefulWidget {
  const _TaskCard({
    required this.task,
    required this.statusLabel,
    required this.onStatusChange,
    required this.onDelete,
  });

  final TaskModel task;
  final String Function(String) statusLabel;
  final Future<void> Function(String) onStatusChange;
  final Future<void> Function() onDelete;

  @override
  State<_TaskCard> createState() => _TaskCardState();
}

class _TaskCardState extends State<_TaskCard> {
  List<AttachmentModel> _photos = [];

  @override
  void initState() {
    super.initState();
    _loadPhotos();
  }

  Future<void> _loadPhotos() async {
    final files = await AttachmentService.instance.getByEntity('task', widget.task.id);
    if (mounted) setState(() => _photos = files);
  }

  Future<void> _uploadPhoto() async {
    final result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: ['jpg', 'jpeg', 'png', 'pdf'],
    );
    if (result == null || result.files.isEmpty || result.files.first.path == null) return;
    try {
      final file = result.files.first;
      final attachment = await AttachmentService.instance.upload(
        file.path!, file.name, 'task', widget.task.id,
      );
      if (mounted) {
        setState(() => _photos.add(attachment));
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Photo uploaded')),
        );
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to upload')),
        );
      }
    }
  }

  Future<void> _viewPhoto(AttachmentModel a) async {
    try {
      final url = await AttachmentService.instance.getDownloadUrl(a.id);
      final target = url.isNotEmpty ? url : a.url;
      if (target.isNotEmpty) {
        final uri = Uri.parse(target);
        if (await canLaunchUrl(uri)) {
          await launchUrl(uri, mode: LaunchMode.inAppBrowserView);
        } else {
          await launchUrl(uri, mode: LaunchMode.externalApplication);
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Could not open file: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final task = widget.task;
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(task.title, style: Theme.of(context).textTheme.titleSmall),
                      const SizedBox(height: 4),
                      Text(
                        [
                          task.status.replaceAll('_', ' '),
                          task.priority,
                          if ((task.assigneeName ?? '').isNotEmpty) task.assigneeName!,
                        ].join(' • '),
                        style: const TextStyle(fontSize: 13),
                      ),
                    ],
                  ),
                ),
                _StatusBadge(status: task.status),
                PopupMenuButton<String>(
                  icon: const Icon(Icons.more_vert),
                  onSelected: (value) async {
                    if (value == '__delete__') {
                      await widget.onDelete();
                    } else if (value == '__photo__') {
                      await _uploadPhoto();
                    } else {
                      await widget.onStatusChange(value);
                    }
                  },
                  itemBuilder: (ctx) => [
                    const PopupMenuItem(value: '__photo__', child: Text('Attach photo')),
                    const PopupMenuDivider(),
                    for (final s in _taskStatuses)
                      PopupMenuItem<String>(
                        value: s,
                        enabled: s != task.status,
                        child: Text(widget.statusLabel(s)),
                      ),
                    const PopupMenuDivider(),
                    const PopupMenuItem(value: '__delete__', child: Text('Delete')),
                  ],
                ),
              ],
            ),
            if (_photos.isNotEmpty) ...[
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                runSpacing: 4,
                children: _photos.map((a) => ActionChip(
                  avatar: Icon(
                    a.mimeType?.startsWith('image/') == true ? Icons.image : Icons.description,
                    size: 16,
                  ),
                  label: Text(a.filename, overflow: TextOverflow.ellipsis),
                  onPressed: () => _viewPhoto(a),
                )).toList(),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _CreateTaskBottomSheet extends StatefulWidget {
  const _CreateTaskBottomSheet({required this.projectId});

  final String projectId;

  @override
  State<_CreateTaskBottomSheet> createState() => _CreateTaskBottomSheetState();
}

class _CreateTaskBottomSheetState extends State<_CreateTaskBottomSheet> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _descriptionController = TextEditingController();
  String _priority = 'medium';
  String _status = 'todo';
  DateTime? _dueDate;
  bool _submitting = false;

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  String _apiPriority(String ui) => ui == 'urgent' ? 'critical' : ui;

  Future<void> _pickDueDate() async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: _dueDate ?? now,
      firstDate: DateTime(now.year - 1),
      lastDate: DateTime(now.year + 10),
    );
    if (picked != null) setState(() => _dueDate = picked);
  }

  Future<void> _submit() async {
    if (!(_formKey.currentState?.validate() ?? false)) return;
    setState(() => _submitting = true);
    final payload = <String, dynamic>{
      'projectId': widget.projectId,
      'title': _titleController.text.trim(),
      'status': _status,
      'priority': _apiPriority(_priority),
    };
    final desc = _descriptionController.text.trim();
    if (desc.isNotEmpty) payload['description'] = desc;
    if (_dueDate != null) {
      payload['dueDate'] = _dueDate!.toIso8601String().split('T').first;
    }
    try {
      await TaskService.instance.create(payload);
      if (!mounted) return;
      Navigator.pop(context, true);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to create task: $e')),
      );
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(24, 16, 24, 24),
        child: Form(
          key: _formKey,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(
                'New task',
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _titleController,
                enabled: !_submitting,
                decoration: const InputDecoration(
                  labelText: 'Title',
                  border: OutlineInputBorder(),
                ),
                textCapitalization: TextCapitalization.sentences,
                validator: (v) {
                  if (v == null || v.trim().isEmpty) return 'Title is required';
                  return null;
                },
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _descriptionController,
                enabled: !_submitting,
                decoration: const InputDecoration(
                  labelText: 'Description',
                  border: OutlineInputBorder(),
                  alignLabelWithHint: true,
                ),
                minLines: 3,
                maxLines: 6,
              ),
              const SizedBox(height: 12),
              DropdownButtonFormField<String>(
                initialValue: _priority,
                decoration: const InputDecoration(
                  labelText: 'Priority',
                  border: OutlineInputBorder(),
                ),
                items: _taskPriorities
                    .map(
                      (p) => DropdownMenuItem<String>(
                        value: p,
                        child: Text(p[0].toUpperCase() + p.substring(1)),
                      ),
                    )
                    .toList(),
                onChanged: _submitting
                    ? null
                    : (v) {
                        if (v != null) setState(() => _priority = v);
                      },
              ),
              const SizedBox(height: 12),
              DropdownButtonFormField<String>(
                initialValue: _status,
                decoration: const InputDecoration(
                  labelText: 'Status',
                  border: OutlineInputBorder(),
                ),
                items: _taskStatuses
                    .map(
                      (s) => DropdownMenuItem<String>(
                        value: s,
                        child: Text(
                          s.replaceAll('_', ' ').split(' ').map((w) {
                            if (w.isEmpty) return w;
                            return w[0].toUpperCase() + w.substring(1);
                          }).join(' '),
                        ),
                      ),
                    )
                    .toList(),
                onChanged: _submitting
                    ? null
                    : (v) {
                        if (v != null) setState(() => _status = v);
                      },
              ),
              const SizedBox(height: 12),
              InputDecorator(
                decoration: const InputDecoration(
                  labelText: 'Due date',
                  border: OutlineInputBorder(),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: Text(
                        _dueDate == null
                            ? 'None'
                            : _dueDate!.toIso8601String().split('T').first,
                      ),
                    ),
                    TextButton(
                      onPressed: _submitting ? null : _pickDueDate,
                      child: const Text('Pick'),
                    ),
                    if (_dueDate != null)
                      IconButton(
                        onPressed: _submitting
                            ? null
                            : () => setState(() => _dueDate = null),
                        icon: const Icon(Icons.clear),
                        tooltip: 'Clear',
                      ),
                  ],
                ),
              ),
              const SizedBox(height: 24),
              FilledButton(
                onPressed: _submitting ? null : _submit,
                child: _submitting
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Text('Create'),
              ),
            ],
          ),
        ),
      ),
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
