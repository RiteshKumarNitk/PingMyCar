import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_sign_in/google_sign_in.dart';
import '../config.dart';
import '../models/models.dart';
import '../providers.dart';

/// The ONLY authentication path in the app: Continue with Google.
/// No OTP, no passwords, no magic links — matching the backend.
class GoogleSignInService {
  GoogleSignInService(this._ref);

  final Ref _ref;
  GoogleSignIn? _googleSignIn;

  GoogleSignIn get _gsi {
    _googleSignIn ??= GoogleSignIn(
      // The app's own iOS client id; Android uses serverClientId for
      // ID-token issuance. Both are public values.
      clientId: AppConfig.googleClientId.isEmpty ? null : AppConfig.googleClientId,
      serverClientId: AppConfig.googleClientId.isEmpty ? null : AppConfig.googleClientId,
    );
    return _googleSignIn!;
  }

  /// Runs the Google flow and exchanges the ID token for a backend session.
  Future<UserProfile> completeSignIn() async {
    if (!AppConfig.googleConfigured) {
      throw Exception(
        'Google sign-in is not configured. Run the app with:\n'
        '--dart-define=PINGMYCAR_GOOGLE_CLIENT_ID=<your-web-client-id>.apps.googleusercontent.com\n'
        'See mobile/lib/config.dart for setup steps.',
      );
    }
    final GoogleSignInAccount? account;
    try {
      account = await _gsi.signIn();
    } on PlatformException catch (e) {
      throw Exception(googleSignInErrorMessage(e));
    }
    if (account == null) {
      throw Exception('Google sign-in was cancelled.');
    }
    final auth = await account.authentication;
    final idToken = auth.idToken;
    if (idToken == null || idToken.isEmpty) {
      throw Exception(
        'Google did not return an ID token. On Android, PINGMYCAR_GOOGLE_CLIENT_ID must be the WEB client id '
        '(passed as serverClientId) and an ANDROID client id with your SHA-1 must exist in the same project. '
        'On iOS, add the REVERSED iOS client id as a URL scheme in Runner/Info.plist.',
      );
    }
    final repo = _ref.read(authRepositoryProvider);
    return repo.signInWithGoogleIdToken(idToken: idToken, accessToken: auth.accessToken);
  }

  Future<void> disconnect() async {
    try {
      await _gsi.disconnect();
    } catch (_) {
      // Already disconnected / no saved account — nothing to do.
    }
  }
}

/// Human explanation for Google Play services sign-in failures.
///
/// `ApiException: 10` (DEVELOPER_ERROR) means this build's signing
/// certificate (SHA-1) + package name isn't registered as an Android OAuth
/// client in the Google Cloud project of the web client id — e.g. a build
/// signed with a new upload key, or a Play-installed build (Play app-signing
/// key). Add that SHA-1 in Google Cloud Console → Credentials.
String googleSignInErrorMessage(PlatformException e) {
  final detail = '${e.code} ${e.message ?? ''}';
  if (detail.contains('ApiException: 10') || detail.contains('DEVELOPER_ERROR')) {
    return "Google sign-in isn't set up for this version of the app yet (code 10). "
        "The app's signing certificate must be registered with Google. Please try again later.";
  }
  if (e.code == 'network_error' || detail.contains('ApiException: 7')) {
    return "You're offline. Check your connection and try again.";
  }
  if (e.code == 'sign_in_canceled' || detail.contains('ApiException: 12501')) {
    return 'Google sign-in was cancelled.';
  }
  return 'Google sign-in failed (${e.code}). Please try again.';
}
