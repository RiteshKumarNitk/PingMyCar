import 'dart:io' show Platform;
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
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

  /// The signed-in owner's id, or null. Tokens are only registered for a
  /// signed-in owner; the backend derives the owner from the session.
  String? get signedInUserId;
}

/// What this device will actually do with an OwnerPing alert.
enum NotificationStatus {
  /// No Firebase in this build/platform — push can't work here.
  unavailable,

  /// App notifications allowed and the message channel isn't muted.
  enabled,

  /// Not allowed (Android 13+ permission not granted, or switched off for
  /// the app in system settings).
  disabled,

  /// The app is allowed, but the owner muted the "OwnerPing messages"
  /// channel in system settings.
  channelOff,
}

/// Debug-only FCM trace. Never logs full tokens, keys or message content.
void fcmLog(String message) {
  if (kDebugMode) debugPrint('[FCM] $message');
}

String _short(String token) => token.length <= 12 ? '…' : '${token.substring(0, 6)}…${token.substring(token.length - 4)}';

/// FCM lifecycle for the owner app.
///
/// The backend is the notification authority: it sends; this app receives.
/// This device's token is registered with the backend whenever an owner is
/// signed in (sign-in, app start, resume, permission grant, token refresh),
/// so the backend always knows where to deliver. The owner is derived from
/// the session server-side — the app never sends an owner id.
///
/// Every entry point is a safe no-op when Firebase is unavailable (web
/// build, or missing google-services.json) — login/vehicles/messages keep
/// working without push.
class FcmService {
  FcmService(this._deps, {required bool firebaseAvailable}) : _firebaseAvailable = firebaseAvailable;

  final FcmDeps _deps;
  final bool _firebaseAvailable;
  final _local = FlutterLocalNotificationsPlugin();
  static const _settingsChannel = MethodChannel('app.ownerping/notification_settings');
  bool _bound = false;

  /// Last successful registration, to avoid re-posting the same token for
  /// the same owner on every resume.
  String? _registeredToken;
  String? _registeredUser;
  DateTime? _registeredAt;
  Future<bool>? _inFlight;

  /// The one message channel. High importance so alerts pop up with sound
  /// and vibration. Its id is shared with the backend (android.notification
  /// .channelId) and the manifest's default_notification_channel_id.
  static const channelId = 'ownerping_messages';
  static const _channel = AndroidNotificationChannel(
    channelId,
    'OwnerPing messages',
    description: 'Alerts when someone contacts you through your OwnerPing QR.',
    importance: Importance.high,
    playSound: true,
    enableVibration: true,
  );

  /// The pre-OwnerPing channel. It was created with default importance, and
  /// Android never lets an app raise an existing channel's importance — so
  /// it is retired once (deleted) in favour of [channelId] rather than
  /// leaving two message channels on the device.
  static const _legacyChannelId = 'pingmycar_messages';

  AndroidFlutterLocalNotificationsPlugin? get _android =>
      _local.resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>();

  /// Boots local notifications (foreground banners) and the channel. Taps on
  /// foreground banners route like FCM taps — including the one that
  /// launched the app from a terminated state.
  Future<void> ensureInitialized() async {
    if (!_firebaseAvailable) return;
    fcmLog('Firebase initialized');
    await _local.initialize(
      const InitializationSettings(
        android: AndroidInitializationSettings('@drawable/ic_stat_ownerping'),
        iOS: DarwinInitializationSettings(
          requestAlertPermission: false,
          requestBadgePermission: false,
          requestSoundPermission: false,
        ),
      ),
      onDidReceiveNotificationResponse: (response) {
        fcmLog('Notification tapped (foreground banner)');
        _deps.deepLinkSignal.emitRoute(response.payload);
      },
    );
    final android = _android;
    if (android != null) {
      await android.createNotificationChannel(_channel); // idempotent
      await android.deleteNotificationChannel(_legacyChannelId); // no-op once gone
    }
    final launch = await _local.getNotificationAppLaunchDetails();
    if (launch?.didNotificationLaunchApp == true) {
      fcmLog('Notification tapped (launched app)');
      _deps.deepLinkSignal.emitRoute(launch!.notificationResponse?.payload);
    }
  }

