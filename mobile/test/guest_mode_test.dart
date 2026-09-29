// Guest / Play-reviewer mode: server-issued demo session, demo data only,
// no writes, no owner endpoints, no FCM, and a clean exit.
import 'dart:convert';

import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:pingmycar_mobile/core/api_client.dart';
import 'package:pingmycar_mobile/core/api_error.dart';
import 'package:pingmycar_mobile/core/token_store.dart';
import 'package:pingmycar_mobile/providers.dart';
import 'package:pingmycar_mobile/ui/router.dart';
import 'package:pingmycar_mobile/ui/screens/home_screen.dart';
import 'package:pingmycar_mobile/ui/screens/settings/settings_screen.dart';
import 'package:pingmycar_mobile/ui/theme.dart';

import 'support/fakes.dart';

const _guestToken = 'guest_AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';

class _MemoryTokenStore implements TokenStore {
  _MemoryTokenStore([this.token]);
  String? token;
  @override
  Future<String?> readSessionToken() async => token;
  @override
  Future<void> saveSessionToken(String t) async => token = t;
  @override
  Future<void> clearSessionToken() async => token = null;
  @override
  Future<String> readOrCreateDeviceId() async => 'test-device';
}

/// Serves the guest endpoints like the real backend; records every request.
class _GuestBackend implements HttpClientAdapter {
  _GuestBackend({this.sessionValid = true});
  bool sessionValid;
  final requests = <String>[];

  static final _now = DateTime.now().toUtc();
  static String _ago(int m) => _now.subtract(Duration(minutes: m)).toIso8601String();
  static const _user = {'id': 'guest', 'name': 'Guest (Demo)', 'email': '', 'image': null, 'hasRealEmail': false, 'isGuest': true};
  static final _vehicle = {
    'id': 'demo-vehicle-car',
    'name': 'Demo Car — Honda City',
    'type': 'CAR',
    'registrationNumber': 'DEMO 1234',
    'color': 'Silver',
    'publicToken': 'EXAMPLE1',
    'qrActive': true,
  };
  static final _conversation = {
    'id': 'demo-conversation-lights',
    'vehicleId': 'demo-vehicle-car',
    'vehicleName': 'Demo Car — Honda City',
    'reason': 'LIGHTS_ON',
    'status': 'OPEN',
    'unread': true,
    'unreadCount': 1,
    'lastMessage': {'body': 'Your headlights are on. (Demo message)', 'senderType': 'VISITOR', 'createdAt': _ago(4)},
    'updatedAt': _ago(4),
  };

  (int, Object?) _route(RequestOptions o) {
    final p = o.path;
    final auth = o.headers['Authorization'] as String?;
    if (p == '/api/guest/session' && o.method == 'POST') {
      return (201, {'token': _guestToken, 'expiresAt': _ago(-1440), 'user': _user});
    }
    if (!p.startsWith('/api/guest/')) return (401, {'error': 'Unauthorized'}); // owner APIs reject guests
    if (auth != 'Bearer $_guestToken' || !sessionValid) return (401, {'error': 'Unauthorized'});
    if (p == '/api/guest/session' && o.method == 'DELETE') return (200, {'ok': true});
    if (p == '/api/guest/session') return (200, {'user': _user});
    if (p == '/api/guest/dashboard/summary') {
      return (200, {
        'vehicleCount': 1,
        'activeQrCount': 1,
        'unreadMessageCount': 1,
        'totalMessageCount': 1,
        'recentConversations': [
          {
            'id': 'demo-conversation-lights',
            'vehicleId': 'demo-vehicle-car',
            'vehicleName': 'Demo Car — Honda City',
            'reason': 'LIGHTS_ON',
            'reasonLabel': 'Lights are on',
            'status': 'OPEN',
            'unread': true,
            'lastMessageBody': 'Your headlights are on. (Demo message)',
            'lastMessageAt': _ago(4),
          },
        ],
      });
    }
    if (p == '/api/guest/vehicles') return (200, {'vehicles': [_vehicle]});
    if (p == '/api/guest/vehicles/demo-vehicle-car') return (200, {'vehicle': _vehicle});
    if (p == '/api/guest/messages') return (200, {'conversations': [_conversation], 'nextCursor': null});
    return (404, {'error': 'Not found'});
  }

  @override
  Future<ResponseBody> fetch(RequestOptions o, Stream<Uint8List>? s, Future<void>? c) async {
    requests.add('${o.method} ${o.path}');
    final (status, body) = _route(o);
    return ResponseBody.fromString(jsonEncode(body), status, headers: {
      Headers.contentTypeHeader: ['application/json'],
    });
  }

  @override
  void close({bool force = false}) {}
}

