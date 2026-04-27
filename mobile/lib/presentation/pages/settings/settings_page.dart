import 'package:flutter/material.dart';

import '../../../app/routes.dart';
import '../../../config/api_config.dart';
import '../../../data/services/account_service.dart';
import '../../../data/services/session_controller.dart';
import '../../../l10n/app_i18n.dart';

class SettingsPage extends StatefulWidget {
  const SettingsPage({super.key});

  @override
  State<SettingsPage> createState() => _SettingsPageState();
}

class _SettingsPageState extends State<SettingsPage> {
  Future<void> _showEditProfileSheet() async {
    final user = SessionController.instance.currentUser;
    final nameCtrl = TextEditingController(text: user?.name ?? '');
    final formKey = GlobalKey<FormState>();
    var submitting = false;

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
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text(
                    'Edit profile',
                    style: Theme.of(modalContext).textTheme.titleLarge,
                  ),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: nameCtrl,
                    decoration: const InputDecoration(
                      labelText: 'Full name',
                      border: OutlineInputBorder(),
                    ),
                    validator: (value) => (value == null || value.trim().isEmpty)
                        ? 'Name is required'
                        : null,
                  ),
                  const SizedBox(height: 16),
                  FilledButton(
                    onPressed: submitting
                        ? null
                        : () async {
                            if (formKey.currentState?.validate() != true) return;
                            setModalState(() => submitting = true);
                            try {
                              final updated =
                                  await AccountService.instance.updateProfile(
                                name: nameCtrl.text.trim(),
                              );
                              SessionController.instance.updateCurrentUser(updated);
                              if (sheetContext.mounted) Navigator.pop(sheetContext);
                              if (!mounted) return;
                              setState(() {});
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                  content: Text('Profile updated'),
                                ),
                              );
                            } catch (_) {
                              if (!mounted) return;
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                  content: Text('Failed to update profile'),
                                ),
                              );
                            } finally {
                              if (modalContext.mounted) {
                                setModalState(() => submitting = false);
                              }
                            }
                          },
                    child: Text(submitting ? 'Saving...' : 'Save changes'),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
    nameCtrl.dispose();
  }

  Future<void> _showChangePasswordSheet() async {
    final currentCtrl = TextEditingController();
    final newCtrl = TextEditingController();
    final confirmCtrl = TextEditingController();
    final formKey = GlobalKey<FormState>();
    var submitting = false;

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
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text(
                    'Change password',
                    style: Theme.of(modalContext).textTheme.titleLarge,
                  ),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: currentCtrl,
                    obscureText: true,
                    decoration: const InputDecoration(
                      labelText: 'Current password',
                      border: OutlineInputBorder(),
                    ),
                    validator: (value) => (value == null || value.isEmpty)
                        ? 'Current password is required'
                        : null,
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: newCtrl,
                    obscureText: true,
                    decoration: const InputDecoration(
                      labelText: 'New password',
                      border: OutlineInputBorder(),
                    ),
                    validator: (value) {
                      if (value == null || value.length < 8) {
                        return 'Password must be at least 8 characters';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: confirmCtrl,
                    obscureText: true,
                    decoration: const InputDecoration(
                      labelText: 'Confirm new password',
                      border: OutlineInputBorder(),
                    ),
                    validator: (value) {
                      if (value != newCtrl.text) {
                        return 'Passwords do not match';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 16),
                  FilledButton(
                    onPressed: submitting
                        ? null
                        : () async {
                            if (formKey.currentState?.validate() != true) return;
                            setModalState(() => submitting = true);
                            try {
                              await AccountService.instance.changePassword(
                                currentPassword: currentCtrl.text,
                                newPassword: newCtrl.text,
                              );
                              if (sheetContext.mounted) Navigator.pop(sheetContext);
                              if (!mounted) return;
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                  content: Text('Password changed'),
                                ),
                              );
                            } catch (_) {
                              if (!mounted) return;
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                  content: Text('Failed to change password'),
                                ),
                              );
                            } finally {
                              if (modalContext.mounted) {
                                setModalState(() => submitting = false);
                              }
                            }
                          },
                    child: Text(submitting ? 'Updating...' : 'Update password'),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
    currentCtrl.dispose();
    newCtrl.dispose();
    confirmCtrl.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final user = SessionController.instance.currentUser;

    return Scaffold(
      appBar: AppBar(title: Text('settings.title'.tr)),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                children: [
                  CircleAvatar(
                    radius: 36,
                    child: Text(
                      (user?.name.isNotEmpty ?? false)
                          ? user!.name.characters.first.toUpperCase()
                          : 'U',
                      style: const TextStyle(fontSize: 28),
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    user?.name ?? 'label.you'.tr,
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  Text(
                    user?.email ?? '',
                    style: const TextStyle(color: Color(0xFF6B7280)),
                  ),
                  const SizedBox(height: 8),
                  Chip(
                    label: Text(user?.role?.toUpperCase() ?? ''),
                    backgroundColor: Theme.of(context)
                        .colorScheme
                        .primaryContainer
                        .withValues(alpha: 0.5),
                    side: BorderSide.none,
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 8),
          // Language picker
          Card(
            child: Column(
              children: [
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
                  child: Row(
                    children: [
                      const Icon(Icons.language, size: 20),
                      const SizedBox(width: 12),
                      Text('settings.language'.tr,
                          style: Theme.of(context).textTheme.titleSmall),
                    ],
                  ),
                ),
                RadioListTile<String>(
                  title: Text('settings.languageEnglish'.tr),
                  value: 'en',
                  groupValue: AppI18n.instance.lang,
                  onChanged: (v) => v != null ? AppI18n.instance.setLanguage(v) : null,
                ),
                RadioListTile<String>(
                  title: Text('settings.languageSwahili'.tr),
                  value: 'sw',
                  groupValue: AppI18n.instance.lang,
                  onChanged: (v) => v != null ? AppI18n.instance.setLanguage(v) : null,
                ),
              ],
            ),
          ),
          const SizedBox(height: 8),
          Card(
            child: Column(
              children: [
                ListTile(
                  leading: const Icon(Icons.edit_outlined),
                  title: Text('action.edit'.tr + ' ' + 'nav.profile'.tr),
                  subtitle: Text('label.fullName'.tr),
                  onTap: _showEditProfileSheet,
                ),
                const Divider(height: 1),
                ListTile(
                  leading: const Icon(Icons.lock_outline),
                  title: Text('settings.changePassword'.tr),
                  subtitle: Text('label.password'.tr),
                  onTap: _showChangePasswordSheet,
                ),
                const Divider(height: 1),
                ListTile(
                  leading: const Icon(Icons.cloud_outlined),
                  title: const Text('API Server'),
                  subtitle: Text(ApiConfig.baseUrl),
                ),
                const Divider(height: 1),
                ListTile(
                  leading: const Icon(Icons.info_outline),
                  title: Text('settings.version'.tr),
                  subtitle: const Text('1.0.0+1'),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          FilledButton.tonalIcon(
            onPressed: () async {
              await SessionController.instance.logout();
              if (!context.mounted) return;
              Navigator.of(context)
                  .pushNamedAndRemoveUntil(AppRoutes.login, (_) => false);
            },
            icon: const Icon(Icons.logout),
            label: Text('action.logout'.tr),
          ),
        ],
      ),
    );
  }
}
