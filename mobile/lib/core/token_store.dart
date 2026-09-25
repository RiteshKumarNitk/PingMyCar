import 'token_store_stub.dart'
    if (dart.library.js_interop) 'token_store_web.dart'
    if (dart.library.io) 'token_store_io.dart';

/// Platform facade. Backends:
///  - Android/iOS (token_store_io.dart): FlutterSecureStorage (keystore /
///    keychain). This is where the production session token lives.
///  - Web (token_store_web.dart): localStorage — dev/preview only.
///
/// The token stored here is the Better Auth session token the mobile app
/// receives in the `set-auth-token` response header at sign-in and echoes
/// back as `Authorization: Bearer <token>`.
abstract class TokenStore {
  factory TokenStore() => createTokenStore();

  Future<void> saveSessionToken(String token);
  Future<String?> readSessionToken();
  Future<void> clearSessionToken();

  /// Stable per-install device id, used to replace this device's own FCM
  /// token row on refresh without touching the owner's other devices.
  Future<String> readOrCreateDeviceId();
}
