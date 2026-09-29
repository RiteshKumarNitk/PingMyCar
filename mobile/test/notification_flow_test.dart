// Notification tap → conversation, including the cold-start case where the
// tap is reported before the session has been restored.
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:pingmycar_mobile/core/api_client.dart';
import 'package:pingmycar_mobile/providers.dart';
import 'package:pingmycar_mobile/services/fcm/fcm_service.dart';
import 'package:pingmycar_mobile/ui/router.dart';
import 'package:pingmycar_mobile/ui/screens/message_detail_screen.dart';
import 'package:pingmycar_mobile/ui/theme.dart';

import 'support/fakes.dart';

const _id = '3f1c2a9e-8b7d-4c6e-9f00-1a2b3c4d5e6f';

void main() {
  setUpAll(() async {
    TestWidgetsFlutterBinding.ensureInitialized();
    await loadRealFonts();
  });

  group('push payload → app route', () {
    test('uses data.conversationId', () {
      const m = RemoteMessage(data: {'type': 'new_message', 'conversationId': _id});
      expect(m.routeFromData, '/messages/$_id');
    });

    test('falls back to the web-shaped data.route', () {
      const m = RemoteMessage(data: {'route': '/dashboard/messages/$_id'});
      expect(m.routeFromData, '/messages/$_id');
    });

    test('rejects malformed ids', () {
      expect(appRouteForConversationId('../settings'), isNull);
      expect(appRouteForConversationId('abc/def'), isNull);
      const m = RemoteMessage(data: {'conversationId': '../../admin'});
      expect(m.routeFromData, isNull);
    });
  });

  test('a tap reported before anyone listens is delivered, once', () {
    final signal = DeepLinkSignal();
    signal.emitRoute('/messages/$_id');
    final got = <String?>[];
    signal.addListener(got.add);
    signal.addListener(got.add);
    expect(got, ['/messages/$_id']);
  });

  Future<(ProviderContainer, TestAuthController)> pumpApp(WidgetTester tester, AuthStatus initial) async {
    tester.view.physicalSize = const Size(390, 844);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.reset);
    final api = ApiClient(tokenStore: FakeTokenStore());
    api.raw.httpClientAdapter = FakeBackend();
    late TestAuthController auth;
    final container = ProviderContainer(overrides: [
      tokenStoreProvider.overrideWithValue(FakeTokenStore()),
      apiClientProvider.overrideWithValue(api),
      authControllerProvider.overrideWith(() {
        auth = TestAuthController(AuthState(status: initial, user: initial == AuthStatus.authenticated ? testUser : null));
        return auth;
      }),
    ]);
    addTearDown(container.dispose);
    await tester.pumpWidget(UncontrolledProviderScope(
      container: container,
      child: MediaQuery(
        data: MediaQueryData.fromView(tester.view).copyWith(disableAnimations: true),
        child: MaterialApp.router(theme: AppTheme.light(), routerConfig: container.read(routerProvider)),
      ),
    ));
    await tester.pump();
    return (container, auth);
  }

  Future<void> frames(WidgetTester tester, [int n = 25]) async {
    for (var i = 0; i < n; i++) {
      await tester.pump(const Duration(milliseconds: 100));
    }
  }

  String location(ProviderContainer c) => c.read(routerProvider).routerDelegate.currentConfiguration.uri.path;
  // The conversation is pushed on top of the dashboard, so check the screen
  // actually shown (and which conversation it loads).
  final thread = find.byWidgetPredicate((w) => w is MessageDetailScreen && w.conversationId == _id);

  testWidgets('cold start: tap waits for the restored session, then opens the conversation', (tester) async {
    final (container, auth) = await pumpApp(tester, AuthStatus.unknown);
    container.read(deepLinkSignalProvider).emitRoute('/messages/$_id');
    await frames(tester, 3);
    expect(location(container), '/splash'); // not opened before auth is known

    expect(thread, findsNothing);

    auth.setStatus(AuthStatus.authenticated);
    await frames(tester);
    expect(thread, findsOneWidget);
  });

  testWidgets('a signed-out user never sees the conversation', (tester) async {
    final (container, _) = await pumpApp(tester, AuthStatus.unknown);
    container.read(deepLinkSignalProvider).emitRoute('/messages/$_id');
    (container.read(authControllerProvider.notifier) as TestAuthController).setStatus(AuthStatus.unauthenticated);
    await frames(tester);
    expect(thread, findsNothing);
    expect(find.text('Continue with Google'), findsOneWidget);
  });

  testWidgets('tap while the app is running opens the conversation', (tester) async {
    final (container, _) = await pumpApp(tester, AuthStatus.authenticated);
    await frames(tester); // splash hands off to /home
    container.read(deepLinkSignalProvider).emitRoute('/messages/$_id');
    await frames(tester, 5);
    expect(thread, findsOneWidget);
  });
}