void main() {
  setUpAll(() async {
    TestWidgetsFlutterBinding.ensureInitialized();
    await loadRealFonts();
  });

  group('guest request routing (client side)', () {
    test('reads go to the read-only demo namespace', () {
      for (final p in ['/api/dashboard/summary', '/api/vehicles', '/api/vehicles/demo-vehicle-car', '/api/messages', '/api/conversations/demo-conversation-lights']) {
        final r = routeGuestRequest('GET', p);
        expect(r, isA<GuestPassThrough>());
        expect((r as GuestPassThrough).path, '/api/guest/${p.substring(5)}');
      }
    });

    test('every write is refused before it leaves the device', () {
      for (final (m, p) in [
        ('POST', '/api/vehicles'),
        ('PATCH', '/api/vehicles/demo-vehicle-car'),
        ('DELETE', '/api/vehicles/demo-vehicle-car'),
        ('POST', '/api/conversations/x/reply'),
        ('POST', '/api/conversations/x/block'),
        ('DELETE', '/api/conversations/x'),
        ('POST', '/api/devices/mobile'),
        ('DELETE', '/api/account'),
        ('POST', '/api/auth/sign-in/social'),
      ]) {
        expect(routeGuestRequest(m, p), isA<GuestBlocked>(), reason: '$m $p');
      }
    });

    test('mark-as-read is a harmless local no-op; guest session calls pass through', () {
      expect(routeGuestRequest('PATCH', '/api/conversations/demo-conversation-lights/read'), isA<GuestNoOp>());
      expect(routeGuestRequest('DELETE', '/api/guest/session'), isA<GuestPassThrough>());
    });

    test('a blocked write surfaces the demo message, not a sign-out', () async {
      final store = _MemoryTokenStore(_guestToken);
      final api = ApiClient(tokenStore: store);
      final backend = _GuestBackend();
      api.raw.httpClientAdapter = backend;
      var expired = false;
      void onExpired() => expired = true;
      sessionExpired.addListener(onExpired);
      addTearDown(() => sessionExpired.removeListener(onExpired));
      await expectLater(
        api.post('/api/vehicles', body: {'name': 'Mine', 'role': 'OWNER'}).timeout(const Duration(seconds: 5)),
        throwsA(isA<ApiException>().having((e) => e.message, 'message', guestModeMessage).having((e) => e.kind, 'kind', ApiErrorKind.forbidden)),
      );
      expect(backend.requests, isEmpty); // never sent
      expect(expired, isFalse);
    });
  });

  Future<(ProviderContainer, _GuestBackend, _MemoryTokenStore, GoRouter)> pumpApp(
    WidgetTester tester, {
    String? storedToken,
    bool sessionValid = true,
  }) async {
    tester.view.physicalSize = const Size(390, 844);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.reset);
    final store = _MemoryTokenStore(storedToken);
    final backend = _GuestBackend(sessionValid: sessionValid);
    final api = ApiClient(tokenStore: store);
    api.raw.httpClientAdapter = backend;
    final container = ProviderContainer(overrides: [
      tokenStoreProvider.overrideWithValue(store),
      apiClientProvider.overrideWithValue(api),
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
    // Not awaited: in the test zone, Dio's timers only advance while pumping.
    container.read(authControllerProvider.notifier).restoreSession();
    await frames(tester, 25);
    return (container, backend, store, router);
  }

  testWidgets('Continue as Guest → demo Home; no owner endpoint, no FCM registration', (tester) async {
    final (container, backend, store, _) = await pumpApp(tester);
    expect(find.text('Continue with Google'), findsOneWidget); // owner sign-in unchanged
    expect(find.text('Explore OwnerPing with demo data. No account required.'), findsOneWidget);

    await tester.tap(find.text('Continue as Guest'));
    await frames(tester, 20);

    expect(container.read(authControllerProvider).status, AuthStatus.guest);
    expect(store.token, _guestToken);
    expect(find.byType(HomeScreen), findsOneWidget);
    expect(find.text('Demo'), findsOneWidget);
    expect(find.text('Demo Car — Honda City'), findsWidgets);

    // Everything from the guest session onwards (before it: the normal
    // signed-out session check).
    final start = backend.requests.indexOf('POST /api/guest/session');
    expect(start, greaterThanOrEqualTo(0));
    final apiCalls = backend.requests.sublist(start);
    expect(apiCalls.length, greaterThan(1));
    expect(apiCalls.every((r) => r.contains('/api/guest/')), isTrue, reason: apiCalls.join('\n'));
    expect(backend.requests.any((r) => r.contains('/api/devices')), isFalse);
  });

  testWidgets('guest can\'t reach account deletion', (tester) async {
    final (_, _, _, router) = await pumpApp(tester, storedToken: _guestToken);
    router.go('/settings/delete-account');
    await frames(tester, 10);
    expect(find.byType(SettingsScreen), findsOneWidget);
    expect(find.text('Delete account'), findsNothing);
    expect(find.text('Guest / Demo Account'), findsOneWidget);
  });

  testWidgets('a stored guest session is restored; Exit demo revokes it and returns to sign-in', (tester) async {
    final (container, backend, store, router) = await pumpApp(tester, storedToken: _guestToken);
    expect(container.read(authControllerProvider).status, AuthStatus.guest);
    router.go('/profile');
    await frames(tester, 10);
    expect(find.text('Guest / Demo Account'), findsOneWidget);
    expect(find.text('Signed in with Google'), findsNothing);

    await tester.tap(find.text('Exit demo'));
    await frames(tester, 15);
    expect(backend.requests, contains('DELETE /api/guest/session'));
    expect(store.token, isNull);
    expect(container.read(authControllerProvider).status, AuthStatus.unauthenticated);
    expect(find.text('Continue with Google'), findsOneWidget);
  });

  testWidgets('an expired guest session goes back to sign-in', (tester) async {
    final (container, _, _, _) = await pumpApp(tester, storedToken: _guestToken, sessionValid: false);
    expect(container.read(authControllerProvider).status, AuthStatus.unauthenticated);
    expect(find.text('Continue with Google'), findsOneWidget);
  });

  test('guests never count as authenticated owners', () {
    const guest = AuthState(status: AuthStatus.guest);
    expect(guest.isGuest, isTrue);
    expect(guest.canEnterApp, isTrue);
    expect(guest.status == AuthStatus.authenticated, isFalse); // FCM + deep links require this
  });
}

Future<void> frames(WidgetTester tester, int n) async {
  for (var i = 0; i < n; i++) {
    await tester.pump(const Duration(milliseconds: 100));
  }
}
