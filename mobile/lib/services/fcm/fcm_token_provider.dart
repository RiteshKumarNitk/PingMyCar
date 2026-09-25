import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Current FCM token, or null if unavailable. Used by sign-out to
/// unregister THIS device's token server-side.
final fcmTokenProvider = FutureProvider<String?>((ref) async {
  return FirebaseMessaging.instance.getToken();
});