  /// The real state, read fresh from the OS every time (the owner may have
  /// changed it in system settings since the last check).
  Future<NotificationStatus> status() async {
    if (!_firebaseAvailable) return NotificationStatus.unavailable;
    final android = _android;
    if (android != null) {
      // Covers the Android 13+ POST_NOTIFICATIONS permission and the
      // app-level switch in system settings.
      if (await android.areNotificationsEnabled() != true) return NotificationStatus.disabled;
      final channels = await android.getNotificationChannels() ?? const [];
      final ours = channels.where((c) => c.id == channelId).firstOrNull;
      if (ours != null && ours.importance == Importance.none) return NotificationStatus.channelOff;
      return NotificationStatus.enabled;
    }
    final settings = await FirebaseMessaging.instance.getNotificationSettings();
    return settings.authorizationStatus == AuthorizationStatus.authorized ||
            settings.authorizationStatus == AuthorizationStatus.provisional
        ? NotificationStatus.enabled
        : NotificationStatus.disabled;
  }

  /// Asks the OS (Android 13+ / iOS). When the permission was already
  /// denied for good, the OS returns without a dialog — callers then send
  /// the owner to system settings. Returns the resulting real status.
  Future<NotificationStatus> requestPermission() async {
    if (!_firebaseAvailable) return NotificationStatus.unavailable;
    final settings = await FirebaseMessaging.instance.requestPermission(alert: true, badge: true, sound: true);
    fcmLog('Permission: ${settings.authorizationStatus.name}');
    return status();
  }

  /// Settings → Apps → OwnerPing → Notifications (or the message channel's
  /// page when [channel] is true). Returns false if nothing could be opened.
  Future<bool> openSystemSettings({bool channel = false}) async {
    if (kIsWeb || !Platform.isAndroid) return false;
    try {
      return await _settingsChannel.invokeMethod<bool>('open', {if (channel) 'channelId': channelId}) ?? false;
    } on PlatformException {
      return false;
    }
  }

  /// Registers this device's current token for the signed-in owner. Cheap to
  /// call often: the same token for the same owner is re-sent at most every
  /// few hours. Throws on API failure when [throwOnError].
  Future<bool> syncToken({bool force = false, bool throwOnError = false}) async {
    final running = _inFlight;
    if (running != null && !force) return running;
    final future = _sync(force: force, throwOnError: throwOnError);
    _inFlight = future;
    try {
      return await future;
    } finally {
      if (identical(_inFlight, future)) _inFlight = null;
    }
  }

  Future<bool> _sync({required bool force, required bool throwOnError}) async {
    if (!_firebaseAvailable) return false;
    final user = _deps.signedInUserId;
    if (user == null) return false;
    String? token;
    try {
      token = await FirebaseMessaging.instance.getToken();
    } catch (e) {
      fcmLog('Token unavailable: $e');
      if (throwOnError) rethrow;
      return false;
    }
    if (token == null) {
      fcmLog('Token unavailable');
      return false;
    }
    fcmLog('Token obtained: ${_short(token)}');
    final fresh = _registeredAt != null && DateTime.now().difference(_registeredAt!) < const Duration(hours: 6);
    if (!force && token == _registeredToken && user == _registeredUser && fresh) return true;
    try {
      await _upload(token);
    } catch (e) {
      fcmLog('Token registration failed: $e');
      if (throwOnError) rethrow;
      return false;
    }
    _registeredToken = token;
    _registeredUser = user;
    _registeredAt = DateTime.now();
    fcmLog('Token registered');
    return true;
  }

