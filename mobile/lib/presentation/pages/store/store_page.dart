import 'package:flutter/material.dart';

import '../../../data/models/inventory_model.dart';
import '../../../data/services/inventory_service.dart';
import '../../widgets/loading_indicator.dart';

class StorePage extends StatefulWidget {
  const StorePage({super.key});

  @override
  State<StorePage> createState() => _StorePageState();
}

class _StorePageState extends State<StorePage> {
  late Future<InventoryOverviewModel> _future;
  bool _onlyLowStock = false;

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  Future<InventoryOverviewModel> _load() async {
    try {
      return await InventoryService.instance.getGlobalInventory();
    } catch (_) {
      return const InventoryOverviewModel(items: [], projects: []);
    }
  }

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: () async {
        setState(() => _future = _load());
        await _future;
      },
      child: FutureBuilder<InventoryOverviewModel>(
        future: _future,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const LoadingIndicator(message: 'Loading store...');
          }

          final overview = snapshot.data ?? const InventoryOverviewModel(items: [], projects: []);
          final items = _onlyLowStock
              ? overview.items.where((item) => item.isLowStock).toList()
              : overview.items;

          return ListView(
            padding: const EdgeInsets.all(16),
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
                            const Text('Inventory Items'),
                            const SizedBox(height: 8),
                            Text(
                              '${overview.items.length}',
                              style: Theme.of(context).textTheme.headlineMedium,
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
                            const Text('Low Stock'),
                            const SizedBox(height: 8),
                            Text(
                              '${overview.items.where((item) => item.isLowStock).length}',
                              style: Theme.of(context)
                                  .textTheme
                                  .headlineMedium
                                  ?.copyWith(color: Colors.red),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ],
              ),
              SwitchListTile(
                value: _onlyLowStock,
                title: const Text('Show low stock only'),
                onChanged: (value) => setState(() => _onlyLowStock = value),
              ),
              const SizedBox(height: 8),
              if (items.isEmpty)
                const Card(
                  child: Padding(
                    padding: EdgeInsets.all(24),
                    child: Text('No materials found matching your criteria.'),
                  ),
                )
              else
                ...items.map(
                  (item) => Card(
                    child: ListTile(
                      contentPadding: const EdgeInsets.all(16),
                      title: Text(item.name),
                      subtitle: Padding(
                        padding: const EdgeInsets.only(top: 6),
                        child: Text(
                          [
                            item.projectName,
                            '${item.currentQuantity.toStringAsFixed(0)} ${item.unit}',
                            item.stockStatus.replaceAll('_', ' '),
                            if ((item.allocationTarget ?? '').isNotEmpty)
                              item.allocationTarget!,
                            if ((item.location ?? '').isNotEmpty) item.location!,
                          ].join(' • '),
                        ),
                      ),
                      trailing: Chip(
                        label: Text(
                          item.isLowStock
                              ? 'Low stock'
                              : item.stockStatus == 'available_in_store'
                                  ? 'In store'
                                  : 'Allocated',
                        ),
                        backgroundColor: item.isLowStock
                            ? Colors.red.withValues(alpha: 0.12)
                            : item.stockStatus == 'available_in_store'
                                ? Colors.green.withValues(alpha: 0.12)
                                : Colors.orange.withValues(alpha: 0.12),
                        side: BorderSide.none,
                      ),
                    ),
                  ),
                ),
            ],
          );
        },
      ),
    );
  }
}
