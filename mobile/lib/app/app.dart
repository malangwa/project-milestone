import 'package:flutter/material.dart';

import '../config/app_theme.dart';
import '../data/services/session_controller.dart';
import 'routes.dart';

class ProjectMilestoneApp extends StatelessWidget {
  const ProjectMilestoneApp({
    super.key,
    required this.sessionController,
  });

  final SessionController sessionController;

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: sessionController,
      builder: (context, _) {
        return MaterialApp(
          title: 'Project Milestone',
          debugShowCheckedModeBanner: false,
          theme: ThemeData(
            useMaterial3: true,
            colorScheme: ColorScheme.fromSeed(seedColor: AppTheme.primary),
            scaffoldBackgroundColor: AppTheme.background,
            inputDecorationTheme: const InputDecorationTheme(
              filled: true,
              fillColor: Colors.white,
            ),
            cardTheme: const CardThemeData(
              color: Colors.white,
              elevation: 0,
              margin: EdgeInsets.zero,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.all(Radius.circular(20)),
                side: BorderSide(color: Color(0xFFE5E7EB)),
              ),
            ),
          ),
          onGenerateRoute: AppRoutes.onGenerateRoute,
          initialRoute: AppRoutes.splash,
        );
      },
    );
  }
}
