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
    final account = await _gsi.signIn();
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
