import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/token_store.dart';
import '../../repositories/repositories.dart';
import '../../providers.dart';
import 'fcm_service.dart';

export '../../signals.dart' show UnreadCountSignal, DeepLinkSignal;
export 'fcm_service.dart' show firebaseMessagingBackgroundHandler, FcmService, NotificationStatus;

/// Adapts the Riverpod container to [FcmDeps].
class ContainerFcmDeps implements FcmDeps {
  ContainerFcmDeps(this._container);

  final ProviderContainer _container;

  @override
  DeviceRepository get deviceRepository => _container.read(deviceRepositoryProvider);

  @override
  TokenStore get tokenStore => _container.read(tokenStoreProvider);

  @override
  UnreadCountSignal get unreadSignal => _container.read(unreadCountSignalProvider);

  @override
  DeepLinkSignal get deepLinkSignal => _container.read(deepLinkSignalProvider);

  @override
  String? get signedInUserId {
    final auth = _container.read(authControllerProvider);
    return auth.status == AuthStatus.authenticated ? auth.user?.id : null;
  }
}

final fcmInstanceProvider = StateProvider<FcmService?>((ref) => null);

/// Called once from main() after the container exists. [firebaseAvailable]
/// comes from bootstrapFirebase() — false on web or when native Firebase
/// config is missing, which makes every FCM call a safe no-op.
Future<void> bootstrapFcm(ProviderContainer container, {required bool firebaseAvailable}) async {
  if (!firebaseAvailable) {
    debugPrint('[fcm] disabled (no Firebase on this platform)');
  }
  if (firebaseAvailable && !kIsWeb) {
    // Background-isolate handler (must be registered before any pushes).
    FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);
  }

  final fcm = FcmService(ContainerFcmDeps(container), firebaseAvailable: firebaseAvailable);
  await fcm.ensureInitialized();
  fcm.bind();
  container.read(fcmInstanceProvider.notifier).state = fcm;
  if (!firebaseAvailable) return;

  // Keep the backend's Device row current, in the background (never blocks
  // the UI): whenever an owner is signed in (sign-in or restored session),
  // and on every return to the foreground (e.g. back from system settings).
  container.listen<AuthState>(authControllerProvider, (prev, next) {
    if (next.status == AuthStatus.authenticated && prev?.user?.id != next.user?.id) {
      fcm.syncToken();
    } else if (next.status == AuthStatus.unauthenticated) {
      fcm.resetRegistration();
    }
  });
  if (container.read(authControllerProvider).status == AuthStatus.authenticated) {
    fcm.syncToken();
  }
  AppLifecycleListener(onResume: () => fcm.syncToken());
}
