import 'package:flutter/material.dart';

import '../../../data/models/issue_model.dart';
import '../../../data/models/project_model.dart';
import '../../../data/services/issue_service.dart';
import '../../../data/services/project_service.dart';
import '../../widgets/empty_state.dart';
import '../../widgets/loading_indicator.dart';

class IssueListPage extends StatefulWidget {
  const IssueListPage({super.key});

  @override
  State<IssueListPage> createState() => _IssueListPageState();
}

class _IssueListPageState extends State<IssueListPage> {
  late Future<List<ProjectModel>> _projectsFuture;
  Future<List<IssueModel>>? _issuesFuture;
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
        _issuesFuture =
            IssueService.instance.getByProject(_selectedProjectId!);
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
      _issuesFuture = IssueService.instance.getByProject(projectId);
    });
  }

  void _refreshIssues() {
    if (_selectedProjectId == null) return;
    setState(() {
      _issuesFuture = IssueService.instance.getByProject(_selectedProjectId!);
    });
  }

  Future<void> _confirmDeleteIssue(IssueModel issue) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete issue'),
        content: const Text(
          'Are you sure you want to delete this issue? This cannot be undone.',
        ),
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
      await IssueService.instance.delete(issue.id);
      _refreshIssues();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Issue deleted')),
        );
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to delete issue')),
        );
      }
    }
  }

  Future<void> _updateIssueStatus(String issueId, String status) async {
    try {
      await IssueService.instance.update(issueId, {'status': status});
      _refreshIssues();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Status updated')),
        );
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to update status')),
        );
      }
    }
  }

  void _showCreateIssueSheet(BuildContext pageContext) {
    final projectId = _selectedProjectId;
    if (projectId == null) return;

    final titleCtrl = TextEditingController();
    final descriptionCtrl = TextEditingController();
    final formKey = GlobalKey<FormState>();
    var priority = 'medium';

    showModalBottomSheet<void>(
      context: pageContext,
      isScrollControlled: true,
      builder: (sheetContext) {
        return StatefulBuilder(
          builder: (modalContext, setModalState) {
            return Padding(
              padding: EdgeInsets.only(
                left: 16,
                right: 16,
                top: 16,
                bottom: MediaQuery.viewInsetsOf(modalContext).bottom + 16,
              ),
              child: Form(
                key: formKey,
                child: SingleChildScrollView(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Text(
                        'New issue',
                        style: Theme.of(modalContext).textTheme.titleLarge,
                      ),
                      const SizedBox(height: 16),
                      TextFormField(
                        controller: titleCtrl,
                        decoration: const InputDecoration(
                          labelText: 'Title',
                          border: OutlineInputBorder(),
                        ),
                        textCapitalization: TextCapitalization.sentences,
                        validator: (v) => (v == null || v.trim().isEmpty)
                            ? 'Title is required'
                            : null,
                      ),
                      const SizedBox(height: 12),
                      TextFormField(
                        controller: descriptionCtrl,
                        decoration: const InputDecoration(
                          labelText: 'Description',
                          border: OutlineInputBorder(),
                        ),
                        maxLines: 4,
                      ),
                      const SizedBox(height: 12),
                      DropdownButtonFormField<String>(
                        key: ValueKey(priority),
                        initialValue: priority,
                        decoration: const InputDecoration(
                          labelText: 'Priority',
                          border: OutlineInputBorder(),
                        ),
                        items: const [
                          DropdownMenuItem(
                            value: 'low',
                            child: Text('Low'),
                          ),
                          DropdownMenuItem(
                            value: 'medium',
                            child: Text('Medium'),
                          ),
                          DropdownMenuItem(
                            value: 'high',
                            child: Text('High'),
                          ),
                          DropdownMenuItem(
                            value: 'critical',
                            child: Text('Critical'),
                          ),
                        ],
                        onChanged: (v) {
                          if (v != null) {
                            setModalState(() => priority = v);
                          }
                        },
                      ),
                      const SizedBox(height: 20),
                      FilledButton(
                        onPressed: () async {
                          if (formKey.currentState?.validate() != true) {
                            return;
                          }
                          final body = <String, dynamic>{
                            'projectId': projectId,
                            'title': titleCtrl.text.trim(),
                            'priority': priority,
                          };
                          final desc = descriptionCtrl.text.trim();
                          if (desc.isNotEmpty) {
                            body['description'] = desc;
                          }
                          try {
                            await IssueService.instance.create(body);
                            if (sheetContext.mounted) {
                              Navigator.pop(sheetContext);
                            }
                            if (!mounted) return;
                            _refreshIssues();
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text('Issue created'),
                              ),
                            );
                          } catch (_) {
                            if (mounted) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                  content: Text('Failed to create issue'),
                                ),
                              );
                            }
                          }
                        },
                        child: const Text('Create'),
                      ),
                    ],
                  ),
                ),
              ),
            );
          },
        );
      },
    ).whenComplete(() {
      titleCtrl.dispose();
      descriptionCtrl.dispose();
    });
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<List<ProjectModel>>(
      future: _projectsFuture,
      builder: (context, projectSnapshot) {
        if (projectSnapshot.connectionState == ConnectionState.waiting) {
          return const LoadingIndicator(message: 'Loading issues...');
        }
        final projects = projectSnapshot.data ?? const <ProjectModel>[];
        if (projectSnapshot.hasError || projects.isEmpty) {
          return EmptyState(
            icon: Icons.folder_open,
            title: 'No projects yet.',
            subtitle: 'Create your first project to track issues',
            onRetry: () => setState(() => _projectsFuture = _loadProjects()),
          );
        }

        return Scaffold(
          floatingActionButton: _selectedProjectId != null
              ? FloatingActionButton(
                  onPressed: () => _showCreateIssueSheet(context),
                  tooltip: 'New issue',
                  child: const Icon(Icons.add),
                )
              : null,
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
                    _issuesFuture = IssueService.instance
                        .getByProject(_selectedProjectId!);
                  });
                  await _issuesFuture;
                },
                child: FutureBuilder<List<IssueModel>>(
                  future: _issuesFuture,
                  builder: (context, snapshot) {
                    if (snapshot.connectionState == ConnectionState.waiting) {
                      return const LoadingIndicator(message: 'Loading issues...');
                    }
                    final issues = snapshot.data ?? const <IssueModel>[];
                    if (snapshot.hasError || issues.isEmpty) {
                      return ListView(
                        physics: const AlwaysScrollableScrollPhysics(),
                        children: [
                          EmptyState(
                            icon: Icons.bug_report_outlined,
                            title: 'No issues found.',
                            onRetry: _selectedProjectId == null ? null : () {
                              setState(() {
                                _issuesFuture = IssueService.instance
                                    .getByProject(_selectedProjectId!);
                              });
                            },
                          ),
                        ],
                      );
                    }

                    final openCount =
                        issues.where((i) => i.status == 'open').length;

                    return ListView(
                      padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                      children: [
                        Card(
                          child: Padding(
                            padding: const EdgeInsets.all(16),
                            child: Row(
                              children: [
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      const Text('Total Issues'),
                                      Text(
                                        '${issues.length}',
                                        style: Theme.of(context)
                                            .textTheme
                                            .headlineMedium,
                                      ),
                                    ],
                                  ),
                                ),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      const Text('Open'),
                                      Text(
                                        '$openCount',
                                        style: Theme.of(context)
                                            .textTheme
                                            .headlineMedium
                                            ?.copyWith(color: Colors.red),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(height: 8),
                        ...issues.map(
                          (issue) => Card(
                            child: ListTile(
                              contentPadding: const EdgeInsets.all(16),
                              leading: Icon(
                                Icons.bug_report,
                                color: _severityColor(issue.severity),
                              ),
                              title: Text(issue.title),
                              subtitle: Padding(
                                padding: const EdgeInsets.only(top: 6),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    if ((issue.description ?? '').isNotEmpty)
                                      Text(
                                        issue.description!,
                                        maxLines: 2,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    const SizedBox(height: 4),
                                    Text(
                                      [
                                        issue.severity,
                                        if ((issue.reportedByName ?? '')
                                            .isNotEmpty)
                                          'by ${issue.reportedByName}',
                                        if ((issue.assignedToName ?? '')
                                            .isNotEmpty)
                                          '→ ${issue.assignedToName}',
                                      ].join(' • '),
                                      style: const TextStyle(fontSize: 12),
                                    ),
                                  ],
                                ),
                              ),
                              trailing: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  _IssueStatusChip(status: issue.status),
                                  PopupMenuButton<String>(
                                    icon: const Icon(Icons.more_vert),
                                    onSelected: (value) {
                                      if (value == 'delete') {
                                        _confirmDeleteIssue(issue);
                                      } else if (value != issue.status) {
                                        _updateIssueStatus(issue.id, value);
                                      }
                                    },
                                    itemBuilder: (ctx) => [
                                      PopupMenuItem(
                                        value: 'open',
                                        enabled: issue.status != 'open',
                                        child: const Text('Set status: Open'),
                                      ),
                                      PopupMenuItem(
                                        value: 'in_progress',
                                        enabled: issue.status != 'in_progress',
                                        child: const Text('Set status: In progress'),
                                      ),
                                      PopupMenuItem(
                                        value: 'resolved',
                                        enabled: issue.status != 'resolved',
                                        child: const Text('Set status: Resolved'),
                                      ),
                                      PopupMenuItem(
                                        value: 'closed',
                                        enabled: issue.status != 'closed',
                                        child: const Text('Set status: Closed'),
                                      ),
                                      const PopupMenuDivider(),
                                      const PopupMenuItem<String>(
                                        value: 'delete',
                                        child: Text('Delete'),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                      ],
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

  Color _severityColor(String severity) {
    return switch (severity) {
      'critical' => Colors.red.shade800,
      'high' => Colors.red,
      'medium' => Colors.orange,
      'low' => Colors.blue,
      _ => Colors.grey,
    };
  }
}

class _IssueStatusChip extends StatelessWidget {
  const _IssueStatusChip({required this.status});

  final String status;

  @override
  Widget build(BuildContext context) {
    final (color, label) = switch (status) {
      'open' => (Colors.red, 'Open'),
      'in_progress' => (Colors.blue, 'In Progress'),
      'resolved' => (Colors.green, 'Resolved'),
      'closed' => (Colors.grey, 'Closed'),
      _ => (Colors.orange, status),
    };

    return Chip(
      label: Text(label),
      side: BorderSide.none,
      backgroundColor: color.withValues(alpha: 0.14),
      labelStyle: TextStyle(color: color, fontSize: 12),
    );
  }
}
