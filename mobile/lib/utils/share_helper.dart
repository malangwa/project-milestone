import 'dart:io';
import 'package:intl/intl.dart';
import 'package:path_provider/path_provider.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:share_plus/share_plus.dart';

import '../data/models/expense_model.dart';
import '../data/models/material_request_model.dart';
import '../data/models/procurement_model.dart';

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

  static Future<File> _savePdf(pw.Document pdf, String filename) async {
    final dir = await getTemporaryDirectory();
    final file = File('${dir.path}/$filename');
    await file.writeAsBytes(await pdf.save());
    return file;
  }

  static Future<void> _sharePdf(File file, String subject) async {
    await Share.shareXFiles(
      [XFile(file.path)],
      subject: subject,
    );
  }

  static pw.Widget _pdfHeader(String title, String subtitle) {
    return pw.Column(
      crossAxisAlignment: pw.CrossAxisAlignment.start,
      children: [
        pw.Text(
          title,
          style: pw.TextStyle(
            fontSize: 22,
            fontWeight: pw.FontWeight.bold,
            color: PdfColor.fromHex('1f2937'),
          ),
        ),
        pw.SizedBox(height: 4),
        pw.Text(
          subtitle,
          style: pw.TextStyle(
            fontSize: 12,
            color: PdfColor.fromHex('6b7280'),
          ),
        ),
        pw.SizedBox(height: 12),
        pw.Divider(color: PdfColor.fromHex('e5e7eb')),
        pw.SizedBox(height: 8),
      ],
    );
  }

  static pw.Widget _pdfFieldRow(String label, String value) {
    return pw.Padding(
      padding: const pw.EdgeInsets.symmetric(vertical: 3),
      child: pw.Row(
        crossAxisAlignment: pw.CrossAxisAlignment.start,
        children: [
          pw.Expanded(
            flex: 2,
            child: pw.Text(
              label,
              style: pw.TextStyle(
                fontSize: 10,
                color: PdfColor.fromHex('6b7280'),
              ),
            ),
          ),
          pw.Expanded(
            flex: 3,
            child: pw.Text(
              value,
              style: pw.TextStyle(
                fontSize: 10,
                fontWeight: pw.FontWeight.bold,
                color: PdfColor.fromHex('1f2937'),
              ),
            ),
          ),
        ],
      ),
    );
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
    final pdf = pw.Document();
    final items = request.items ?? [];

    pdf.addPage(
      pw.Page(
        pageFormat: PdfPageFormat.a4,
        margin: const pw.EdgeInsets.all(24),
        build: (context) => pw.Column(
          crossAxisAlignment: pw.CrossAxisAlignment.start,
          children: [
            _pdfHeader(request.title, 'Material Request'),
            _pdfFieldRow('Status', _capitalize(request.status)),
            if (projectName != null) _pdfFieldRow('Project', projectName),
            if (request.requestedByName != null)
              _pdfFieldRow('Requested by', request.requestedByName!),
            _pdfFieldRow('Date', _formatDate(request.createdAt)),
            if (request.purpose?.isNotEmpty == true)
              _pdfFieldRow('Purpose', request.purpose!),
            pw.SizedBox(height: 16),
            pw.Text(
              'Items',
              style: pw.TextStyle(
                fontSize: 14,
                fontWeight: pw.FontWeight.bold,
                color: PdfColor.fromHex('1f2937'),
              ),
            ),
            pw.SizedBox(height: 8),
            pw.Table(
              border: pw.TableBorder.all(color: PdfColor.fromHex('e5e7eb')),
              columnWidths: {
                0: const pw.FlexColumnWidth(3),
                1: const pw.FlexColumnWidth(1.2),
                2: const pw.FlexColumnWidth(1),
                3: const pw.FlexColumnWidth(1.5),
                4: const pw.FlexColumnWidth(1.5),
              },
              children: [
                pw.TableRow(
                  decoration: pw.BoxDecoration(color: PdfColor.fromHex('f3f4f6')),
                  children: ['Item', 'Qty', 'Unit', 'Unit Price', 'Total']
                      .map(
                        (h) => pw.Padding(
                          padding: const pw.EdgeInsets.all(6),
                          child: pw.Text(
                            h,
                            style: pw.TextStyle(
                              fontSize: 10,
                              fontWeight: pw.FontWeight.bold,
                              color: PdfColor.fromHex('374151'),
                            ),
                          ),
                        ),
                      )
                      .toList(),
                ),
                ...items.map(
                  (item) => pw.TableRow(
                    children: [
                      _cell(item.name),
                      _cell('${item.quantity}'),
                      _cell(item.unit),
                      _cell(_formatCurrency(item.unitPrice)),
                      _cell(_formatCurrency(item.lineTotal)),
                    ],
                  ),
                ),
              ],
            ),
            pw.SizedBox(height: 12),
            pw.Align(
              alignment: pw.Alignment.centerRight,
              child: pw.Text(
                'Total: ${_formatCurrency(request.requestedAmount)}',
                style: pw.TextStyle(
                  fontSize: 12,
                  fontWeight: pw.FontWeight.bold,
                  color: PdfColor.fromHex('1f2937'),
                ),
              ),
            ),
            if (request.notes?.isNotEmpty == true) ...[
              pw.SizedBox(height: 16),
              pw.Text(
                'Notes',
                style: pw.TextStyle(
                  fontSize: 12,
                  fontWeight: pw.FontWeight.bold,
                  color: PdfColor.fromHex('1f2937'),
                ),
              ),
              pw.SizedBox(height: 4),
              pw.Text(
                request.notes!,
                style: pw.TextStyle(
                  fontSize: 10,
                  color: PdfColor.fromHex('4b5563'),
                ),
              ),
            ],
            pw.Spacer(),
            pw.Align(
              alignment: pw.Alignment.center,
              child: pw.Text(
                'Generated by Project Milestone',
                style: pw.TextStyle(
                  fontSize: 8,
                  color: PdfColor.fromHex('9ca3af'),
                ),
              ),
            ),
          ],
        ),
      ),
    );

    final file = await _savePdf(pdf, 'material_request_${request.id}.pdf');
    await _sharePdf(file, request.title);
  }

  static Future<void> sharePurchaseOrder(
    PurchaseOrderModel order, {
    String? projectName,
  }) async {
    final pdf = pw.Document();
    final items = order.items;

    pdf.addPage(
      pw.Page(
        pageFormat: PdfPageFormat.a4,
        margin: const pw.EdgeInsets.all(24),
        build: (context) => pw.Column(
          crossAxisAlignment: pw.CrossAxisAlignment.start,
          children: [
            _pdfHeader(
              order.orderNumber.isNotEmpty ? order.orderNumber : 'Purchase Order',
              'Purchase Order',
            ),
            _pdfFieldRow('Status', _capitalize(order.status)),
            if (projectName != null) _pdfFieldRow('Project', projectName),
            if (order.supplier?.name != null)
              _pdfFieldRow('Supplier', order.supplier!.name),
            _pdfFieldRow('Date', _formatDate(order.createdAt)),
            if (order.notes?.isNotEmpty == true)
              _pdfFieldRow('Notes', order.notes!),
            pw.SizedBox(height: 16),
            pw.Text(
              'Items',
              style: pw.TextStyle(
                fontSize: 14,
                fontWeight: pw.FontWeight.bold,
                color: PdfColor.fromHex('1f2937'),
              ),
            ),
            pw.SizedBox(height: 8),
            pw.Table(
              border: pw.TableBorder.all(color: PdfColor.fromHex('e5e7eb')),
              columnWidths: {
                0: const pw.FlexColumnWidth(3),
                1: const pw.FlexColumnWidth(1.2),
                2: const pw.FlexColumnWidth(1),
                3: const pw.FlexColumnWidth(1.5),
                4: const pw.FlexColumnWidth(1.5),
              },
              children: [
                pw.TableRow(
                  decoration: pw.BoxDecoration(color: PdfColor.fromHex('f3f4f6')),
                  children: ['Item', 'Qty', 'Unit', 'Unit Price', 'Line Total']
                      .map(
                        (h) => pw.Padding(
                          padding: const pw.EdgeInsets.all(6),
                          child: pw.Text(
                            h,
                            style: pw.TextStyle(
                              fontSize: 10,
                              fontWeight: pw.FontWeight.bold,
                              color: PdfColor.fromHex('374151'),
                            ),
                          ),
                        ),
                      )
                      .toList(),
                ),
                ...items.map(
                  (item) => pw.TableRow(
                    children: [
                      _cell(item.name),
                      _cell('${item.quantity}'),
                      _cell(item.unit),
                      _cell(_formatCurrency(item.unitPrice)),
                      _cell(_formatCurrency(item.lineTotal)),
                    ],
                  ),
                ),
              ],
            ),
            pw.SizedBox(height: 12),
            pw.Align(
              alignment: pw.Alignment.centerRight,
              child: pw.Column(
                crossAxisAlignment: pw.CrossAxisAlignment.end,
                children: [
                  _pdfSummaryRow('Subtotal', _formatCurrency(order.subtotal)),
                  _pdfSummaryRow('Tax', _formatCurrency(order.taxAmount)),
                  pw.Divider(color: PdfColor.fromHex('e5e7eb')),
                  _pdfSummaryRow(
                    'Total',
                    _formatCurrency(order.totalAmount),
                    bold: true,
                  ),
                ],
              ),
            ),
            pw.Spacer(),
            pw.Align(
              alignment: pw.Alignment.center,
              child: pw.Text(
                'Generated by Project Milestone',
                style: pw.TextStyle(
                  fontSize: 8,
                  color: PdfColor.fromHex('9ca3af'),
                ),
              ),
            ),
          ],
        ),
      ),
    );

    final file = await _savePdf(pdf, 'purchase_order_${order.id}.pdf');
    await _sharePdf(file, order.orderNumber.isNotEmpty ? order.orderNumber : 'Purchase Order');
  }

  static Future<void> shareSupplierInvoice(
    SupplierInvoiceModel invoice, {
    PurchaseOrderModel? order,
    String? projectName,
  }) async {
    final pdf = pw.Document();

    pdf.addPage(
      pw.Page(
        pageFormat: PdfPageFormat.a4,
        margin: const pw.EdgeInsets.all(24),
        build: (context) => pw.Column(
          crossAxisAlignment: pw.CrossAxisAlignment.start,
          children: [
            _pdfHeader(
              'Invoice #${invoice.invoiceNumber}',
              'Supplier Invoice',
            ),
            _pdfFieldRow('Status', _capitalize(invoice.status)),
            if (projectName != null) _pdfFieldRow('Project', projectName),
            if (order?.orderNumber != null)
              _pdfFieldRow('Purchase Order', order!.orderNumber),
            if (order?.supplier?.name != null)
              _pdfFieldRow('Supplier', order!.supplier!.name),
            _pdfFieldRow('Invoice Date', _formatDate(invoice.invoiceDate)),
            if (invoice.dueDate?.isNotEmpty == true)
              _pdfFieldRow('Due Date', _formatDate(invoice.dueDate)),
            if (invoice.notes?.isNotEmpty == true)
              _pdfFieldRow('Notes', invoice.notes!),
            pw.SizedBox(height: 16),
            pw.Text(
              'Amount Summary',
              style: pw.TextStyle(
                fontSize: 14,
                fontWeight: pw.FontWeight.bold,
                color: PdfColor.fromHex('1f2937'),
              ),
            ),
            pw.SizedBox(height: 8),
            pw.Container(
              padding: const pw.EdgeInsets.all(12),
              decoration: pw.BoxDecoration(
                color: PdfColor.fromHex('f9fafb'),
                borderRadius: pw.BorderRadius.circular(8),
              ),
              child: pw.Column(
                crossAxisAlignment: pw.CrossAxisAlignment.start,
                children: [
                  if (invoice.subtotal != null && invoice.subtotal! > 0)
                    _pdfSummaryRow('Subtotal', _formatCurrency(invoice.subtotal!)),
                  if (invoice.taxAmount != null && invoice.taxAmount! > 0)
                    _pdfSummaryRow('Tax', _formatCurrency(invoice.taxAmount!)),
                  pw.Divider(color: PdfColor.fromHex('e5e7eb')),
                  _pdfSummaryRow(
                    'Total',
                    _formatCurrency(invoice.totalAmount),
                    bold: true,
                  ),
                ],
              ),
            ),
            if (invoice.paidAt?.isNotEmpty == true) ...[
              pw.SizedBox(height: 12),
              pw.Container(
                padding: const pw.EdgeInsets.all(8),
                decoration: pw.BoxDecoration(
                  color: PdfColor.fromHex('d1fae5'),
                  borderRadius: pw.BorderRadius.circular(6),
                ),
                child: pw.Text(
                  'PAID on ${_formatDate(invoice.paidAt)}',
                  style: pw.TextStyle(
                    fontSize: 11,
                    fontWeight: pw.FontWeight.bold,
                    color: PdfColor.fromHex('065f46'),
                  ),
                ),
              ),
            ],
            pw.Spacer(),
            pw.Align(
              alignment: pw.Alignment.center,
              child: pw.Text(
                'Generated by Project Milestone',
                style: pw.TextStyle(
                  fontSize: 8,
                  color: PdfColor.fromHex('9ca3af'),
                ),
              ),
            ),
          ],
        ),
      ),
    );

    final file = await _savePdf(pdf, 'invoice_${invoice.id}.pdf');
    await _sharePdf(file, 'Invoice #${invoice.invoiceNumber}');
  }

  static pw.Widget _cell(String text) {
    return pw.Padding(
      padding: const pw.EdgeInsets.all(6),
      child: pw.Text(
        text,
        style: pw.TextStyle(fontSize: 10, color: PdfColor.fromHex('374151')),
      ),
    );
  }

  static pw.Widget _pdfSummaryRow(String label, String value, {bool bold = false}) {
    return pw.Padding(
      padding: const pw.EdgeInsets.symmetric(vertical: 3),
      child: pw.Row(
        mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
        children: [
          pw.Text(
            label,
            style: pw.TextStyle(
              fontSize: 10,
              color: PdfColor.fromHex('4b5563'),
            ),
          ),
          pw.Text(
            value,
            style: pw.TextStyle(
              fontSize: 10,
              fontWeight: bold ? pw.FontWeight.bold : pw.FontWeight.normal,
              color: PdfColor.fromHex('1f2937'),
            ),
          ),
        ],
      ),
    );
  }
}
