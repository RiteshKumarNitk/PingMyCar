// Responsive/overflow QA for every owner screen.
//
// Drives the REAL router, auth redirect, repositories and models against an
// in-memory backend, at 360×800, 390×844 and 412×915 (plus dark mode and an
// open keyboard). Any RenderFlex overflow / layout exception fails the test.
//
// Set PMC_SHOTS=<dir> to also write PNG screenshots (real Roboto + Material
// Icons fonts from the Flutter SDK cache) for visual review.
import 'dart:io';
import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:pingmycar_mobile/core/api_client.dart';
import 'package:pingmycar_mobile/providers.dart';
import 'package:pingmycar_mobile/ui/router.dart';
import 'package:pingmycar_mobile/ui/theme.dart';

import 'support/fakes.dart';

final _shots = Platform.environment['PMC_SHOTS'];
final _boundaryKey = GlobalKey();

Future<void> _pumpApp(
  WidgetTester tester, {
  required String path,
  required Size size,
  AuthStatus status = AuthStatus.authenticated,
  bool empty = false,
  bool offline = false,
  bool dark = false,
  double keyboard = 0,
}) async {
  tester.view.physicalSize = size;
  tester.view.devicePixelRatio = 1;
  tester.view.viewInsets = FakeViewPadding(bottom: keyboard);
  tester.view.padding = const FakeViewPadding(top: 24, bottom: 16);
  addTearDown(tester.view.reset);

  final api = ApiClient(tokenStore: FakeTokenStore());
  api.raw.httpClientAdapter = FakeBackend(empty: empty, offline: offline);

  final container = ProviderContainer(overrides: [
    tokenStoreProvider.overrideWithValue(FakeTokenStore()),
    apiClientProvider.overrideWithValue(api),
    authControllerProvider.overrideWith(
      () => TestAuthController(AuthState(status: status, user: status == AuthStatus.authenticated ? testUser : null)),
    ),
  ]);
  addTearDown(container.dispose);

  final router = container.read(routerProvider);
  await tester.pumpWidget(
    UncontrolledProviderScope(
      container: container,
      child: RepaintBoundary(
        key: _boundaryKey,
        child: MediaQuery(
          data: MediaQueryData.fromView(tester.view).copyWith(disableAnimations: true),
          child: MaterialApp.router(
            debugShowCheckedModeBanner: false,
            theme: AppTheme.light(),
            darkTheme: AppTheme.dark(),
            themeMode: dark ? ThemeMode.dark : ThemeMode.light,
            routerConfig: router,
          ),
        ),
      ),
    ),
  );
  // Let the brand splash finish and hand off first (reduced motion: ~0.9 s),
  // otherwise its own navigation would replace the screen under test.
  for (var i = 0; i < 20; i++) {
    await tester.pump(const Duration(milliseconds: 100));
  }
  router.go(path);
  for (var i = 0; i < 15; i++) {
    await tester.pump(const Duration(milliseconds: 100));
  }
  // Guard against the harness silently testing the wrong screen.
  final at = router.routerDelegate.currentConfiguration.uri;
  final expected = Uri.parse(path);
  final redirected = status != AuthStatus.authenticated; // guests are sent to /login
  if (!redirected && at.path != expected.path) {
    throw StateError('Layout harness is on ${at.path}, expected ${expected.path}');
  }
}

Future<void> _shot(WidgetTester tester, String name) async {
  if (_shots == null) return;
  await tester.runAsync(() async {
    final boundary = _boundaryKey.currentContext!.findRenderObject()! as RenderRepaintBoundary;
    final ui.Image image = await boundary.toImage(pixelRatio: 2);
    final bytes = await image.toByteData(format: ui.ImageByteFormat.png);
    Directory(_shots!).createSync(recursive: true);
    File('$_shots/$name.png').writeAsBytesSync(bytes!.buffer.asUint8List());
  });
}

