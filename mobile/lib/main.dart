import 'package:flutter/material.dart';

import 'app/app.dart';
import 'data/services/session_controller.dart';
import 'l10n/app_i18n.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await AppI18n.instance.load();
  runApp(ProjectMilestoneApp(sessionController: SessionController.instance));
}
