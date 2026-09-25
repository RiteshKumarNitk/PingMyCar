import 'package:flutter/foundation.dart';
import 'package:firebase_core/firebase_core.dart';

/// Initializes Firebase as early as possible.
///
/// Returns true when Firebase is usable. This is intentionally forgiving:
///  - Web: FCM/push is an Android/iOS feature; the owner app on web skips
///    Firebase entirely (web builds need FirebaseOptions, which we don't
///    ship — that was the "FirebaseOptions cannot be null" crash).
///  - Android/iOS: config comes from google-services.json /
///    GoogleService-Info.plist. Missing files mean push is unavailable but
///    the rest of the app (login, vehicles, messages) must still work.
Future<bool> bootstrapFirebase() async {
  if (kIsWeb) {
    debugPrint('[firebase] skipped on web (push is mobile-only)');
    return false;
  }
  try {
    await Firebase.initializeApp();
    return true;
  } catch (e) {
    debugPrint('[firebase] init failed — notifications disabled: $e');
    return false;
  }
}
