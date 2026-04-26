import 'package:flutter/material.dart';

class AppTheme {
  static const Color primary = Color(0xFF4F46E5);
  static const Color primaryDark = Color(0xFF4338CA);
  static const Color gradientEnd = Color(0xFF2563EB);
  static const Color secondary = Color(0xFF10B981);
  static const Color error = Color(0xFFEF4444);
  static const Color warning = Color(0xFFF59E0B);
  static const Color background = Color(0xFFF8FAFC);
  static const Color surface = Color(0xFFFFFFFF);
  static const Color cardBorder = Color(0xFFE2E8F0);
  static const Color textPrimary = Color(0xFF0F172A);
  static const Color textSecondary = Color(0xFF64748B);
  static const Color textMuted = Color(0xFF94A3B8);
  static const Color slate100 = Color(0xFFF1F5F9);
  static const Color slate200 = Color(0xFFE2E8F0);
  static const Color indigo50 = Color(0xFFEEF2FF);
  static const Color emerald50 = Color(0xFFECFDF5);
  static const Color emerald600 = Color(0xFF059669);
  static const Color amber50 = Color(0xFFFFFBEB);
  static const Color amber600 = Color(0xFFD97706);
  static const Color red50 = Color(0xFFFEF2F2);
  static const Color red600 = Color(0xFFDC2626);

  static const LinearGradient primaryGradient = LinearGradient(
    colors: [primary, gradientEnd],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient drawerGradient = LinearGradient(
    colors: [Color(0xFF1E1B4B), Color(0xFF312E81)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
}
