import 'package:flutter/material.dart';

import '../../app/routes.dart';
import '../../config/app_theme.dart';
import '../../data/services/session_controller.dart';
import '../../l10n/app_i18n.dart';
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
      _NavItem('Dashboard', 'nav.dashboard'.tr, Icons.dashboard_outlined, Icons.dashboard),
      _NavItem('Projects', 'nav.projects'.tr, Icons.folder_outlined, Icons.folder),
      _NavItem('Milestones', 'nav.milestones'.tr, Icons.flag_outlined, Icons.flag),
      _NavItem('Tasks', 'nav.tasks'.tr, Icons.checklist_outlined, Icons.checklist),
      _NavItem('Expenses', 'nav.expenses'.tr, Icons.receipt_long_outlined, Icons.receipt_long),
      _NavItem('Issues', 'nav.issues'.tr, Icons.bug_report_outlined, Icons.bug_report),
      _NavItem('Reports', 'nav.reports'.tr, Icons.bar_chart_outlined, Icons.bar_chart),
      _NavItem('Store', 'nav.store'.tr, Icons.inventory_2_outlined, Icons.inventory_2),
      _NavItem('Calendar', 'nav.calendar'.tr, Icons.calendar_month_outlined, Icons.calendar_month),
      _NavItem('Search', 'nav.search'.tr, Icons.search_outlined, Icons.search),
      _NavItem('Time Tracking', 'nav.timeTracking'.tr, Icons.timer_outlined, Icons.timer),
      _NavItem('Resources', 'nav.resources'.tr, Icons.build_outlined, Icons.build),
      _NavItem('Activities', 'nav.activities'.tr, Icons.timeline_outlined, Icons.timeline),
      if (isAdmin || isManager)
        _NavItem('Users', 'nav.users'.tr, Icons.people_outlined, Icons.people),
      if (isAdmin)
        _NavItem('Audit Logs', 'nav.auditLogs'.tr, Icons.receipt_outlined, Icons.receipt),
    ];
  }

  Widget _buildPage(int index) {
    final destinations = _destinations;
    if (index < 0 || index >= destinations.length) return const DashboardPage();

    final id = destinations[index].id;
    return switch (id) {
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
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(52),
          child: Container(
            height: 52,
            decoration: const BoxDecoration(
              color: Colors.white,
              border: Border(bottom: BorderSide(color: AppTheme.slate200)),
            ),
            child: ListView.separated(
              padding: const EdgeInsets.fromLTRB(12, 0, 12, 10),
              scrollDirection: Axis.horizontal,
              itemBuilder: (context, index) {
                final item = destinations[index];
                final selected = _currentIndex == index;
                return ChoiceChip(
                  label: Text(item.label),
                  selected: selected,
                  selectedColor: AppTheme.indigo50,
                  labelStyle: TextStyle(
                    color: selected ? AppTheme.primary : AppTheme.textSecondary,
                    fontWeight: selected ? FontWeight.w600 : FontWeight.normal,
                    fontSize: 13,
                  ),
                  avatar: Icon(
                    selected ? item.selectedIcon : item.icon,
                    size: 16,
                    color: selected ? AppTheme.primary : AppTheme.textMuted,
                  ),
                  onSelected: (_) {
                    _cachedPages.remove(index);
                    setState(() => _currentIndex = index);
                  },
                );
              },
              separatorBuilder: (context, index) => const SizedBox(width: 6),
              itemCount: destinations.length,
            ),
          ),
        ),
        actions: [
          // Quick language toggle
          PopupMenuButton<String>(
            icon: const Icon(Icons.language, size: 22),
            tooltip: 'settings.language'.tr,
            onSelected: (v) => AppI18n.instance.setLanguage(v),
            itemBuilder: (_) => [
              CheckedPopupMenuItem(
                value: 'en',
                checked: AppI18n.instance.lang == 'en',
                child: Text('settings.languageEnglish'.tr),
              ),
              CheckedPopupMenuItem(
                value: 'sw',
                checked: AppI18n.instance.lang == 'sw',
                child: Text('settings.languageSwahili'.tr),
              ),
            ],
          ),
          IconButton(
            icon: const Icon(Icons.notifications_outlined, size: 22),
            tooltip: 'nav.notifications'.tr,
            onPressed: () =>
                Navigator.of(context).pushNamed(AppRoutes.notifications),
          ),
          const SizedBox(width: 4),
        ],
      ),
      drawer: Drawer(
        backgroundColor: Colors.white,
        child: Column(
          children: [
            Container(
              width: double.infinity,
              padding: const EdgeInsets.fromLTRB(20, 52, 20, 24),
              decoration: const BoxDecoration(gradient: AppTheme.drawerGradient),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: 52,
                    height: 52,
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [AppTheme.primary, AppTheme.gradientEnd],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: Colors.white24, width: 2),
                    ),
                    child: Center(
                      child: Text(
                        (user?.name.isNotEmpty ?? false)
                            ? user!.name.characters.first.toUpperCase()
                            : 'U',
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                          fontSize: 20,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    user?.name ?? 'label.you'.tr,
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w700,
                      fontSize: 16,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    user?.email ?? '',
                    style: const TextStyle(
                      color: Color(0xFFA5B4FC),
                      fontSize: 13,
                    ),
                  ),
                  if ((user?.role ?? '').isNotEmpty) ...[
                    const SizedBox(height: 10),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        user!.role!.toUpperCase(),
                        style: const TextStyle(
                          color: Color(0xFFC7D2FE),
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          letterSpacing: 0.8,
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            ),
            Expanded(
              child: ListView(
                padding: const EdgeInsets.symmetric(vertical: 8),
                children: [
                  for (var i = 0; i < destinations.length; i++)
                    _DrawerItem(
                      icon: _currentIndex == i
                          ? destinations[i].selectedIcon
                          : destinations[i].icon,
                      label: destinations[i].label,
                      selected: _currentIndex == i,
                      onTap: () => _goTo(i),
                    ),
                  const Padding(
                    padding: EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                    child: Divider(color: AppTheme.slate200),
                  ),
                  _DrawerItem(
                    icon: Icons.notifications_outlined,
                    label: 'nav.notifications'.tr,
                    selected: false,
                    onTap: () {
                      Navigator.of(context).pop();
                      Navigator.of(context).pushNamed(AppRoutes.notifications);
                    },
                  ),
                  _DrawerItem(
                    icon: Icons.settings_outlined,
                    label: 'nav.settings'.tr,
                    selected: false,
                    onTap: () {
                      Navigator.of(context).pop();
                      Navigator.of(context).pushNamed(AppRoutes.settings);
                    },
                  ),
                ],
              ),
            ),
            const Divider(height: 1, color: AppTheme.slate200),
            InkWell(
              onTap: _logout,
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                child: Row(
                  children: [
                    const Icon(Icons.logout_rounded, size: 20, color: AppTheme.red600),
                    const SizedBox(width: 12),
                    Text(
                      'action.logout'.tr,
                      style: const TextStyle(
                        color: AppTheme.red600,
                        fontWeight: FontWeight.w600,
                        fontSize: 14,
                      ),
                    ),
                  ],
                ),
              ),
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
  const _NavItem(this.id, this.label, this.icon, this.selectedIcon);

  final String id; // stable identifier (English)
  final String label; // localized display
  final IconData icon;
  final IconData selectedIcon;
}

class _DrawerItem extends StatelessWidget {
  const _DrawerItem({
    required this.icon,
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 2),
      child: Material(
        color: selected ? AppTheme.indigo50 : Colors.transparent,
        borderRadius: BorderRadius.circular(12),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(12),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            child: Row(
              children: [
                Icon(
                  icon,
                  size: 20,
                  color: selected ? AppTheme.primary : AppTheme.textSecondary,
                ),
                const SizedBox(width: 12),
                Text(
                  label,
                  style: TextStyle(
                    color: selected ? AppTheme.primary : AppTheme.textPrimary,
                    fontWeight: selected ? FontWeight.w600 : FontWeight.normal,
                    fontSize: 14,
                  ),
                ),
                if (selected) ...[
                  const Spacer(),
                  Container(
                    width: 6,
                    height: 6,
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
      ),
    );
  }
}
