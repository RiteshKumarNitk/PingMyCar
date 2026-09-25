import 'package:flutter_test/flutter_test.dart';
import 'package:pingmycar_mobile/core/api_error.dart';

void main() {
  group('Api.fromStatus maps statuses to friendly messages', () {
    test('401 → unauthorized with re-auth message', () {
      final e = Api.fromStatus(401, null);
      expect(e.kind, ApiErrorKind.unauthorized);
      expect(e.isUnauthorized, isTrue);
      expect(e.message, contains('sign in again'));
    });

    test('403 → forbidden', () {
      final e = Api.fromStatus(403, 'Forbidden');
      expect(e.kind, ApiErrorKind.forbidden);
    });

    test('404 → not found', () {
      final e = Api.fromStatus(404, 'Not found');
      expect(e.kind, ApiErrorKind.notFound);
    });

    test('400/422 → validation, showing the backend human message', () {
      final e = Api.fromStatus(400, 'Name is required');
      expect(e.kind, ApiErrorKind.validation);
      expect(e.message, 'Name is required');
    });

    test('429 → rate limited', () {
      final e = Api.fromStatus(429, null);
      expect(e.kind, ApiErrorKind.rateLimited);
    });

    test('500 → server error (server detail NOT leaked)', () {
      final e = Api.fromStatus(500, 'PrismaClientKnownRequestError: Invalid constraint');
      expect(e.kind, ApiErrorKind.server);
      expect(e.message, isNot(contains('Prisma')));
    });
  });

  group('Validation message sanitization', () {
    test('long garbage falls back to generic text', () {
      final e = Api.fromStatus(400, 'x' * 200);
      expect(e.message, 'Please check the details and try again.');
    });

    test('JSON-ish bodies fall back to generic text', () {
      final e = Api.fromStatus(422, '{"stack":"secret"}');
      expect(e.message, 'Please check the details and try again.');
    });

    test('empty message falls back to generic text', () {
      final e = Api.fromStatus(400, '');
      expect(e.message, 'Please check the details and try again.');
    });
  });

  test('offline network error', () {
    final e = ApiException.network();
    expect(e.kind, ApiErrorKind.network);
    expect(e.message, contains("offline"));
  });
}
