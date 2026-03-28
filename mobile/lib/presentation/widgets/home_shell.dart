import 'package:flutter/material.dart';

import '../../app/routes.dart';
import '../../data/services/session_controller.dart';
import '../pages/activities/activity_list_page.dart';
import '../pages/dashboard/dashboard_page.dart';
import '../pages/expenses/expense_list_page.dart';
import '../pages/issues/issue_list_page.dart';
import '../pages/milestones/milestone_list_page.dart';
import '../pages/projects/project_list_page.dart';
import '../pages/reports/report_page.dart';
import '../pages/store/store_page.dart';
import '../pages/tasks/task_list_page.dart';

class HomeShell extends StatefulWidget {
  const HomeShell({super.key, this.initialIndex = 0});

  final int initialIndex;

  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> {
  late int _currentIndex;
  final Map<int, Widget> _cachedPages = {};

  static const _destinations = <_NavItem>[
    _NavItem('Dashboard', Icons.dashboard_outlined, Icons.dashboard),
    _NavItem('Projects', Icons.folder_outlined, Icons.folder),
    _NavItem('Tasks', Icons.checklist_outlined, Icons.checklist),
    _NavItem('Milestones', Icons.flag_outlined, Icons.flag),
    _NavItem('Expenses', Icons.receipt_long_outlined, Icons.receipt_long),
    _NavItem('Issues', Icons.bug_report_outlined, Icons.bug_report),
    _NavItem('Activities', Icons.timeline_outlined, Icons.timeline),
    _NavItem('Reports', Icons.bar_chart_outlined, Icons.bar_chart),
    _NavItem('Store', Icons.inventory_2_outlined, Icons.inventory_2),
  ];

  Widget _buildPage(int index) {
    return switch (index) {
      0 => const DashboardPage(),
      1 => const ProjectListPage(),
      2 => const TaskListPage(),
      3 => const MilestoneListPage(),
      4 => const ExpenseListPage(),
      5 => const IssueListPage(),
      6 => const ActivityListPage(),
      7 => const ReportPage(),
      8 => const StorePage(),
      _ => const DashboardPage(),
    };
  }

  Widget _getPage(int index) {
    return _cachedPages.putIfAbsent(index, () => _buildPage(index));
  }

  @override
  void initState() {
    super.initState();
    _currentIndex = widget.initialIndex.clamp(0, _destinations.length - 1);
  }

  Future<void> _logout() async {
    await SessionController.instance.logout();
    if (!mounted) return;
    Navigator.of(context)
        .pushNamedAndRemoveUntil(AppRoutes.login, (_) => false);
  }

  void _goTo(int index) {
    Navigator.of(context).pop();
    setState(() => _currentIndex = index);
  }

  @override
  Widget build(BuildContext context) {
    final user = SessionController.instance.currentUser;

    const bottomNavCount = 5;
    final bottomIndex = _currentIndex < bottomNavCount ? _currentIndex : -1;

    return Scaffold(
      appBar: AppBar(
        title: Text(_destinations[_currentIndex].label),
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications_outlined),
            tooltip: 'Notifications',
            onPressed: () =>
                Navigator.of(context).pushNamed(AppRoutes.notifications),
          ),
        ],
      ),
      drawer: Drawer(
        child: Column(
          children: [
            UserAccountsDrawerHeader(
              accountName: Text(user?.name ?? 'User'),
              accountEmail: Text(user?.email ?? ''),
              currentAccountPicture: CircleAvatar(
                child: Text(
                  (user?.name.isNotEmpty ?? false)
                      ? user!.name.characters.first.toUpperCase()
                      : 'U',
                ),
              ),
            ),
            Expanded(
              child: ListView(
                padding: EdgeInsets.zero,
                children: [
                  for (var i = 0; i < _destinations.length; i++)
                    ListTile(
                      leading: Icon(
                        _currentIndex == i
                            ? _destinations[i].selectedIcon
                            : _destinations[i].icon,
                      ),
                      title: Text(_destinations[i].label),
                      selected: _currentIndex == i,
                      onTap: () => _goTo(i),
                    ),
                  const Divider(),
                  ListTile(
                    leading: const Icon(Icons.notifications_outlined),
                    title: const Text('Notifications'),
                    onTap: () {
                      Navigator.of(context).pop();
                      Navigator.of(context).pushNamed(AppRoutes.notifications);
                    },
                  ),
                  ListTile(
                    leading: const Icon(Icons.settings_outlined),
                    title: const Text('Settings'),
                    onTap: () {
                      Navigator.of(context).pop();
                      Navigator.of(context).pushNamed(AppRoutes.settings);
                    },
                  ),
                ],
              ),
            ),
            const Divider(height: 1),
            ListTile(
              leading: const Icon(Icons.logout),
              title: const Text('Logout'),
              onTap: _logout,
            ),
            const SizedBox(height: 12),
          ],
        ),
      ),
      body: IndexedStack(
        index: _currentIndex,
        children: [
          for (var i = 0; i < _destinations.length; i++)
            if (_cachedPages.containsKey(i))
              _getPage(i)
            else if (i == _currentIndex)
              _getPage(i)
            else
              const SizedBox.shrink(),
        ],
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: bottomIndex == -1 ? 0 : bottomIndex,
        onDestinationSelected: (index) {
          setState(() => _currentIndex = index);
        },
        destinations: [
          for (var i = 0; i < bottomNavCount; i++)
            NavigationDestination(
              icon: Icon(_destinations[i].icon),
              selectedIcon: Icon(_destinations[i].selectedIcon),
              label: _destinations[i].label,
            ),
        ],
      ),
    );
  }
}

class _NavItem {
  const _NavItem(this.label, this.icon, this.selectedIcon);

  final String label;
  final IconData icon;
  final IconData selectedIcon;
}
