import 'package:dio/dio.dart';
import 'package:flutter/material.dart';

import '../../../app/routes.dart';
import '../../../config/app_theme.dart';
import '../../../data/services/session_controller.dart';

class LoginPage extends StatefulWidget {
  const LoginPage({super.key});

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _submitting = false;
  String? _error;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _submitting = true;
      _error = null;
    });

    try {
      await SessionController.instance.login(
        email: _emailController.text,
        password: _passwordController.text,
      );

      if (!mounted) return;
      Navigator.of(context).pushNamedAndRemoveUntil(
        AppRoutes.splash,
        (_) => false,
      );
    } on DioException catch (error) {
      final data = error.response?.data;
      var message = 'Login failed';
      if (data is Map<String, dynamic>) {
        final rawMessage = data['message'];
        if (rawMessage is List && rawMessage.isNotEmpty) {
          message = rawMessage.join(', ');
        } else if (rawMessage != null) {
          message = rawMessage.toString();
        }
      }
      setState(() => _error = message);
    } catch (_) {
      setState(() => _error = 'Login failed');
    } finally {
      if (mounted) {
        setState(() => _submitting = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      body: SafeArea(
        child: SingleChildScrollView(
          child: Column(
            children: [
              Container(
                width: double.infinity,
                padding: const EdgeInsets.fromLTRB(24, 40, 24, 56),
                decoration: const BoxDecoration(gradient: AppTheme.primaryGradient),
                child: Column(
                  children: [
                    Container(
                      width: 64,
                      height: 64,
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.18),
                        borderRadius: BorderRadius.circular(18),
                        border: Border.all(color: Colors.white24, width: 2),
                      ),
                      child: const Icon(Icons.rocket_launch_rounded, color: Colors.white, size: 30),
                    ),
                    const SizedBox(height: 16),
                    const Text(
                      'Welcome back',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 26,
                        fontWeight: FontWeight.w800,
                        letterSpacing: -0.5,
                      ),
                    ),
                    const SizedBox(height: 6),
                    const Text(
                      'Sign in to continue to your workspace',
                      style: TextStyle(color: Color(0xFFC7D2FE), fontSize: 13),
                    ),
                  ],
                ),
              ),
              Transform.translate(
                offset: const Offset(0, -32),
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: ConstrainedBox(
                    constraints: const BoxConstraints(maxWidth: 440),
                    child: Card(
                      child: Padding(
                        padding: const EdgeInsets.all(24),
                        child: Form(
                          key: _formKey,
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              if (_error != null) ...[
                                Container(
                                  width: double.infinity,
                                  padding: const EdgeInsets.all(12),
                                  decoration: BoxDecoration(
                                    color: AppTheme.red50,
                                    borderRadius: BorderRadius.circular(12),
                                    border: Border.all(color: const Color(0xFFFECACA)),
                                  ),
                                  child: Row(
                                    children: [
                                      const Icon(Icons.error_outline, size: 18, color: AppTheme.red600),
                                      const SizedBox(width: 8),
                                      Expanded(
                                        child: Text(
                                          _error!,
                                          style: const TextStyle(color: AppTheme.red600, fontSize: 13),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                const SizedBox(height: 16),
                              ],
                              const Text(
                                'Email',
                                style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppTheme.textSecondary),
                              ),
                              const SizedBox(height: 6),
                              TextFormField(
                                controller: _emailController,
                                keyboardType: TextInputType.emailAddress,
                                decoration: const InputDecoration(
                                  hintText: 'you@example.com',
                                  prefixIcon: Icon(Icons.mail_outline, size: 20),
                                ),
                                validator: (value) =>
                                    (value == null || value.trim().isEmpty) ? 'Email is required' : null,
                              ),
                              const SizedBox(height: 16),
                              const Text(
                                'Password',
                                style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppTheme.textSecondary),
                              ),
                              const SizedBox(height: 6),
                              TextFormField(
                                controller: _passwordController,
                                obscureText: true,
                                decoration: const InputDecoration(
                                  hintText: '••••••••',
                                  prefixIcon: Icon(Icons.lock_outline, size: 20),
                                ),
                                validator: (value) =>
                                    (value == null || value.isEmpty) ? 'Password is required' : null,
                              ),
                              const SizedBox(height: 24),
                              SizedBox(
                                width: double.infinity,
                                child: FilledButton(
                                  onPressed: _submitting ? null : _submit,
                                  child: _submitting
                                      ? const SizedBox(
                                          height: 20,
                                          width: 20,
                                          child: CircularProgressIndicator(
                                            strokeWidth: 2,
                                            color: Colors.white,
                                          ),
                                        )
                                      : const Text('Sign in'),
                                ),
                              ),
                              const SizedBox(height: 8),
                              Center(
                                child: TextButton(
                                  onPressed: () => Navigator.of(context).pushNamed(AppRoutes.register),
                                  style: TextButton.styleFrom(foregroundColor: AppTheme.primary),
                                  child: const Text("Don't have an account? Sign up"),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
