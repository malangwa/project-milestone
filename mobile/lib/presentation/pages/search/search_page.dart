import 'package:flutter/material.dart';

import '../../../app/routes.dart';
import '../../../config/app_theme.dart';
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

  (Color, Color) _typeColors(String type) {
    return switch (type) {
      'project' => (AppTheme.indigo50, AppTheme.primary),
      'task' => (const Color(0xFFF5F3FF), const Color(0xFF7C3AED)),
      'issue' => (AppTheme.red50, AppTheme.red600),
      'milestone' => (AppTheme.emerald50, AppTheme.emerald600),
      _ => (AppTheme.slate100, AppTheme.textSecondary),
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
                    hintText: 'Search projects, tasks, milestones, issues…',
                    prefixIcon: Icon(Icons.search, size: 20, color: AppTheme.textMuted),
                  ),
                  textInputAction: TextInputAction.search,
                  onSubmitted: (_) => _search(),
                ),
              ),
              const SizedBox(width: 8),
              FilledButton(
                onPressed: _loading ? null : _search,
                style: FilledButton.styleFrom(
                  padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
                ),
                child: _loading
                    ? const SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                      )
                    : const Text('Search'),
              ),
            ],
          ),
        ),
        Expanded(
          child: _loading
              ? const LoadingIndicator(message: 'Searching…')
              : !_searched
                  ? const EmptyState(
                      icon: Icons.search,
                      title: 'Type to search.',
                      subtitle: 'Search projects, tasks, milestones and issues.',
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
                            final colors = _typeColors(r.type);
                            return Card(
                              child: InkWell(
                                borderRadius: BorderRadius.circular(20),
                                onTap: () => _openResult(r),
                                child: Padding(
                                  padding: const EdgeInsets.all(14),
                                  child: Row(
                                    children: [
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                        decoration: BoxDecoration(
                                          color: colors.$1,
                                          borderRadius: BorderRadius.circular(8),
                                        ),
                                        child: Text(
                                          r.type,
                                          style: TextStyle(
                                            color: colors.$2,
                                            fontSize: 11,
                                            fontWeight: FontWeight.w700,
                                          ),
                                        ),
                                      ),
                                      const SizedBox(width: 12),
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                              r.label,
                                              style: const TextStyle(
                                                fontWeight: FontWeight.w600,
                                                color: AppTheme.textPrimary,
                                                fontSize: 14,
                                              ),
                                              maxLines: 1,
                                              overflow: TextOverflow.ellipsis,
                                            ),
                                            if (r.subtitle.isNotEmpty) ...[
                                              const SizedBox(height: 2),
                                              Text(
                                                r.subtitle,
                                                style: const TextStyle(
                                                  fontSize: 12,
                                                  color: AppTheme.textMuted,
                                                ),
                                                maxLines: 1,
                                                overflow: TextOverflow.ellipsis,
                                              ),
                                            ],
                                          ],
                                        ),
                                      ),
                                      const Icon(Icons.chevron_right, size: 18, color: AppTheme.textMuted),
                                    ],
                                  ),
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
