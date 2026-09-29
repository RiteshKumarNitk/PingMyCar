import 'dart:async';

import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers.dart';
import 'fcm/fcm_token_provider.dart';

/// Account deletion orchestration.
///
/// 1. The server deletes the account (and every device token registered to
///    it) and the local session token is cleared. If this fails, nothing
///    else happens — the owner stays signed in and can retry.
/// 2. Then this device is cleaned up in the background, best-effort and
///    time-boxed, so it can never delay leaving the authenticated app: this
///    device's FCM token (so it can't be notified under the old
///    registration) and the Google grant.
class AccountDeletionService {
  AccountDeletionService(this._ref);

  final Ref _ref;

  Future<void> deleteAccount() async {
    await _ref.read(authRepositoryProvider).deleteAccount();
    _ref.invalidate(fcmTokenProvider);
    final google = _ref.read(googleSignInServiceProvider);
    unawaited(_bestEffort(() => FirebaseMessaging.instance.deleteToken()));
    unawaited(_bestEffort(google.disconnect));
  }

  static Future<void> _bestEffort(Future<void> Function() task) async {
    try {
      await task().timeout(const Duration(seconds: 10));
    } catch (_) {
      // Unavailable plugin, offline, or already done — the account is
      // deleted server-side either way.
    }
  }
}
