import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../../data/models/expense_model.dart';
import '../../../data/models/project_model.dart';
import '../../../data/services/expense_service.dart';
import '../../../data/services/project_service.dart';
import '../../../data/services/session_controller.dart';
import '../../widgets/empty_state.dart';
import '../../widgets/loading_indicator.dart';

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
    try {
      final projects = await ProjectService.instance.getProjects();
      if (projects.isNotEmpty && _selectedProjectId == null) {
        _selectedProjectId = projects.first.id;
        _expensesFuture =
            ExpenseService.instance.getByProject(_selectedProjectId!);
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
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              action == 'approve'
                  ? 'Expense approved'
                  : 'Expense rejected',
            ),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to $action expense')),
        );
      }
    }
  }

  void _refreshExpenses() {
    if (_selectedProjectId == null) return;
    setState(() {
      _expensesFuture =
          ExpenseService.instance.getByProject(_selectedProjectId!);
    });
  }

  Future<void> _confirmDeleteExpense(ExpenseModel expense) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete expense'),
        content: const Text(
          'Are you sure you want to delete this expense? This cannot be undone.',
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
      await ExpenseService.instance.delete(expense.id);
      _refreshExpenses();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Expense deleted')),
        );
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to delete expense')),
        );
      }
    }
  }

  void _showCreateExpenseSheet(BuildContext pageContext) {
    final projectId = _selectedProjectId;
    if (projectId == null) return;

    final titleCtrl = TextEditingController();
    final amountCtrl = TextEditingController();
    final notesCtrl = TextEditingController();
    final formKey = GlobalKey<FormState>();
    var category = 'labor';
    var selectedDate = DateTime.now();

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
                        'New expense',
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
                        controller: amountCtrl,
                        keyboardType: const TextInputType.numberWithOptions(
                          decimal: true,
                        ),
                        decoration: const InputDecoration(
                          labelText: 'Amount',
                          border: OutlineInputBorder(),
                        ),
                        validator: (v) {
                          if (v == null || v.trim().isEmpty) {
                            return 'Amount is required';
                          }
                          if (double.tryParse(v.trim()) == null) {
                            return 'Enter a valid number';
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 12),
                      DropdownButtonFormField<String>(
                        key: ValueKey(category),
                        initialValue: category,
                        decoration: const InputDecoration(
                          labelText: 'Category',
                          border: OutlineInputBorder(),
                        ),
                        items: const [
                          DropdownMenuItem(
                            value: 'labor',
                            child: Text('Labor'),
                          ),
                          DropdownMenuItem(
                            value: 'material',
                            child: Text('Material'),
                          ),
                          DropdownMenuItem(
                            value: 'equipment',
                            child: Text('Equipment'),
                          ),
                          DropdownMenuItem(
                            value: 'travel',
                            child: Text('Travel'),
                          ),
                          DropdownMenuItem(
                            value: 'other',
                            child: Text('Other'),
                          ),
                        ],
                        onChanged: (v) {
                          if (v != null) {
                            setModalState(() => category = v);
                          }
                        },
                      ),
                      const SizedBox(height: 8),
                      ListTile(
                        contentPadding: EdgeInsets.zero,
                        title: const Text('Date'),
                        subtitle: Text(
                          DateFormat.yMMMd().format(selectedDate),
                        ),
                        trailing: const Icon(Icons.calendar_today),
                        onTap: () async {
                          final picked = await showDatePicker(
                            context: modalContext,
                            initialDate: selectedDate,
                            firstDate: DateTime(2000),
                            lastDate: DateTime(2100),
                          );
                          if (picked != null) {
                            setModalState(() => selectedDate = picked);
                          }
                        },
                      ),
                      const SizedBox(height: 8),
                      TextFormField(
                        controller: notesCtrl,
                        decoration: const InputDecoration(
                          labelText: 'Notes',
                          border: OutlineInputBorder(),
                        ),
                        maxLines: 3,
                      ),
                      const SizedBox(height: 20),
                      FilledButton(
                        onPressed: () async {
                          if (formKey.currentState?.validate() != true) {
                            return;
                          }
                          final amount = double.parse(amountCtrl.text.trim());
                          final body = <String, dynamic>{
                            'projectId': projectId,
                            'title': titleCtrl.text.trim(),
                            'amount': amount,
                            'category': category,
                            'date': DateFormat('yyyy-MM-dd').format(
                              selectedDate,
                            ),
                          };
                          final notes = notesCtrl.text.trim();
                          if (notes.isNotEmpty) {
                            body['notes'] = notes;
                          }
                          try {
                            await ExpenseService.instance.create(body);
                            if (sheetContext.mounted) {
                              Navigator.pop(sheetContext);
                            }
                            if (!mounted) return;
                            _refreshExpenses();
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text('Expense created'),
                              ),
                            );
                          } catch (_) {
                            if (mounted) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                  content: Text('Failed to create expense'),
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
      amountCtrl.dispose();
      notesCtrl.dispose();
    });
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
          return const LoadingIndicator(message: 'Loading expenses...');
        }
        final projects = projectSnapshot.data ?? const <ProjectModel>[];
        if (projectSnapshot.hasError || projects.isEmpty) {
          return EmptyState(
            icon: Icons.folder_open,
            title: 'No projects yet.',
            subtitle: 'Create your first project to track expenses',
            onRetry: () => setState(() => _projectsFuture = _loadProjects()),
          );
        }

        return Scaffold(
          floatingActionButton: _selectedProjectId != null
              ? FloatingActionButton(
                  onPressed: () => _showCreateExpenseSheet(context),
                  tooltip: 'New expense',
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
                      .map(
                        (p) => DropdownMenuItem(
                          value: p.id,
                          child: Text(p.name),
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
                      _expensesFuture = ExpenseService.instance
                          .getByProject(_selectedProjectId!);
                    });
                    await _expensesFuture;
                  },
                child: FutureBuilder<List<ExpenseModel>>(
                  future: _expensesFuture,
                  builder: (context, snapshot) {
                    if (snapshot.connectionState == ConnectionState.waiting) {
                      return const LoadingIndicator(message: 'Loading expenses...');
                    }
                    final expenses = snapshot.data ?? const <ExpenseModel>[];
                    if (snapshot.hasError || expenses.isEmpty) {
                      return ListView(
                        physics: const AlwaysScrollableScrollPhysics(),
                        children: [
                          EmptyState(
                            icon: Icons.receipt_long_outlined,
                            title: 'No expenses for this project.',
                            onRetry: _selectedProjectId == null ? null : () {
                              setState(() {
                                _expensesFuture = ExpenseService.instance
                                    .getByProject(_selectedProjectId!);
                              });
                            },
                          ),
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
                              title: Text(
                                (expense.title ?? '').trim().isNotEmpty
                                    ? expense.title!.trim()
                                    : expense.category,
                              ),
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
                              trailing: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  _ExpenseStatusChip(
                                    status: expense.status,
                                  ),
                                  PopupMenuButton<String>(
                                    icon: const Icon(Icons.more_vert),
                                    onSelected: (value) {
                                      if (value == 'delete') {
                                        _confirmDeleteExpense(expense);
                                      }
                                    },
                                    itemBuilder: (ctx) => [
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
