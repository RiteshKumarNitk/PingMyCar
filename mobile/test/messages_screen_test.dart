// Messages inbox behaviour against an in-memory backend that follows the real
// /api/messages contract (owner-scoped pages + nextCursor) and the real
// DELETE /api/conversations/:id outcomes (200, 409 open report).
import 'dart:async';
import 'dart:convert';

import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:pingmycar_mobile/core/api_client.dart';
import 'package:pingmycar_mobile/providers.dart';
import 'package:pingmycar_mobile/ui/components/components.dart';
import 'package:pingmycar_mobile/ui/screens/messages_screen.dart';

import 'support/fakes.dart';

class _InboxBackend implements HttpClientAdapter {
  _InboxBackend({required int count, this.pageSize = 10, this.blockedDelete = const {}, this.fail = false, this.gate}) {
    final now = DateTime.now().toUtc();
    for (var i = 1; i <= count; i++) {
      _items.add({
        'id': 'c$i',
        'vehicleId': 'v${(i % 3) + 1}',
        'vehicleName': 'Vehicle $i',
        'reason': i.isEven ? 'LIGHTS_ON' : 'MOVE_VEHICLE',
        'status': 'OPEN',
        'unread': i == 1,
        'unreadCount': i == 1 ? 1 : 0,
        'lastMessage': {'body': 'Message $i', 'senderType': 'VISITOR', 'createdAt': now.subtract(Duration(minutes: i)).toIso8601String()},
        'updatedAt': now.subtract(Duration(minutes: i)).toIso8601String(),
      });
    }
  }

  final int pageSize;

  /// Ids whose delete is refused with 409 (open report), like the backend.
  final Set<String> blockedDelete;
  final bool fail;

  /// When set, list requests wait for it — lets a test observe loading.
  final Completer<void>? gate;

  final _items = <Map<String, Object?>>[];
  final requests = <String>[];

  (int, Object?) _route(RequestOptions o) {
    final p = o.path;
    if (p == '/api/messages') {
      if (fail) return (500, {'error': 'boom'});
      final cursor = o.queryParameters['cursor'] as String?;
      final limit = int.parse('${o.queryParameters['limit'] ?? 20}').clamp(1, pageSize);
      final start = cursor == null ? 0 : _items.indexWhere((c) => c['id'] == cursor) + 1;
      final page = _items.skip(start).take(limit).toList();
      final more = start + page.length < _items.length;
      return (200, {'conversations': page, 'nextCursor': more ? page.last['id'] : null});
    }
    if (p.startsWith('/api/conversations/') && o.method == 'DELETE') {
      final id = p.split('/').last;
      if (blockedDelete.contains(id)) return (409, {'error': 'This conversation has an open report.'});
      _items.removeWhere((c) => c['id'] == id);
      return (200, {'ok': true});
    }
    if (p == '/api/vehicles') return (200, {'vehicles': []});
    if (p == '/api/dashboard/summary') {
      return (200, {'vehicleCount': 1, 'activeQrCount': 1, 'unreadMessageCount': 0, 'totalMessageCount': 0, 'recentConversations': []});
    }
    return (200, <String, Object?>{});
  }

  @override
  Future<ResponseBody> fetch(RequestOptions o, Stream<Uint8List>? s, Future<void>? c) async {
    requests.add('${o.method} ${o.path}${o.queryParameters.isEmpty ? '' : '?${Uri(queryParameters: o.queryParameters.map((k, v) => MapEntry(k, '$v'))).query}'}');
    if (gate != null && o.path == '/api/messages') await gate!.future;
    final (status, body) = _route(o);
    return ResponseBody.fromString(jsonEncode(body), status, headers: {
      Headers.contentTypeHeader: ['application/json'],
    });
  }

  @override
  void close({bool force = false}) {}
}

Future<_InboxBackend> _pump(WidgetTester tester, _InboxBackend backend, {bool settle = true}) async {
  tester.view.physicalSize = const Size(390, 844);
  tester.view.devicePixelRatio = 1;
  addTearDown(tester.view.reset);

  final api = ApiClient(tokenStore: FakeTokenStore());
  api.raw.httpClientAdapter = backend;
  final container = ProviderContainer(overrides: [
    tokenStoreProvider.overrideWithValue(FakeTokenStore()),
    apiClientProvider.overrideWithValue(api),
    authControllerProvider.overrideWith(() => TestAuthController(AuthState(status: AuthStatus.authenticated, user: testUser))),
  ]);
  addTearDown(container.dispose);

  final router = GoRouter(initialLocation: '/messages', routes: [
    GoRoute(path: '/messages', builder: (_, __) => const MessagesScreen()),
    GoRoute(path: '/messages/:id', builder: (_, s) => Scaffold(body: Text('thread ${s.pathParameters['id']}'))),
  ]);
  await tester.pumpWidget(UncontrolledProviderScope(
    container: container,
    child: MediaQuery(
      data: MediaQueryData.fromView(tester.view).copyWith(disableAnimations: true),
      child: MaterialApp.router(theme: AppTheme.light(), routerConfig: router),
    ),
  ));
  if (settle) {
    for (var i = 0; i < 10; i++) {
      await tester.pump(const Duration(milliseconds: 50));
    }
  }
  return backend;
}

Future<void> _pumpFrames(WidgetTester tester) async {
  for (var i = 0; i < 10; i++) {
    await tester.pump(const Duration(milliseconds: 50));
  }
}

