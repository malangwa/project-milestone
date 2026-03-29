import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../../data/models/audit_log_model.dart';
import '../../../data/services/audit_log_service.dart';
import '../../../data/services/session_controller.dart';
import '../../widgets/empty_state.dart';
import '../../widgets/loading_indicator.dart';

class AuditLogsPage extends StatefulWidget {
  const AuditLogsPage({super.key});

  @override
  State<AuditLogsPage> createState() => _AuditLogsPageState();
}

class _AuditLogsPageState extends State<AuditLogsPage> {
  late Future<List<AuditLogModel>> _future;
  String _query = '';
  String _actionFilter = 'all';

  @override
  void initState() {
    super.initState();
    _future = _loadLogs();
  }

  Future<List<AuditLogModel>> _loadLogs() async {
    try {
      return await AuditLogService.instance.getAll();
    } catch (_) {
      return [];
    }
  }

  @override
  Widget build(BuildContext context) {
    final me = SessionController.instance.currentUser;
    if (me?.role != 'admin') {
      return const EmptyState(
        icon: Icons.lock_outline,
        title: 'You don\'t have permission to view this page.',
      );
    }

    final dateFormat = DateFormat('MMM d, h:mm a');

    return FutureBuilder<List<AuditLogModel>>(
      future: _future,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const LoadingIndicator(message: 'Loading audit logs...');
        }
        final allLogs = snapshot.data ?? [];
        final actions = {'all', ...allLogs.map((l) => l.action)}.toList()..sort();

        final term = _query.trim().toLowerCase();
        final filtered = allLogs.where((log) {
          if (_actionFilter != 'all' && log.action != _actionFilter) return false;
          if (term.isEmpty) return true;
          return [log.action, log.entityType, log.entityId, log.userName, log.userEmail]
              .where((v) => v != null)
              .any((v) => v!.toLowerCase().contains(term));
        }).toList();

        return Column(
          children: [
            Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      decoration: const InputDecoration(
                        hintText: 'Search logs...',
                        prefixIcon: Icon(Icons.search),
                        border: OutlineInputBorder(),
                        isDense: true,
                      ),
                      onChanged: (v) => setState(() => _query = v),
                    ),
                  ),
                  const SizedBox(width: 8),
                  SizedBox(
                    width: 130,
                    child: DropdownButtonFormField<String>(
                      value: _actionFilter,
                      decoration: const InputDecoration(border: OutlineInputBorder(), isDense: true),
                      isExpanded: true,
                      items: actions.map((a) => DropdownMenuItem(value: a, child: Text(a == 'all' ? 'All' : a, overflow: TextOverflow.ellipsis))).toList(),
                      onChanged: (v) => setState(() => _actionFilter = v ?? 'all'),
                    ),
                  ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Row(
                children: [
                  _StatCard(label: 'Events', value: '${allLogs.length}', color: Colors.grey),
                  const SizedBox(width: 8),
                  _StatCard(label: 'Approvals', value: '${allLogs.where((l) => l.action == 'approve').length}', color: Colors.blue),
                ],
              ),
            ),
            const SizedBox(height: 8),
            Expanded(
              child: filtered.isEmpty
                  ? const EmptyState(
                      icon: Icons.receipt_long_outlined,
                      title: 'No audit events matched the current filters.',
                    )
                  : RefreshIndicator(
                      onRefresh: () async {
                        setState(() => _future = _loadLogs());
                        await _future;
                      },
                      child: ListView.separated(
                        padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                        itemCount: filtered.length,
                        separatorBuilder: (_, _) => const SizedBox(height: 6),
                        itemBuilder: (context, index) {
                          final log = filtered[index];
                          String? timeStr;
                          if (log.createdAt != null) {
                            final parsed = DateTime.tryParse(log.createdAt!);
                            if (parsed != null) timeStr = dateFormat.format(parsed.toLocal());
                          }

                          return Card(
                            child: ExpansionTile(
                              tilePadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                              title: Row(
                                children: [
                                  Chip(
                                    label: Text(log.action),
                                    backgroundColor: Colors.grey.withValues(alpha: 0.1),
                                    labelStyle: const TextStyle(fontSize: 11),
                                    side: BorderSide.none,
                                    materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                                    visualDensity: VisualDensity.compact,
                                  ),
                                  const SizedBox(width: 6),
                                  Chip(
                                    label: Text(log.entityType),
                                    backgroundColor: Colors.blue.withValues(alpha: 0.1),
                                    labelStyle: const TextStyle(fontSize: 11, color: Colors.blue),
                                    side: BorderSide.none,
                                    materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                                    visualDensity: VisualDensity.compact,
                                  ),
                                ],
                              ),
                              subtitle: Text(
                                [
                                  log.userName ?? 'System',
                                  if (timeStr != null) timeStr,
                                ].join(' · '),
                                style: const TextStyle(fontSize: 11),
                              ),
                              children: [
                                if (log.before != null || log.after != null)
                                  Padding(
                                    padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                                    child: Row(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Expanded(
                                          child: _JsonBlock(
                                            title: 'Before',
                                            data: log.before,
                                          ),
                                        ),
                                        const SizedBox(width: 8),
                                        Expanded(
                                          child: _JsonBlock(
                                            title: 'After',
                                            data: log.after,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                              ],
                            ),
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

class _StatCard extends StatelessWidget {
  const _StatCard({required this.label, required this.value, required this.color});
  final String label;
  final String value;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label, style: TextStyle(fontSize: 12, color: color)),
              const SizedBox(height: 4),
              Text(value, style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: color)),
            ],
          ),
        ),
      ),
    );
  }
}

class _JsonBlock extends StatelessWidget {
  const _JsonBlock({required this.title, this.data});
  final String title;
  final Map<String, dynamic>? data;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: const Color(0xFFF9FAFB),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: const Color(0xFFE5E7EB)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: Color(0xFF6B7280))),
          const SizedBox(height: 4),
          Text(
            data != null ? const JsonEncoder.withIndent('  ').convert(data) : 'No data',
            style: const TextStyle(fontSize: 10, fontFamily: 'monospace', color: Color(0xFF374151)),
          ),
        ],
      ),
    );
  }
}
