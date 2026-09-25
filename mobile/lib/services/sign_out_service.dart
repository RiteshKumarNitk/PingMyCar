import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers.dart';
import 'fcm/fcm_token_provider.dart';

/// Sign-out orchestration. Careful property: unregistering notifications
/// removes ONLY this device's token — the owner's other devices keep
/// receiving notifications.
class SignOutService {
  SignOutService(this._ref);

  final Ref _ref;

  Future<void> performSignOut() async {
    // 1. Unregister this device's FCM token (best-effort).
    try {
      final token = await _ref.read(fcmTokenProvider.future);
      if (token != null && token.isNotEmpty) {
        await _ref.read(deviceRepositoryProvider).unregisterFcmToken(token);
      }
    } catch (_) {
      // Sign-out must never be blocked by notification cleanup.
    }

    // 2. Clear the backend session + local token.
    await _ref.read(authRepositoryProvider).signOut();

    // 3. Disconnect Google (revokes the app-level grant; the Google account
    // itself is untouched).
    await _ref.read(googleSignInServiceProvider).disconnect();
  }
}
