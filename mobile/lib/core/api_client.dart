import 'package:dio/dio.dart';

import '../config.dart';
import 'api_error.dart';
import 'token_store.dart';

/// Signals that the session is invalid and the app must return to sign-in.
/// The router listens to this instead of every screen handling 401 itself.
final sessionExpired = ExpiredSessionSignal();

class ExpiredSessionSignal {
  final _listeners = <void Function()>[];

  void addListener(void Function() cb) => _listeners.add(cb);
  void removeListener(void Function() cb) => _listeners.remove(cb);

  void fire() {
    for (final cb in List.of(_listeners)) {
      cb();
    }
  }
}

/// Guest/reviewer tokens are issued by POST /api/guest/session.
const guestTokenPrefix = 'guest_';

/// Shown when a guest tries anything that would change data.
const guestModeMessage = 'This is the OwnerPing demo. Sign in with Google to make changes.';

/// Marks a request the client refused locally in guest mode.
class GuestModeBlocked implements Exception {
  const GuestModeBlocked();
}

/// Where a guest request goes: the read-only demo namespace for reads, a
/// harmless local no-op for "mark as read", and nowhere for everything else.
/// Pure so it can be unit-tested; the server enforces the same boundary
/// (a guest token is never accepted by owner/admin routes).
sealed class GuestRoute {
  const GuestRoute();
}

class GuestPassThrough extends GuestRoute {
  const GuestPassThrough(this.path);
  final String path;
}

class GuestNoOp extends GuestRoute {
  const GuestNoOp();
}

class GuestBlocked extends GuestRoute {
  const GuestBlocked();
}

GuestRoute routeGuestRequest(String method, String path) {
  final m = method.toUpperCase();
  if (path.startsWith('/api/guest/')) return GuestPassThrough(path);
  if (m == 'GET' && path.startsWith('/api/')) return GuestPassThrough('/api/guest/${path.substring(5)}');
  if (m == 'PATCH' && RegExp(r'^/api/conversations/[^/]+/read$').hasMatch(path)) return const GuestNoOp();
  return const GuestBlocked();
}

/// The single HTTP gateway for the whole app. Screens never call Dio
/// directly — they go through repositories that use this client.
///
/// Guest mode (a `guest_…` token): reads are served by the demo endpoints and
/// every write is refused before it leaves the device, so a guest can never
/// create, change or delete anything — and never hits an owner endpoint.
class ApiClient {
  ApiClient({TokenStore? tokenStore}) : _tokens = tokenStore ?? TokenStore() {
    _dio = Dio(
      BaseOptions(
        baseUrl: AppConfig.apiBaseUrl,
        connectTimeout: const Duration(seconds: 15),
        receiveTimeout: const Duration(seconds: 20),
        // Keep server error payloads; the mapper shows only friendly text.
        validateStatus: (code) => code != null && code < 500,
        headers: {'Accept': 'application/json'},
      ),
    );
    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await _tokens.readSessionToken();
        if (token != null && token.isNotEmpty) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        if (token != null && token.startsWith(guestTokenPrefix)) {
          switch (routeGuestRequest(options.method, options.path)) {
            case GuestPassThrough(:final path):
              options.path = path;
            case GuestNoOp():
              return handler.resolve(Response(requestOptions: options, statusCode: 200, data: {'ok': true}));
            case GuestBlocked():
              return handler.reject(DioException(requestOptions: options, type: DioExceptionType.cancel, error: const GuestModeBlocked()));
          }
        }
        handler.next(options);
      },
    ));
  }

  final TokenStore _tokens;
  late final Dio _dio;

  Dio get raw => _dio;

  Future<dynamic> get(String path, {Map<String, String>? query}) async {
    return _run(() => _dio.get<dynamic>(path, queryParameters: query));
  }

  Future<dynamic> post(String path, {Object? body}) async {
    return _run(() => _dio.post<dynamic>(path, data: body));
  }

  Future<dynamic> patch(String path, {Object? body}) async {
    return _run(() => _dio.patch<dynamic>(path, data: body));
  }

  Future<dynamic> put(String path, {Object? body}) async {
    return _run(() => _dio.put<dynamic>(path, data: body));
  }

  Future<dynamic> delete(String path, {Object? body}) async {
    return _run(() => _dio.delete<dynamic>(path, data: body));
  }

  Future<void> download(String path, String savePath) async {
    try {
      await _dio.download(path, savePath);
    } on DioException catch (e) {
      throw _map(e);
    }
  }

  Future<dynamic> _run(Future<Response<dynamic>> Function() fn) async {
    try {
      final res = await fn();
      if (res.statusCode != null && res.statusCode! >= 400) {
        final err = Api.fromStatus(res.statusCode, _extractError(res.data));
        if (err.isUnauthorized) sessionExpired.fire();
        throw err;
      }
      return res.data;
    } on DioException catch (e) {
      final err = _map(e);
      if (err.isUnauthorized) sessionExpired.fire();
      throw err;
    }
  }

  ApiException _map(DioException e) {
    if (e.error is GuestModeBlocked) {
      return const ApiException(ApiErrorKind.forbidden, guestModeMessage, statusCode: 403);
    }
    switch (e.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
      case DioExceptionType.connectionError:
        return ApiException.network();
      case DioExceptionType.badResponse:
        return Api.fromStatus(e.response?.statusCode, _extractError(e.response?.data));
      default:
        return ApiException(ApiErrorKind.network, 'Network error. Please try again.');
    }
  }

  String? _extractError(dynamic data) {
    if (data is Map && data['error'] is String) return data['error'] as String;
    return null;
  }
}
