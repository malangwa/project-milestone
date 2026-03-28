import 'package:flutter_test/flutter_test.dart';
import 'package:project_milestone/app/app.dart';
import 'package:project_milestone/data/services/session_controller.dart';

void main() {
  testWidgets('shows login screen by default', (WidgetTester tester) async {
    await tester.pumpWidget(
      ProjectMilestoneApp(sessionController: SessionController.instance),
    );

    expect(find.text('Project Milestone'), findsOneWidget);
    expect(find.text('Sign in'), findsOneWidget);
  });
}
