import 'dart:io';
import 'package:dio/dio.dart';
import '../core/api_client.dart';
import '../core/api_error.dart';
import '../core/token_store.dart';
import '../models/models.dart';

/// Repositories are the only place that knows endpoint paths. Screens ask
/// repositories; repositories use the shared ApiClient (bearer token,
/// timeouts, error mapping).
class RepositoryException implements Exception {
  RepositoryException(this.message);
  final String message;
  @override
  String toString() => message;
}

class AuthRepository {
  AuthRepository(this._client, this._store);
  final ApiClient _client;
  final TokenStore _store;

  /// Verifies the stored token still yields a session; used at app start.
  Future<UserProfile> me() async {
    final data = await _client.get('/api/auth/get-session');
    if (data == null || (data is Map && data['user'] == null)) {
      throw const ApiException(ApiErrorKind.unauthorized, 'No session');
    }
    return UserProfile.fromJson((data['user'] as Map).cast<String, dynamic>());
  }

  /// Exchanges a Google ID token for a Better Auth session. The token is
  /// verified server-side (signature, issuer, audience); the response's
  /// `set-auth-token` header carries the session token for the app.
  Future<UserProfile> signInWithGoogleIdToken({required String idToken, String? accessToken}) async {
    final Response<Map<String, dynamic>> res;
    try {
      res = await _client.raw.post<Map<String, dynamic>>(
        // Better Auth's social sign-in endpoint takes the provider + idToken.
        '/api/auth/sign-in/social',
        data: {
          'provider': 'google',
          'idToken': {
            'token': idToken,
            if (accessToken != null) 'accessToken': accessToken,
          },
        },
        options: Options(responseType: ResponseType.json),
      );
    } on DioException catch (e) {
      // Surface the backend's rejection reason so sign-in problems are
      // diagnosable (invalid token, provider not configured, etc).
      final detail = e.response?.data is Map
          ? (e.response!.data as Map)['message'] ?? (e.response!.data as Map)['error']
          : null;
      throw ApiException(
        ApiErrorKind.unauthorized,
        'Backend rejected the Google sign-in (${e.response?.statusCode ?? 'network'}). $detail',
      );
    }
    final sessionToken = res.headers.value('set-auth-token');
    if (sessionToken == null || sessionToken.isEmpty) {
      throw const ApiException(
        ApiErrorKind.unauthorized,
        'Sign-in succeeded but no session was issued. Is the bearer plugin enabled on the backend?',
      );
    }
    await _store.saveSessionToken(sessionToken);
    final user = res.data?['user'];
    if (user is Map) return UserProfile.fromJson(user.cast<String, dynamic>());
    return me();
  }

  /// Signing out clears the local session; the server session expires
  /// naturally. The device's FCM token is unregistered separately.
  Future<void> signOut() async {
    try {
      await _client.post('/api/auth/sign-out');
    } catch (_) {/* server-side sign-out is best-effort */}
    await _store.clearSessionToken();
  }
}

class DashboardRepository {
  DashboardRepository(this._client);
  final ApiClient _client;

  Future<DashboardSummary> summary() async {
    final data = await _client.get('/api/dashboard/summary');
    return DashboardSummary.fromJson((data as Map).cast<String, dynamic>());
  }
}

class VehicleRepository {
  VehicleRepository(this._client);
  final ApiClient _client;

  Future<List<Vehicle>> list() async {
    final data = await _client.get('/api/vehicles');
    final items = (data?['vehicles'] as List? ?? []);
    return items.map((v) => Vehicle.fromJson((v as Map).cast<String, dynamic>())).toList();
  }

  Future<Vehicle> create({required String name, String? type, String? registrationNumber, String? color}) async {
    final data = await _client.post('/api/vehicles', body: {
      'name': name,
      if (type != null) 'type': type,
      if (registrationNumber != null && registrationNumber.isNotEmpty) 'registrationNumber': registrationNumber,
      if (color != null && color.isNotEmpty) 'color': color,
    });
    return Vehicle.fromJson((data['vehicle'] as Map).cast<String, dynamic>());
  }

  Future<Vehicle> get(String id) async {
    final data = await _client.get('/api/vehicles/$id');
    return Vehicle.fromJson((data['vehicle'] as Map).cast<String, dynamic>());
  }

  Future<Vehicle> update(String id, {String? name, String? type, String? registrationNumber, String? color, bool? qrActive, bool regenerateToken = false}) async {
    final data = await _client.patch('/api/vehicles/$id', body: {
      if (name != null) 'name': name,
      if (type != null) 'type': type,
      'registrationNumber': registrationNumber, // explicit null clears it
      'color': color,
      if (qrActive != null) 'qrActive': qrActive,
      if (regenerateToken) 'regenerateToken': true,
    });
    return Vehicle.fromJson((data['vehicle'] as Map).cast<String, dynamic>());
  }

  Future<void> delete(String id) async {
    await _client.delete('/api/vehicles/$id');
  }

  /// Downloads the vehicle's real QR PNG (same token/URL as web).
  Future<File> downloadQrPng(String id, String publicToken, {String? toPath}) async {
    final path = toPath ??
        '${Directory.systemTemp.path}/pingmycar-qr-$publicToken.png';
    await _client.download('/api/vehicles/$id/qr.png', path);
    return File(path);
  }

  /// Downloads the vector A4 print sheet PDF.
  Future<File> downloadStickerPdf(String id, String publicToken, {String? toPath}) async {
    final path = toPath ??
        '${Directory.systemTemp.path}/pingmycar-sticker-a4-$publicToken.pdf';
    await _client.download('/api/vehicles/$id/sticker-a4', path);
    return File(path);
  }
}

class ConversationRepository {
  ConversationRepository(this._client);
  final ApiClient _client;

  Future<List<ConversationSummary>> list({String? vehicleId}) async {
    final data = await _client.get('/api/messages', query: {
      if (vehicleId != null) 'vehicle': vehicleId,
    });
    final items = (data?['conversations'] as List? ?? []);
    return items.map((c) => ConversationSummary.fromListJson((c as Map).cast<String, dynamic>())).toList();
  }

  Future<ConversationDetail> get(String id) async {
    final data = await _client.get('/api/conversations/$id');
    return ConversationDetail.fromJson((data as Map).cast<String, dynamic>());
  }

  /// Server-side unread state — the database is the source of truth.
  Future<void> markRead(String id) async {
    await _client.patch('/api/conversations/$id/read');
  }

  Future<void> report(String id, {String? reason}) async {
    await _client.post('/api/conversations/$id/report', body: {if (reason != null) 'reason': reason});
  }

  Future<void> reply(String id, String body) async {
    await _client.post('/api/conversations/$id/reply', body: {'body': body});
  }

  Future<void> block(String id) async {
    await _client.post('/api/conversations/$id/block');
  }
}

class DeviceRepository {
  DeviceRepository(this._client);
  final ApiClient _client;

  /// Registers/replaces this device's FCM token. Other devices are untouched.
  Future<void> registerFcmToken({required String token, required String platform, required String deviceId}) async {
    await _client.post('/api/devices/mobile', body: {
      'token': token,
      'platform': platform, // ANDROID | IOS
      'deviceId': deviceId,
    });
  }

  /// Removes ONLY this device's token (used at sign-out).
  Future<void> unregisterFcmToken(String token) async {
    await _client.delete('/api/devices/mobile', body: {'token': token});
  }
}
