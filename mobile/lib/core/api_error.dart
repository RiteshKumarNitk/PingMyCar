/// Typed API failure with a friendly, user-safe message.
///
/// The UI only ever shows [message] — never raw bodies, stack traces, or
/// server internals (no SQL/Prisma errors, no secrets).
enum ApiErrorKind { network, unauthorized, forbidden, notFound, validation, rateLimited, server, unknown }

class ApiException implements Exception {
  const ApiException(this.kind, this.message, {this.statusCode});

  final ApiErrorKind kind;
  final String message;
  final int? statusCode;

  bool get isUnauthorized => kind == ApiErrorKind.unauthorized;

  factory ApiException.network() => const ApiException(
        ApiErrorKind.network,
        "You're offline. Check your connection and try again.",
      );

  @override
  String toString() => message;
}

/// Maps HTTP statuses to friendly errors. 401 triggers global re-auth.
class Api {
  static ApiException fromStatus(int? status, String? serverMessage) {
    switch (status) {
      case 401:
        return ApiException(ApiErrorKind.unauthorized, 'Your session has expired. Please sign in again.', statusCode: status);
      case 403:
        return ApiException(ApiErrorKind.forbidden, "You don't have access to this.", statusCode: status);
      case 404:
        return ApiException(ApiErrorKind.notFound, 'This item no longer exists.', statusCode: status);
      case 422:
      case 400:
        return ApiException(ApiErrorKind.validation, _friendlyValidation(serverMessage), statusCode: status);
      case 429:
        return ApiException(ApiErrorKind.rateLimited, 'Too many attempts. Please wait a moment.', statusCode: status);
      case null:
        return ApiException.network();
      default:
        return ApiException(ApiErrorKind.server, 'Something went wrong on our side. Please try again.', statusCode: status);
    }
  }

  static String _friendlyValidation(String? serverMessage) {
    const fallback = 'Please check the details and try again.';
    if (serverMessage == null || serverMessage.isEmpty) return fallback;
    // The backend's first validation message is written for humans; anything
    // unexpected falls back to the generic text.
    if (serverMessage.length > 120 || serverMessage.contains('\n') || serverMessage.contains('{')) {
      return fallback;
    }
    return serverMessage;
  }
}

const String offlineBannerMessage = "You're offline. Some information may be out of date.";
