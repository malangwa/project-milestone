import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../../data/models/project_model.dart';
import '../../../data/models/resource_model.dart';
import '../../../data/services/project_service.dart';
import '../../../data/services/resource_service.dart';
import '../../widgets/empty_state.dart';
import '../../widgets/loading_indicator.dart';

class ResourcesPage extends StatefulWidget {
  const ResourcesPage({super.key});

  @override
  State<ResourcesPage> createState() => _ResourcesPageState();
}

class _ResourcesPageState extends State<ResourcesPage> {
  late Future<List<ProjectModel>> _projectsFuture;
  List<ResourceModel> _resources = [];
  bool _loadingResources = false;
  String? _selectedProjectId;

  static const _types = ['human', 'equipment', 'material', 'software', 'other'];

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
        _loadResources(projects.first.id);
      }
      return projects;
    } catch (_) {
      return [];
    }
  }

  Future<void> _loadResources(String projectId) async {
    setState(() => _loadingResources = true);
    try {
      final resources = await ResourceService.instance.getByProject(projectId);
      setState(() => _resources = resources);
    } catch (_) {
      setState(() => _resources = []);
    } finally {
      setState(() => _loadingResources = false);
    }
  }

  void _onProjectChanged(String? id) {
    if (id == null) return;
    setState(() => _selectedProjectId = id);
    _loadResources(id);
  }

  Color _typeColor(String? type) {
    return switch (type) {
      'human' => Colors.blue,
      'equipment' => Colors.orange,
      'material' => Colors.green,
      'software' => Colors.purple,
      _ => Colors.grey,
    };
  }

  Future<void> _showForm({ResourceModel? existing}) async {
    final nameCtl = TextEditingController(text: existing?.name ?? '');
    final roleCtl = TextEditingController(text: existing?.role ?? '');
    final qtyCtl = TextEditingController(text: '${existing?.quantity ?? 1}');
    final costCtl = TextEditingController(text: existing?.costPerUnit != null ? '${existing!.costPerUnit}' : '');
    final unitCtl = TextEditingController(text: existing?.unit ?? '');
    final notesCtl = TextEditingController(text: existing?.notes ?? '');
    String selectedType = existing?.type ?? 'human';

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          title: Text(existing != null ? 'Edit Resource' : 'Add Resource'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(controller: nameCtl, decoration: const InputDecoration(labelText: 'Name *')),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  value: selectedType,
                  decoration: const InputDecoration(labelText: 'Type'),
                  items: _types.map((t) => DropdownMenuItem(value: t, child: Text(t))).toList(),
                  onChanged: (v) => setDialogState(() => selectedType = v ?? 'human'),
                ),
                const SizedBox(height: 12),
                TextField(controller: roleCtl, decoration: const InputDecoration(labelText: 'Role')),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(child: TextField(controller: qtyCtl, decoration: const InputDecoration(labelText: 'Qty'), keyboardType: TextInputType.number)),
                    const SizedBox(width: 12),
                    Expanded(child: TextField(controller: costCtl, decoration: const InputDecoration(labelText: 'Cost/Unit'), keyboardType: TextInputType.number)),
                  ],
                ),
                const SizedBox(height: 12),
                TextField(controller: unitCtl, decoration: const InputDecoration(labelText: 'Unit (e.g. hr, day)')),
                const SizedBox(height: 12),
                TextField(controller: notesCtl, decoration: const InputDecoration(labelText: 'Notes'), maxLines: 2),
              ],
            ),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
            FilledButton(onPressed: () => Navigator.pop(ctx, true), child: Text(existing != null ? 'Update' : 'Add')),
          ],
        ),
      ),
    );

    if (confirmed != true || _selectedProjectId == null) return;
    if (nameCtl.text.trim().isEmpty) return;

    final body = <String, dynamic>{
      'name': nameCtl.text.trim(),
      'type': selectedType,
      'projectId': _selectedProjectId,
    };
    if (roleCtl.text.trim().isNotEmpty) body['role'] = roleCtl.text.trim();
    if (qtyCtl.text.trim().isNotEmpty) body['quantity'] = double.tryParse(qtyCtl.text.trim());
    if (costCtl.text.trim().isNotEmpty) body['costPerUnit'] = double.tryParse(costCtl.text.trim());
    if (unitCtl.text.trim().isNotEmpty) body['unit'] = unitCtl.text.trim();
    if (notesCtl.text.trim().isNotEmpty) body['notes'] = notesCtl.text.trim();

    try {
      if (existing != null) {
        await ResourceService.instance.update(existing.id, body);
      } else {
        await ResourceService.instance.create(body);
      }
      _loadResources(_selectedProjectId!);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed: $e')));
      }
    }
  }

  Future<void> _delete(String id) async {
    await ResourceService.instance.remove(id);
    setState(() => _resources.removeWhere((r) => r.id == id));
  }

  @override
  Widget build(BuildContext context) {
    final currency = NumberFormat.currency(symbol: '\$');

    return FutureBuilder<List<ProjectModel>>(
      future: _projectsFuture,
      builder: (context, projectSnap) {
        if (projectSnap.connectionState == ConnectionState.waiting) {
          return const LoadingIndicator(message: 'Loading resources...');
        }
        final projects = projectSnap.data ?? [];
        if (projectSnap.hasError || projects.isEmpty) {
          return EmptyState(
            icon: Icons.folder_open,
            title: 'No projects yet.',
            subtitle: 'Create your first project to manage resources',
            onRetry: () => setState(() => _projectsFuture = _loadProjects()),
          );
        }

        return Column(
          children: [
            Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  Expanded(
                    child: DropdownButtonFormField<String>(
                      value: _selectedProjectId,
                      decoration: const InputDecoration(labelText: 'Project', border: OutlineInputBorder()),
                      items: projects.map((p) => DropdownMenuItem(value: p.id, child: Text(p.name))).toList(),
                      onChanged: _onProjectChanged,
                    ),
                  ),
                  const SizedBox(width: 8),
                  FilledButton.tonalIcon(
                    onPressed: () => _showForm(),
                    icon: const Icon(Icons.add),
                    label: const Text('Add'),
                  ),
                ],
              ),
            ),
            Expanded(
              child: _loadingResources
                  ? const LoadingIndicator(message: 'Loading resources...')
                  : _resources.isEmpty
                      ? const EmptyState(
                          icon: Icons.build_outlined,
                          title: 'No resources assigned to this project yet.',
                        )
                      : ListView(
                          padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                          children: [
                            Card(
                              color: const Color(0xFFF0FDF4),
                              child: Padding(
                                padding: const EdgeInsets.all(16),
                                child: Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    const Text('Total Cost', style: TextStyle(fontWeight: FontWeight.w600)),
                                    Text(
                                      currency.format(_resources.fold<double>(0, (s, r) => s + (r.costPerUnit ?? 0) * (r.quantity ?? 1))),
                                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                            const SizedBox(height: 8),
                            ..._resources.map((r) {
                              final total = (r.costPerUnit ?? 0) * (r.quantity ?? 1);
                              final color = _typeColor(r.type);
                              return Card(
                                child: ListTile(
                                  contentPadding: const EdgeInsets.all(14),
                                  leading: CircleAvatar(
                                    backgroundColor: color.withValues(alpha: 0.14),
                                    child: Text(
                                      (r.type ?? 'o')[0].toUpperCase(),
                                      style: TextStyle(color: color, fontWeight: FontWeight.bold),
                                    ),
                                  ),
                                  title: Text(r.name),
                                  subtitle: Text([
                                    r.type ?? '',
                                    if (r.role?.isNotEmpty == true) r.role!,
                                    '${r.quantity ?? 1} ${r.unit ?? ''}',
                                    if (r.costPerUnit != null) currency.format(total),
                                  ].join(' · '), style: const TextStyle(fontSize: 12)),
                                  trailing: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      IconButton(icon: const Icon(Icons.edit_outlined, size: 20), onPressed: () => _showForm(existing: r)),
                                      IconButton(icon: const Icon(Icons.delete_outline, size: 20, color: Colors.red), onPressed: () => _delete(r.id)),
                                    ],
                                  ),
                                ),
                              );
                            }),
                          ],
                        ),
            ),
          ],
        );
      },
    );
  }
}
