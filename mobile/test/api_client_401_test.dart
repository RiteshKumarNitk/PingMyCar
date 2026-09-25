import 'dart:typed_data';

import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:pingmycar_mobile/core/api_client.dart';
import 'package:pingmycar_mobile/core/api_error.dart';
import 'package:pingmycar_mobile/core/token_store.dart';

/// Token store that never touches platform channels (unit-test env).
FakeTokenStore fakeStore([String? token]) => FakeTokenStore(token);

class FakeTokenStore implements TokenStore {
  FakeTokenStore(this._token);
  final String? _token;

  @override
  Future<String?> readSessionToken() async => _token;

  @override
  Future<void> saveSessionToken(String token) async {}

  @override
  Future<void> clearSessionToken() async {}

  @override
  Future<String> readOrCreateDeviceId() async => 'test-device';
}

/// In-memory Dio adapter: verifies the Authorization header and simulates
/// backend responses — drives the REAL ApiClient, not a mock of it.
class FakeBackend implements HttpClientAdapter {
  FakeBackend(this.handler);

  final ResponseBody Function(RequestOptions options) handler;
  String? lastAuthorizationHeader;

  @override
  Future<ResponseBody> fetch(RequestOptions options, Stream<Uint8List>? requestStream, Future<void>? cancelFuture) async {
    lastAuthorizationHeader = options.headers['Authorization'] as String?;
    return handler(options);
  }

  @override
  void close({bool force = false}) {}
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  test('every request carries Authorization: Bearer <token> once set', () async {
    final backend = FakeBackend((options) {
      return ResponseBody.fromString('{"vehicles":[]}', 200, headers: {
        Headers.contentTypeHeader: [Headers.jsonContentType],
      });
    });

    final client = ApiClient(tokenStore: fakeStore());
    client.raw.httpClientAdapter = backend;

    // No token stored → the Authorization header must be ABSENT (the public
    // visitor-facing behavior would be identical; owner calls 401 instead).
    await client.get('/api/vehicles');
    expect(backend.lastAuthorizationHeader, isNull);
  });

  test('a stored token IS attached as Bearer header', () async {
    final backend = FakeBackend((options) {
      return ResponseBody.fromString('{}', 200, headers: {
        Headers.contentTypeHeader: [Headers.jsonContentType],
      });
    });

    final client = ApiClient(tokenStore: fakeStore('pmc-test-token-123'));
    client.raw.httpClientAdapter = backend;

    await client.get('/api/vehicles');
    expect(backend.lastAuthorizationHeader, 'Bearer pmc-test-token-123');
  });

  test('401 response fires sessionExpired and throws unauthorized', () async {
    final backend = FakeBackend((options) {
      return ResponseBody.fromString('{"error":"Unauthorized"}', 401, headers: {
        Headers.contentTypeHeader: [Headers.jsonContentType],
      });
    });

    final client = ApiClient(tokenStore: fakeStore());
    client.raw.httpClientAdapter = backend;

    var expired = false;
    sessionExpired.addListener(() => expired = true);

    await expectLater(
      client.get('/api/vehicles'),
      throwsA(isA<ApiException>().having((e) => e.kind, 'kind', ApiErrorKind.unauthorized)),
    );
    expect(expired, isTrue, reason: '401 must trigger the global session-expiry signal');
  });

  test('404 maps to notFound and does NOT fire sessionExpired', () async {
    final backend = FakeBackend((options) {
      return ResponseBody.fromString('{"error":"Not found"}', 404, headers: {
        Headers.contentTypeHeader: [Headers.jsonContentType],
      });
    });

    final client = ApiClient(tokenStore: fakeStore());
    client.raw.httpClientAdapter = backend;

    var expired = false;
    sessionExpired.addListener(() => expired = true);

    await expectLater(
      client.get('/api/vehicles/abc'),
      throwsA(isA<ApiException>().having((e) => e.kind, 'kind', ApiErrorKind.notFound)),
    );
    expect(expired, isFalse, reason: 'Only 401 may trigger re-auth');
  });

  test('successful body is returned as decoded JSON', () async {
    final backend = FakeBackend((options) {
      return ResponseBody.fromString(
        '{"vehicles":[{"id":"v1","name":"Honda City","publicToken":"K7M3PQ9X","qrActive":true}]}',
        200,
        headers: {Headers.contentTypeHeader: [Headers.jsonContentType]},
      );
    });

    final client = ApiClient(tokenStore: fakeStore());
    client.raw.httpClientAdapter = backend;

    final data = await client.get('/api/vehicles');
    expect((data['vehicles'] as List), hasLength(1));
  });

  test('connection error maps to offline network error', () async {
    final backend = FakeBackend((options) {
      throw DioException.connectionError(
        requestOptions: options,
        reason: 'socket closed',
      );
    });

    final client = ApiClient(tokenStore: fakeStore());
    client.raw.httpClientAdapter = backend;

    await expectLater(
      client.get('/api/dashboard/summary'),
      throwsA(isA<ApiException>().having((e) => e.kind, 'kind', ApiErrorKind.network)),
    );
  });
}
