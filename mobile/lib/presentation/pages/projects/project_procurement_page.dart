import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../data/models/attachment_model.dart';
import '../../../data/models/inventory_model.dart';
import '../../../data/models/material_request_model.dart';
import '../../../data/models/procurement_model.dart';
import '../../../data/services/attachment_service.dart';
import '../../../data/services/material_request_service.dart';
import '../../../data/services/procurement_service.dart';
import '../../../data/services/session_controller.dart';
import '../../widgets/loading_indicator.dart';

class ProjectProcurementPage extends StatefulWidget {
  const ProjectProcurementPage({
    super.key,
    required this.projectId,
    required this.projectName,
  });

  final String projectId;
  final String projectName;

  @override
  State<ProjectProcurementPage> createState() => _ProjectProcurementPageState();
}

class _ProjectProcurementPageState extends State<ProjectProcurementPage> {
  bool _loading = true;
  List<MaterialRequestModel> _requests = [];
  List<SupplierModel> _suppliers = [];
  List<PurchaseOrderModel> _orders = [];
  List<InventoryItemModel> _inventory = [];
  Map<String, List<SupplierInvoiceModel>> _invoices = {};
  Map<String, List<GoodsReceiptModel>> _receipts = {};
  Map<String, List<AttachmentModel>> _invoiceAttachments = {};

  bool get _canApprove {
    final role = SessionController.instance.currentUser?.role ?? '';
    return role == 'admin' || role == 'manager';
  }

