/// Environment configuration for the PingMyCar mobile app.
///
/// Nothing here may ever contain server secrets — only public, app-side
/// values. Real deployments inject these at build time (--dart-define)
/// rather than editing this file.
///
/// Examples:
///   flutter run --dart-define=PINGMYCAR_API_BASE_URL=https://pingmycar.app
///   flutter run --dart-define=PINGMYCAR_API_BASE_URL=http://10.0.2.2:3100
class AppConfig {
  /// Backend origin (no trailing slash). The Android emulator reaches the
  /// host machine as 10.0.2.2.
  static const apiBaseUrl = String.fromEnvironment(
    'PINGMYCAR_API_BASE_URL',
    defaultValue: 'http://10.0.2.2:3100',
  );

  /// Google OAuth client ID for the mobile app. Public value.
  ///
  /// You need TWO client IDs in Google Cloud Console (both for the same
  /// Firebase/Cloud project that owns the backend's web client):
  ///
  ///  1. **Web application** client (likely already exists — the backend
  ///     uses it). Its ID is the "Web SDK configuration" server client id.
  ///  2. **Android** client: package name
  ///     `app.pingmycar.pingmycar_mobile` + your debug/release SHA-1
  ///     (`cd mobile && gradlew signingReport`).
  ///  3. **iOS** client: bundle id `app.pingmycar.pingmycarMobile`, and its
  ///     REVERSED client id must be a URL scheme in ios/Runner/Info.plist.
  ///
  /// Pass the WEB client id here (it is what `serverClientId` must be for
  /// Android ID tokens, and what iOS uses directly):
  ///
  ///   flutter run --dart-define=PINGMYCAR_GOOGLE_CLIENT_ID=YOUR_WEB_CLIENT_ID.apps.googleusercontent.com
  static const googleClientId = String.fromEnvironment(
    'PINGMYCAR_GOOGLE_CLIENT_ID',
    defaultValue: '',
  );

  /// Deep-link scheme, e.g. `pingmycar://dashboard/messages/some-id`
  static const appScheme = String.fromEnvironment(
    'PINGMYCAR_APP_SCHEME',
    defaultValue: 'pingmycar',
  );

  /// True when Google sign-in can be attempted (client id configured).
  static bool get googleConfigured => googleClientId.isNotEmpty;

  static Uri apiUri(String path, [Map<String, String>? query]) =>
      Uri.parse('$apiBaseUrl$path').replace(queryParameters: query);
}
