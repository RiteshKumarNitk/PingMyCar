import 'package:flutter_test/flutter_test.dart';
import 'package:pingmycar_mobile/core/api_error.dart';
import 'package:pingmycar_mobile/services/fcm/fcm_service.dart';

void main() {
  group('notification tap routing', () {
    test('backend web route maps to the app conversation route', () {
      expect(
        appRouteForNotification('/dashboard/messages/3f1c2a9e-8b7d-4c6e-9f00-1a2b3c4d5e6f'),
        '/messages/3f1c2a9e-8b7d-4c6e-9f00-1a2b3c4d5e6f',
      );
    });

    test('unknown or malformed routes are ignored', () {
      expect(appRouteForNotification(null), isNull);
      expect(appRouteForNotification('/dashboard/vehicles/abc'), isNull);
      expect(appRouteForNotification('/admin/messages/3f1c2a9e-8b7d-4c6e'), isNull);
      // No path smuggling through the id segment.
      expect(appRouteForNotification('/dashboard/messages/../../settings'), isNull);
      expect(appRouteForNotification('/dashboard/messages/abc/def'), isNull);
    });
  });

  group('409 conflict', () {
    test('shows the human reason from the server', () {
      final e = Api.fromStatus(409, "This conversation has an open report and can't be deleted until it's reviewed.");
      expect(e.kind, ApiErrorKind.conflict);
      expect(e.message, contains('open report'));
    });

    test('falls back to a friendly hint without a server message', () {
      final e = Api.fromStatus(409, null);
      expect(e.kind, ApiErrorKind.conflict);
      expect(e.message, 'Something changed in the meantime. Refresh and try again.');
    });
  });
}
