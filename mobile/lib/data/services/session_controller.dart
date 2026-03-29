import 'package:flutter/foundation.dart';

import '../models/user_model.dart';
import 'auth_service.dart';
import 'auth_storage_service.dart';

class SessionController extends ChangeNotifier {
  SessionController._();

  static final SessionController instance = SessionController._();

  UserModel? _currentUser;
  bool _isLoading = true;

  UserModel? get currentUser => _currentUser;
  bool get isLoading => _isLoading;
  bool get isAuthenticated => _currentUser != null;

  Future<void> initialize() async {
    _isLoading = true;
    notifyListeners();

    final session = await AuthStorageService.instance.readSession();
    if (session == null) {
      _currentUser = null;
      _isLoading = false;
      notifyListeners();
      return;
    }

    try {
      _currentUser = await AuthService.instance.me();
    } catch (_) {
      await AuthStorageService.instance.clearSession();
      _currentUser = null;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> login({
    required String email,
    required String password,
  }) async {
    _isLoading = true;
    notifyListeners();

    try {
      final result = await AuthService.instance.login(
        email: email,
        password: password,
      );
      _currentUser = result.user;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> logout() async {
    _isLoading = true;
    notifyListeners();

    try {
      await AuthService.instance.logout();
      _currentUser = null;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  void updateCurrentUser(UserModel user) {
    _currentUser = user;
    notifyListeners();
  }
}
