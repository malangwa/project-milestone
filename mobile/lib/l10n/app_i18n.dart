import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import 'translations.dart';

/// Lightweight i18n controller.
/// Wraps a current language code ('en' or 'sw') and exposes [t] for lookups.
/// Persists the choice via flutter_secure_storage.
class AppI18n extends ChangeNotifier {
  AppI18n._();
  static final AppI18n instance = AppI18n._();

  static const _storageKey = 'app_language';
  static const _storage = FlutterSecureStorage();

  String _lang = 'en';
  String get lang => _lang;
  bool get isSwahili => _lang == 'sw';

  /// Load the saved language, if any. Call once at startup.
  Future<void> load() async {
    try {
      final saved = await _storage.read(key: _storageKey);
      if (saved == 'sw' || saved == 'en') {
        _lang = saved!;
        notifyListeners();
      }
    } catch (_) {
      // ignore – stick to default
    }
  }

  Future<void> setLanguage(String code) async {
    if (code != 'en' && code != 'sw') return;
    if (_lang == code) return;
    _lang = code;
    notifyListeners();
    try {
      await _storage.write(key: _storageKey, value: code);
    } catch (_) {
      // ignore
    }
  }

  Future<void> toggle() async {
    await setLanguage(_lang == 'en' ? 'sw' : 'en');
  }

  /// Returns the translation for [key]. Falls back to English then to the key.
  String t(String key) {
    final byLang = translations[_lang];
    final value = byLang?[key];
    if (value != null && value.isNotEmpty) return value;
    final en = translations['en']?[key];
    if (en != null && en.isNotEmpty) return en;
    return key;
  }
}

/// Convenient extension so you can write `'projects'.tr` anywhere.
extension StringTranslate on String {
  String get tr => AppI18n.instance.t(this);
}
