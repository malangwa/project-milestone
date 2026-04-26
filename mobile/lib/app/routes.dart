import 'package:flutter/material.dart';

import '../presentation/pages/auth/login_page.dart';
import '../presentation/pages/auth/register_page.dart';
import '../presentation/pages/notifications/notification_page.dart';
import '../presentation/pages/projects/project_detail_page.dart';
import '../presentation/pages/settings/settings_page.dart';
import '../presentation/pages/splash/splash_page.dart';
import '../presentation/pages/dashboard/dashboard_page.dart';
import '../presentation/pages/projects/project_list_page.dart';
import '../presentation/pages/tasks/task_list_page.dart';
import '../presentation/pages/milestones/milestone_list_page.dart';
import '../presentation/pages/expenses/expense_list_page.dart';
import '../presentation/pages/issues/issue_list_page.dart';
import '../presentation/pages/reports/report_page.dart';
import '../presentation/pages/store/store_page.dart';
import '../presentation/pages/calendar/calendar_page.dart';
import '../presentation/pages/search/search_page.dart';
import '../presentation/pages/time_tracking/time_tracking_page.dart';
import '../presentation/pages/resources/resources_page.dart';
import '../presentation/pages/activities/activity_list_page.dart';
import '../presentation/pages/users/users_page.dart';
import '../presentation/pages/audit/audit_logs_page.dart';
import '../presentation/widgets/home_shell.dart';

class AppRoutes {
  static const String splash = '/';
  static const String login = '/login';
  static const String register = '/register';
  static const String home = '/home';
  static const String projectDetail = '/projects/detail';
  static const String projectList = '/projects';
  static const String settings = '/settings';
  static const String notifications = '/notifications';
  static const String tasks = '/tasks';
  static const String milestones = '/milestones';
  static const String expenses = '/expenses';
  static const String issues = '/issues';
  static const String reports = '/reports';
  static const String store = '/store';
  static const String calendar = '/calendar';
  static const String search = '/search';
  static const String timeTracking = '/time-tracking';
  static const String resources = '/resources';
  static const String activities = '/activities';
  static const String users = '/users';
  static const String auditLogs = '/audit-logs';

  static Route<dynamic> onGenerateRoute(RouteSettings routeSettings) {
    switch (routeSettings.name) {
      case splash:
        return MaterialPageRoute<void>(
          builder: (_) => const SplashPage(),
          settings: routeSettings,
        );
      case login:
        return MaterialPageRoute<void>(
          builder: (_) => const LoginPage(),
          settings: routeSettings,
        );
      case register:
        return MaterialPageRoute<void>(
          builder: (_) => const RegisterPage(),
          settings: routeSettings,
        );
      case home:
        final index =
            routeSettings.arguments is int ? routeSettings.arguments! as int : 0;
        return MaterialPageRoute<void>(
          builder: (_) => HomeShell(initialIndex: index),
          settings: routeSettings,
        );
      case projectDetail:
        final projectId = routeSettings.arguments as String;
        return MaterialPageRoute<void>(
          builder: (_) => ProjectDetailPage(projectId: projectId),
          settings: routeSettings,
        );
      case projectList:
        return MaterialPageRoute<void>(
          builder: (_) => const ProjectListPage(),
          settings: routeSettings,
        );
      case settings:
        return MaterialPageRoute<void>(
          builder: (_) => const SettingsPage(),
          settings: routeSettings,
        );
      case notifications:
        return MaterialPageRoute<void>(
          builder: (_) => const NotificationPage(),
          settings: routeSettings,
        );
      case tasks:
        return MaterialPageRoute<void>(
          builder: (_) => const TaskListPage(),
          settings: routeSettings,
        );
      case milestones:
        return MaterialPageRoute<void>(
          builder: (_) => const MilestoneListPage(),
          settings: routeSettings,
        );
      case expenses:
        return MaterialPageRoute<void>(
          builder: (_) => const ExpenseListPage(),
          settings: routeSettings,
        );
      case issues:
        return MaterialPageRoute<void>(
          builder: (_) => const IssueListPage(),
          settings: routeSettings,
        );
      case reports:
        return MaterialPageRoute<void>(
          builder: (_) => const ReportPage(),
          settings: routeSettings,
        );
      case store:
        return MaterialPageRoute<void>(
          builder: (_) => const StorePage(),
          settings: routeSettings,
        );
      case calendar:
        return MaterialPageRoute<void>(
          builder: (_) => const CalendarPage(),
          settings: routeSettings,
        );
      case search:
        return MaterialPageRoute<void>(
          builder: (_) => const SearchPage(),
          settings: routeSettings,
        );
      case timeTracking:
        return MaterialPageRoute<void>(
          builder: (_) => const TimeTrackingPage(),
          settings: routeSettings,
        );
      case resources:
        return MaterialPageRoute<void>(
          builder: (_) => const ResourcesPage(),
          settings: routeSettings,
        );
      case activities:
        return MaterialPageRoute<void>(
          builder: (_) => const ActivityListPage(),
          settings: routeSettings,
        );
      case users:
        return MaterialPageRoute<void>(
          builder: (_) => const UsersPage(),
          settings: routeSettings,
        );
      case auditLogs:
        return MaterialPageRoute<void>(
          builder: (_) => const AuditLogsPage(),
          settings: routeSettings,
        );
      default:
        return MaterialPageRoute<void>(
          builder: (_) => const LoginPage(),
          settings: routeSettings,
        );
    }
  }
}