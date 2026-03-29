import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../../data/models/milestone_model.dart';
import '../../../data/models/project_model.dart';
import '../../../data/services/milestone_service.dart';
import '../../../data/services/project_service.dart';
import '../../widgets/empty_state.dart';
import '../../widgets/loading_indicator.dart';

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
    try {
      final projects = await ProjectService.instance.getProjects();
      if (projects.isNotEmpty && _selectedProjectId == null) {
        _selectedProjectId = projects.first.id;
        _milestonesFuture =
            MilestoneService.instance.getByProject(_selectedProjectId!);
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
      _milestonesFuture = MilestoneService.instance.getByProject(projectId);
    });
  }

  void _refreshMilestones() {
    final id = _selectedProjectId;
    if (id == null) return;
    setState(() {
      _milestonesFuture = MilestoneService.instance.getByProject(id);
    });
  }

  void _showCreateMilestoneSheet() {
    final projectId = _selectedProjectId;
    if (projectId == null) return;

    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      builder: (sheetContext) {
        return Padding(
          padding: EdgeInsets.only(
            bottom: MediaQuery.viewInsetsOf(sheetContext).bottom,
          ),
          child: _CreateMilestoneSheet(
            projectId: projectId,
            onSuccess: () {
              if (!mounted) return;
              Navigator.of(sheetContext).pop();
              _refreshMilestones();
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Milestone created')),
              );
            },
            onFailure: (message) {
              if (!mounted) return;
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text(message)),
              );
            },
          ),
        );
      },
    );
  }

  void _showEditMilestoneSheet(MilestoneModel milestone) {
    final projectId = _selectedProjectId;
    if (projectId == null) return;

    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      builder: (sheetContext) {
        return Padding(
          padding: EdgeInsets.only(
            bottom: MediaQuery.viewInsetsOf(sheetContext).bottom,
          ),
          child: _CreateMilestoneSheet(
            projectId: projectId,
            existing: milestone,
            onSuccess: () {
              if (!mounted) return;
              Navigator.of(sheetContext).pop();
              _refreshMilestones();
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Milestone updated')),
              );
            },
            onFailure: (message) {
              if (!mounted) return;
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text(message)),
              );
            },
          ),
        );
      },
    );
  }

  Future<void> _confirmDeleteMilestone(MilestoneModel milestone) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete milestone'),
        content: Text('Delete "${milestone.title}"? This cannot be undone.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
    if (confirmed != true || !mounted) return;

    try {
      await MilestoneService.instance.delete(milestone.id);
      if (!mounted) return;
      _refreshMilestones();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Milestone deleted')),
      );
    } on DioException catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            e.message ?? e.response?.data?.toString() ?? e.toString(),
          ),
        ),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to delete milestone: $e')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final dateFormat = DateFormat('MMM d, y');

    return FutureBuilder<List<ProjectModel>>(
      future: _projectsFuture,
      builder: (context, projectSnapshot) {
        if (projectSnapshot.connectionState == ConnectionState.waiting) {
          return const LoadingIndicator(message: 'Loading milestones...');
        }
        final projects = projectSnapshot.data ?? const <ProjectModel>[];
        if (projectSnapshot.hasError || projects.isEmpty) {
          return EmptyState(
            icon: Icons.folder_open,
            title: 'No projects yet.',
            subtitle: 'Create your first project to add milestones',
            onRetry: () => setState(() => _projectsFuture = _loadProjects()),
          );
        }

        return Scaffold(
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
                      return const LoadingIndicator(message: 'Loading milestones...');
                    }
                    final milestones =
                        snapshot.data ?? const <MilestoneModel>[];
                    if (snapshot.hasError || milestones.isEmpty) {
                      return ListView(
                        physics: const AlwaysScrollableScrollPhysics(),
                        children: [
                          EmptyState(
                            icon: Icons.flag_outlined,
                            title: 'No milestones for this project yet.',
                            onRetry: _selectedProjectId == null
                                ? null
                                : () => _refreshMilestones(),
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
                              child: Padding(
                                padding: const EdgeInsets.all(12),
                                child: Row(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Padding(
                                      padding: const EdgeInsets.only(
                                        top: 4,
                                        right: 8,
                                      ),
                                      child: Icon(
                                        milestone.status == 'completed'
                                            ? Icons.check_circle
                                            : Icons.flag_outlined,
                                        color: milestone.status == 'completed'
                                            ? Colors.green
                                            : Colors.orange,
                                      ),
                                    ),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            milestone.title,
                                            style: Theme.of(context)
                                                .textTheme
                                                .titleMedium,
                                          ),
                                          if ((milestone.description ?? '')
                                              .isNotEmpty) ...[
                                            const SizedBox(height: 6),
                                            Text(milestone.description!),
                                          ],
                                          if (dueDateStr != null) ...[
                                            const SizedBox(height: 4),
                                            Text('Due: $dueDateStr'),
                                          ],
                                        ],
                                      ),
                                    ),
                                    Column(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        _MilestoneStatusChip(
                                          status: milestone.status,
                                        ),
                                        PopupMenuButton<String>(
                                          icon: const Icon(Icons.more_vert),
                                          onSelected: (value) {
                                            if (value == 'edit') {
                                              _showEditMilestoneSheet(
                                                milestone,
                                              );
                                            } else if (value == 'delete') {
                                              _confirmDeleteMilestone(
                                                milestone,
                                              );
                                            }
                                          },
                                          itemBuilder: (context) => const [
                                            PopupMenuItem(
                                              value: 'edit',
                                              child: Text('Edit'),
                                            ),
                                            PopupMenuItem(
                                              value: 'delete',
                                              child: Text('Delete'),
                                            ),
                                          ],
                                        ),
                                      ],
                                    ),
                                  ],
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
          ),
          floatingActionButton: _selectedProjectId != null
              ? FloatingActionButton(
                  onPressed: _showCreateMilestoneSheet,
                  child: const Icon(Icons.add),
                )
              : null,
        );
      },
    );
  }
}

