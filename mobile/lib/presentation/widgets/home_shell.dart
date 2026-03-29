import 'package:flutter/material.dart';

import '../../app/routes.dart';
import '../../data/services/session_controller.dart';
import '../pages/activities/activity_list_page.dart';
import '../pages/audit/audit_logs_page.dart';
import '../pages/calendar/calendar_page.dart';
import '../pages/dashboard/dashboard_page.dart';
import '../pages/expenses/expense_list_page.dart';
import '../pages/issues/issue_list_page.dart';
import '../pages/milestones/milestone_list_page.dart';
import '../pages/projects/project_list_page.dart';
import '../pages/reports/report_page.dart';
import '../pages/resources/resources_page.dart';
import '../pages/search/search_page.dart';
import '../pages/store/store_page.dart';
import '../pages/tasks/task_list_page.dart';
import '../pages/time_tracking/time_tracking_page.dart';
import '../pages/users/users_page.dart';

class HomeShell extends StatefulWidget {
  const HomeShell({super.key, this.initialIndex = 0});

  final int initialIndex;

  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> {
  late int _currentIndex;
  final Map<int, Widget> _cachedPages = {};

  List<_NavItem> get _destinations {
    final role = SessionController.instance.currentUser?.role ?? '';
    final isAdmin = role == 'admin';
    final isManager = role == 'manager';

    return [
      const _NavItem('Dashboard', Icons.dashboard_outlined, Icons.dashboard),
      const _NavItem('Projects', Icons.folder_outlined, Icons.folder),
      const _NavItem('Milestones', Icons.flag_outlined, Icons.flag),
      const _NavItem('Tasks', Icons.checklist_outlined, Icons.checklist),
      const _NavItem('Expenses', Icons.receipt_long_outlined, Icons.receipt_long),
      const _NavItem('Issues', Icons.bug_report_outlined, Icons.bug_report),
      const _NavItem('Reports', Icons.bar_chart_outlined, Icons.bar_chart),
      const _NavItem('Store', Icons.inventory_2_outlined, Icons.inventory_2),
      const _NavItem('Calendar', Icons.calendar_month_outlined, Icons.calendar_month),
      const _NavItem('Search', Icons.search_outlined, Icons.search),
      const _NavItem('Time Tracking', Icons.timer_outlined, Icons.timer),
      const _NavItem('Resources', Icons.build_outlined, Icons.build),
      const _NavItem('Activities', Icons.timeline_outlined, Icons.timeline),
      if (isAdmin || isManager)
        const _NavItem('Users', Icons.people_outlined, Icons.people),
      if (isAdmin)
        const _NavItem('Audit Logs', Icons.receipt_outlined, Icons.receipt),
    ];
  }

  Widget _buildPage(int index) {
    final destinations = _destinations;
    if (index < 0 || index >= destinations.length) return const DashboardPage();

    final label = destinations[index].label;
    return switch (label) {
      'Dashboard' => const DashboardPage(),
      'Projects' => const ProjectListPage(),
      'Milestones' => const MilestoneListPage(),
      'Tasks' => const TaskListPage(),
      'Expenses' => const ExpenseListPage(),
      'Issues' => const IssueListPage(),
      'Reports' => const ReportPage(),
      'Store' => const StorePage(),
      'Calendar' => const CalendarPage(),
      'Search' => const SearchPage(),
      'Time Tracking' => const TimeTrackingPage(),
      'Resources' => const ResourcesPage(),
      'Activities' => const ActivityListPage(),
      'Users' => const UsersPage(),
      'Audit Logs' => const AuditLogsPage(),
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
    _cachedPages.remove(index);
    setState(() => _currentIndex = index);
  }

  @override
  Widget build(BuildContext context) {
    final user = SessionController.instance.currentUser;
    final destinations = _destinations;

    const bottomNavCount = 5;
    final bottomIndex = _currentIndex < bottomNavCount ? _currentIndex : -1;

    return Scaffold(
      appBar: AppBar(
        title: Text(destinations[_currentIndex.clamp(0, destinations.length - 1)].label),
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
                  for (var i = 0; i < destinations.length; i++)
                    ListTile(
                      leading: Icon(
                        _currentIndex == i
                            ? destinations[i].selectedIcon
                            : destinations[i].icon,
                      ),
                      title: Text(destinations[i].label),
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
          for (var i = 0; i < destinations.length; i++)
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
          _cachedPages.remove(index);
          setState(() => _currentIndex = index);
        },
        destinations: [
          for (var i = 0; i < bottomNavCount; i++)
            NavigationDestination(
              icon: Icon(destinations[i].icon),
              selectedIcon: Icon(destinations[i].selectedIcon),
              label: destinations[i].label,
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
