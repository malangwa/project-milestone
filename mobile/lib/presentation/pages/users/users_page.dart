import 'package:flutter/material.dart';

import '../../../data/models/user_model.dart';
import '../../../data/services/session_controller.dart';
import '../../../data/services/user_management_service.dart';
import '../../widgets/empty_state.dart';
import '../../widgets/loading_indicator.dart';

class UsersPage extends StatefulWidget {
  const UsersPage({super.key});

  @override
  State<UsersPage> createState() => _UsersPageState();
}

class _UsersPageState extends State<UsersPage> {
  late Future<List<UserModel>> _future;

  static const _roles = ['admin', 'manager', 'engineer', 'viewer', 'client', 'subcontractor'];
  static const _managerRoles = ['engineer', 'viewer', 'client', 'subcontractor'];

  @override
  void initState() {
    super.initState();
    _future = _loadUsers();
  }

  Future<List<UserModel>> _loadUsers() async {
    try {
      return await UserManagementService.instance.getAll();
    } catch (_) {
      return [];
    }
  }

  Color _roleColor(String? role) {
    return switch (role) {
      'admin' => Colors.red,
      'manager' => Colors.blue,
      'engineer' => Colors.purple,
      'viewer' => Colors.grey,
      'client' => Colors.green,
      'subcontractor' => Colors.orange,
      _ => Colors.grey,
    };
  }

