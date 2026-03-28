import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../../data/models/expense_model.dart';
import '../../../data/models/project_model.dart';
import '../../../data/services/expense_service.dart';
import '../../../data/services/project_service.dart';
import '../../../data/services/session_controller.dart';

class ExpenseListPage extends StatefulWidget {
  const ExpenseListPage({super.key});

  @override
  State<ExpenseListPage> createState() => _ExpenseListPageState();
}

class _ExpenseListPageState extends State<ExpenseListPage> {
  late Future<List<ProjectModel>> _projectsFuture;
  Future<List<ExpenseModel>>? _expensesFuture;
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
      _expensesFuture =
          ExpenseService.instance.getByProject(_selectedProjectId!);
    }
    return projects;
  }

  void _onProjectChanged(String? projectId) {
    if (projectId == null) return;
    setState(() {
      _selectedProjectId = projectId;
      _expensesFuture = ExpenseService.instance.getByProject(projectId);
    });
  }

  Future<void> _handleAction(String expenseId, String action) async {
    try {
      if (action == 'approve') {
        await ExpenseService.instance.approve(expenseId);
      } else if (action == 'reject') {
        await ExpenseService.instance.reject(expenseId);
      }
      if (_selectedProjectId != null) {
        setState(() {
          _expensesFuture =
              ExpenseService.instance.getByProject(_selectedProjectId!);
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to $action expense')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final currency = NumberFormat.currency(symbol: '\$');
    final userRole = SessionController.instance.currentUser?.role ?? '';
    final canApprove = userRole == 'admin' || userRole == 'manager';

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
          return const Center(
            child: Text('No projects available.'),
          );
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
                    .map((p) => DropdownMenuItem(value: p.id, child: Text(p.name)))
                    .toList(),
                onChanged: _onProjectChanged,
              ),
            ),
            Expanded(
              child: RefreshIndicator(
                onRefresh: () async {
                  if (_selectedProjectId == null) return;
                  setState(() {
                    _expensesFuture = ExpenseService.instance
                        .getByProject(_selectedProjectId!);
                  });
                  await _expensesFuture;
                },
                child: FutureBuilder<List<ExpenseModel>>(
                  future: _expensesFuture,
                  builder: (context, snapshot) {
                    if (snapshot.connectionState == ConnectionState.waiting) {
                      return const Center(child: CircularProgressIndicator());
                    }
                    if (snapshot.hasError) {
                      return ListView(
                        children: const [
                          SizedBox(height: 160),
                          Center(child: Text('Failed to load expenses')),
                        ],
                      );
                    }

                    final expenses = snapshot.data ?? const <ExpenseModel>[];
                    if (expenses.isEmpty) {
                      return ListView(
                        children: const [
                          SizedBox(height: 160),
                          Center(child: Text('No expenses recorded for this project.')),
                        ],
                      );
                    }

                    final totalAmount = expenses.fold<double>(
                      0,
                      (sum, e) => sum + e.amount,
                    );
                    final pendingCount =
                        expenses.where((e) => e.status == 'pending').length;

                    return ListView(
                      padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: Card(
                                child: Padding(
                                  padding: const EdgeInsets.all(16),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      const Text('Total'),
                                      const SizedBox(height: 4),
                                      Text(
                                        currency.format(totalAmount),
                                        style: Theme.of(context)
                                            .textTheme
                                            .titleLarge
                                            ?.copyWith(
                                              fontWeight: FontWeight.bold,
                                            ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ),
                            Expanded(
                              child: Card(
                                child: Padding(
                                  padding: const EdgeInsets.all(16),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      const Text('Pending'),
                                      const SizedBox(height: 4),
                                      Text(
                                        '$pendingCount',
                                        style: Theme.of(context)
                                            .textTheme
                                            .titleLarge
                                            ?.copyWith(
                                              fontWeight: FontWeight.bold,
                                              color: Colors.orange,
                                            ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        ...expenses.map(
                          (expense) => Card(
                            child: ListTile(
                              contentPadding: const EdgeInsets.all(16),
                              title: Text(expense.category),
                              subtitle: Padding(
                                padding: const EdgeInsets.only(top: 6),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    if ((expense.description ?? '').isNotEmpty)
                                      Text(expense.description!),
                                    const SizedBox(height: 4),
                                    Text(
                                      [
                                        currency.format(expense.amount),
                                        if ((expense.submittedByName ?? '')
                                            .isNotEmpty)
                                          'by ${expense.submittedByName}',
                                      ].join(' • '),
                                    ),
                                    if (canApprove &&
                                        expense.status == 'pending') ...[
                                      const SizedBox(height: 8),
                                      Row(
                                        children: [
                                          FilledButton.tonal(
                                            onPressed: () => _handleAction(
                                                expense.id, 'approve'),
                                            child: const Text('Approve'),
                                          ),
                                          const SizedBox(width: 8),
                                          OutlinedButton(
                                            onPressed: () => _handleAction(
                                                expense.id, 'reject'),
                                            child: const Text('Reject'),
                                          ),
                                        ],
                                      ),
                                    ],
                                  ],
                                ),
                              ),
                              trailing: _ExpenseStatusChip(
                                status: expense.status,
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
        );
      },
    );
  }
}

class _ExpenseStatusChip extends StatelessWidget {
  const _ExpenseStatusChip({required this.status});

  final String status;

  @override
  Widget build(BuildContext context) {
    final (color, label) = switch (status) {
      'approved' => (Colors.green, 'Approved'),
      'rejected' => (Colors.red, 'Rejected'),
      'pending' => (Colors.orange, 'Pending'),
      _ => (Colors.grey, status),
    };

    return Chip(
      label: Text(label),
      side: BorderSide.none,
      backgroundColor: color.withValues(alpha: 0.14),
      labelStyle: TextStyle(color: color, fontSize: 12),
    );
  }
}
