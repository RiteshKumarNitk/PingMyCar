// Shared fakes for widget tests: an in-memory backend that drives the REAL
// ApiClient/repositories, a token store without platform channels, a
// controllable auth state, and real fonts for screenshots/layout checks.
import 'dart:convert';
import 'dart:io';

import 'package:dio/dio.dart';
import 'package:flutter/services.dart';
import 'package:pingmycar_mobile/core/token_store.dart';
import 'package:pingmycar_mobile/models/models.dart';
import 'package:pingmycar_mobile/providers.dart';

class FakeTokenStore implements TokenStore {
  @override
  Future<String?> readSessionToken() async => 'test-token';
  @override
  Future<void> saveSessionToken(String token) async {}
  @override
  Future<void> clearSessionToken() async {}
  @override
  Future<String> readOrCreateDeviceId() async => 'test-device';
}

class FakeBackend implements HttpClientAdapter {
  FakeBackend({this.empty = false, this.offline = false});
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
    {
      'id': 'c3',
      'vehicleId': 'v1',
      'vehicleName': 'Honda City VX CVT Automatic',
      'reason': 'DAMAGE',
      'status': 'OPEN',
      'unread': false,
      'unreadCount': 0,
      'lastMessage': {'body': 'Someone scraped your rear bumper while reversing.', 'senderType': 'VISITOR', 'createdAt': _ago(const Duration(minutes: 18))},
      'updatedAt': _ago(const Duration(minutes: 18)),
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
    if (o.method == 'DELETE') return {'ok': true};
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

class TestAuthController extends AuthController {
  TestAuthController(this._state);
  final AuthState _state;
  @override
  AuthState build() => _state;

  /// Lets tests resolve the session restore at a chosen moment.
  void setStatus(AuthStatus status) =>
      state = AuthState(status: status, user: status == AuthStatus.authenticated ? testUser : null);
}

final testUser = UserProfile(id: 'u1', name: 'Riya Sharma', email: 'riya.sharma@example.com', hasRealEmail: true);

Future<void> loadRealFonts() async {
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