  Future<void> _showCreateDialog() async {
    final myRole = SessionController.instance.currentUser?.role ?? '';
    final isAdmin = myRole == 'admin';
    final availableRoles = isAdmin ? _roles : _managerRoles;
    final nameCtl = TextEditingController();
    final emailCtl = TextEditingController();
    final passCtl = TextEditingController();
    String role = 'engineer';

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          title: const Text('Create User'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(controller: nameCtl, decoration: const InputDecoration(labelText: 'Full Name *')),
                const SizedBox(height: 12),
                TextField(controller: emailCtl, decoration: const InputDecoration(labelText: 'Email *'), keyboardType: TextInputType.emailAddress),
                const SizedBox(height: 12),
                TextField(controller: passCtl, decoration: const InputDecoration(labelText: 'Password *'), obscureText: true),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  value: role,
                  decoration: const InputDecoration(labelText: 'Role'),
                  items: availableRoles.map((r) => DropdownMenuItem(value: r, child: Text(r))).toList(),
                  onChanged: (v) => setDialogState(() => role = v ?? 'engineer'),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
            FilledButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Create')),
          ],
        ),
      ),
    );

    if (confirmed != true) return;
    if (nameCtl.text.trim().isEmpty || emailCtl.text.trim().isEmpty || passCtl.text.trim().isEmpty) return;

    try {
      await UserManagementService.instance.createUser({
        'name': nameCtl.text.trim(),
        'email': emailCtl.text.trim(),
        'password': passCtl.text.trim(),
        'role': role,
      });
      setState(() => _future = _loadUsers());
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('User created')));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed: $e')));
      }
    }
  }

  bool _canEdit(UserModel target, String? myId, bool isAdmin, bool isManager) {
    if (target.id == myId) return false;
    if (isAdmin) return true;
    if (isManager) {
      // Backend already filters list to only own-created users + self.
      // Don't allow editing admins/managers.
      return target.role != 'admin' && target.role != 'manager';
    }
    return false;
  }

  Future<void> _editRole(UserModel user) async {
    final myRole = SessionController.instance.currentUser?.role ?? '';
    final isAdmin = myRole == 'admin';
    final availableRoles = isAdmin ? _roles : _managerRoles;
    String role = user.role ?? 'viewer';
    if (!availableRoles.contains(role)) role = availableRoles.first;

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          title: Text('Edit role: ${user.name}'),
          content: DropdownButtonFormField<String>(
            value: role,
            decoration: const InputDecoration(labelText: 'Role'),
            items: availableRoles.map((r) => DropdownMenuItem(value: r, child: Text(r))).toList(),
            onChanged: (v) => setDialogState(() => role = v ?? role),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
            FilledButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Save')),
          ],
        ),
      ),
    );

    if (confirmed != true) return;
    try {
      await UserManagementService.instance.updateRole(user.id, role);
      setState(() => _future = _loadUsers());
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed: $e')));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final me = SessionController.instance.currentUser;
    final myRole = me?.role ?? '';
    final isAdmin = myRole == 'admin';
    final isManager = myRole == 'manager';
    final canView = isAdmin || isManager;
    final canManage = isAdmin || isManager;

    if (!canView) {
      return const EmptyState(
        icon: Icons.lock_outline,
        title: 'You don\'t have permission to view this page.',
      );
    }

    return FutureBuilder<List<UserModel>>(
      future: _future,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const LoadingIndicator(message: 'Loading users...');
        }
        final users = snapshot.data ?? [];

        return Column(
          children: [
            if (canManage)
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    FilledButton.tonalIcon(
                      onPressed: _showCreateDialog,
                      icon: const Icon(Icons.person_add),
                      label: const Text('New User'),
                    ),
                  ],
                ),
              ),
            Expanded(
              child: users.isEmpty
                  ? const EmptyState(icon: Icons.people_outlined, title: 'No users found')
                  : RefreshIndicator(
                      onRefresh: () async {
                        setState(() => _future = _loadUsers());
                        await _future;
                      },
                      child: ListView.separated(
                        padding: const EdgeInsets.all(16),
                        itemCount: users.length,
                        separatorBuilder: (_, _) => const SizedBox(height: 6),
                        itemBuilder: (context, index) {
                          final u = users[index];
                          final color = _roleColor(u.role);
                          final isMe = u.id == me?.id;
                          return Card(
                            child: ListTile(
                              contentPadding: const EdgeInsets.all(14),
                              leading: CircleAvatar(
                                backgroundColor: Colors.blue,
                                child: Text(
                                  u.name.isNotEmpty ? u.name[0].toUpperCase() : 'U',
                                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                                ),
                              ),
                              title: Row(
                                children: [
                                  Flexible(child: Text(u.name)),
                                  if (isMe) ...[
                                    const SizedBox(width: 6),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                      decoration: BoxDecoration(
                                        color: Colors.blue.withValues(alpha: 0.1),
                                        borderRadius: BorderRadius.circular(10),
                                      ),
                                      child: const Text('You', style: TextStyle(fontSize: 10, color: Colors.blue)),
                                    ),
                                  ],
                                ],
                              ),
                              subtitle: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(u.email, style: const TextStyle(fontSize: 12)),
                                  const SizedBox(height: 4),
                                  Row(
                                    children: [
                                      Chip(
                                        label: Text(u.role ?? 'unknown'),
                                        backgroundColor: color.withValues(alpha: 0.12),
                                        labelStyle: TextStyle(color: color, fontSize: 11),
                                        side: BorderSide.none,
                                        materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                                        visualDensity: VisualDensity.compact,
                                      ),
                                      const SizedBox(width: 6),
                                      Chip(
                                        label: Text(u.isActive == true ? 'Active' : 'Inactive'),
                                        backgroundColor: u.isActive == true
                                            ? Colors.green.withValues(alpha: 0.1)
                                            : Colors.grey.withValues(alpha: 0.1),
                                        labelStyle: TextStyle(
                                          color: u.isActive == true ? Colors.green : Colors.grey,
                                          fontSize: 11,
                                        ),
                                        side: BorderSide.none,
                                        materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                                        visualDensity: VisualDensity.compact,
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                              trailing: _canEdit(u, me?.id, isAdmin, isManager)
                                  ? IconButton(icon: const Icon(Icons.edit_outlined, size: 20), onPressed: () => _editRole(u))
                                  : null,
                            ),
                          );
                        },
                      ),
                    ),
            ),
          ],
        );
      },
    );
  }
}
