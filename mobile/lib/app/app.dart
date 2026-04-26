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
            colorScheme: ColorScheme.fromSeed(
              seedColor: AppTheme.primary,
              brightness: Brightness.light,
            ),
            scaffoldBackgroundColor: AppTheme.background,
            appBarTheme: const AppBarTheme(
              backgroundColor: Colors.white,
              foregroundColor: AppTheme.textPrimary,
              elevation: 0,
              scrolledUnderElevation: 1,
              titleTextStyle: TextStyle(
                color: AppTheme.textPrimary,
                fontSize: 18,
                fontWeight: FontWeight.w700,
              ),
              iconTheme: IconThemeData(color: AppTheme.textPrimary),
              surfaceTintColor: Colors.white,
            ),
            inputDecorationTheme: InputDecorationTheme(
              filled: true,
              fillColor: AppTheme.slate100,
              hintStyle: const TextStyle(color: AppTheme.textMuted),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(14),
                borderSide: const BorderSide(color: AppTheme.slate200),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(14),
                borderSide: const BorderSide(color: AppTheme.slate200),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(14),
                borderSide: const BorderSide(color: AppTheme.primary, width: 2),
              ),
              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            ),
            cardTheme: const CardThemeData(
              color: Colors.white,
              elevation: 0,
              margin: EdgeInsets.zero,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.all(Radius.circular(20)),
                side: BorderSide(color: AppTheme.cardBorder),
              ),
            ),
            filledButtonTheme: FilledButtonThemeData(
              style: FilledButton.styleFrom(
                backgroundColor: AppTheme.primary,
                foregroundColor: Colors.white,
                elevation: 0,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
                textStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15),
                padding: const EdgeInsets.symmetric(vertical: 14),
              ),
            ),
            outlinedButtonTheme: OutlinedButtonThemeData(
              style: OutlinedButton.styleFrom(
                foregroundColor: AppTheme.primary,
                side: const BorderSide(color: AppTheme.slate200),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
                padding: const EdgeInsets.symmetric(vertical: 14),
              ),
            ),
            chipTheme: ChipThemeData(
              backgroundColor: AppTheme.slate100,
              labelStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
              side: BorderSide.none,
            ),
            dividerTheme: const DividerThemeData(
              color: AppTheme.slate200,
              space: 1,
            ),
            navigationBarTheme: NavigationBarThemeData(
              backgroundColor: Colors.white,
              indicatorColor: AppTheme.indigo50,
              iconTheme: WidgetStateProperty.resolveWith((states) {
                if (states.contains(WidgetState.selected)) {
                  return const IconThemeData(color: AppTheme.primary);
                }
                return const IconThemeData(color: AppTheme.textMuted);
              }),
              labelTextStyle: WidgetStateProperty.resolveWith((states) {
                if (states.contains(WidgetState.selected)) {
                  return const TextStyle(color: AppTheme.primary, fontWeight: FontWeight.w600, fontSize: 12);
                }
                return const TextStyle(color: AppTheme.textMuted, fontSize: 12);
              }),
              elevation: 0,
              surfaceTintColor: Colors.transparent,
            ),
          ),
          onGenerateRoute: AppRoutes.onGenerateRoute,
          initialRoute: AppRoutes.splash,
        );
      },
    );
  }
}
