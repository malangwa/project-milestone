import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

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
          TextButton(
            onPressed: _markAllRead,
            child: const Text('Mark all read'),
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
              padding: const EdgeInsets.symmetric(vertical: 8),
              itemCount: notifications.length,
              separatorBuilder: (_, _) => const Divider(height: 1),
              itemBuilder: (context, index) {
                final notification = notifications[index];
                String? timeStr;
                if (notification.createdAt != null) {
                  final parsed = DateTime.tryParse(notification.createdAt!);
                  if (parsed != null) {
                    timeStr = dateFormat.format(parsed.toLocal());
                  }
                }

                return ListTile(
                  tileColor: notification.isRead
                      ? null
                      : Theme.of(context)
                          .colorScheme
                          .primaryContainer
                          .withValues(alpha: 0.2),
                  leading: Icon(
                    notification.isRead
                        ? Icons.notifications_none
                        : Icons.notifications_active,
                    color: notification.isRead ? Colors.grey : Colors.blue,
                  ),
                  title: Text(
                    notification.message,
                    style: TextStyle(
                      fontWeight: notification.isRead
                          ? FontWeight.normal
                          : FontWeight.w600,
                    ),
                  ),
                  subtitle: timeStr != null ? Text(timeStr) : null,
                  onTap: notification.isRead
                      ? null
                      : () => _markRead(notification.id),
                );
              },
            );
          },
        ),
      ),
    );
  }
}
