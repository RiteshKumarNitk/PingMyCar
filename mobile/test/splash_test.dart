// Brand splash: timing, routing, reduced motion, skip, cold-start deep link,
// landscape. Set PMC_SHOTS=<dir> to capture one frame per animation beat.
import 'dart:io';
import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:pingmycar_mobile/core/api_client.dart';
import 'package:pingmycar_mobile/providers.dart';
import 'package:pingmycar_mobile/ui/router.dart';
import 'package:pingmycar_mobile/ui/screens/splash_screen.dart';
import 'package:pingmycar_mobile/ui/splash/brand_qr_data.dart';
import 'package:pingmycar_mobile/ui/theme.dart';

import 'support/fakes.dart';

final _shots = Platform.environment['PMC_SHOTS'];
final _boundary = GlobalKey();

Future<ProviderContainer> _launch(
  WidgetTester tester, {
  AuthStatus status = AuthStatus.authenticated,
  bool reducedMotion = false,
  Size size = const Size(390, 844),
  bool dark = false,
}) async {
  tester.view.physicalSize = size;
  tester.view.devicePixelRatio = 1;
  tester.view.padding = const FakeViewPadding(top: 24, bottom: 16);
  addTearDown(tester.view.reset);

  final api = ApiClient(tokenStore: FakeTokenStore());
  api.raw.httpClientAdapter = FakeBackend();
  final container = ProviderContainer(overrides: [
    tokenStoreProvider.overrideWithValue(FakeTokenStore()),
    apiClientProvider.overrideWithValue(api),
    authControllerProvider.overrideWith(
      () => TestAuthController(AuthState(status: status, user: status == AuthStatus.authenticated ? testUser : null)),
    ),
  ]);
  addTearDown(container.dispose);

  await tester.pumpWidget(
    UncontrolledProviderScope(
      container: container,
      child: RepaintBoundary(
        key: _boundary,
        child: MediaQuery(
          data: MediaQueryData.fromView(tester.view).copyWith(disableAnimations: reducedMotion),
          child: MaterialApp.router(
            debugShowCheckedModeBanner: false,
            theme: AppTheme.light(),
            darkTheme: AppTheme.dark(),
            themeMode: dark ? ThemeMode.dark : ThemeMode.light,
            routerConfig: container.read(routerProvider),
          ),
        ),
      ),
    ),
  );
  return container;
}

Future<void> _advance(WidgetTester tester, Duration total, {Duration step = const Duration(milliseconds: 50)}) async {
  var t = Duration.zero;
  while (t < total) {
    await tester.pump(step);
    t += step;
  }
}

Future<void> _shot(WidgetTester tester, String name) async {
  if (_shots == null) return;
  await tester.runAsync(() async {
    final b = _boundary.currentContext!.findRenderObject()! as RenderRepaintBoundary;
    final ui.Image image = await b.toImage(pixelRatio: 2);
    final bytes = await image.toByteData(format: ui.ImageByteFormat.png);
    Directory(_shots!).createSync(recursive: true);
    File('$_shots/$name.png').writeAsBytesSync(bytes!.buffer.asUint8List());
  });
}

bool _onSplash() => find.byType(SplashScreen).evaluate().isNotEmpty;

