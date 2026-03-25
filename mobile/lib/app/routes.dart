import 'package:flutter/material.dart';
import '../presentation/pages/auth/login_page.dart';
import '../presentation/pages/dashboard/dashboard_page.dart';
import '../presentation/pages/projects/project_list_page.dart';
import '../presentation/pages/tasks/task_list_page.dart';

class AppRoutes {
  static final Map<String, WidgetBuilder> routes = {
    '/login': (_) => const LoginPage(),
    '/dashboard': (_) => const DashboardPage(),
    '/projects': (_) => const ProjectListPage(),
    '/tasks': (_) => const TaskListPage(),
  };
}
