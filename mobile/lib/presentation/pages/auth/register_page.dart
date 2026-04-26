import 'package:dio/dio.dart';
import 'package:flutter/material.dart';

import '../../../app/routes.dart';
import '../../../config/app_theme.dart';
import '../../../core/network/dio_client.dart';

class RegisterPage extends StatefulWidget {
  const RegisterPage({super.key});

  @override
  State<RegisterPage> createState() => _RegisterPageState();
}

class _RegisterPageState extends State<RegisterPage> {
  final _formKey = GlobalKey<FormState>();
  final _nameCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  final _confirmCtrl = TextEditingController();
  bool _loading = false;
  String? _error;

  @override
  void dispose() {
    _nameCtrl.dispose();
    _emailCtrl.dispose();
    _passwordCtrl.dispose();
    _confirmCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!(_formKey.currentState?.validate() ?? false)) return;

    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      await DioClient.instance.dio.post<Map<String, dynamic>>(
        '/auth/register',
        data: {
          'name': _nameCtrl.text.trim(),
          'email': _emailCtrl.text.trim(),
          'password': _passwordCtrl.text,
        },
      );
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Account created. Please log in.')),
      );
      Navigator.of(context).pushReplacementNamed(AppRoutes.login);
    } on DioException catch (e) {
      final msg = e.response?.data is Map
          ? ((e.response!.data as Map)['message'] ?? 'Registration failed')
              .toString()
          : 'Registration failed';
      setState(() => _error = msg);
    } catch (_) {
      setState(() => _error = 'Something went wrong');
    } finally {
      if (mounted) setState(() => _loading = false);
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
                padding: const EdgeInsets.fromLTRB(24, 16, 24, 56),
                decoration: const BoxDecoration(gradient: AppTheme.primaryGradient),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    IconButton(
                      onPressed: () => Navigator.of(context).pop(),
                      icon: const Icon(Icons.arrow_back_rounded, color: Colors.white),
                      padding: EdgeInsets.zero,
                      alignment: Alignment.centerLeft,
                    ),
                    const SizedBox(height: 16),
                    Center(
                      child: Container(
                        width: 64,
                        height: 64,
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.18),
                          borderRadius: BorderRadius.circular(18),
                          border: Border.all(color: Colors.white24, width: 2),
                        ),
                        child: const Icon(Icons.person_add_alt_1_rounded, color: Colors.white, size: 30),
                      ),
                    ),
                    const SizedBox(height: 16),
                    const Center(
                      child: Text(
                        'Create your account',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 24,
                          fontWeight: FontWeight.w800,
                          letterSpacing: -0.5,
                        ),
                      ),
                    ),
                    const SizedBox(height: 6),
                    const Center(
                      child: Text(
                        'Get started with Project Milestone',
                        style: TextStyle(color: Color(0xFFC7D2FE), fontSize: 13),
                      ),
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
                            crossAxisAlignment: CrossAxisAlignment.stretch,
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              TextFormField(
                                controller: _nameCtrl,
                                decoration: const InputDecoration(
                                  hintText: 'Full Name',
                                  prefixIcon: Icon(Icons.person_outline, size: 20),
                                ),
                                textInputAction: TextInputAction.next,
                                validator: (v) =>
                                    (v == null || v.trim().isEmpty) ? 'Name is required' : null,
                              ),
                              const SizedBox(height: 12),
                              TextFormField(
                                controller: _emailCtrl,
                                decoration: const InputDecoration(
                                  hintText: 'Email',
                                  prefixIcon: Icon(Icons.email_outlined, size: 20),
                                ),
                                keyboardType: TextInputType.emailAddress,
                                textInputAction: TextInputAction.next,
                                validator: (v) {
                                  if (v == null || v.trim().isEmpty) return 'Email is required';
                                  if (!v.contains('@')) return 'Enter a valid email';
                                  return null;
                                },
                              ),
                              const SizedBox(height: 12),
                              TextFormField(
                                controller: _passwordCtrl,
                                decoration: const InputDecoration(
                                  hintText: 'Password',
                                  prefixIcon: Icon(Icons.lock_outline, size: 20),
                                ),
                                obscureText: true,
                                textInputAction: TextInputAction.next,
                                validator: (v) {
                                  if (v == null || v.isEmpty) return 'Password is required';
                                  if (v.length < 6) return 'At least 6 characters';
                                  return null;
                                },
                              ),
                              const SizedBox(height: 12),
                              TextFormField(
                                controller: _confirmCtrl,
                                decoration: const InputDecoration(
                                  hintText: 'Confirm Password',
                                  prefixIcon: Icon(Icons.lock_outline, size: 20),
                                ),
                                obscureText: true,
                                textInputAction: TextInputAction.done,
                                validator: (v) {
                                  if (v != _passwordCtrl.text) return 'Passwords do not match';
                                  return null;
                                },
                              ),
                              if (_error != null) ...[
                                const SizedBox(height: 12),
                                Container(
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
                              ],
                              const SizedBox(height: 20),
                              FilledButton(
                                onPressed: _loading ? null : _submit,
                                child: _loading
                                    ? const SizedBox(
                                        height: 20,
                                        width: 20,
                                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                                      )
                                    : const Text('Create Account'),
                              ),
                              const SizedBox(height: 8),
                              Center(
                                child: TextButton(
                                  onPressed: () =>
                                      Navigator.of(context).pushReplacementNamed(AppRoutes.login),
                                  style: TextButton.styleFrom(foregroundColor: AppTheme.primary),
                                  child: const Text('Already have an account? Log in'),
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
