import 'dart:async';

import 'package:flutter/material.dart';

import '../../../app/routes.dart';
import '../../../config/app_theme.dart';
import '../../../data/services/project_service.dart';
import '../../../data/services/session_controller.dart';

class SplashPage extends StatefulWidget {
  const SplashPage({super.key});

  @override
  State<SplashPage> createState() => _SplashPageState();
}

class _SplashPageState extends State<SplashPage>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final Animation<double> _fadeIn;
  String _status = 'Starting up...';

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 600),
    );
    _fadeIn = CurvedAnimation(parent: _controller, curve: Curves.easeIn);
    _controller.forward();
    _init();
  }

  Future<void> _init() async {
    final session = SessionController.instance;

    if (!session.isAuthenticated) {
      _setStatus('Checking session...');
      await session.initialize();
    }

    if (!session.isAuthenticated) {
      await Future.delayed(const Duration(milliseconds: 300));
      if (mounted) {
        Navigator.of(context).pushReplacementNamed(AppRoutes.login);
      }
      return;
    }

    _setStatus('Connecting to server...');

    try {
      await ProjectService.instance.getProjects().timeout(
            const Duration(seconds: 50),
            onTimeout: () => [],
          );
    } catch (_) {}

    _setStatus('Almost ready...');
    await Future.delayed(const Duration(milliseconds: 300));

    if (mounted) {
      Navigator.of(context).pushReplacementNamed(AppRoutes.home);
    }
  }

  void _setStatus(String s) {
    if (mounted) setState(() => _status = s);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: FadeTransition(
        opacity: _fadeIn,
        child: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 88,
                height: 88,
                decoration: BoxDecoration(
                  gradient: AppTheme.primaryGradient,
                  borderRadius: BorderRadius.circular(24),
                  boxShadow: [
                    BoxShadow(
                      color: AppTheme.primary.withValues(alpha: 0.35),
                      blurRadius: 24,
                      offset: const Offset(0, 12),
                    ),
                  ],
                ),
                child: const Icon(
                  Icons.rocket_launch_rounded,
                  color: Colors.white,
                  size: 44,
                ),
              ),
              const SizedBox(height: 28),
              const Text(
                'Project Milestone',
                style: TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.w800,
                  color: AppTheme.textPrimary,
                  letterSpacing: -0.4,
                ),
              ),
              const SizedBox(height: 6),
              const Text(
                'Build, track, deliver.',
                style: TextStyle(
                  fontSize: 13,
                  color: AppTheme.textMuted,
                ),
              ),
              const SizedBox(height: 36),
              const SizedBox(
                width: 28,
                height: 28,
                child: CircularProgressIndicator(
                  strokeWidth: 2.5,
                  valueColor: AlwaysStoppedAnimation(AppTheme.primary),
                ),
              ),
              const SizedBox(height: 14),
              Text(
                _status,
                style: const TextStyle(fontSize: 13, color: AppTheme.textMuted),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