void main() {
  setUpAll(() async {
    TestWidgetsFlutterBinding.ensureInitialized();
    await loadRealFonts();
  });

  test('brand QR matrix is a well-formed 29×29 code with finder patterns', () {
    expect(kBrandQrRows.length, 29);
    expect(kBrandQrRows.every((r) => r.length == 29), isTrue);
    // Top-left, top-right and bottom-left finder patterns.
    for (final (x, y) in [(0, 0), (22, 0), (0, 22)]) {
      expect(kBrandQrRows[y].substring(x, x + 7), '#######');
      expect(kBrandQrRows[y + 2].substring(x, x + 7), '#.###.#');
    }
  });

  testWidgets('authenticated: plays the story, then opens the dashboard', (tester) async {
    await _launch(tester);
    const beats = {'logo': 300, 'qr-scan': 1000, 'travel': 1700, 'attach': 2500, 'privacy': 3200};
    var elapsed = 0;
    for (final beat in beats.entries) {
      await _advance(tester, Duration(milliseconds: beat.value - elapsed));
      elapsed = beat.value;
      expect(_onSplash(), isTrue, reason: 'still on splash at ${beat.value}ms');
      expect(tester.takeException(), isNull);
      await _shot(tester, 'splash-${beat.value}-${beat.key}');
    }
    expect(find.text('Connect privately.'), findsOneWidget);
    expect(find.text('No phone number required.'), findsOneWidget);

    await _advance(tester, const Duration(milliseconds: 1500)); // + page transition
    expect(_onSplash(), isFalse);
    expect(find.text('Riya'), findsOneWidget); // dashboard greeting
  });

  testWidgets('unauthenticated: goes to Google sign-in, never the dashboard', (tester) async {
    await _launch(tester, status: AuthStatus.unauthenticated);
    await _advance(tester, const Duration(milliseconds: 3800));
    expect(find.text('Continue with Google'), findsOneWidget);
    expect(find.text('Add Vehicle'), findsNothing);
  });

  testWidgets('waits for a slow session restore, then routes', (tester) async {
    final container = await _launch(tester, status: AuthStatus.unknown);
    await _advance(tester, const Duration(milliseconds: 4200));
    expect(_onSplash(), isTrue); // animation done, session still unknown
    expect(find.bySemanticsLabel('Signing you in'), findsOneWidget);

    (container.read(authControllerProvider.notifier) as TestAuthController).setStatus(AuthStatus.authenticated);
    await _advance(tester, const Duration(milliseconds: 1500)); // + page transition
    expect(_onSplash(), isFalse);
    expect(find.text('Riya'), findsOneWidget);
  });

  testWidgets('tap skips the animation', (tester) async {
    await _launch(tester, status: AuthStatus.unauthenticated);
    await _advance(tester, const Duration(milliseconds: 400));
    await tester.tap(find.byType(SplashScreen));
    await _advance(tester, const Duration(milliseconds: 600));
    expect(find.text('Continue with Google'), findsOneWidget);
  });

  testWidgets('reduced motion: short fade of the final composition, then continues', (tester) async {
    await _launch(tester, reducedMotion: true);
    await _advance(tester, const Duration(milliseconds: 500));
    expect(find.text('Connect privately.'), findsOneWidget);
    await _shot(tester, 'splash-reduced-motion');
    await _advance(tester, const Duration(milliseconds: 1500)); // + page transition
    expect(_onSplash(), isFalse);
    expect(find.text('Riya'), findsOneWidget);
  });

  testWidgets('cold start from a notification opens the conversation; Back → dashboard', (tester) async {
    final container = await _launch(tester);
    await _advance(tester, const Duration(milliseconds: 800));
    container.read(deepLinkSignalProvider).emitRoute('/messages/c1');
    await _advance(tester, const Duration(milliseconds: 1500));
    expect(_onSplash(), isFalse);
    expect(find.text('Lights are on'), findsWidgets); // conversation title

    final router = container.read(routerProvider);
    router.pop();
    await _advance(tester, const Duration(milliseconds: 800));
    expect(router.routerDelegate.currentConfiguration.uri.path, '/home');
  });

  for (final (name, size, dark) in [
    ('landscape', const Size(844, 390), false),
    ('small', const Size(360, 640), false),
    ('dark', const Size(390, 844), true),
  ]) {
    testWidgets('$name: no overflow at any beat', (tester) async {
      await _launch(tester, size: size, dark: dark);
      for (var ms = 0; ms < 3300; ms += 300) {
        await _advance(tester, const Duration(milliseconds: 300));
        expect(tester.takeException(), isNull, reason: 'at ${ms + 300}ms');
      }
      await _shot(tester, 'splash-$name-final');
      await _advance(tester, const Duration(milliseconds: 800));
    });
  }
}
