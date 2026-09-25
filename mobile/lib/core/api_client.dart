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

/// The single HTTP gateway for the whole app. Screens never call Dio
/// directly — they go through repositories that use this client.
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
