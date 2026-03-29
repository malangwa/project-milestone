import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../../data/models/project_model.dart';
import '../../../data/models/time_entry_model.dart';
import '../../../data/services/project_service.dart';
import '../../../data/services/time_tracking_service.dart';
import '../../widgets/empty_state.dart';
import '../../widgets/loading_indicator.dart';

class TimeTrackingPage extends StatefulWidget {
  const TimeTrackingPage({super.key});

  @override
  State<TimeTrackingPage> createState() => _TimeTrackingPageState();
}

class _TimeTrackingPageState extends State<TimeTrackingPage> {
  late Future<List<ProjectModel>> _projectsFuture;
  List<TimeEntryModel> _entries = [];
  double _total = 0;
  bool _loadingEntries = false;
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
        _loadEntries(projects.first.id);
      }
      return projects;
    } catch (_) {
      return [];
    }
  }

  Future<void> _loadEntries(String projectId) async {
    setState(() => _loadingEntries = true);
    try {
      final entries = await TimeTrackingService.instance.getByProject(projectId);
      final total = await TimeTrackingService.instance.getProjectTotal(projectId);
      setState(() { _entries = entries; _total = total; });
    } catch (_) {
      setState(() { _entries = []; _total = 0; });
    } finally {
      setState(() => _loadingEntries = false);
    }
  }

  void _onProjectChanged(String? id) {
    if (id == null) return;
    setState(() => _selectedProjectId = id);
    _loadEntries(id);
  }

  Future<void> _showLogDialog() async {
    final hoursCtl = TextEditingController();
    final descCtl = TextEditingController();
    final dateCtl = TextEditingController(text: DateFormat('yyyy-MM-dd').format(DateTime.now()));

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Log Hours'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(controller: hoursCtl, decoration: const InputDecoration(labelText: 'Hours *'), keyboardType: TextInputType.number),
            const SizedBox(height: 12),
            TextField(controller: dateCtl, decoration: const InputDecoration(labelText: 'Date (yyyy-mm-dd)')),
            const SizedBox(height: 12),
            TextField(controller: descCtl, decoration: const InputDecoration(labelText: 'Description'), maxLines: 2),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          FilledButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Log')),
        ],
      ),
    );

    if (confirmed != true || _selectedProjectId == null) return;
    final hours = double.tryParse(hoursCtl.text.trim());
    if (hours == null || hours <= 0) return;

    try {
      final body = <String, dynamic>{
        'projectId': _selectedProjectId,
        'hours': hours,
        'date': dateCtl.text.trim(),
      };
      final desc = descCtl.text.trim();
      if (desc.isNotEmpty) body['description'] = desc;

      await TimeTrackingService.instance.create(body);
      _loadEntries(_selectedProjectId!);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to log hours: $e')));
      }
    }
  }

  Future<void> _delete(String id) async {
    await TimeTrackingService.instance.remove(id);
    setState(() => _entries.removeWhere((e) => e.id == id));
  }

  @override
  Widget build(BuildContext context) {
    final dateFormat = DateFormat('MMM d, y');

    return FutureBuilder<List<ProjectModel>>(
      future: _projectsFuture,
      builder: (context, projectSnap) {
        if (projectSnap.connectionState == ConnectionState.waiting) {
          return const LoadingIndicator(message: 'Loading time entries...');
        }
        final projects = projectSnap.data ?? [];
        if (projectSnap.hasError || projects.isEmpty) {
          return EmptyState(
            icon: Icons.folder_open,
            title: 'No projects yet.',
            subtitle: 'Create your first project to start tracking time',
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
                    onPressed: _showLogDialog,
                    icon: const Icon(Icons.add),
                    label: const Text('Log'),
                  ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Row(
                children: [
                  Expanded(
                    child: Card(
                      color: const Color(0xFFEFF6FF),
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('Total Hours', style: TextStyle(fontSize: 12, color: Color(0xFF1D4ED8))),
                            const SizedBox(height: 4),
                            Text('${_total.toStringAsFixed(1)}h', style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Color(0xFF1E40AF))),
                          ],
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Card(
                      color: const Color(0xFFF5F3FF),
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('Entries', style: TextStyle(fontSize: 12, color: Color(0xFF7C3AED))),
                            const SizedBox(height: 4),
                            Text('${_entries.length}', style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Color(0xFF6D28D9))),
                          ],
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 8),
            Expanded(
              child: _loadingEntries
                  ? const LoadingIndicator(message: 'Loading time entries...')
                  : _entries.isEmpty
                      ? const EmptyState(
                          icon: Icons.timer_outlined,
                          title: 'No time entries yet for this project.',
                        )
                      : ListView.separated(
                          padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                          itemCount: _entries.length,
                          separatorBuilder: (_, _) => const SizedBox(height: 6),
                          itemBuilder: (context, index) {
                            final e = _entries[index];
                            String? dateStr;
                            if (e.date != null) {
                              final parsed = DateTime.tryParse(e.date!);
                              if (parsed != null) dateStr = dateFormat.format(parsed);
                            }

                            return Card(
                              child: ListTile(
                                contentPadding: const EdgeInsets.all(14),
                                title: Text(e.description?.isNotEmpty == true ? e.description! : 'No description'),
                                subtitle: Text([
                                  if (dateStr != null) dateStr,
                                  if (e.userName != null) e.userName!,
                                ].join(' · '), style: const TextStyle(fontSize: 12)),
                                trailing: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Text('${e.hours.toStringAsFixed(1)}h', style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF1D4ED8), fontSize: 16)),
                                    const SizedBox(width: 8),
                                    IconButton(
                                      icon: const Icon(Icons.delete_outline, size: 20, color: Colors.red),
                                      onPressed: () => _delete(e.id),
                                    ),
                                  ],
                                ),
                              ),
                            );
                          },
                        ),
            ),
          ],
        );
      },
    );
  }
}
