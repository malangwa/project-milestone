import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../data/models/attachment_model.dart';
import '../../../data/models/expense_model.dart';
import '../../../data/models/milestone_model.dart';
import '../../../data/models/project_model.dart';
import '../../../data/models/report_model.dart';
import '../../../data/models/task_model.dart';
import '../../../data/services/attachment_service.dart';
import '../../../data/services/expense_service.dart';
import '../../../data/services/milestone_service.dart';
import '../../../data/services/project_service.dart';
import '../../../data/services/report_service.dart';
import '../../../data/services/task_service.dart';
import '../../widgets/loading_indicator.dart';

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

  void _showEditProjectSheet(ProjectModel project) {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      builder: (sheetContext) {
        return Padding(
          padding: EdgeInsets.only(
            bottom: MediaQuery.viewInsetsOf(sheetContext).bottom,
          ),
          child: _EditProjectForm(
            project: project,
            onSubmitted: () {
              if (!mounted) return;
              setState(() => _future = _load());
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Project updated')),
              );
            },
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final currency = NumberFormat.currency(symbol: '\$');

    return Scaffold(
      appBar: AppBar(
        title: const Text('Project Detail'),
        actions: [
          FutureBuilder<_Bundle>(
            future: _future,
            builder: (context, snap) {
              if (!snap.hasData) return const SizedBox.shrink();
              return IconButton(
                icon: const Icon(Icons.edit_outlined),
                tooltip: 'Edit project',
                onPressed: () => _showEditProjectSheet(snap.data!.project),
              );
            },
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          setState(() => _future = _load());
          await _future;
        },
        child: FutureBuilder<_Bundle>(
          future: _future,
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return const LoadingIndicator(message: 'Loading project...');
            }

            if (snapshot.hasError) {
              return ListView(
                physics: const AlwaysScrollableScrollPhysics(),
                children: const [
                  SizedBox(height: 120),
                  Center(
                    child: Column(
                      children: [
                        Icon(Icons.folder_open, size: 48, color: Color(0xFFD1D5DB)),
                        SizedBox(height: 12),
                        Text('Project not found.', style: TextStyle(fontSize: 16)),
                      ],
                    ),
                  ),
                ],
              );
            }

            final data = snapshot.data!;
            final completedTasks =
                data.tasks.where((t) => t.status == 'done').length;
            final totalExpenses =
                data.expenses.fold<double>(0, (s, e) => s + e.amount);
            final approvedExpenses = data.expenses
                .where((e) => e.status == 'approved')
                .fold<double>(0, (s, e) => s + e.amount);
            final completedMilestones =
                data.milestones.where((m) => m.status == 'completed').length;
            final budget = data.project.budget;
            final remaining = budget > 0 ? budget - approvedExpenses : 0.0;
            final budgetPct = budget > 0 ? (approvedExpenses / budget * 100).clamp(0, 100) : 0.0;

            return ListView(
              padding: const EdgeInsets.all(16),
              children: [
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
                              value: currency.format(budget),
                            ),
                            _InfoChip(
                              label: 'Given',
                              value: currency.format(approvedExpenses),
                            ),
                            _InfoChip(
                              label: 'Remaining',
                              value: currency.format(remaining),
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
                          ],
                        ),
                        if (budget > 0) ...[
                          const SizedBox(height: 16),
                          ClipRRect(
                            borderRadius: BorderRadius.circular(6),
                            child: LinearProgressIndicator(
                              value: budgetPct / 100,
                              minHeight: 8,
                              backgroundColor: const Color(0xFFE5E7EB),
                              color: approvedExpenses > budget
                                  ? Colors.red
                                  : approvedExpenses > budget * 0.8
                                      ? Colors.orange
                                      : Colors.green,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            '${budgetPct.toStringAsFixed(0)}% of budget used',
                            style: const TextStyle(fontSize: 12, color: Color(0xFF9CA3AF)),
                          ),
                        ],
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
                const SizedBox(height: 16),

                // Files
                _FilesSection(projectId: widget.projectId),
              ],
            );
          },
        ),
      ),
    );
  }
}

class _FilesSection extends StatefulWidget {
  const _FilesSection({required this.projectId});
  final String projectId;

  @override
  State<_FilesSection> createState() => _FilesSectionState();
}

class _FilesSectionState extends State<_FilesSection> {
  List<AttachmentModel> _files = [];
  bool _loading = true;
  bool _uploading = false;

  @override
  void initState() {
    super.initState();
    _loadFiles();
  }

  Future<void> _loadFiles() async {
    final files = await AttachmentService.instance.getByEntity(
      'project',
      widget.projectId,
    );
    if (mounted) setState(() { _files = files; _loading = false; });
  }

  Future<void> _pickAndUpload() async {
    final result = await FilePicker.platform.pickFiles(allowMultiple: true);
    if (result == null || result.files.isEmpty) return;

    setState(() => _uploading = true);
    try {
      for (final file in result.files) {
        if (file.path == null) continue;
        final attachment = await AttachmentService.instance.upload(
          file.path!,
          file.name,
          'project',
          widget.projectId,
        );
        if (mounted) setState(() => _files.add(attachment));
      }
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Files uploaded successfully')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Upload failed: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _uploading = false);
    }
  }

