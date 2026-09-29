import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:pingmycar_mobile/services/google_sign_in_service.dart';

void main() {
  test('unregistered signing certificate (ApiException: 10) is explained', () {
    final msg = googleSignInErrorMessage(PlatformException(code: 'sign_in_failed', message: 'com.google.android.gms.common.api.ApiException: 10: '));
    expect(msg, contains('code 10'));
  });

  test('network and cancel map to friendly text', () {
    expect(googleSignInErrorMessage(PlatformException(code: 'network_error')), contains('offline'));
    expect(googleSignInErrorMessage(PlatformException(code: 'sign_in_canceled')), contains('cancelled'));
  });
}
