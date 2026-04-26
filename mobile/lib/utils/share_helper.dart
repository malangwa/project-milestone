import 'package:share_plus/share_plus.dart';
import 'package:intl/intl.dart';

import '../data/models/expense_model.dart';
import '../data/models/material_request_model.dart';

class ShareHelper {
  static String _formatDate(String? dateStr) {
    if (dateStr == null) return '';
    final date = DateTime.tryParse(dateStr);
    if (date == null) return dateStr;
    return DateFormat('MMM d, y').format(date);
  }

  static String _formatCurrency(double amount) {
    return '\$${amount.toStringAsFixed(2)}';
  }

  static String _capitalize(String? text) {
    if (text == null || text.isEmpty) return '';
    return text[0].toUpperCase() + text.substring(1);
  }

  static Future<void> shareExpense(ExpenseModel expense, {String? projectName}) async {
    final lines = <String>[
      expense.title ?? expense.category,
      'Expense',
      if (expense.status != null) 'Status: ${_capitalize(expense.status)}',
      if (projectName != null) 'Project: $projectName',
      if (expense.submittedByName != null) 'Submitted by: ${expense.submittedByName}',
      if (expense.date != null) 'Date: ${_formatDate(expense.date)}',
      if (expense.category.isNotEmpty) 'Category: ${_capitalize(expense.category)}',
      '',
      'Amount: ${_formatCurrency(expense.amount)}',
      if (expense.description?.isNotEmpty == true) '\nNotes: ${expense.description}',
    ].where((line) => line.isNotEmpty);

    final text = lines.join('\n');
    await Share.share(text, subject: expense.title ?? 'Expense');
  }

  static Future<void> shareMaterialRequest(
    MaterialRequestModel request, {
    String? projectName,
  }) async {
    final lines = <String>[
      request.title,
      'Material Request',
      if (request.status != null) 'Status: ${_capitalize(request.status)}',
      if (projectName != null) 'Project: $projectName',
      if (request.requestedByName != null) 'Requested by: ${request.requestedByName}',
      'Date: ${_formatDate(request.createdAt)}',
      if (request.purpose?.isNotEmpty == true) 'Purpose: ${request.purpose}',
      '',
      ...(request.items ?? []).map(
        (item) => '• ${item.name} — ${item.quantity}${item.unit != null ? ' ${item.unit}' : ''}${item.estimatedCost != null ? ' @ ${_formatCurrency(item.estimatedCost!)}' : ''}',
      ),
      if (request.requestedAmount != null) '\nTotal: ${_formatCurrency(request.requestedAmount!)}',
      if (request.notes?.isNotEmpty == true) '\nNotes: ${request.notes}',
    ].where((line) => line.isNotEmpty);

    final text = lines.join('\n');
    await Share.share(text, subject: request.title);
  }
}