class _CreateMilestoneSheet extends StatefulWidget {
  const _CreateMilestoneSheet({
    required this.projectId,
    this.existing,
    required this.onSuccess,
    required this.onFailure,
  });

  final String projectId;
  final MilestoneModel? existing;
  final VoidCallback onSuccess;
  final void Function(String message) onFailure;

  @override
  State<_CreateMilestoneSheet> createState() => _CreateMilestoneSheetState();
}

class _CreateMilestoneSheetState extends State<_CreateMilestoneSheet> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _descriptionController = TextEditingController();
  String _status = 'pending';
  DateTime? _dueDate;

  static const List<(String, String)> _statusOptions = [
    ('pending', 'Pending'),
    ('in_progress', 'In progress'),
    ('completed', 'Completed'),
    ('delayed', 'Delayed'),
  ];

  bool get _isEditing => widget.existing != null;

  @override
  void initState() {
    super.initState();
    final e = widget.existing;
    if (e != null) {
      _nameController.text = e.title;
      _descriptionController.text = e.description ?? '';
      _status = e.status;
      final d = e.dueDate;
      if (d != null) {
        final parsed = DateTime.tryParse(d);
        if (parsed != null) _dueDate = parsed;
      }
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  Future<void> _pickDueDate() async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: _dueDate ?? now,
      firstDate: DateTime(2000),
      lastDate: DateTime(2100),
    );
    if (picked != null) setState(() => _dueDate = picked);
  }

  Future<void> _submit() async {
    if (!(_formKey.currentState?.validate() ?? false)) return;

    final name = _nameController.text.trim();
    final desc = _descriptionController.text.trim();

    try {
      if (_isEditing) {
        final patch = <String, dynamic>{
          'name': name,
          'status': _status,
        };
        if (desc.isNotEmpty) patch['description'] = desc;
        if (_dueDate != null) {
          patch['dueDate'] = DateFormat('yyyy-MM-dd').format(_dueDate!);
        }
        await MilestoneService.instance.update(widget.existing!.id, patch);
      } else {
        final payload = <String, dynamic>{
          'projectId': widget.projectId,
          'name': name,
          'status': _status,
        };
        if (desc.isNotEmpty) payload['description'] = desc;
        if (_dueDate != null) {
          payload['dueDate'] = DateFormat('yyyy-MM-dd').format(_dueDate!);
        }
        await MilestoneService.instance.create(payload);
      }
      if (!mounted) return;
      widget.onSuccess();
    } on DioException catch (e) {
      if (!mounted) return;
      widget.onFailure(
        e.message ?? e.response?.data?.toString() ?? e.toString(),
      );
    } catch (e) {
      if (!mounted) return;
      widget.onFailure(
        _isEditing
            ? 'Failed to update milestone: $e'
            : 'Failed to create milestone: $e',
      );
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
                _isEditing ? 'Edit milestone' : 'New milestone',
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _nameController,
                decoration: const InputDecoration(
                  labelText: 'Name',
                  border: OutlineInputBorder(),
                ),
                validator: (v) {
                  if (v == null || v.trim().isEmpty) {
                    return 'Name is required';
                  }
                  return null;
                },
                textCapitalization: TextCapitalization.sentences,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _descriptionController,
                decoration: const InputDecoration(
                  labelText: 'Description',
                  border: OutlineInputBorder(),
                  alignLabelWithHint: true,
                ),
                maxLines: 3,
              ),
              const SizedBox(height: 12),
              DropdownButtonFormField<String>(
                initialValue: _status,
                decoration: const InputDecoration(
                  labelText: 'Status',
                  border: OutlineInputBorder(),
                ),
                items: _statusOptions
                    .map(
                      (e) => DropdownMenuItem<String>(
                        value: e.$1,
                        child: Text(e.$2),
                      ),
                    )
                    .toList(),
                onChanged: (v) {
                  if (v != null) setState(() => _status = v);
                },
              ),
              const SizedBox(height: 12),
              ListTile(
                contentPadding: EdgeInsets.zero,
                title: const Text('Due date'),
                subtitle: Text(
                  _dueDate == null
                      ? 'None selected'
                      : DateFormat.yMMMd().format(_dueDate!),
                ),
                trailing: TextButton(
                  onPressed: _pickDueDate,
                  child: const Text('Pick date'),
                ),
              ),
              const SizedBox(height: 16),
              FilledButton(
                onPressed: _submit,
                child: Text(_isEditing ? 'Save' : 'Create'),
              ),
            ],
          ),
        ),
      ),
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
      'delayed' => (Colors.amber.shade800, 'Delayed'),
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
