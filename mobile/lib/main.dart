import 'package:flutter/material.dart';

import 'app/app.dart';
import 'data/services/session_controller.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await SessionController.instance.initialize();
  runApp(ProjectMilestoneApp(sessionController: SessionController.instance));
}
