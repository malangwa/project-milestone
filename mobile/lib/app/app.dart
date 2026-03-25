import 'package:flutter/material.dart';
import 'routes.dart';

class ProjectMilestoneApp extends StatelessWidget {
  const ProjectMilestoneApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Project Milestone',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF2563EB)),
        useMaterial3: true,
      ),
      initialRoute: '/login',
      routes: AppRoutes.routes,
    );
  }
}
