// Android system Back: pushed screens pop normally, tabs return to Home, and
// only Home asks "Exit OwnerPing?" before closing the app.
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:pingmycar_mobile/core/api_client.dart';
import 'package:pingmycar_mobile/providers.dart';
import 'package:pingmycar_mobile/ui/router.dart';
import 'package:pingmycar_mobile/ui/screens/home_screen.dart';
import 'package:pingmycar_mobile/ui/screens/message_detail_screen.dart';
import 'package:pingmycar_mobile/ui/screens/messages_screen.dart';
import 'package:pingmycar_mobile/ui/screens/vehicle_detail_screen.dart';
import 'package:pingmycar_mobile/ui/screens/vehicles_screen.dart';
import 'package:pingmycar_mobile/ui/theme.dart';

import 'support/fakes.dart';

void main() {
  late List<String> systemCalls;

  setUpAll(() async {
    TestWidgetsFlutterBinding.ensureInitialized();
    await loadRealFonts();
  });

  setUp(() {
    systemCalls = [];
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger.setMockMethodCallHandler(SystemChannels.platform, (call) async {
      systemCalls.add(call.method);
      return null;
    });
  });

  tearDown(() {
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger.setMockMethodCallHandler(SystemChannels.platform, null);
  });

  Future<GoRouter> pumpApp(WidgetTester tester, String path) async {
    tester.view.physicalSize = const Size(390, 844);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.reset);
    final api = ApiClient(tokenStore: FakeTokenStore());
    api.raw.httpClientAdapter = FakeBackend();
    final container = ProviderContainer(overrides: [
      tokenStoreProvider.overrideWithValue(FakeTokenStore()),
      apiClientProvider.overrideWithValue(api),
      authControllerProvider.overrideWith(() => TestAuthController(AuthState(status: AuthStatus.authenticated, user: testUser))),
    ]);
    addTearDown(container.dispose);
    final router = container.read(routerProvider);
    await tester.pumpWidget(UncontrolledProviderScope(
      container: container,
      child: MediaQuery(
        data: MediaQueryData.fromView(tester.view).copyWith(disableAnimations: true),
        child: MaterialApp.router(theme: AppTheme.light(), routerConfig: router),
      ),
    ));
    await frames(tester, 20); // splash hands off to /home
    router.go(path);
    await frames(tester, 10);
    return router;
  }

  bool exited() => systemCalls.contains('SystemNavigator.pop');

  Future<void> back(WidgetTester tester) async {
    await tester.binding.handlePopRoute();
    // Long enough for the Android page transition (reverse) to finish.
    await frames(tester, 15);
  }

  testWidgets('Home → Back asks before exiting; Cancel stays', (tester) async {
    await pumpApp(tester, '/home');
    await back(tester);
    expect(find.text('Exit OwnerPing?'), findsOneWidget);
    expect(find.text('Are you sure you want to close the app?'), findsOneWidget);

    await tester.tap(find.text('Cancel'));
    await frames(tester, 6);
    expect(find.text('Exit OwnerPing?'), findsNothing);
    expect(find.byType(HomeScreen), findsOneWidget);
    expect(exited(), isFalse);
  });

  testWidgets('Exit closes the app', (tester) async {
    await pumpApp(tester, '/home');
    await back(tester);
    await tester.tap(find.text('Exit'));
    await frames(tester, 6);
    expect(systemCalls.where((m) => m == 'SystemNavigator.pop').length, 1);
  });

  testWidgets('a second Back while asking just closes the dialog — never exits', (tester) async {
    await pumpApp(tester, '/home');
    await back(tester);
    expect(find.text('Exit OwnerPing?'), findsOneWidget);
    await back(tester);
    expect(find.text('Exit OwnerPing?'), findsNothing);
    expect(find.byType(HomeScreen), findsOneWidget);
    expect(exited(), isFalse);
  });

  for (final tab in ['/messages', '/vehicles', '/profile']) {
    testWidgets('$tab → Back → Home (no dialog)', (tester) async {
      await pumpApp(tester, tab);
      await back(tester);
      expect(find.text('Exit OwnerPing?'), findsNothing);
      expect(find.byType(HomeScreen), findsOneWidget);
      expect(exited(), isFalse);
    });
  }

  testWidgets('Conversation → Back → Messages', (tester) async {
    final router = await pumpApp(tester, '/messages');
    router.push('/messages/c1');
    await frames(tester, 10);
    expect(find.byType(MessageDetailScreen), findsOneWidget);
    await back(tester);
    expect(find.byType(MessageDetailScreen), findsNothing);
    expect(find.byType(MessagesScreen), findsOneWidget);
    expect(find.text('Exit OwnerPing?'), findsNothing);
  });

  testWidgets('Vehicle detail → Back → Vehicles', (tester) async {
    final router = await pumpApp(tester, '/vehicles');
    router.push('/vehicles/v1');
    await frames(tester, 10);
    expect(find.byType(VehicleDetailScreen), findsOneWidget);
    await back(tester);
    expect(find.byType(VehicleDetailScreen), findsNothing);
    expect(find.byType(VehiclesScreen), findsOneWidget);
    expect(exited(), isFalse);
  });
}

Future<void> frames(WidgetTester tester, int n) async {
  for (var i = 0; i < n; i++) {
    await tester.pump(const Duration(milliseconds: 100));
  }
}
