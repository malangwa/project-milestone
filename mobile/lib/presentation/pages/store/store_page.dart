import 'package:flutter/material.dart';

import '../../../data/models/inventory_model.dart';
import '../../../data/services/inventory_service.dart';

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
    _future = InventoryService.instance.getGlobalInventory();
  }

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: () async {
        setState(() => _future = InventoryService.instance.getGlobalInventory());
        await _future;
      },
      child: FutureBuilder<InventoryOverviewModel>(
        future: _future,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }

          if (snapshot.hasError) {
            return ListView(
              children: const [
                SizedBox(height: 160),
                Center(child: Text('Failed to load store inventory')),
              ],
            );
          }

          final overview = snapshot.data!;
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
                    child: Text('No inventory items match the current filter.'),
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
                            if ((item.location ?? '').isNotEmpty) item.location!,
                          ].join(' • '),
                        ),
                      ),
                      trailing: Chip(
                        label: Text(
                          item.isLowStock ? 'Low stock' : 'Normal',
                        ),
                        backgroundColor: item.isLowStock
                            ? Colors.red.withValues(alpha: 0.12)
                            : Colors.green.withValues(alpha: 0.12),
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
