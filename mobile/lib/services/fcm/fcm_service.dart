import 'dart:io' show Platform;
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import '../../core/api_error.dart';
import '../../core/token_store.dart';
import '../../repositories/repositories.dart';
import '../../signals.dart';

/// Minimal provider surface FcmService needs — satisfied by both
/// ProviderContainer and WidgetRef, keeping it decoupled from Riverpod.
abstract class FcmDeps {
  DeviceRepository get deviceRepository;
  TokenStore get tokenStore;
  UnreadCountSignal get unreadSignal;
  DeepLinkSignal get deepLinkSignal;
}

/// FCM lifecycle for the owner app.
///
/// The backend is the notification authority: it sends; this app receives.
/// The token is registered server-side at login/permission grant and on
/// every refresh; the same physical device replaces its own row.
///
/// Every entry point is a safe no-op when Firebase is unavailable (web
/// build, or missing google-services.json) — login/vehicles/messages keep
/// working without push.
class FcmService {
  FcmService(this._deps, {required bool firebaseAvailable})
      : _firebaseAvailable = firebaseAvailable;

  final FcmDeps _deps;
  final bool _firebaseAvailable;
  final _flutterLocalNotifications = FlutterLocalNotificationsPlugin();
  bool _bound = false;

  static const _channel = AndroidNotificationChannel(
    'pingmycar_messages',
    'Visitor messages',
    description: 'Notifications when someone contacts your vehicle.',
    importance: Importance.defaultImportance,
  );

  /// Boot local notifications for foreground display.
  Future<void> ensureInitialized() async {
    if (!_firebaseAvailable) return;
    await _flutterLocalNotifications
        .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(_channel);
  }

  /// Native OS permission — must only be called after the in-app primer.
  Future<bool> requestPermission() async {
    if (!_firebaseAvailable) return false;
    final settings = await FirebaseMessaging.instance.requestPermission(
      alert: true,
      badge: true,
      sound: true,
    );
    return settings.authorizationStatus == AuthorizationStatus.authorized ||
        settings.authorizationStatus == AuthorizationStatus.provisional;
  }

  Future<bool> hasPermission() async {
    if (!_firebaseAvailable) return false;
    final settings = await FirebaseMessaging.instance.getNotificationSettings();
    return settings.authorizationStatus == AuthorizationStatus.authorized ||
        settings.authorizationStatus == AuthorizationStatus.provisional;
  }

  /// Registers (or re-registers) the current FCM token with the backend.
  Future<void> registerCurrentToken() async {
    if (!_firebaseAvailable) return;
    final token = await FirebaseMessaging.instance.getToken();
    if (token == null) return;
    await _upload(token);
  }

  Future<void> _upload(String token) async {
    final platform = Platform.isIOS ? 'IOS' : 'ANDROID';
    final deviceId = await _deps.tokenStore.readOrCreateDeviceId();
    try {
      await _deps.deviceRepository.registerFcmToken(
        token: token,
        platform: platform,
        deviceId: deviceId,
      );
    } on ApiException {
      // Not signed in yet, or offline — onTokenRefresh retries later.
      rethrow;
    }
  }

  /// Wires token refresh + foreground/tap streams.
  void bind() {
    if (_bound || !_firebaseAvailable) return;
    _bound = true;

    // Token rotation: FCM tokens change (app restore, security events);
    // every new token is pushed so notifications keep flowing.
    FirebaseMessaging.instance.onTokenRefresh.listen(
      (token) => _upload(token).catchError((_) {}),
    );

    // Foreground: show an in-app style banner via local notifications and
    // tell the UI to refresh unread counts (no full app reload).
    FirebaseMessaging.onMessage.listen((message) {
      _showForegroundBanner(message);
      _deps.unreadSignal.bump();
    });

    // Tapped while backgrounded (app alive).
    FirebaseMessaging.onMessageOpenedApp.listen((message) {
      _deps.deepLinkSignal.emitRoute(message.routeFromData);
    });

    // Tapped while terminated: delivered once the app is running.
    FirebaseMessaging.instance.getInitialMessage().then((message) {
      if (message != null) {
        Future.delayed(const Duration(milliseconds: 800), () {
          _deps.deepLinkSignal.emitRoute(message.routeFromData);
        });
      }
    });
  }

  Future<void> _showForegroundBanner(RemoteMessage message) async {
    final notification = message.notification;
    if (notification == null) return;
    await _flutterLocalNotifications.show(
      DateTime.now().millisecondsSinceEpoch % 0x7fffffff,
      notification.title ?? 'PingMyCar',
      notification.body ?? 'New message about your vehicle.',
      const NotificationDetails(
        android: AndroidNotificationDetails(
          'pingmycar_messages',
          'Visitor messages',
          channelDescription: 'Notifications when someone contacts your vehicle.',
          importance: Importance.defaultImportance,
          priority: Priority.defaultPriority,
        ),
        iOS: DarwinNotificationDetails(),
      ),
      payload: message.routeFromData,
    );
  }
}

extension RemoteMessageRoute on RemoteMessage {
  /// The backend sends `data.route` like `/dashboard/messages/<id>` — the
  /// same route shape the web app uses. Nothing here is trusted: the route
  /// is only a hint, and the backend re-verifies ownership when the message
  /// is fetched.
  String? get routeFromData {
    final route = data['route'] as String?;
    if (route == null || !route.startsWith('/dashboard/messages/')) return null;
    return route;
  }
}

/// Must be a top-level function so background isolates can resume handling.
@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
  // The OS already renders the notification from its `notification` payload;
  // unread counts refresh when the user opens the app.
  debugPrint('[fcm] background message: ${message.messageId}');
}
