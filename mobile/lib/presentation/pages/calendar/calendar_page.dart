import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../../data/models/project_model.dart';
import '../../../data/services/milestone_service.dart';
import '../../../data/services/project_service.dart';
import '../../../data/services/task_service.dart';
import '../../widgets/empty_state.dart';
import '../../widgets/loading_indicator.dart';

class _CalendarItem {
  const _CalendarItem({
    required this.id,
    required this.label,
    required this.date,
    required this.type,
    required this.projectName,
  });

  final String id;
  final String label;
  final DateTime date;
  final String type;
  final String projectName;
}

class CalendarPage extends StatefulWidget {
  const CalendarPage({super.key});

  @override
  State<CalendarPage> createState() => _CalendarPageState();
}

class _CalendarPageState extends State<CalendarPage> {
  late Future<List<_CalendarItem>> _future;
  DateTime _month = DateTime(DateTime.now().year, DateTime.now().month);

  @override
  void initState() {
    super.initState();
    _future = _loadAll();
  }

  Future<List<_CalendarItem>> _loadAll() async {
    final projects = await ProjectService.instance.getProjects();
    final items = <_CalendarItem>[];

    for (final p in projects) {
      try {
        final milestones = await MilestoneService.instance.getByProject(p.id);
        for (final m in milestones) {
          if (m.dueDate != null) {
            final date = DateTime.tryParse(m.dueDate!);
            if (date != null) {
              items.add(_CalendarItem(
                id: m.id,
                label: m.title,
                date: date,
                type: 'milestone',
                projectName: p.name,
              ));
            }
          }
        }
      } catch (_) {}

      try {
        final tasks = await TaskService.instance.getTasksByProject(p.id);
        for (final t in tasks) {
          if (t.dueDate != null) {
            final date = DateTime.tryParse(t.dueDate!);
            if (date != null) {
              items.add(_CalendarItem(
                id: t.id,
                label: t.title,
                date: date,
                type: 'task',
                projectName: p.name,
              ));
            }
          }
        }
      } catch (_) {}
    }

    return items;
  }

  List<_CalendarItem> _itemsForDay(List<_CalendarItem> all, int day) {
    return all.where((i) =>
        i.date.year == _month.year &&
        i.date.month == _month.month &&
        i.date.day == day).toList();
  }

  void _prevMonth() => setState(() => _month = DateTime(_month.year, _month.month - 1));
  void _nextMonth() => setState(() => _month = DateTime(_month.year, _month.month + 1));

  @override
  Widget build(BuildContext context) {
    final today = DateTime.now();
    final daysInMonth = DateTime(_month.year, _month.month + 1, 0).day;
    final firstWeekday = DateTime(_month.year, _month.month, 1).weekday % 7;
    final monthLabel = DateFormat('MMMM yyyy').format(_month);

    return FutureBuilder<List<_CalendarItem>>(
      future: _future,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const LoadingIndicator(message: 'Loading calendar...');
        }
        final items = snapshot.data ?? [];

        return Column(
          children: [
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  IconButton(
                    icon: const Icon(Icons.chevron_left),
                    onPressed: _prevMonth,
                  ),
                  Text(
                    monthLabel,
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
                  ),
                  IconButton(
                    icon: const Icon(Icons.chevron_right),
                    onPressed: _nextMonth,
                  ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 8),
              child: Row(
                children: ['S', 'M', 'T', 'W', 'T', 'F', 'S']
                    .map((d) => Expanded(
                          child: Center(
                            child: Text(d, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 12, color: Color(0xFF9CA3AF))),
                          ),
                        ))
                    .toList(),
              ),
            ),
            const SizedBox(height: 4),
            Expanded(
              child: GridView.builder(
                padding: const EdgeInsets.symmetric(horizontal: 8),
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 7,
                  childAspectRatio: 0.75,
                ),
                itemCount: firstWeekday + daysInMonth,
                itemBuilder: (context, index) {
                  if (index < firstWeekday) return const SizedBox.shrink();
                  final day = index - firstWeekday + 1;
                  final dayItems = _itemsForDay(items, day);
                  final isToday = today.year == _month.year &&
                      today.month == _month.month &&
                      today.day == day;

                  return Container(
                    margin: const EdgeInsets.all(1),
                    decoration: BoxDecoration(
                      border: Border.all(color: const Color(0xFFE5E7EB), width: 0.5),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    padding: const EdgeInsets.all(3),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          width: 22,
                          height: 22,
                          alignment: Alignment.center,
                          decoration: isToday
                              ? const BoxDecoration(color: Colors.blue, shape: BoxShape.circle)
                              : null,
                          child: Text(
                            '$day',
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                              color: isToday ? Colors.white : const Color(0xFF374151),
                            ),
                          ),
                        ),
                        ...dayItems.take(2).map((item) => Container(
                              margin: const EdgeInsets.only(top: 1),
                              padding: const EdgeInsets.symmetric(horizontal: 3, vertical: 1),
                              decoration: BoxDecoration(
                                color: item.type == 'milestone'
                                    ? const Color(0xFFF3E8FF)
                                    : const Color(0xFFDBEAFE),
                                borderRadius: BorderRadius.circular(3),
                              ),
                              child: Text(
                                item.label,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: TextStyle(
                                  fontSize: 8,
                                  color: item.type == 'milestone'
                                      ? const Color(0xFF7C3AED)
                                      : const Color(0xFF1D4ED8),
                                ),
                              ),
                            )),
                        if (dayItems.length > 2)
                          Padding(
                            padding: const EdgeInsets.only(top: 1),
                            child: Text(
                              '+${dayItems.length - 2}',
                              style: const TextStyle(fontSize: 8, color: Color(0xFF9CA3AF)),
                            ),
                          ),
                      ],
                    ),
                  );
                },
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(12),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Container(
                    width: 12, height: 12,
                    decoration: BoxDecoration(color: const Color(0xFFF3E8FF), borderRadius: BorderRadius.circular(2)),
                  ),
                  const SizedBox(width: 4),
                  const Text('Milestone', style: TextStyle(fontSize: 11, color: Color(0xFF6B7280))),
                  const SizedBox(width: 16),
                  Container(
                    width: 12, height: 12,
                    decoration: BoxDecoration(color: const Color(0xFFDBEAFE), borderRadius: BorderRadius.circular(2)),
                  ),
                  const SizedBox(width: 4),
                  const Text('Task', style: TextStyle(fontSize: 11, color: Color(0xFF6B7280))),
                ],
              ),
            ),
          ],
        );
      },
    );
  }
}
