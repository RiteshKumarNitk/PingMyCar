import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../providers.dart';
import 'screens/home_shell.dart';
import 'screens/home_screen.dart';
import 'screens/messages_screen.dart';
import 'screens/message_detail_screen.dart';
import 'screens/vehicles_screen.dart';
import 'screens/vehicle_detail_screen.dart';
import 'screens/vehicle_form_screen.dart';
import 'screens/vehicle_qr_screen.dart';
import 'screens/stickers_screen.dart';
import 'screens/sticker_preview_screen.dart';
import 'screens/profile_screen.dart';
import 'screens/settings/settings_screen.dart';
import 'screens/settings/notifications_screen.dart';
import 'screens/settings/privacy_screen.dart';
import 'screens/login_screen.dart';
import 'screens/splash_screen.dart';
import 'screens/welcome_screen.dart';

final _rootNavigatorKey = GlobalKey<NavigatorState>();
final _shellNavigatorKey = GlobalKey<NavigatorState>();

/// Bridges auth-state changes into a Listenable for GoRouter's
/// refreshListenable — the router object itself is created once and never
/// rebuilt, so navigation state survives auth transitions.
class _AuthListenable extends ChangeNotifier {
  _AuthListenable(Ref ref) {
    ref.listen(authControllerProvider, (_, __) => notifyListeners());
    ref.onDispose(notifyListeners);
  }
}

/// Forwards notification-tap routes into the router. The route is only a
/// hint — the target screen fetches from the backend, which enforces
/// ownership; a deep link never bypasses authentication or authorization.
class _DeepLinkBinding {
  _DeepLinkBinding(this._ref, this._router) {
    _ref.read(deepLinkSignalProvider).addListener(_onRoute);
    _ref.onDispose(_dispose);
  }

  final Ref _ref;
  final GoRouter _router;
  bool _disposed = false;

  void _onRoute(String? route) {
    if (_disposed || route == null) return;
    final auth = _ref.read(authControllerProvider);
    if (auth.status != AuthStatus.authenticated) return;
    _router.push(route);
  }

  void _dispose() {
    _disposed = true;
    _ref.read(deepLinkSignalProvider).removeListener(_onRoute);
  }
}

final routerProvider = Provider<GoRouter>((ref) {
  final router = GoRouter(
    navigatorKey: _rootNavigatorKey,
    initialLocation: '/splash',
    refreshListenable: _AuthListenable(ref),
    redirect: (context, state) {
      final status = ref.read(authControllerProvider).status;
      final location = state.matchedLocation;

      if (location == '/splash' || location == '/welcome' || location == '/login') {
        if (status == AuthStatus.authenticated) return '/home';
        if (status == AuthStatus.unknown) return null;
        return null;
      }

      if (status == AuthStatus.unknown) return '/splash';
      if (status == AuthStatus.unauthenticated) return '/welcome';
      if (status == AuthStatus.authenticated && location == '/login') return '/home';
      return null;
    },
    routes: [
      GoRoute(path: '/splash', builder: (context, state) => const SplashScreen()),
      GoRoute(path: '/welcome', builder: (context, state) => const WelcomeScreen()),
      GoRoute(path: '/login', builder: (context, state) => const LoginScreen()),
      ShellRoute(
        navigatorKey: _shellNavigatorKey,
        builder: (context, state, child) => HomeShell(child: child),
        routes: [
          GoRoute(path: '/home', builder: (context, state) => const HomeScreen()),
          GoRoute(path: '/messages', builder: (context, state) => const MessagesScreen()),
          GoRoute(path: '/vehicles', builder: (context, state) => const VehiclesScreen()),
          GoRoute(path: '/profile', builder: (context, state) => const ProfileScreen()),
        ],
      ),
      GoRoute(
        path: '/vehicles/new',
        builder: (context, state) => const VehicleFormScreen(),
      ),
      GoRoute(
        path: '/vehicles/:id',
        builder: (context, state) => VehicleDetailScreen(vehicleId: state.pathParameters['id']!),
        routes: [
          GoRoute(
            path: 'edit',
            builder: (context, state) => VehicleFormScreen(vehicleId: state.pathParameters['id']),
          ),
          GoRoute(
            path: 'qr',
            builder: (context, state) => VehicleQrScreen(vehicleId: state.pathParameters['id']!),
          ),
        ],
      ),
      GoRoute(
        path: '/messages/:id',
        builder: (context, state) => MessageDetailScreen(conversationId: state.pathParameters['id']!),
      ),
      GoRoute(path: '/stickers', builder: (context, state) => const StickersScreen()),
      GoRoute(
        path: '/stickers/:vehicleId',
        builder: (context, state) => StickerPreviewScreen(vehicleId: state.pathParameters['vehicleId']!),
      ),
      GoRoute(path: '/settings', builder: (context, state) => const SettingsScreen()),
      GoRoute(path: '/settings/notifications', builder: (context, state) => const NotificationsScreen()),
      GoRoute(path: '/settings/privacy', builder: (context, state) => const PrivacyScreen()),
    ],
  );

  _DeepLinkBinding(ref, router);

  return router;
});