void main() {
  setUpAll(() async {
    TestWidgetsFlutterBinding.ensureInitialized();
    // Real fonts always: the default test font (Ahem) renders every glyph as
    // a full-width square and would report overflows that never happen.
    await loadRealFonts();
  });

  const sizes = {'360x800': Size(360, 800), '390x844': Size(390, 844), '412x915': Size(412, 915)};
  const ownerScreens = {
    'home': '/home',
    'messages': '/messages',
    'messages-filtered': '/messages?vehicle=v1',
    'thread': '/messages/c1',
    'vehicles': '/vehicles',
    'vehicle-detail': '/vehicles/v1',
    'vehicle-qr': '/vehicles/v1/qr',
    'vehicle-new': '/vehicles/new',
    'vehicle-edit': '/vehicles/v1/edit',
    'stickers': '/stickers',
    'sticker-designer': '/stickers/v1',
    'sticker-designer-round': '/stickers/v1?design=round',
    'profile': '/profile',
    'account': '/settings',
    'notifications': '/settings/notifications',
    'privacy': '/settings/privacy',
  };

  for (final size in sizes.entries) {
    for (final screen in ownerScreens.entries) {
      testWidgets('${screen.key} @ ${size.key} has no overflow', (tester) async {
        await _pumpApp(tester, path: screen.value, size: size.value);
        expect(tester.takeException(), isNull);
        expect(find.byType(ErrorWidget), findsNothing);
        await _shot(tester, '${screen.key}-${size.key}');
      });
    }

    testWidgets('login (guest) @ ${size.key}', (tester) async {
      await _pumpApp(tester, path: '/home', size: size.value, status: AuthStatus.unauthenticated);
      expect(tester.takeException(), isNull);
      // Guests are redirected to Google sign-in — never shown owner screens.
      expect(find.text('Continue with Google'), findsOneWidget);
      expect(find.text('Add Vehicle'), findsNothing);
      await _shot(tester, 'login-${size.key}');
    });
  }

  group('guests cannot reach owner routes', () {
    for (final path in ['/home', '/messages', '/vehicles', '/vehicles/new', '/vehicles/v1/qr', '/stickers', '/profile', '/messages/c1']) {
      testWidgets(path, (tester) async {
        await _pumpApp(tester, path: path, size: const Size(390, 844), status: AuthStatus.unauthenticated);
        expect(find.text('Continue with Google'), findsOneWidget);
      });
    }
  });

  group('states', () {
    for (final screen in {'home': '/home', 'vehicles': '/vehicles', 'messages': '/messages', 'stickers': '/stickers'}.entries) {
      testWidgets('empty ${screen.key}', (tester) async {
        await _pumpApp(tester, path: screen.value, size: const Size(360, 800), empty: true);
        expect(tester.takeException(), isNull);
        await _shot(tester, 'empty-${screen.key}-360x800');
      });
      testWidgets('offline ${screen.key}', (tester) async {
        await _pumpApp(tester, path: screen.value, size: const Size(360, 800), offline: true);
        expect(tester.takeException(), isNull);
        expect(find.text('No internet connection'), findsOneWidget);
        expect(find.text('Retry'), findsOneWidget);
        await _shot(tester, 'offline-${screen.key}-360x800');
      });
    }

    for (final screen in {'home': '/home', 'thread': '/messages/c1', 'vehicle-qr': '/vehicles/v1/qr', 'vehicles': '/vehicles'}.entries) {
      testWidgets('dark ${screen.key}', (tester) async {
        await _pumpApp(tester, path: screen.value, size: const Size(390, 844), dark: true);
        expect(tester.takeException(), isNull);
        await _shot(tester, 'dark-${screen.key}-390x844');
      });
    }

    for (final screen in {'thread': '/messages/c1', 'vehicle-new': '/vehicles/new'}.entries) {
      testWidgets('keyboard open ${screen.key}', (tester) async {
        await _pumpApp(tester, path: screen.value, size: const Size(360, 800), keyboard: 300);
        expect(tester.takeException(), isNull);
        await _shot(tester, 'keyboard-${screen.key}-360x800');
      });
    }
  });
}
