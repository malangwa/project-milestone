class SearchResultItem {
  const SearchResultItem({
    required this.id,
    required this.label,
    required this.subtitle,
    required this.type,
    this.projectId,
  });

  final String id;
  final String label;
  final String subtitle;
  final String type;
  final String? projectId;
}

class SearchResultModel {
  const SearchResultModel({required this.items});

  final List<SearchResultItem> items;

  factory SearchResultModel.fromJson(Map<String, dynamic> json) {
    final items = <SearchResultItem>[];

    for (final p in (json['projects'] as List? ?? [])) {
      items.add(SearchResultItem(
        id: p['id'] as String,
        label: p['title'] as String? ?? p['name'] as String? ?? '',
        subtitle: p['status'] as String? ?? '',
        type: 'project',
        projectId: p['id'] as String,
      ));
    }
    for (final m in (json['milestones'] as List? ?? [])) {
      items.add(SearchResultItem(
        id: m['id'] as String,
        label: m['title'] as String? ?? m['name'] as String? ?? '',
        subtitle: 'Milestone · ${m['status'] ?? ''}',
        type: 'milestone',
        projectId: m['projectId']?.toString(),
      ));
    }
    for (final t in (json['tasks'] as List? ?? [])) {
      items.add(SearchResultItem(
        id: t['id'] as String,
        label: t['title'] as String? ?? '',
        subtitle: 'Task · ${t['status'] ?? ''}',
        type: 'task',
        projectId: t['projectId']?.toString(),
      ));
    }
    for (final i in (json['issues'] as List? ?? [])) {
      items.add(SearchResultItem(
        id: i['id'] as String,
        label: i['title'] as String? ?? '',
        subtitle: 'Issue · ${i['status'] ?? ''}',
        type: 'issue',
        projectId: i['projectId']?.toString(),
      ));
    }

    return SearchResultModel(items: items);
  }
}
