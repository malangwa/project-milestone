import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../../app/routes.dart';
import '../../../config/app_theme.dart';
import '../../../data/models/project_model.dart';
import '../../../data/services/project_service.dart';
import '../../../data/services/session_controller.dart';
import '../../widgets/empty_state.dart';
import '../../widgets/loading_indicator.dart';

class ProjectListPage extends StatefulWidget {
  const ProjectListPage({super.key});

  @override
  State<ProjectListPage> createState() => _ProjectListPageState();
}

class _ProjectListPageState extends State<ProjectListPage> {
  late Future<List<ProjectModel>> _future;
  String _query = '';

  @override
  void initState() {
    super.initState();
    _future = _loadProjects();
  }

  Future<List<ProjectModel>> _loadProjects() async {
    try {
      return await ProjectService.instance.getProjects();
    } catch (_) {
      return [];
    }
  }

  bool _canCreateProject() {
    final role = SessionController.instance.currentUser?.role;
    return role == 'admin' || role == 'manager';
  }

  Future<void> _showCreateProjectSheet() async {
    final created = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      builder: (sheetContext) {
        return Padding(
          padding: EdgeInsets.only(
            bottom: MediaQuery.viewInsetsOf(sheetContext).bottom,
          ),
          child: const _CreateProjectForm(),
        );
      },
    );
    if (created == true && mounted) {
      setState(() => _future = _loadProjects());
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Project created')),
      );
    }
  }

  Future<void> _confirmDeleteProject(ProjectModel project) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete project?'),
        content: Text('Delete "${project.name}"? This cannot be undone.'),
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
    if (confirmed != true || !mounted) return;
    try {
      await ProjectService.instance.delete(project.id);
      if (!mounted) return;
      setState(() => _future = _loadProjects());
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Project deleted')));
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('Failed to delete: $e')));
    }
  }

  @override
  Widget build(BuildContext context) {
    final currency = NumberFormat.currency(symbol: '\$');

    return Scaffold(
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
            child: TextField(
              decoration: const InputDecoration(
                prefixIcon: Icon(Icons.search, size: 20, color: AppTheme.textMuted),
                hintText: 'Search projects',
              ),
              onChanged: (value) =>
                  setState(() => _query = value.trim().toLowerCase()),
            ),
          ),
          Expanded(
            child: RefreshIndicator(
              onRefresh: () async {
                setState(() => _future = _loadProjects());
                await _future;
              },
              child: FutureBuilder<List<ProjectModel>>(
                future: _future,
                builder: (context, snapshot) {
                  if (snapshot.connectionState == ConnectionState.waiting) {
                    return const LoadingIndicator(
                      message: 'Loading projects...',
                    );
                  }

                  final allProjects = snapshot.data ?? <ProjectModel>[];

                  if (snapshot.hasError || allProjects.isEmpty) {
                    return ListView(
                      physics: const AlwaysScrollableScrollPhysics(),
                      children: [
                        EmptyState(
                          icon: Icons.folder_open,
                          title: _query.isEmpty
                              ? 'No projects yet.'
                              : 'No projects match the selected filter.',
                          subtitle: _query.isEmpty
                              ? 'Create your first one!'
                              : null,
                          onRetry: () =>
                              setState(() => _future = _loadProjects()),
                        ),
                      ],
                    );
                  }

                  final projects = allProjects
                      .where(
                        (project) =>
                            _query.isEmpty ||
                            project.name.toLowerCase().contains(_query) ||
                            (project.location ?? '').toLowerCase().contains(
                              _query,
                            ),
                      )
                      .toList();

                  if (projects.isEmpty) {
                    return ListView(
                      physics: const AlwaysScrollableScrollPhysics(),
                      children: [
                        if (_query.isEmpty)
                          const EmptyState(
                            icon: Icons.folder_open,
                            title: 'No projects yet.',
                            subtitle: 'Create your first one!',
                          )
                        else
                          const EmptyState(
                            icon: Icons.search_off,
                            title: 'No projects match the selected filter.',
                          ),
                      ],
                    );
                  }

                  return ListView.separated(
                    padding: const EdgeInsets.all(16),
                    itemCount: projects.length,
                    separatorBuilder: (_, _) => const SizedBox(height: 10),
                    itemBuilder: (context, index) {
                      final project = projects[index];
                      return Card(
                        child: InkWell(
                          borderRadius: BorderRadius.circular(20),
                          onTap: () => Navigator.of(context).pushNamed(
                            AppRoutes.projectDetail,
                            arguments: project.id,
                          ),
                          child: Padding(
                            padding: const EdgeInsets.all(16),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
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
                                              fontSize: 15,
                                              fontWeight: FontWeight.w700,
                                              color: AppTheme.textPrimary,
                                            ),
                                          ),
                                          const SizedBox(height: 2),
                                          Text(
                                            project.industry,
                                            style: const TextStyle(
                                              fontSize: 12,
                                              color: AppTheme.textMuted,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                    _ProjectStatusChip(status: project.status),
                                    PopupMenuButton<String>(
                                      icon: const Icon(Icons.more_vert, size: 20, color: AppTheme.textMuted),
                                      onSelected: (value) {
                                        if (value == 'delete') _confirmDeleteProject(project);
                                      },
                                      itemBuilder: (context) => [
                                        const PopupMenuItem(
                                          value: 'delete',
                                          child: ListTile(
                                            contentPadding: EdgeInsets.zero,
                                            leading: Icon(Icons.delete_outline, color: AppTheme.red600),
                                            title: Text('Delete', style: TextStyle(color: AppTheme.red600)),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ],
                                ),
                                if ((project.description ?? '').isNotEmpty) ...[
                                  const SizedBox(height: 10),
                                  Text(
                                    project.description!,
                                    maxLines: 2,
                                    overflow: TextOverflow.ellipsis,
                                    style: const TextStyle(
                                      fontSize: 13,
                                      color: AppTheme.textSecondary,
                                      height: 1.4,
                                    ),
                                  ),
                                ],
                                const SizedBox(height: 12),
                                Row(
                                  children: [
                                    if ((project.location ?? '').isNotEmpty) ...[
                                      const Icon(Icons.place_outlined, size: 14, color: AppTheme.textMuted),
                                      const SizedBox(width: 4),
                                      Text(
                                        project.location!,
                                        style: const TextStyle(fontSize: 12, color: AppTheme.textMuted),
                                      ),
                                      const SizedBox(width: 12),
                                    ],
                                    const Icon(Icons.attach_money, size: 14, color: AppTheme.textMuted),
                                    Text(
                                      currency.format(project.budget),
                                      style: const TextStyle(
                                        fontSize: 12,
                                        color: AppTheme.textSecondary,
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ),
                      );
                    },
                  );
                },
              ),
            ),
        ),
        ],
      ),
      floatingActionButton: _canCreateProject()
          ? FloatingActionButton.extended(
              onPressed: _showCreateProjectSheet,
              tooltip: 'New project',
              backgroundColor: AppTheme.primary,
              foregroundColor: Colors.white,
              elevation: 4,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              icon: const Icon(Icons.add_rounded),
              label: const Text('New', style: TextStyle(fontWeight: FontWeight.w600)),
            )
          : null,
    );
  }
}

class _CreateProjectForm extends StatefulWidget {
  const _CreateProjectForm();

  @override
  State<_CreateProjectForm> createState() => _CreateProjectFormState();
}

class _CreateProjectFormState extends State<_CreateProjectForm> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _locationController = TextEditingController();
  final _budgetController = TextEditingController();
  final _givenCashController = TextEditingController();
  String _industry = 'other';
  String _status = 'planning';
  DateTime? _startDate;
  DateTime? _endDate;
  bool _submitting = false;

  static const List<String> _industryValues = [
    'construction',
    'telecom',
    'software',
    'other',
  ];

  static const List<String> _statusValues = [
    'planning',
    'active',
    'on_hold',
    'completed',
    'cancelled',
  ];

  @override
  void dispose() {
    _nameController.dispose();
    _descriptionController.dispose();
    _locationController.dispose();
    _budgetController.dispose();
    _givenCashController.dispose();
    super.dispose();
  }

  String _industryLabel(String v) {
    return switch (v) {
      'construction' => 'Construction',
      'telecom' => 'Telecom',
      'software' => 'Software',
      _ => 'Other',
    };
  }

  String _statusLabel(String v) {
    return switch (v) {
      'planning' => 'Planning',
      'active' => 'Active',
      'on_hold' => 'On hold',
      'completed' => 'Completed',
      'cancelled' => 'Cancelled',
      _ => v,
    };
  }

  Future<void> _pickStartDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _startDate ?? DateTime.now(),
      firstDate: DateTime(2000),
      lastDate: DateTime(2100),
    );
    if (picked != null) setState(() => _startDate = picked);
  }

  Future<void> _pickEndDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _endDate ?? _startDate ?? DateTime.now(),
      firstDate: DateTime(2000),
      lastDate: DateTime(2100),
    );
    if (picked != null) setState(() => _endDate = picked);
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _submitting = true);
    try {
      final data = <String, dynamic>{
        'name': _nameController.text.trim(),
        if (_descriptionController.text.trim().isNotEmpty)
          'description': _descriptionController.text.trim(),
        if (_locationController.text.trim().isNotEmpty)
          'location': _locationController.text.trim(),
        'industry': _industry,
        'status': _status,
        'budget': double.tryParse(_budgetController.text.trim()) ?? 0,
        'givenCash': double.tryParse(_givenCashController.text.trim()) ?? 0,
        if (_startDate != null)
          'startDate': DateFormat('yyyy-MM-dd').format(_startDate!),
        if (_endDate != null)
          'endDate': DateFormat('yyyy-MM-dd').format(_endDate!),
      };
      await ProjectService.instance.create(data);
      if (!mounted) return;
      Navigator.of(context).pop(true);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('Failed to create project: $e')));
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final budget = double.tryParse(_budgetController.text.trim()) ?? 0;
    final givenCash = double.tryParse(_givenCashController.text.trim()) ?? 0;
    final remaining = (budget - givenCash) < 0 ? 0.0 : (budget - givenCash);

    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
      child: Form(
        key: _formKey,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                margin: const EdgeInsets.only(bottom: 16),
                decoration: BoxDecoration(
                  color: Theme.of(context).colorScheme.outlineVariant,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            Text('New project', style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 16),
            TextFormField(
              controller: _nameController,
              decoration: const InputDecoration(
                labelText: 'Name *',
                border: OutlineInputBorder(),
              ),
              textCapitalization: TextCapitalization.words,
              validator: (value) {
                if (value == null || value.trim().isEmpty) {
                  return 'Name is required';
                }
                return null;
              },
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _descriptionController,
              decoration: const InputDecoration(
                labelText: 'Description',
                border: OutlineInputBorder(),
              ),
              maxLines: 3,
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _locationController,
              decoration: const InputDecoration(
                labelText: 'Location',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              initialValue: _industry,
              decoration: const InputDecoration(
                labelText: 'Industry',
                border: OutlineInputBorder(),
              ),
              items: _industryValues
                  .map(
                    (v) => DropdownMenuItem(
                      value: v,
                      child: Text(_industryLabel(v)),
                    ),
                  )
                  .toList(),
              onChanged: (v) {
                if (v != null) setState(() => _industry = v);
              },
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              initialValue: _status,
              decoration: const InputDecoration(
                labelText: 'Status',
                border: OutlineInputBorder(),
              ),
              items: _statusValues
                  .map(
                    (v) => DropdownMenuItem(
                      value: v,
                      child: Text(_statusLabel(v)),
                    ),
                  )
                  .toList(),
              onChanged: (v) {
                if (v != null) setState(() => _status = v);
              },
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _budgetController,
              decoration: const InputDecoration(
                labelText: 'Budget',
                border: OutlineInputBorder(),
              ),
              keyboardType: const TextInputType.numberWithOptions(
                decimal: true,
              ),
              onChanged: (_) => setState(() {}),
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _givenCashController,
              decoration: const InputDecoration(
                labelText: 'Given cash',
                border: OutlineInputBorder(),
              ),
              keyboardType: const TextInputType.numberWithOptions(
                decimal: true,
              ),
              onChanged: (_) => setState(() {}),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: _ProjectFigureCard(
                    label: 'Given',
                    value: NumberFormat.currency(symbol: '\$').format(givenCash),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: _ProjectFigureCard(
                    label: 'Remaining',
                    value: NumberFormat.currency(symbol: '\$').format(remaining),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            ListTile(
              contentPadding: EdgeInsets.zero,
              title: const Text('Start date'),
              subtitle: Text(
                _startDate != null
                    ? DateFormat.yMd().format(_startDate!)
                    : 'Not set',
              ),
              trailing: const Icon(Icons.calendar_today),
              onTap: _pickStartDate,
            ),
            ListTile(
              contentPadding: EdgeInsets.zero,
              title: const Text('End date'),
              subtitle: Text(
                _endDate != null
                    ? DateFormat.yMd().format(_endDate!)
                    : 'Not set',
              ),
              trailing: const Icon(Icons.calendar_today),
              onTap: _pickEndDate,
            ),
            const SizedBox(height: 16),
            FilledButton(
              onPressed: _submitting ? null : _submit,
              child: _submitting
                  ? const SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Text('Create project'),
            ),
          ],
        ),
      ),
    );
  }
}

class _ProjectFigureCard extends StatelessWidget {
  const _ProjectFigureCard({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppTheme.slate100,
        borderRadius: BorderRadius.circular(14),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: const TextStyle(fontSize: 12, color: AppTheme.textMuted),
          ),
          const SizedBox(height: 4),
          Text(
            value,
            style: const TextStyle(
              fontWeight: FontWeight.w700,
              color: AppTheme.textPrimary,
              fontSize: 14,
            ),
          ),
        ],
      ),
    );
  }
}

class _ProjectStatusChip extends StatelessWidget {
  const _ProjectStatusChip({required this.status});

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