  Future<void> _download(AttachmentModel attachment) async {
    try {
      final url = await AttachmentService.instance.getDownloadUrl(attachment.id);
      final target = url.isNotEmpty ? url : attachment.url;
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

  Future<void> _delete(AttachmentModel attachment) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete file?'),
        content: Text('Are you sure you want to delete "${attachment.filename}"?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Delete', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );
    if (confirmed != true) return;

    try {
      await AttachmentService.instance.delete(attachment.id);
      if (mounted) {
        setState(() => _files.removeWhere((f) => f.id == attachment.id));
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('File deleted')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to delete: $e')),
        );
      }
    }
  }

  IconData _iconForMime(String? mime) {
    if (mime == null) return Icons.insert_drive_file;
    if (mime.startsWith('image/')) return Icons.image;
    if (mime.contains('pdf')) return Icons.picture_as_pdf;
    if (mime.contains('spreadsheet') || mime.contains('excel')) return Icons.table_chart;
    if (mime.contains('word') || mime.contains('document')) return Icons.description;
    return Icons.insert_drive_file;
  }

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('Files', style: Theme.of(context).textTheme.titleMedium),
                _uploading
                    ? const SizedBox(
                        width: 24,
                        height: 24,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : IconButton(
                        icon: const Icon(Icons.upload_file),
                        tooltip: 'Upload files',
                        onPressed: _pickAndUpload,
                      ),
              ],
            ),
            const SizedBox(height: 12),
            if (_loading)
              const Center(child: CircularProgressIndicator(strokeWidth: 2))
            else if (_files.isEmpty)
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 16),
                child: Center(
                  child: Text(
                    'No files yet. Tap the upload button to add files.',
                    style: TextStyle(color: Color(0xFF9CA3AF)),
                  ),
                ),
              )
            else
              ..._files.map((file) => ListTile(
                    contentPadding: EdgeInsets.zero,
                    leading: Icon(
                      _iconForMime(file.mimeType),
                      color: Theme.of(context).colorScheme.primary,
                    ),
                    title: Text(
                      file.filename,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    subtitle: Text(
                      [
                        if (file.sizeLabel.isNotEmpty) file.sizeLabel,
                        if (file.createdAt != null)
                          DateFormat.yMd().format(DateTime.parse(file.createdAt!)),
                      ].join(' • '),
                      style: const TextStyle(fontSize: 12),
                    ),
                    trailing: PopupMenuButton<String>(
                      onSelected: (value) {
                        if (value == 'download') _download(file);
                        if (value == 'delete') _delete(file);
                      },
                      itemBuilder: (_) => [
                        const PopupMenuItem(value: 'download', child: Text('Download')),
                        const PopupMenuItem(value: 'delete', child: Text('Delete', style: TextStyle(color: Colors.red))),
                      ],
                    ),
                  )),
          ],
        ),
      ),
    );
  }
}

class _EditProjectForm extends StatefulWidget {
  const _EditProjectForm({
    required this.project,
    required this.onSubmitted,
  });

  final ProjectModel project;
  final VoidCallback onSubmitted;

  @override
  State<_EditProjectForm> createState() => _EditProjectFormState();
}

class _EditProjectFormState extends State<_EditProjectForm> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _nameController;
  late final TextEditingController _descriptionController;
  late final TextEditingController _locationController;
  late final TextEditingController _budgetController;
  late String _industry;
  late String _status;
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

  static DateTime? _parseProjectDate(String? raw) {
    if (raw == null || raw.isEmpty) return null;
    final iso = DateTime.tryParse(raw);
    if (iso != null) return iso;
    try {
      return DateFormat('yyyy-MM-dd').parse(raw);
    } catch (_) {
      return null;
    }
  }

  @override
  void initState() {
    super.initState();
    final p = widget.project;
    _nameController = TextEditingController(text: p.name);
    _descriptionController =
        TextEditingController(text: p.description ?? '');
    _locationController = TextEditingController(text: p.location ?? '');
    _budgetController = TextEditingController(
      text: p.budget == 0 ? '' : p.budget.toString(),
    );
    _industry =
        _industryValues.contains(p.industry) ? p.industry : 'other';
    _status = _statusValues.contains(p.status) ? p.status : 'planning';
    _startDate = _parseProjectDate(p.startDate);
    _endDate = _parseProjectDate(p.endDate);
  }

  @override
  void dispose() {
    _nameController.dispose();
    _descriptionController.dispose();
    _locationController.dispose();
    _budgetController.dispose();
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
        if (_startDate != null)
          'startDate': DateFormat('yyyy-MM-dd').format(_startDate!),
        if (_endDate != null)
          'endDate': DateFormat('yyyy-MM-dd').format(_endDate!),
      };
      await ProjectService.instance.update(widget.project.id, data);
      if (!mounted) return;
      Navigator.of(context).pop();
      widget.onSubmitted();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to update project: $e')),
      );
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
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
            Text(
              'Edit project',
              style: Theme.of(context).textTheme.titleLarge,
            ),
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
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
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
                  : const Text('Save changes'),
            ),
          ],
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
