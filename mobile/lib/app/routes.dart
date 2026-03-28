import 'package:flutter/material.dart';

import '../presentation/pages/auth/login_page.dart';
import '../presentation/pages/auth/register_page.dart';
import '../presentation/pages/notifications/notification_page.dart';
import '../presentation/pages/projects/project_detail_page.dart';
import '../presentation/pages/settings/settings_page.dart';
import '../presentation/widgets/home_shell.dart';

class AppRoutes {
  static const String login = '/login';
  static const String register = '/register';
  static const String home = '/home';
  static const String projectDetail = '/projects/detail';
  static const String settings = '/settings';
  static const String notifications = '/notifications';

  static Route<dynamic> onGenerateRoute(RouteSettings routeSettings) {
    switch (routeSettings.name) {
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
      default:
        return MaterialPageRoute<void>(
          builder: (_) => const LoginPage(),
          settings: routeSettings,
        );
    }
  }
}
