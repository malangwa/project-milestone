import 'package:flutter/material.dart';

import '../../../app/routes.dart';
import '../../../data/models/search_result_model.dart';
import '../../../data/services/search_service.dart';
import '../../widgets/empty_state.dart';
import '../../widgets/loading_indicator.dart';

class SearchPage extends StatefulWidget {
  const SearchPage({super.key});

  @override
  State<SearchPage> createState() => _SearchPageState();
}

class _SearchPageState extends State<SearchPage> {
  final _controller = TextEditingController();
  List<SearchResultItem>? _results;
  bool _loading = false;
  bool _searched = false;

  Future<void> _search() async {
    final q = _controller.text.trim();
    if (q.length < 2) return;

    setState(() { _loading = true; _searched = true; });
    try {
      final result = await SearchService.instance.search(q);
      setState(() => _results = result.items);
    } catch (_) {
      setState(() => _results = []);
    } finally {
      setState(() => _loading = false);
    }
  }

  Color _typeColor(String type) {
    return switch (type) {
      'project' => Colors.blue,
      'task' => Colors.deepPurple,
      'issue' => Colors.red,
      'milestone' => Colors.green,
      _ => Colors.grey,
    };
  }

  void _openResult(SearchResultItem result) {
    final projectId = result.type == 'project' ? result.id : result.projectId;
    if (projectId == null || projectId.isEmpty) return;
    Navigator.of(context).pushNamed(
      AppRoutes.projectDetail,
      arguments: projectId,
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _controller,
                  decoration: const InputDecoration(
                    hintText: 'Search projects, tasks, milestones, issues...',
                    prefixIcon: Icon(Icons.search),
                    border: OutlineInputBorder(),
                  ),
                  textInputAction: TextInputAction.search,
                  onSubmitted: (_) => _search(),
                ),
              ),
              const SizedBox(width: 8),
              FilledButton(
                onPressed: _loading ? null : _search,
                child: Text(_loading ? '...' : 'Search'),
              ),
            ],
          ),
        ),
        Expanded(
          child: _loading
              ? const LoadingIndicator(message: 'Searching...')
              : !_searched
                  ? const EmptyState(
                      icon: Icons.search,
                      title: 'Type to search across all your projects.',
                    )
                  : (_results == null || _results!.isEmpty)
                      ? EmptyState(
                          icon: Icons.search_off,
                          title: 'No results for "${_controller.text}".',
                        )
                      : ListView.separated(
                          padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                          itemCount: _results!.length,
                          separatorBuilder: (_, _) => const SizedBox(height: 8),
                          itemBuilder: (context, index) {
                            final r = _results![index];
                            final color = _typeColor(r.type);
                            return Card(
                              child: ListTile(
                                contentPadding: const EdgeInsets.all(16),
                                onTap: () => _openResult(r),
                                leading: CircleAvatar(
                                  backgroundColor: color.withValues(alpha: 0.14),
                                  child: Text(
                                    r.type[0].toUpperCase(),
                                    style: TextStyle(color: color, fontWeight: FontWeight.bold),
                                  ),
                                ),
                                title: Text(r.label),
                                subtitle: Text(r.subtitle, style: const TextStyle(fontSize: 12)),
                                trailing: Chip(
                                  label: Text(r.type),
                                  backgroundColor: color.withValues(alpha: 0.12),
                                  labelStyle: TextStyle(color: color, fontSize: 11),
                                  side: BorderSide.none,
                                ),
                              ),
                            );
                          },
                        ),
        ),
      ],
    );
  }
}
