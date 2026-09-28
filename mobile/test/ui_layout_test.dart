// Responsive/overflow QA for every owner screen.
//
// Drives the REAL router, auth redirect, repositories and models against an
// in-memory backend, at 360×800, 390×844 and 412×915 (plus dark mode and an
// open keyboard). Any RenderFlex overflow / layout exception fails the test.
//
// Set PMC_SHOTS=<dir> to also write PNG screenshots (real Roboto + Material
// Icons fonts from the Flutter SDK cache) for visual review.
import 'dart:convert';
import 'dart:io';
import 'dart:ui' as ui;

import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:pingmycar_mobile/core/api_client.dart';
import 'package:pingmycar_mobile/core/token_store.dart';
import 'package:pingmycar_mobile/models/models.dart';
import 'package:pingmycar_mobile/providers.dart';
import 'package:pingmycar_mobile/ui/router.dart';
import 'package:pingmycar_mobile/ui/theme.dart';

class _FakeTokenStore implements TokenStore {
  @override
  Future<String?> readSessionToken() async => 'test-token';
  @override
  Future<void> saveSessionToken(String token) async {}
  @override
  Future<void> clearSessionToken() async {}
  @override
  Future<String> readOrCreateDeviceId() async => 'test-device';
}

class _Backend implements HttpClientAdapter {
  _Backend({this.empty = false, this.offline = false});
  final bool empty;
  final bool offline;

  static final _now = DateTime.now().toUtc();
  static String _ago(Duration d) => _now.subtract(d).toIso8601String();

  static final _vehicles = [
    {
      'id': 'v1',
      'name': 'Honda City VX CVT Automatic',
      'type': 'CAR',
      'registrationNumber': 'RJ14 CD 4521',
      'color': 'Silver',
      'publicToken': 'ABCD1234',
      'qrActive': true,
    },
    {'id': 'v2', 'name': 'Activa', 'type': 'SCOOTER', 'publicToken': 'EFGH5678', 'qrActive': false},
  ];

  static final _conversations = [
    {
      'id': 'c1',
      'vehicleId': 'v1',
      'vehicleName': 'Honda City VX CVT Automatic',
      'reason': 'LIGHTS_ON',
      'status': 'OPEN',
      'unread': true,
      'unreadCount': 2,
      'lastMessage': {'body': 'Hi, your headlights are still on. Parked near gate 2 by the pharmacy.', 'senderType': 'VISITOR', 'createdAt': _ago(const Duration(minutes: 4))},
      'updatedAt': _ago(const Duration(minutes: 4)),
    },
    {
      'id': 'c2',
      'vehicleId': 'v2',
      'vehicleName': 'Activa',
      'reason': 'MOVE_VEHICLE',
      'status': 'BLOCKED',
      'unread': false,
      'unreadCount': 0,
      'lastMessage': {'body': 'Thanks, moved it.', 'senderType': 'OWNER', 'createdAt': _ago(const Duration(days: 3))},
      'updatedAt': _ago(const Duration(days: 3)),
    },
  ];

  Object? _route(RequestOptions o) {
    final p = o.path;
    if (p == '/api/me' || p.startsWith('/api/auth/get-session')) {
      return {
        'user': {'id': 'u1', 'name': 'Riya Sharma', 'email': 'riya.sharma@example.com', 'hasRealEmail': true},
      };
    }
    if (p == '/api/dashboard/summary') {
      return {
        'vehicleCount': empty ? 0 : 2,
        'activeQrCount': empty ? 0 : 1,
        'unreadMessageCount': empty ? 0 : 2,
        'totalMessageCount': empty ? 0 : 5,
        'recentConversations': empty
            ? []
            : [
                {
                  'id': 'c1',
                  'vehicleId': 'v1',
                  'vehicleName': 'Honda City VX CVT Automatic',
                  'reason': 'LIGHTS_ON',
                  'reasonLabel': 'Lights are on',
                  'status': 'OPEN',
                  'unread': true,
                  'lastMessageBody': 'Hi, your headlights are still on. Parked near gate 2.',
                  'lastMessageAt': _ago(const Duration(minutes: 4)),
                },
              ],
      };
    }
    if (p == '/api/vehicles') return {'vehicles': empty ? [] : _vehicles};
    if (p.startsWith('/api/vehicles/')) {
      final id = p.split('/')[3];
      return {'vehicle': _vehicles.firstWhere((v) => v['id'] == id, orElse: () => _vehicles.first)};
    }
    if (p == '/api/messages') return {'conversations': empty ? [] : _conversations, 'nextCursor': null};
    if (p.endsWith('/read')) return {'ok': true};
    if (p.startsWith('/api/conversations/')) {
      return {
        'id': 'c1',
        'vehicleId': 'v1',
        'vehicleName': 'Honda City VX CVT Automatic',
        'reason': 'LIGHTS_ON',
        'status': 'OPEN',
        'messages': [
          {'senderType': 'VISITOR', 'body': 'Hi, your headlights are still on. Parked near gate 2 by the pharmacy.', 'createdAt': _ago(const Duration(hours: 26))},
          {'senderType': 'OWNER', 'body': 'Thank you so much! Coming down right now.', 'createdAt': _ago(const Duration(minutes: 30))},
          {'senderType': 'VISITOR', 'body': 'No problem 👍', 'createdAt': _ago(const Duration(minutes: 4))},
        ],
      };
    }
    return <String, Object?>{};
  }

  @override
  Future<ResponseBody> fetch(RequestOptions o, Stream<Uint8List>? s, Future<void>? c) async {
    if (offline) {
      throw DioException(requestOptions: o, type: DioExceptionType.connectionError);
    }
    return ResponseBody.fromString(jsonEncode(_route(o)), 200, headers: {
      Headers.contentTypeHeader: ['application/json'],
    });
  }

  @override
  void close({bool force = false}) {}
}

class _AuthedController extends AuthController {
  _AuthedController(this._state);
  final AuthState _state;
  @override
  AuthState build() => _state;
}

final _user = UserProfile(id: 'u1', name: 'Riya Sharma', email: 'riya.sharma@example.com', hasRealEmail: true);

Future<void> _loadFonts() async {
  final cache = Platform.environment['FLUTTER_ROOT'] ?? r'C:\flutter';
  final dir = '$cache/bin/cache/artifacts/material_fonts';
  Future<void> load(String family, List<String> files) async {
    final loader = FontLoader(family);
    for (final f in files) {
      final file = File('$dir/$f');
      if (file.existsSync()) loader.addFont(Future.value(ByteData.view(file.readAsBytesSync().buffer)));
    }
    await loader.load();
  }

  await load('Roboto', ['roboto-regular.ttf', 'roboto-medium.ttf', 'roboto-bold.ttf']);
  await load('MaterialIcons', ['materialicons-regular.otf']);
}

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

  final api = ApiClient(tokenStore: _FakeTokenStore());
  api.raw.httpClientAdapter = _Backend(empty: empty, offline: offline);

  final container = ProviderContainer(overrides: [
    tokenStoreProvider.overrideWithValue(_FakeTokenStore()),
    apiClientProvider.overrideWithValue(api),
    authControllerProvider.overrideWith(
      () => _AuthedController(AuthState(status: status, user: status == AuthStatus.authenticated ? _user : null)),
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
  router.go(path);
  for (var i = 0; i < 12; i++) {
    await tester.pump(const Duration(milliseconds: 100));
  }
  // Let the splash hand-off timer (1.4s) fire so no timers are left pending.
  await tester.pump(const Duration(seconds: 2));
  await tester.pump(const Duration(milliseconds: 100));
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
    await _loadFonts();
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
