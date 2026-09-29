// Account deletion from the app: explicit confirmation, success → signed
// out to Google sign-in, failure → still signed in with a retry.
import 'dart:convert';

import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:pingmycar_mobile/core/api_client.dart';
import 'package:pingmycar_mobile/providers.dart';
import 'package:pingmycar_mobile/ui/router.dart';
import 'package:pingmycar_mobile/ui/theme.dart';

import 'support/fakes.dart';

class _Backend extends FakeBackend {
  _Backend({required this.deleteStatus});
  final int deleteStatus;
  final requests = <String>[];

  @override
  Future<ResponseBody> fetch(RequestOptions o, Stream<Uint8List>? s, Future<void>? c) async {
    requests.add('${o.method} ${o.path}');
    if (o.method == 'DELETE' && o.path == '/api/account') {
      final body = deleteStatus == 200 ? {'ok': true} : {'error': 'boom'};
      return ResponseBody.fromString(jsonEncode(body), deleteStatus, headers: {
        Headers.contentTypeHeader: ['application/json'],
      });
    }
    return super.fetch(o, s, c);
  }
}

void main() {
  setUpAll(() async {
    TestWidgetsFlutterBinding.ensureInitialized();
    await loadRealFonts();
  });

  Future<(ProviderContainer, _Backend)> pumpApp(WidgetTester tester, {required int deleteStatus}) async {
    tester.view.physicalSize = const Size(390, 844);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.reset);
    final backend = _Backend(deleteStatus: deleteStatus);
    final api = ApiClient(tokenStore: FakeTokenStore());
    api.raw.httpClientAdapter = backend;
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
    await frames(tester, 20);
    router.go('/settings/delete-account');
    await frames(tester, 10);
    return (container, backend);
  }

  Future<void> confirmDelete(WidgetTester tester) async {
    await tester.tap(find.byType(CheckboxListTile));
    await frames(tester, 3);
    await tester.tap(find.widgetWithText(FilledButton, 'Delete Account').first);
    await frames(tester, 5);
    expect(find.text('Delete your OwnerPing account?'), findsOneWidget);
    await tester.tap(find.descendant(of: find.byType(AlertDialog), matching: find.widgetWithText(FilledButton, 'Delete Account')));
    await frames(tester, 15);
  }

  testWidgets('Delete is disabled until the owner confirms they understand', (tester) async {
    final (_, backend) = await pumpApp(tester, deleteStatus: 200);
    expect(find.text('Delete your OwnerPing account'), findsOneWidget);
    await tester.tap(find.widgetWithText(FilledButton, 'Delete Account'));
    await frames(tester, 3);
    expect(find.text('Delete your OwnerPing account?'), findsNothing);
    expect(backend.requests.where((r) => r.startsWith('DELETE')), isEmpty);
  });

  testWidgets('Cancel in the final confirmation sends nothing', (tester) async {
    final (_, backend) = await pumpApp(tester, deleteStatus: 200);
    await tester.tap(find.byType(CheckboxListTile));
    await frames(tester, 3);
    await tester.tap(find.widgetWithText(FilledButton, 'Delete Account'));
    await frames(tester, 5);
    await tester.tap(find.text('Cancel'));
    await frames(tester, 5);
    expect(backend.requests.where((r) => r.startsWith('DELETE')), isEmpty);
  });

  testWidgets('success deletes server-side, signs out and returns to Google sign-in', (tester) async {
    // Plugins (Google Sign-In, Firebase) aren't available in tests; the
    // service treats their cleanup as best-effort.
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(const MethodChannel('plugins.flutter.io/google_sign_in_android'), (_) async => null);
    final (container, backend) = await pumpApp(tester, deleteStatus: 200);
    await confirmDelete(tester);
    expect(backend.requests, contains('DELETE /api/account'));
    expect(container.read(authControllerProvider).status, AuthStatus.unauthenticated);
    expect(find.text('Continue with Google'), findsOneWidget);
    expect(find.text('Delete your OwnerPing account'), findsNothing);
    // Device cleanup is time-boxed in the background; let its timer lapse.
    await tester.pump(const Duration(seconds: 11));
  });

  testWidgets('failure keeps the owner signed in, explains, and allows retry', (tester) async {
    final (container, _) = await pumpApp(tester, deleteStatus: 500);
    await confirmDelete(tester);
    expect(container.read(authControllerProvider).status, AuthStatus.authenticated);
    expect(find.text('Something went wrong on our side. Please try again.'), findsOneWidget);
    expect(find.widgetWithText(FilledButton, 'Try again'), findsOneWidget);
  });
}

Future<void> frames(WidgetTester tester, int n) async {
  for (var i = 0; i < n; i++) {
    await tester.pump(const Duration(milliseconds: 100));
  }
}