  /// Forget the last registration (sign-out), so the next owner re-registers.
  void resetRegistration() {
    _registeredToken = null;
    _registeredUser = null;
    _registeredAt = null;
  }

  Future<void> _upload(String token) async {
    final platform = Platform.isIOS ? 'IOS' : 'ANDROID';
    final deviceId = await _deps.tokenStore.readOrCreateDeviceId();
    await _deps.deviceRepository.registerFcmToken(token: token, platform: platform, deviceId: deviceId);
  }

  /// Wires token refresh + foreground/tap streams.
  void bind() {
    if (_bound || !_firebaseAvailable) return;
    _bound = true;

    // Token rotation: every new token is registered so pushes keep flowing.
    FirebaseMessaging.instance.onTokenRefresh.listen((token) {
      fcmLog('Token refreshed: ${_short(token)}');
      syncToken(force: true);
    });

    // Foreground: FCM doesn't display anything itself — show a local banner
    // on the same channel and refresh unread counts in place.
    FirebaseMessaging.onMessage.listen((message) {
      fcmLog('Message received (foreground)');
      _showForegroundBanner(message);
      _deps.unreadSignal.bump();
    });

    // Tapped while backgrounded (app alive).
    FirebaseMessaging.onMessageOpenedApp.listen((message) {
      fcmLog('Notification tapped (background)');
      _deps.deepLinkSignal.emitRoute(message.routeFromData);
    });

    // Tapped while terminated. The router holds the route until the session
    // is restored, then opens the conversation (never for a signed-out user).
    FirebaseMessaging.instance.getInitialMessage().then((message) {
      if (message == null) return;
      fcmLog('Notification tapped (terminated)');
      _deps.deepLinkSignal.emitRoute(message.routeFromData);
    });
  }

  Future<void> _showForegroundBanner(RemoteMessage message) async {
    final notification = message.notification;
    if (notification == null) return;
    await _local.show(
      DateTime.now().millisecondsSinceEpoch % 0x7fffffff,
      notification.title ?? 'New OwnerPing message',
      // Generic body: the visitor's words stay inside the app, behind the
      // authenticated conversation screen — not on the banner.
      'Tap to open the private conversation.',
      NotificationDetails(
        android: AndroidNotificationDetails(
          _channel.id,
          _channel.name,
          channelDescription: _channel.description,
          importance: Importance.high,
          priority: Priority.high,
          icon: '@drawable/ic_stat_ownerping',
          color: const Color(0xFF1E40AF),
        ),
        iOS: const DarwinNotificationDetails(),
      ),
      payload: message.routeFromData,
    );
    fcmLog('Notification displayed (foreground)');
  }
}

extension RemoteMessageRoute on RemoteMessage {
  /// App route for this push: the conversation id from `data.conversationId`,
  /// or the web-shaped `data.route` (`/dashboard/messages/<id>`). Nothing
  /// here is trusted: the backend re-verifies ownership on fetch.
  String? get routeFromData =>
      appRouteForConversationId(data['conversationId'] as String?) ?? appRouteForNotification(data['route'] as String?);
}

final _idPattern = RegExp(r'^[0-9a-fA-F-]{8,64}$');

/// Maps a backend notification route to an app route (or null if unknown).
String? appRouteForNotification(String? route) {
  const prefix = '/dashboard/messages/';
  if (route == null || !route.startsWith(prefix)) return null;
  return appRouteForConversationId(route.substring(prefix.length));
}

/// `/messages/<id>` for a well-formed conversation id (UUID-like), else null
/// — anything that could smuggle a path is rejected.
String? appRouteForConversationId(String? id) {
  if (id == null || !_idPattern.hasMatch(id)) return null;
  return '/messages/$id';
}

/// Must be a top-level function so background isolates can resume handling.
@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
  // The OS renders the notification from its `notification` payload on the
  // OwnerPing channel; unread counts refresh when the owner opens the app.
  fcmLog('Message received (background)');
}