  bool get _canEdit => SessionController.instance.isAuthenticated;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
    });
    try {
      final results = await Future.wait<dynamic>([
        MaterialRequestService.instance.getByProject(widget.projectId),
        ProcurementService.instance.getSuppliers(),
        ProcurementService.instance.getPurchaseOrdersByProject(widget.projectId),
        ProcurementService.instance.getInventoryByProject(widget.projectId),
      ]);

      final requests = results[0] as List<MaterialRequestModel>;
      final suppliers = results[1] as List<SupplierModel>;
      final orders = results[2] as List<PurchaseOrderModel>;
      final inventory = results[3] as List<InventoryItemModel>;

      final invoicePairs = await Future.wait(
        orders.map((order) async {
          final data = await ProcurementService.instance
              .getInvoicesByPurchaseOrder(order.id);
          return MapEntry(order.id, data);
        }),
      );

      final receiptPairs = await Future.wait(
        orders.map((order) async {
          final data = await ProcurementService.instance
              .getReceiptsByPurchaseOrder(order.id);
          return MapEntry(order.id, data);
        }),
      );

      final attachments = <String, List<AttachmentModel>>{};
      for (final pair in invoicePairs) {
        for (final invoice in pair.value) {
          attachments[invoice.id] = await AttachmentService.instance.getByEntity(
            'supplier_invoice',
            invoice.id,
          );
        }
      }

      if (!mounted) return;
      setState(() {
        _requests = requests;
        _suppliers = suppliers;
        _orders = orders;
        _inventory = inventory;
        _invoices = {for (final pair in invoicePairs) pair.key: pair.value};
        _receipts = {for (final pair in receiptPairs) pair.key: pair.value};
        _invoiceAttachments = attachments;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _loading = false;
      });
    }
  }

  String _money(num value) => '\$${value.toStringAsFixed(2)}';

  Future<void> _openAttachment(AttachmentModel attachment) async {
    final url = await AttachmentService.instance.getDownloadUrl(attachment.id);
    final target = url.isNotEmpty ? url : attachment.url;
    if (target.isEmpty) return;
    final uri = Uri.parse(target);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.inAppBrowserView);
    }
  }

  Future<void> _uploadAttachment({
    required String entityType,
    required String entityId,
    required String successText,
    String? defaultDescription,
  }) async {
    final result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: ['jpg', 'jpeg', 'png', 'pdf'],
    );
    if (result == null || result.files.isEmpty || result.files.first.path == null) {
      return;
    }
    try {
      final file = result.files.first;
      await AttachmentService.instance.upload(
        file.path!,
        file.name,
        entityType,
        entityId,
        defaultDescription,
      );
      await _load();
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(successText)),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Upload failed: $e')),
      );
    }
  }

  Future<void> _showCreateSupplierSheet() async {
    final nameCtrl = TextEditingController();
    final emailCtrl = TextEditingController();
    final phoneCtrl = TextEditingController();
    final formKey = GlobalKey<FormState>();

    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      builder: (sheetContext) => Padding(
        padding: EdgeInsets.only(
          left: 16,
          right: 16,
          top: 16,
          bottom: MediaQuery.viewInsetsOf(sheetContext).bottom + 16,
        ),
        child: Form(
          key: formKey,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(
                'New supplier',
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: nameCtrl,
                decoration: const InputDecoration(
                  labelText: 'Supplier name',
                  border: OutlineInputBorder(),
                ),
                validator: (value) => (value == null || value.trim().isEmpty)
                    ? 'Supplier name is required'
                    : null,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: emailCtrl,
                decoration: const InputDecoration(
                  labelText: 'Email',
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: phoneCtrl,
                decoration: const InputDecoration(
                  labelText: 'Phone',
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 16),
              FilledButton(
                onPressed: () async {
                  if (formKey.currentState?.validate() != true) return;
                  await ProcurementService.instance.createSupplier({
                    'name': nameCtrl.text.trim(),
                    if (emailCtrl.text.trim().isNotEmpty)
                      'email': emailCtrl.text.trim(),
                    if (phoneCtrl.text.trim().isNotEmpty)
                      'phone': phoneCtrl.text.trim(),
                  });
                  if (sheetContext.mounted) Navigator.pop(sheetContext);
                  await _load();
                },
                child: const Text('Create supplier'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _showCreateMaterialRequestSheet() async {
    final titleCtrl = TextEditingController();
    final purposeCtrl = TextEditingController();
    final notesCtrl = TextEditingController();
    final formKey = GlobalKey<FormState>();
    final items = <_MaterialItemDraft>[_MaterialItemDraft()];

    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      builder: (sheetContext) {
        return StatefulBuilder(
          builder: (modalContext, setModalState) => Padding(
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
                      'Material request',
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    const SizedBox(height: 16),
                    TextFormField(
                      controller: titleCtrl,
                      decoration: const InputDecoration(
                        labelText: 'Title',
                        border: OutlineInputBorder(),
                      ),
                      validator: (value) => (value == null || value.trim().isEmpty)
                          ? 'Title is required'
                          : null,
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: purposeCtrl,
                      decoration: const InputDecoration(
                        labelText: 'Purpose',
                        border: OutlineInputBorder(),
                      ),
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: notesCtrl,
                      maxLines: 2,
                      decoration: const InputDecoration(
                        labelText: 'Notes',
                        border: OutlineInputBorder(),
                      ),
                    ),
                    const SizedBox(height: 12),
                    for (var index = 0; index < items.length; index++) ...[
                      _MaterialDraftEditor(
                        item: items[index],
                        index: index,
                        onRemove: items.length == 1
                            ? null
                            : () => setModalState(() => items.removeAt(index)),
                      ),
                      const SizedBox(height: 12),
                    ],
                    TextButton.icon(
                      onPressed: () => setModalState(() {
                        items.add(_MaterialItemDraft());
                      }),
                      icon: const Icon(Icons.add),
                      label: const Text('Add item'),
                    ),
                    const SizedBox(height: 16),
                    FilledButton(
                      onPressed: () async {
                        if (formKey.currentState?.validate() != true) return;
                        await MaterialRequestService.instance.create(
                          widget.projectId,
                          {
                            'title': titleCtrl.text.trim(),
                            if (purposeCtrl.text.trim().isNotEmpty)
                              'purpose': purposeCtrl.text.trim(),
                            if (notesCtrl.text.trim().isNotEmpty)
                              'notes': notesCtrl.text.trim(),
                            'items': items
                                .map((item) => {
                                      'name': item.nameCtrl.text.trim(),
                                      'quantity': double.tryParse(
                                            item.quantityCtrl.text.trim(),
                                          ) ??
                                          0,
                                      'unit': item.unitCtrl.text.trim(),
                                      'estimatedCost': double.tryParse(
                                            item.costCtrl.text.trim(),
                                          ) ??
                                          0,
                                      if (item.notesCtrl.text.trim().isNotEmpty)
                                        'notes': item.notesCtrl.text.trim(),
                                    })
                                .toList(),
                          },
                        );
                        if (sheetContext.mounted) Navigator.pop(sheetContext);
                        await _load();
                      },
                      child: const Text('Submit request'),
                    ),
                  ],
                ),
              ),
            ),
          ),
        );
      },
    );

    titleCtrl.dispose();
    purposeCtrl.dispose();
    notesCtrl.dispose();
    for (final item in items) {
      item.dispose();
    }
  }

  Future<void> _showCreateOrderSheet({String? initialRequestId}) async {
    if (_suppliers.isEmpty) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Create a supplier first')),
      );
      await _showCreateSupplierSheet();
      return;
    }

    String supplierId = _suppliers.first.id;
    String requestId = initialRequestId ?? '';
    final titleCtrl = TextEditingController();
    final notesCtrl = TextEditingController();
    final taxCtrl = TextEditingController();
    List<_OrderItemDraft> items = [_OrderItemDraft()];

    void applyRequest(String? id) {
      requestId = id ?? '';
      MaterialRequestModel? request;
      for (final item in _requests) {
        if (item.id == requestId) {
          request = item;
          break;
        }
      }
      if (request == null) return;
      titleCtrl.text = request.title;
      notesCtrl.text = request.purpose ?? request.notes ?? '';
      items = request.items
          .map(
            (item) => _OrderItemDraft(
              name: item.name,
              quantity: item.quantity.toString(),
              unit: item.unit,
              unitPrice: item.quantity == 0
                  ? item.estimatedCost.toString()
                  : (item.estimatedCost / item.quantity).toStringAsFixed(2),
              description: item.notes ?? '',
              notes: item.notes ?? '',
            ),
          )
          .toList();
    }

    if (requestId.isNotEmpty) {
      applyRequest(requestId);
    }

    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      builder: (sheetContext) {
        return StatefulBuilder(
          builder: (modalContext, setModalState) => Padding(
            padding: EdgeInsets.only(
              left: 16,
              right: 16,
              top: 16,
              bottom: MediaQuery.viewInsetsOf(modalContext).bottom + 16,
            ),
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text(
                    'Purchase order',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  const SizedBox(height: 16),
                  DropdownButtonFormField<String>(
                    initialValue: supplierId,
                    decoration: const InputDecoration(
                      labelText: 'Supplier',
                      border: OutlineInputBorder(),
                    ),
                    items: _suppliers
                        .map(
                          (supplier) => DropdownMenuItem(
                            value: supplier.id,
                            child: Text(supplier.name),
                          ),
                        )
                        .toList(),
                    onChanged: (value) {
                      if (value != null) supplierId = value;
                    },
                  ),
                  const SizedBox(height: 12),
                  DropdownButtonFormField<String>(
                    initialValue: requestId.isEmpty ? null : requestId,
                    decoration: const InputDecoration(
                      labelText: 'Approved material request',
                      border: OutlineInputBorder(),
                    ),
                    items: [
                      const DropdownMenuItem(
                        value: '',
                        child: Text('No linked request'),
                      ),
                      ..._requests
                          .where((item) => item.status == 'approved')
                          .map(
                            (request) => DropdownMenuItem(
                              value: request.id,
                              child: Text(request.title),
                            ),
                          ),
                    ],
                    onChanged: (value) {
                      setModalState(() {
                        applyRequest(value);
                      });
                    },
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: titleCtrl,
                    decoration: const InputDecoration(
                      labelText: 'Order title',
                      border: OutlineInputBorder(),
                    ),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: taxCtrl,
                    keyboardType:
                        const TextInputType.numberWithOptions(decimal: true),
                    decoration: const InputDecoration(
                      labelText: 'Tax amount',
                      border: OutlineInputBorder(),
                    ),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: notesCtrl,
                    maxLines: 2,
                    decoration: const InputDecoration(
                      labelText: 'Notes',
                      border: OutlineInputBorder(),
                    ),
                  ),
                  const SizedBox(height: 12),
                  for (var index = 0; index < items.length; index++) ...[
                    _OrderDraftEditor(
                      item: items[index],
                      index: index,
                      onRemove: items.length == 1
                          ? null
                          : () => setModalState(() => items.removeAt(index)),
                    ),
                    const SizedBox(height: 12),
                  ],
                  TextButton.icon(
                    onPressed: () => setModalState(() {
                      items.add(_OrderItemDraft());
                    }),
                    icon: const Icon(Icons.add),
                    label: const Text('Add order item'),
                  ),
                  const SizedBox(height: 16),
                  FilledButton(
                    onPressed: () async {
                      await ProcurementService.instance.createPurchaseOrder(
                        widget.projectId,
                        {
                          'supplierId': supplierId,
                          if (requestId.isNotEmpty) 'materialRequestId': requestId,
                          if (titleCtrl.text.trim().isNotEmpty)
                            'title': titleCtrl.text.trim(),
                          if (notesCtrl.text.trim().isNotEmpty)
                            'notes': notesCtrl.text.trim(),
                          if (taxCtrl.text.trim().isNotEmpty)
                            'taxAmount':
                                double.tryParse(taxCtrl.text.trim()) ?? 0,
                          'items': items
                              .map(
                                (item) => {
                                  'name': item.nameCtrl.text.trim(),
                                  'description': item.descriptionCtrl.text.trim(),
                                  'quantity': double.tryParse(
                                        item.quantityCtrl.text.trim(),
                                      ) ??
                                      0,
                                  'unit': item.unitCtrl.text.trim(),
                                  'unitPrice': double.tryParse(
                                        item.unitPriceCtrl.text.trim(),
                                      ) ??
                                      0,
                                  'notes': item.notesCtrl.text.trim(),
                                },
                              )
                              .toList(),
                        },
                      );
                      if (sheetContext.mounted) Navigator.pop(sheetContext);
                      await _load();
                    },
                    child: const Text('Create order'),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );

    titleCtrl.dispose();
    notesCtrl.dispose();
    taxCtrl.dispose();
    for (final item in items) {
      item.dispose();
    }
  }

  Future<void> _showInvoiceSheet(PurchaseOrderModel order) async {
    final invoiceNoCtrl = TextEditingController();
    final invoiceDateCtrl = TextEditingController(
      text: DateTime.now().toIso8601String().split('T').first,
    );
    final dueDateCtrl = TextEditingController();
    final subtotalCtrl = TextEditingController(text: order.subtotal.toString());
    final taxCtrl = TextEditingController(text: order.taxAmount.toString());
    final totalCtrl = TextEditingController(text: order.totalAmount.toString());
    final notesCtrl = TextEditingController();
    final fileUrlCtrl = TextEditingController();

    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      builder: (sheetContext) => Padding(
        padding: EdgeInsets.only(
          left: 16,
          right: 16,
          top: 16,
          bottom: MediaQuery.viewInsetsOf(sheetContext).bottom + 16,
        ),
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(
                'Supplier invoice',
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: 16),
              for (final field in [
                (invoiceNoCtrl, 'Invoice number'),
                (invoiceDateCtrl, 'Invoice date (YYYY-MM-DD)'),
                (dueDateCtrl, 'Due date (YYYY-MM-DD)'),
                (subtotalCtrl, 'Subtotal'),
                (taxCtrl, 'Tax amount'),
                (totalCtrl, 'Total amount'),
                (fileUrlCtrl, 'Attachment URL'),
              ]) ...[
                TextField(
                  controller: field.$1,
                  keyboardType: field.$2.contains('amount') ||
                          field.$2 == 'Subtotal' ||
                          field.$2 == 'Total amount'
                      ? const TextInputType.numberWithOptions(decimal: true)
                      : TextInputType.text,
                  decoration: InputDecoration(
                    labelText: field.$2,
                    border: const OutlineInputBorder(),
                  ),
                ),
                const SizedBox(height: 12),
              ],
              TextField(
                controller: notesCtrl,
                maxLines: 2,
                decoration: const InputDecoration(
                  labelText: 'Notes',
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 16),
              FilledButton(
                onPressed: () async {
                  await ProcurementService.instance.createInvoice(order.id, {
                    'invoiceNumber': invoiceNoCtrl.text.trim(),
                    'invoiceDate': invoiceDateCtrl.text.trim(),
                    if (dueDateCtrl.text.trim().isNotEmpty)
                      'dueDate': dueDateCtrl.text.trim(),
                    'subtotal': double.tryParse(subtotalCtrl.text.trim()) ?? 0,
                    'taxAmount': double.tryParse(taxCtrl.text.trim()) ?? 0,
                    'totalAmount': double.tryParse(totalCtrl.text.trim()) ?? 0,
                    if (notesCtrl.text.trim().isNotEmpty)
                      'notes': notesCtrl.text.trim(),
                    if (fileUrlCtrl.text.trim().isNotEmpty)
                      'fileUrl': fileUrlCtrl.text.trim(),
                  });
                  if (sheetContext.mounted) Navigator.pop(sheetContext);
                  await _load();
                },
                child: const Text('Create invoice'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _showReceiptSheet(PurchaseOrderModel order) async {
    String destinationType = 'store';
    final destinationCtrl = TextEditingController(text: 'Main Store');
    final notesCtrl = TextEditingController();
    final items = order.items
        .map(
          (item) => _ReceiptItemDraft(
            id: item.id,
            name: item.name,
            unit: item.unit,
            ordered: item.quantity.toString(),
            received: item.quantity.toString(),
            notes: item.notes ?? '',
          ),
        )
        .toList();

    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      builder: (sheetContext) {
        return StatefulBuilder(
          builder: (modalContext, setModalState) => Padding(
            padding: EdgeInsets.only(
              left: 16,
              right: 16,
              top: 16,
              bottom: MediaQuery.viewInsetsOf(modalContext).bottom + 16,
            ),
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text(
                    'Receive materials',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  const SizedBox(height: 16),
                  DropdownButtonFormField<String>(
                    initialValue: destinationType,
                    decoration: const InputDecoration(
                      labelText: 'Destination',
                      border: OutlineInputBorder(),
                    ),
                    items: const [
                      DropdownMenuItem(
                        value: 'store',
                        child: Text('Receive into store'),
                      ),
                      DropdownMenuItem(
                        value: 'site',
                        child: Text('Send to site'),
                      ),
                    ],
                    onChanged: (value) {
                      if (value == null) return;
                      setModalState(() {
                        destinationType = value;
                        destinationCtrl.text =
                            value == 'site' ? 'Project Site' : 'Main Store';
                      });
                    },
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: destinationCtrl,
                    decoration: InputDecoration(
                      labelText: destinationType == 'site'
                          ? 'Site name'
                          : 'Store name',
                      border: const OutlineInputBorder(),
                    ),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: notesCtrl,
                    maxLines: 2,
                    decoration: const InputDecoration(
                      labelText: 'Notes',
                      border: OutlineInputBorder(),
                    ),
                  ),
                  const SizedBox(height: 12),
                  for (final item in items) ...[
                    _ReceiptDraftEditor(item: item),
                    const SizedBox(height: 12),
                  ],
                  FilledButton(
                    onPressed: () async {
                      await ProcurementService.instance.createReceipt(order.id, {
                        'destinationType': destinationType,
                        'destinationLabel': destinationCtrl.text.trim(),
                        if (notesCtrl.text.trim().isNotEmpty)
                          'notes': notesCtrl.text.trim(),
                        'items': items
                            .map(
                              (item) => {
                                if (item.id != null)
                                  'purchaseOrderItemId': item.id,
                                'name': item.name,
                                'unit': item.unit,
                                'orderedQuantity':
                                    double.tryParse(item.orderedCtrl.text) ?? 0,
                                'receivedQuantity':
                                    double.tryParse(item.receivedCtrl.text) ?? 0,
                                'damagedQuantity':
                                    double.tryParse(item.damagedCtrl.text) ?? 0,
                                if (item.notesCtrl.text.trim().isNotEmpty)
                                  'notes': item.notesCtrl.text.trim(),
                              },
                            )
                            .toList(),
                      });
                      if (sheetContext.mounted) Navigator.pop(sheetContext);
                      await _load();
                    },
                    child: const Text('Save receipt'),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );

    destinationCtrl.dispose();
    notesCtrl.dispose();
    for (final item in items) {
      item.dispose();
    }
  }

  Future<void> _showAdjustStockSheet() async {
    final nameCtrl = TextEditingController();
    final unitCtrl = TextEditingController();
    final qtyCtrl = TextEditingController();
    final reorderCtrl = TextEditingController();
    final locationCtrl = TextEditingController(text: 'Main Store');
    final notesCtrl = TextEditingController();

    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      builder: (sheetContext) => Padding(
        padding: EdgeInsets.only(
          left: 16,
          right: 16,
          top: 16,
          bottom: MediaQuery.viewInsetsOf(sheetContext).bottom + 16,
        ),
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(
                'Adjust stock',
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: 16),
              for (final field in [
                (nameCtrl, 'Material name'),
                (unitCtrl, 'Unit'),
                (qtyCtrl, 'Quantity'),
                (reorderCtrl, 'Reorder level'),
                (locationCtrl, 'Location'),
              ]) ...[
                TextField(
                  controller: field.$1,
                  keyboardType: field.$2.contains('Quantity') ||
                          field.$2.contains('Reorder')
                      ? const TextInputType.numberWithOptions(decimal: true)
                      : TextInputType.text,
                  decoration: InputDecoration(
                    labelText: field.$2,
                    border: const OutlineInputBorder(),
                  ),
                ),
                const SizedBox(height: 12),
              ],
              TextField(
                controller: notesCtrl,
                maxLines: 2,
                decoration: const InputDecoration(
                  labelText: 'Notes',
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 16),
              FilledButton(
                onPressed: () async {
                  await ProcurementService.instance.adjustInventory(
                    widget.projectId,
                    {
                      'name': nameCtrl.text.trim(),
                      'unit': unitCtrl.text.trim(),
                      'quantity': double.tryParse(qtyCtrl.text.trim()) ?? 0,
                      if (reorderCtrl.text.trim().isNotEmpty)
                        'reorderLevel':
                            double.tryParse(reorderCtrl.text.trim()) ?? 0,
                      if (locationCtrl.text.trim().isNotEmpty)
                        'location': locationCtrl.text.trim(),
                      if (notesCtrl.text.trim().isNotEmpty)
                        'notes': notesCtrl.text.trim(),
                    },
                  );
                  if (sheetContext.mounted) Navigator.pop(sheetContext);
                  await _load();
                },
                child: const Text('Save adjustment'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _showTransferStockSheet(InventoryItemModel item) async {
    String stockStatus = item.stockStatus;
    final locationCtrl = TextEditingController(text: item.location ?? '');
    final allocationCtrl =
        TextEditingController(text: item.allocationTarget ?? '');
    final notesCtrl = TextEditingController();

    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      builder: (sheetContext) {
        return StatefulBuilder(
          builder: (modalContext, setModalState) => Padding(
            padding: EdgeInsets.only(
              left: 16,
              right: 16,
              top: 16,
              bottom: MediaQuery.viewInsetsOf(modalContext).bottom + 16,
            ),
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text(
                    'Transfer stock',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  const SizedBox(height: 16),
                  DropdownButtonFormField<String>(
                    initialValue: stockStatus,
                    decoration: const InputDecoration(
                      labelText: 'Stock status',
                      border: OutlineInputBorder(),
                    ),
                    items: const [
                      DropdownMenuItem(
                        value: 'available_in_store',
                        child: Text('Available in store'),
                      ),
                      DropdownMenuItem(
                        value: 'allocated_to_site',
                        child: Text('Allocated to site'),
                      ),
                      DropdownMenuItem(
                        value: 'allocated_to_project',
                        child: Text('Allocated to project'),
                      ),
                    ],
                    onChanged: (value) {
                      if (value != null) {
                        setModalState(() => stockStatus = value);
                      }
                    },
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: locationCtrl,
                    decoration: const InputDecoration(
                      labelText: 'Location',
                      border: OutlineInputBorder(),
                    ),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: allocationCtrl,
                    decoration: const InputDecoration(
                      labelText: 'Allocated to',
                      border: OutlineInputBorder(),
                    ),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: notesCtrl,
                    maxLines: 2,
                    decoration: const InputDecoration(
                      labelText: 'Notes',
                      border: OutlineInputBorder(),
                    ),
                  ),
                  const SizedBox(height: 16),
                  FilledButton(
                    onPressed: () async {
                      await ProcurementService.instance.transferInventory(
                        widget.projectId,
                        item.id,
                        {
                          'stockStatus': stockStatus,
                          if (locationCtrl.text.trim().isNotEmpty)
                            'location': locationCtrl.text.trim(),
                          if (stockStatus != 'available_in_store' &&
                              allocationCtrl.text.trim().isNotEmpty)
                            'allocationTarget': allocationCtrl.text.trim(),
                          if (notesCtrl.text.trim().isNotEmpty)
                            'notes': notesCtrl.text.trim(),
                        },
                      );
                      if (sheetContext.mounted) Navigator.pop(sheetContext);
                      await _load();
                    },
                    child: const Text('Transfer'),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return Scaffold(
        appBar: AppBar(title: Text(widget.projectName)),
        body: const LoadingIndicator(message: 'Loading procurement...'),
      );
    }

    return DefaultTabController(
      length: 3,
      child: Scaffold(
        appBar: AppBar(
          title: Text('${widget.projectName} Procurement'),
          bottom: const TabBar(
            tabs: [
              Tab(text: 'Requests'),
              Tab(text: 'Orders'),
              Tab(text: 'Store'),
            ],
          ),
        ),
        floatingActionButton: _canEdit
            ? TabBarViewFAB(
                onRequest: _showCreateMaterialRequestSheet,
                onOrder: () => _showCreateOrderSheet(),
                onStore: _showAdjustStockSheet,
              )
            : null,
        body: RefreshIndicator(
          onRefresh: _load,
          child: TabBarView(
            children: [
              _RequestsTab(
                requests: _requests,
                canApprove: _canApprove,
                canEdit: _canEdit,
                money: _money,
                onApprove: (id) async {
                  await MaterialRequestService.instance.approve(id);
                  await _load();
                },
                onReject: (id) async {
                  await MaterialRequestService.instance.reject(id);
                  await _load();
                },
                onUploadReceipt: (id) => _uploadAttachment(
                  entityType: 'material_request',
                  entityId: id,
                  successText: 'Receipt uploaded',
                  defaultDescription: 'Requested materials receipt',
                ),
                onCreateOrder: (id) => _showCreateOrderSheet(initialRequestId: id),
              ),
              _OrdersTab(
                orders: _orders,
                invoices: _invoices,
                receipts: _receipts,
                invoiceAttachments: _invoiceAttachments,
                canApprove: _canApprove,
                canEdit: _canEdit,
                money: _money,
                onApproveOrder: (id) async {
                  await ProcurementService.instance.approvePurchaseOrder(id);
                  await _load();
                },
                onSendOrder: (id) async {
                  await ProcurementService.instance.sendPurchaseOrder(id);
                  await _load();
                },
                onCancelOrder: (id) async {
                  await ProcurementService.instance.cancelPurchaseOrder(id);
                  await _load();
                },
                onCreateInvoice: _showInvoiceSheet,
                onCreateReceipt: _showReceiptSheet,
                onVerifyInvoice: (id) async {
                  await ProcurementService.instance.verifyInvoice(id);
                  await _load();
                },
                onApproveInvoice: (id) async {
                  await ProcurementService.instance.approveInvoice(id);
                  await _load();
                },
                onPayInvoice: (id) async {
                  await ProcurementService.instance.payInvoice(id);
                  await _load();
                },
                onRejectInvoice: (id) async {
                  await ProcurementService.instance.rejectInvoice(id);
                  await _load();
                },
                onUploadProof: (id) => _uploadAttachment(
                  entityType: 'supplier_invoice',
                  entityId: id,
                  successText: 'Payment proof uploaded',
                  defaultDescription: 'Bank transfer or payment proof',
                ),
                onOpenAttachment: _openAttachment,
              ),
              _InventoryTab(
                inventory: _inventory,
                money: _money,
                canEdit: _canEdit,
                onTransfer: _showTransferStockSheet,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class TabBarViewFAB extends StatelessWidget {
  const TabBarViewFAB({
    super.key,
    required this.onRequest,
    required this.onOrder,
    required this.onStore,
  });

  final VoidCallback onRequest;
  final VoidCallback onOrder;
  final VoidCallback onStore;

  @override
  Widget build(BuildContext context) {
    final controller = DefaultTabController.of(context);
    return AnimatedBuilder(
      animation: controller,
      builder: (context, _) {
        final index = controller.index;
        return FloatingActionButton(
          onPressed: switch (index) {
            0 => onRequest,
            1 => onOrder,
            _ => onStore,
          },
          child: const Icon(Icons.add),
        );
      },
    );
  }
}

class _RequestsTab extends StatelessWidget {
  const _RequestsTab({
    required this.requests,
    required this.canApprove,
    required this.canEdit,
    required this.money,
    required this.onApprove,
    required this.onReject,
    required this.onUploadReceipt,
    required this.onCreateOrder,
  });

  final List<MaterialRequestModel> requests;
  final bool canApprove;
  final bool canEdit;
  final String Function(num) money;
  final Future<void> Function(String id) onApprove;
  final Future<void> Function(String id) onReject;
  final Future<void> Function(String id) onUploadReceipt;
  final Future<void> Function(String id) onCreateOrder;

  @override
  Widget build(BuildContext context) {
    if (requests.isEmpty) {
      return ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(16),
        children: const [
          Card(
            child: Padding(
              padding: EdgeInsets.all(20),
              child: Text('No material requests yet.'),
            ),
          ),
        ],
      );
    }

    return ListView.builder(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.all(16),
      itemCount: requests.length,
      itemBuilder: (context, index) {
        final request = requests[index];
        final statusColor = switch (request.status) {
          'approved' => Colors.green,
          'rejected' => Colors.red,
          _ => Colors.orange,
        };
        return Card(
          margin: const EdgeInsets.only(bottom: 12),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        request.title,
                        style: Theme.of(context).textTheme.titleMedium,
                      ),
                    ),
                    Chip(
                      label: Text(request.status),
                      side: BorderSide.none,
                      backgroundColor: statusColor.withValues(alpha: 0.12),
                      labelStyle: TextStyle(color: statusColor),
                    ),
                  ],
                ),
                if ((request.purpose ?? '').isNotEmpty)
                  Text(request.purpose!),
                const SizedBox(height: 8),
                Text(
                  'Requested: ${money(request.requestedAmount)}',
                  style: const TextStyle(fontWeight: FontWeight.w600),
                ),
                const SizedBox(height: 8),
                ...request.items.map(
                  (item) => Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: Row(
                      children: [
                        Expanded(
                          child: Text(
                            '${item.name} • ${item.quantity} ${item.unit}',
                          ),
                        ),
                        Text(money(item.estimatedCost)),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    if (canApprove && request.status == 'pending') ...[
                      OutlinedButton(
                        onPressed: () => onReject(request.id),
                        child: const Text('Reject'),
                      ),
                      FilledButton(
                        onPressed: () => onApprove(request.id),
                        child: const Text('Approve'),
                      ),
                    ],
                    if (canEdit && request.status == 'approved') ...[
                      OutlinedButton(
                        onPressed: () => onUploadReceipt(request.id),
                        child: const Text('Upload Receipt'),
                      ),
                      FilledButton(
                        onPressed: () => onCreateOrder(request.id),
                        child: const Text('Create Order'),
                      ),
                    ],
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}

class _OrdersTab extends StatelessWidget {
  const _OrdersTab({
    required this.orders,
    required this.invoices,
    required this.receipts,
    required this.invoiceAttachments,
    required this.canApprove,
    required this.canEdit,
    required this.money,
    required this.onApproveOrder,
    required this.onSendOrder,
    required this.onCancelOrder,
    required this.onCreateInvoice,
    required this.onCreateReceipt,
    required this.onVerifyInvoice,
    required this.onApproveInvoice,
    required this.onPayInvoice,
    required this.onRejectInvoice,
    required this.onUploadProof,
    required this.onOpenAttachment,
  });

  final List<PurchaseOrderModel> orders;
  final Map<String, List<SupplierInvoiceModel>> invoices;
  final Map<String, List<GoodsReceiptModel>> receipts;
  final Map<String, List<AttachmentModel>> invoiceAttachments;
  final bool canApprove;
  final bool canEdit;
  final String Function(num) money;
  final Future<void> Function(String id) onApproveOrder;
  final Future<void> Function(String id) onSendOrder;
  final Future<void> Function(String id) onCancelOrder;
  final Future<void> Function(PurchaseOrderModel order) onCreateInvoice;
  final Future<void> Function(PurchaseOrderModel order) onCreateReceipt;
  final Future<void> Function(String id) onVerifyInvoice;
  final Future<void> Function(String id) onApproveInvoice;
  final Future<void> Function(String id) onPayInvoice;
  final Future<void> Function(String id) onRejectInvoice;
  final Future<void> Function(String id) onUploadProof;
  final Future<void> Function(AttachmentModel attachment) onOpenAttachment;

  @override
  Widget build(BuildContext context) {
    if (orders.isEmpty) {
      return ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(16),
        children: const [
          Card(
            child: Padding(
              padding: EdgeInsets.all(20),
              child: Text('No purchase orders yet.'),
            ),
          ),
        ],
      );
    }

    return ListView.builder(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.all(16),
      itemCount: orders.length,
      itemBuilder: (context, index) {
        final order = orders[index];
        final orderInvoices = invoices[order.id] ?? const [];
        final orderReceipts = receipts[order.id] ?? const [];
        return Card(
          margin: const EdgeInsets.only(bottom: 12),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            order.orderNumber,
                            style: Theme.of(context).textTheme.titleMedium,
                          ),
                          Text(order.title ?? order.supplier?.name ?? 'Order'),
                          Text(
                            '${order.status} • ${money(order.totalAmount)}',
                            style: const TextStyle(fontSize: 12),
                          ),
                        ],
                      ),
                    ),
                    if (canApprove && order.status == 'pending_approval')
                      FilledButton(
                        onPressed: () => onApproveOrder(order.id),
                        child: const Text('Approve'),
                      ),
                  ],
                ),
                const SizedBox(height: 8),
                ...order.items.map(
                  (item) => Padding(
                    padding: const EdgeInsets.only(bottom: 6),
                    child: Row(
                      children: [
                        Expanded(
                          child: Text('${item.name} • ${item.quantity} ${item.unit}'),
                        ),
                        Text(money(item.lineTotal)),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    if (canApprove && order.status == 'approved')
                      OutlinedButton(
                        onPressed: () => onSendOrder(order.id),
                        child: const Text('Send'),
                      ),
                    if (canApprove &&
                        !{'received', 'closed', 'cancelled'}.contains(order.status))
                      OutlinedButton(
                        onPressed: () => onCancelOrder(order.id),
                        child: const Text('Cancel'),
                      ),
                    if (canEdit)
                      FilledButton.tonal(
                        onPressed: () => onCreateInvoice(order),
                        child: const Text('Invoice'),
                      ),
                    if (canEdit)
                      FilledButton.tonal(
                        onPressed: () => onCreateReceipt(order),
                        child: const Text('Receive'),
                      ),
                  ],
                ),
                if (orderInvoices.isNotEmpty) ...[
                  const SizedBox(height: 12),
                  const Text(
                    'Invoices',
                    style: TextStyle(fontWeight: FontWeight.w700),
                  ),
                  const SizedBox(height: 8),
                  ...orderInvoices.map(
                    (invoice) => Container(
                      margin: const EdgeInsets.only(bottom: 8),
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: const Color(0xFFE5E7EB)),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Expanded(
                                child: Text(
                                  '${invoice.invoiceNumber} • ${money(invoice.totalAmount)}',
                                  style: const TextStyle(
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ),
                              Chip(
                                label: Text(invoice.status),
                                visualDensity: VisualDensity.compact,
                              ),
                            ],
                          ),
                          if ((invoiceAttachments[invoice.id] ?? const []).isNotEmpty)
                            Wrap(
                              spacing: 8,
                              children: (invoiceAttachments[invoice.id] ?? const [])
                                  .map(
                                    (file) => ActionChip(
                                      label: Text(
                                        file.description ?? file.filename,
                                      ),
                                      onPressed: () => onOpenAttachment(file),
                                    ),
                                  )
                                  .toList(),
                            ),
                          const SizedBox(height: 8),
                          Wrap(
                            spacing: 8,
                            runSpacing: 8,
                            children: [
                              OutlinedButton(
                                onPressed: () => onUploadProof(invoice.id),
                                child: const Text('Payment Proof'),
                              ),
                              if (canApprove && invoice.status == 'received')
                                FilledButton.tonal(
                                  onPressed: () => onVerifyInvoice(invoice.id),
                                  child: const Text('Verify'),
                                ),
                              if (canApprove &&
                                  (invoice.status == 'received' ||
                                      invoice.status == 'verified'))
                                FilledButton(
                                  onPressed: () => onApproveInvoice(invoice.id),
                                  child: const Text('Approve'),
                                ),
                              if (canApprove && invoice.status == 'approved')
                                FilledButton(
                                  onPressed: () => onPayInvoice(invoice.id),
                                  child: const Text('Mark Paid'),
                                ),
                              if (canApprove &&
                                  !{'paid', 'rejected'}.contains(invoice.status))
                                OutlinedButton(
                                  onPressed: () => onRejectInvoice(invoice.id),
                                  child: const Text('Reject'),
                                ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
                if (orderReceipts.isNotEmpty) ...[
                  const SizedBox(height: 12),
                  const Text(
                    'Goods Receipts',
                    style: TextStyle(fontWeight: FontWeight.w700),
                  ),
                  const SizedBox(height: 8),
                  ...orderReceipts.map(
                    (receipt) => Padding(
                      padding: const EdgeInsets.only(bottom: 8),
                      child: Text(
                        '${receipt.status} • ${receipt.destinationType}'
                        '${receipt.destinationLabel != null ? ' • ${receipt.destinationLabel}' : ''}',
                      ),
                    ),
                  ),
                ],
              ],
            ),
          ),
        );
      },
    );
  }
}

class _InventoryTab extends StatelessWidget {
  const _InventoryTab({
    required this.inventory,
    required this.money,
    required this.canEdit,
    required this.onTransfer,
  });

  final List<InventoryItemModel> inventory;
  final String Function(num) money;
  final bool canEdit;
  final Future<void> Function(InventoryItemModel item) onTransfer;

  @override
  Widget build(BuildContext context) {
    if (inventory.isEmpty) {
      return ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(16),
        children: const [
          Card(
            child: Padding(
              padding: EdgeInsets.all(20),
              child: Text('No inventory items yet.'),
            ),
          ),
        ],
      );
    }

    return ListView.builder(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.all(16),
      itemCount: inventory.length,
      itemBuilder: (context, index) {
        final item = inventory[index];
        return Card(
          margin: const EdgeInsets.only(bottom: 12),
          child: ListTile(
            contentPadding: const EdgeInsets.all(16),
            title: Text(item.name),
            subtitle: Text(
              [
                '${item.currentQuantity} ${item.unit}',
                item.stockStatus.replaceAll('_', ' '),
                if ((item.allocationTarget ?? '').isNotEmpty)
                  item.allocationTarget!,
                if ((item.location ?? '').isNotEmpty) item.location!,
              ].join(' • '),
            ),
            trailing: canEdit
                ? OutlinedButton(
                    onPressed: () => onTransfer(item),
                    child: const Text('Transfer'),
                  )
                : null,
          ),
        );
      },
    );
  }
}

class _MaterialItemDraft {
  _MaterialItemDraft({
    String name = '',
    String quantity = '',
    String unit = '',
    String estimatedCost = '',
    String notes = '',
  })  : nameCtrl = TextEditingController(text: name),
        quantityCtrl = TextEditingController(text: quantity),
        unitCtrl = TextEditingController(text: unit),
        costCtrl = TextEditingController(text: estimatedCost),
        notesCtrl = TextEditingController(text: notes);

  final TextEditingController nameCtrl;
  final TextEditingController quantityCtrl;
  final TextEditingController unitCtrl;
  final TextEditingController costCtrl;
  final TextEditingController notesCtrl;

  void dispose() {
    nameCtrl.dispose();
    quantityCtrl.dispose();
    unitCtrl.dispose();
    costCtrl.dispose();
    notesCtrl.dispose();
  }
}

class _MaterialDraftEditor extends StatelessWidget {
  const _MaterialDraftEditor({
    required this.item,
    required this.index,
    required this.onRemove,
  });

  final _MaterialItemDraft item;
  final int index;
  final VoidCallback? onRemove;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFE5E7EB)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Expanded(child: Text('Item ${index + 1}')),
              if (onRemove != null)
                IconButton(
                  onPressed: onRemove,
                  icon: const Icon(Icons.delete_outline),
                ),
            ],
          ),
          TextFormField(
            controller: item.nameCtrl,
            decoration: const InputDecoration(
              labelText: 'Material name',
              border: OutlineInputBorder(),
            ),
            validator: (value) =>
                (value == null || value.trim().isEmpty) ? 'Required' : null,
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: TextFormField(
                  controller: item.quantityCtrl,
                  keyboardType:
                      const TextInputType.numberWithOptions(decimal: true),
                  decoration: const InputDecoration(
                    labelText: 'Quantity',
                    border: OutlineInputBorder(),
                  ),
                  validator: (value) => (double.tryParse(value ?? '') ?? 0) <= 0
                      ? 'Required'
                      : null,
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: TextFormField(
                  controller: item.unitCtrl,
                  decoration: const InputDecoration(
                    labelText: 'Unit',
                    border: OutlineInputBorder(),
                  ),
                  validator: (value) => (value == null || value.trim().isEmpty)
                      ? 'Required'
                      : null,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          TextFormField(
            controller: item.costCtrl,
            keyboardType:
                const TextInputType.numberWithOptions(decimal: true),
            decoration: const InputDecoration(
              labelText: 'Estimated cost',
              border: OutlineInputBorder(),
            ),
            validator: (value) =>
                (double.tryParse(value ?? '') ?? -1) < 0 ? 'Required' : null,
          ),
          const SizedBox(height: 8),
          TextField(
            controller: item.notesCtrl,
            decoration: const InputDecoration(
              labelText: 'Notes',
              border: OutlineInputBorder(),
            ),
          ),
        ],
      ),
    );
  }
}

class _OrderItemDraft {
  _OrderItemDraft({
    String name = '',
    String quantity = '',
    String unit = '',
    String unitPrice = '',
    String description = '',
    String notes = '',
  })  : nameCtrl = TextEditingController(text: name),
        quantityCtrl = TextEditingController(text: quantity),
        unitCtrl = TextEditingController(text: unit),
        unitPriceCtrl = TextEditingController(text: unitPrice),
        descriptionCtrl = TextEditingController(text: description),
        notesCtrl = TextEditingController(text: notes);

  final TextEditingController nameCtrl;
  final TextEditingController quantityCtrl;
  final TextEditingController unitCtrl;
  final TextEditingController unitPriceCtrl;
  final TextEditingController descriptionCtrl;
  final TextEditingController notesCtrl;

  void dispose() {
    nameCtrl.dispose();
    quantityCtrl.dispose();
    unitCtrl.dispose();
    unitPriceCtrl.dispose();
    descriptionCtrl.dispose();
    notesCtrl.dispose();
  }
}

class _OrderDraftEditor extends StatelessWidget {
  const _OrderDraftEditor({
    required this.item,
    required this.index,
    required this.onRemove,
  });

  final _OrderItemDraft item;
  final int index;
  final VoidCallback? onRemove;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFE5E7EB)),
      ),
      child: Column(
        children: [
          Row(
            children: [
              Expanded(child: Text('Order item ${index + 1}')),
              if (onRemove != null)
                IconButton(
                  onPressed: onRemove,
                  icon: const Icon(Icons.delete_outline),
                ),
            ],
          ),
          TextField(
            controller: item.nameCtrl,
            decoration: const InputDecoration(
              labelText: 'Name',
              border: OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: 8),
          TextField(
            controller: item.descriptionCtrl,
            decoration: const InputDecoration(
              labelText: 'Description',
              border: OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: item.quantityCtrl,
                  keyboardType:
                      const TextInputType.numberWithOptions(decimal: true),
                  decoration: const InputDecoration(
                    labelText: 'Qty',
                    border: OutlineInputBorder(),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: TextField(
                  controller: item.unitCtrl,
                  decoration: const InputDecoration(
                    labelText: 'Unit',
                    border: OutlineInputBorder(),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          TextField(
            controller: item.unitPriceCtrl,
            keyboardType:
                const TextInputType.numberWithOptions(decimal: true),
            decoration: const InputDecoration(
              labelText: 'Unit price',
              border: OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: 8),
          TextField(
            controller: item.notesCtrl,
            decoration: const InputDecoration(
              labelText: 'Notes',
              border: OutlineInputBorder(),
            ),
          ),
        ],
      ),
    );
  }
}

class _ReceiptItemDraft {
  _ReceiptItemDraft({
    required this.name,
    required this.unit,
    required String ordered,
    required String received,
    String damaged = '0',
    this.id,
    String notes = '',
  })  : orderedCtrl = TextEditingController(text: ordered),
        receivedCtrl = TextEditingController(text: received),
        damagedCtrl = TextEditingController(text: damaged),
        notesCtrl = TextEditingController(text: notes);

  final String? id;
  final String name;
  final String unit;
  final TextEditingController orderedCtrl;
  final TextEditingController receivedCtrl;
  final TextEditingController damagedCtrl;
  final TextEditingController notesCtrl;

  void dispose() {
    orderedCtrl.dispose();
    receivedCtrl.dispose();
    damagedCtrl.dispose();
    notesCtrl.dispose();
  }
}

class _ReceiptDraftEditor extends StatelessWidget {
  const _ReceiptDraftEditor({required this.item});

  final _ReceiptItemDraft item;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFE5E7EB)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(item.name, style: const TextStyle(fontWeight: FontWeight.w600)),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: item.orderedCtrl,
                  keyboardType:
                      const TextInputType.numberWithOptions(decimal: true),
                  decoration: const InputDecoration(
                    labelText: 'Ordered',
                    border: OutlineInputBorder(),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: TextField(
                  controller: item.receivedCtrl,
                  keyboardType:
                      const TextInputType.numberWithOptions(decimal: true),
                  decoration: InputDecoration(
                    labelText: 'Received (${item.unit})',
                    border: const OutlineInputBorder(),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          TextField(
            controller: item.damagedCtrl,
            keyboardType:
                const TextInputType.numberWithOptions(decimal: true),
            decoration: const InputDecoration(
              labelText: 'Damaged quantity',
              border: OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: 8),
          TextField(
            controller: item.notesCtrl,
            decoration: const InputDecoration(
              labelText: 'Notes',
              border: OutlineInputBorder(),
            ),
          ),
        ],
      ),
    );
  }
}