Future<void> _openMenu(WidgetTester tester, String vehicleName) async {
  final card = find.ancestor(of: find.text(vehicleName), matching: find.byType(ConversationCard));
  await tester.tap(find.descendant(of: card, matching: find.byIcon(Icons.more_vert)));
  await _pumpFrames(tester);
}

void main() {
  setUpAll(() async {
    TestWidgetsFlutterBinding.ensureInitialized();
    await loadRealFonts();
  });

  testWidgets('shows every conversation, one card each', (tester) async {
    await _pump(tester, _InboxBackend(count: 3));
    expect(find.byType(ConversationCard), findsNWidgets(3));
    for (final n in ['Vehicle 1', 'Vehicle 2', 'Vehicle 3']) {
      expect(find.text(n), findsOneWidget);
    }
    expect(tester.takeException(), isNull);
  });

  testWidgets('follows nextCursor until every page is loaded', (tester) async {
    final backend = await _pump(tester, _InboxBackend(count: 25, pageSize: 10));
    await tester.scrollUntilVisible(find.text('Vehicle 25'), 300, scrollable: find.byType(Scrollable).last);
    await _pumpFrames(tester);
    expect(find.text('Vehicle 25'), findsOneWidget);
    final pages = backend.requests.where((r) => r.startsWith('GET /api/messages')).toList();
    expect(pages.length, 3);
    expect(pages.last, contains('cursor=c20'));
    // Only list previews are fetched — no conversation history was loaded.
    expect(backend.requests.where((r) => r.startsWith('GET /api/conversations/')), isEmpty);
  });

  testWidgets('owner deletes a conversation from the list without opening it', (tester) async {
    final backend = await _pump(tester, _InboxBackend(count: 3));
    await _openMenu(tester, 'Vehicle 2');
    await tester.tap(find.text('Delete conversation'));
    await _pumpFrames(tester);
    expect(find.text('Delete conversation?'), findsOneWidget);
    expect(find.text('This will permanently remove this conversation from your messages.'), findsOneWidget);
    await tester.tap(find.widgetWithText(FilledButton, 'Delete'));
    await _pumpFrames(tester);

    expect(backend.requests, contains('DELETE /api/conversations/c2'));
    expect(backend.requests.where((r) => r.startsWith('GET /api/conversations/')), isEmpty);
    expect(find.text('Vehicle 2'), findsNothing);
    expect(find.byType(ConversationCard), findsNWidgets(2));
    expect(find.text('Conversation deleted'), findsOneWidget);
    // Removed locally — the inbox wasn't reloaded.
    expect(backend.requests.where((r) => r.startsWith('GET /api/messages')).length, 1);
  });

  testWidgets('cancel keeps the conversation and sends nothing', (tester) async {
    final backend = await _pump(tester, _InboxBackend(count: 3));
    await _openMenu(tester, 'Vehicle 3');
    await tester.tap(find.text('Delete conversation'));
    await _pumpFrames(tester);
    await tester.tap(find.text('Cancel'));
    await _pumpFrames(tester);
    expect(backend.requests.where((r) => r.startsWith('DELETE')), isEmpty);
    expect(find.byType(ConversationCard), findsNWidgets(3));
  });

  testWidgets('409 (open report) keeps the card and explains why', (tester) async {
    await _pump(tester, _InboxBackend(count: 3, blockedDelete: {'c1'}));
    await _openMenu(tester, 'Vehicle 1');
    await tester.tap(find.text('Delete conversation'));
    await _pumpFrames(tester);
    await tester.tap(find.widgetWithText(FilledButton, 'Delete'));
    await _pumpFrames(tester);
    expect(find.text('This conversation cannot be deleted while an active report is open.'), findsOneWidget);
    expect(find.text('Vehicle 1'), findsOneWidget);
    expect(find.byType(ConversationCard), findsNWidgets(3));
  });

  testWidgets('static UI renders at once; skeletons hold the list area until data lands', (tester) async {
    final gate = Completer<void>();
    await _pump(tester, _InboxBackend(count: 3, gate: gate), settle: false);
    await tester.pump();
    expect(find.text('Messages'), findsOneWidget);
    expect(find.text('Search conversations'), findsOneWidget);
    expect(find.text('All'), findsOneWidget);
    expect(find.byType(ConversationCardSkeleton), findsWidgets);
    expect(find.byType(ConversationCard), findsNothing);

    gate.complete();
    await _pumpFrames(tester);
    expect(find.byType(ConversationCardSkeleton), findsNothing);
    expect(find.byType(ConversationCard), findsNWidgets(3));
  });

  testWidgets('failed load shows a clear error with Try again', (tester) async {
    await _pump(tester, _InboxBackend(count: 3, fail: true));
    expect(find.text('Unable to load messages'), findsOneWidget);
    expect(find.text('Try again'), findsOneWidget);
    expect(find.text('Search conversations'), findsOneWidget); // header stays
  });

  testWidgets('empty inbox explains what will appear', (tester) async {
    await _pump(tester, _InboxBackend(count: 0));
    expect(find.text('No messages yet'), findsOneWidget);
    expect(find.text('When someone scans your OwnerPing QR and contacts you, conversations will appear here.'), findsOneWidget);
  });

  testWidgets('search filters loaded conversations', (tester) async {
    await _pump(tester, _InboxBackend(count: 3));
    await tester.enterText(find.byType(TextField), 'Message 3');
    await _pumpFrames(tester);
    expect(find.byType(ConversationCard), findsOneWidget);
    expect(find.text('Vehicle 3'), findsOneWidget);
  });
}
