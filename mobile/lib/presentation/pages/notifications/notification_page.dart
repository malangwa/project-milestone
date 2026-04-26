import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../../config/app_theme.dart';
import '../../../data/models/notification_model.dart';
import '../../../data/services/notification_service.dart';
import '../../widgets/empty_state.dart';
import '../../widgets/loading_indicator.dart';

class NotificationPage extends StatefulWidget {
  const NotificationPage({super.key});

  @override
  State<NotificationPage> createState() => _NotificationPageState();
}

class _NotificationPageState extends State<NotificationPage> {
  late Future<List<NotificationModel>> _future;

  @override
  void initState() {
    super.initState();
    _future = _loadNotifications();
  }

  Future<List<NotificationModel>> _loadNotifications() async {
    try {
      return await NotificationService.instance.getAll();
    } catch (_) {
      return [];
    }
  }

  Future<void> _markAllRead() async {
    try {
      await NotificationService.instance.markAllRead();
      setState(() => _future = _loadNotifications());
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to mark notifications as read')),
        );
      }
    }
  }

  Future<void> _markRead(String id) async {
    try {
      await NotificationService.instance.markRead(id);
      setState(() => _future = _loadNotifications());
    } catch (_) {
      // silently fail for single item
    }
  }

  @override
  Widget build(BuildContext context) {
    final dateFormat = DateFormat('MMM d, h:mm a');

    return Scaffold(
      appBar: AppBar(
        title: const Text('Notifications'),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 8),
            child: TextButton.icon(
              onPressed: _markAllRead,
              icon: const Icon(Icons.done_all_rounded, size: 18),
              label: const Text('Mark all read'),
              style: TextButton.styleFrom(foregroundColor: AppTheme.primary),
            ),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          setState(() => _future = _loadNotifications());
          await _future;
        },
        child: FutureBuilder<List<NotificationModel>>(
          future: _future,
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return const LoadingIndicator(message: 'Loading notifications...');
            }
            final notifications =
                snapshot.data ?? const <NotificationModel>[];
            if (snapshot.hasError || notifications.isEmpty) {
              return ListView(
                physics: const AlwaysScrollableScrollPhysics(),
                children: const [
                  EmptyState(
                    icon: Icons.notifications_outlined,
                    title: 'No notifications yet.',
                  ),
                ],
              );
            }

            return ListView.separated(
              padding: const EdgeInsets.all(12),
              itemCount: notifications.length,
              separatorBuilder: (_, _) => const SizedBox(height: 8),
              itemBuilder: (context, index) {
                final notification = notifications[index];
                String? timeStr;
                if (notification.createdAt != null) {
                  final parsed = DateTime.tryParse(notification.createdAt!);
                  if (parsed != null) {
                    timeStr = dateFormat.format(parsed.toLocal());
                  }
                }

                final unread = !notification.isRead;
                return Card(
                  color: unread ? AppTheme.indigo50 : Colors.white,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                    side: BorderSide(
                      color: unread ? const Color(0xFFC7D2FE) : AppTheme.cardBorder,
                    ),
                  ),
                  child: InkWell(
                    borderRadius: BorderRadius.circular(16),
                    onTap: unread ? () => _markRead(notification.id) : null,
                    child: Padding(
                      padding: const EdgeInsets.all(14),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Container(
                            width: 36,
                            height: 36,
                            decoration: BoxDecoration(
                              color: unread ? AppTheme.primary : AppTheme.slate100,
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Icon(
                              unread ? Icons.notifications_active_rounded : Icons.notifications_none_rounded,
                              color: unread ? Colors.white : AppTheme.textMuted,
                              size: 18,
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  notification.message,
                                  style: TextStyle(
                                    fontWeight: unread ? FontWeight.w600 : FontWeight.w500,
                                    color: AppTheme.textPrimary,
                                    fontSize: 14,
                                    height: 1.4,
                                  ),
                                ),
                                if (timeStr != null) ...[
                                  const SizedBox(height: 4),
                                  Text(
                                    timeStr,
                                    style: const TextStyle(
                                      fontSize: 12,
                                      color: AppTheme.textMuted,
                                    ),
                                  ),
                                ],
                              ],
                            ),
                          ),
                          if (unread) ...[
                            const SizedBox(width: 8),
                            Container(
                              width: 8,
                              height: 8,
                              decoration: const BoxDecoration(
                                color: AppTheme.primary,
                                shape: BoxShape.circle,
                              ),
                            ),
                          ],
                        ],
                      ),
                    ),
                  ),
                );
              },
            );
          },
        ),
      ),
    );
  }
}
