import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'core/api_client.dart';
import 'core/api_error.dart';
import 'core/token_store.dart';
import 'models/models.dart';
import 'repositories/repositories.dart';
import 'services/google_sign_in_service.dart';
import 'services/account_deletion_service.dart';
import 'services/sign_out_service.dart';

export 'signals.dart';

final tokenStoreProvider = Provider<TokenStore>((ref) => TokenStore());
final apiClientProvider = Provider<ApiClient>((ref) => ApiClient(tokenStore: ref.watch(tokenStoreProvider)));

final authRepositoryProvider = Provider<AuthRepository>(
  (ref) => AuthRepository(ref.watch(apiClientProvider), ref.watch(tokenStoreProvider)),
);
final dashboardRepositoryProvider = Provider<DashboardRepository>(
  (ref) => DashboardRepository(ref.watch(apiClientProvider)),
);
final vehicleRepositoryProvider = Provider<VehicleRepository>(
  (ref) => VehicleRepository(ref.watch(apiClientProvider)),
);
final conversationRepositoryProvider = Provider<ConversationRepository>(
  (ref) => ConversationRepository(ref.watch(apiClientProvider)),
);
final deviceRepositoryProvider = Provider<DeviceRepository>(
  (ref) => DeviceRepository(ref.watch(apiClientProvider)),
);

final googleSignInServiceProvider = Provider<GoogleSignInService>(
  (ref) => GoogleSignInService(ref),
);

final signOutServiceProvider = Provider<SignOutService>((ref) => SignOutService(ref));

final accountDeletionServiceProvider = Provider<AccountDeletionService>((ref) => AccountDeletionService(ref));

/// Auth state machine: unknown (booting) → unauthenticated → authenticated.
class AuthState {
  const AuthState({this.status = AuthStatus.unknown, this.user});

  final AuthStatus status;
  final UserProfile? user;

  AuthState copyWith({AuthStatus? status, UserProfile? user}) =>
      AuthState(status: status ?? this.status, user: user ?? this.user);

  /// Guest/reviewer demo session — never an owner.
  bool get isGuest => status == AuthStatus.guest;

  /// May see the in-app screens (a real owner, or a guest on demo data).
  bool get canEnterApp => status == AuthStatus.authenticated || status == AuthStatus.guest;
}

/// `guest` is a limited demo session issued by the server: it can browse
/// demo data only (see ApiClient) and is never treated as `authenticated` —
/// no FCM registration, no notifications, no owner data.
enum AuthStatus { unknown, unauthenticated, authenticated, guest }

class AuthController extends Notifier<AuthState> {
  @override
  AuthState build() => const AuthState();

  /// Called at app start: restore session from the stored token.
  Future<void> restoreSession() async {
    final repo = ref.read(authRepositoryProvider);
    try {
      if (await repo.hasGuestToken()) {
        state = AuthState(status: AuthStatus.guest, user: await repo.restoreGuest());
        return;
      }
      final user = await repo.me();
      state = AuthState(status: AuthStatus.authenticated, user: user);
    } on ApiException {
      state = const AuthState(status: AuthStatus.unauthenticated);
    }
  }

  /// "Continue as Guest": the server issues a short-lived demo session.
  Future<void> continueAsGuest() async {
    final user = await ref.read(authRepositoryProvider).startGuestSession();
    state = AuthState(status: AuthStatus.guest, user: user);
  }

  Future<void> signInWithGoogle() async {
    final user = await ref.read(googleSignInServiceProvider).completeSignIn();
    state = AuthState(status: AuthStatus.authenticated, user: user);
  }

  Future<void> signOut() async {
    if (state.isGuest) {
      // Guests have no device registration or Google grant to clean up.
      await ref.read(authRepositoryProvider).endGuestSession();
    } else {
      await ref.read(signOutServiceProvider).performSignOut();
    }
    state = const AuthState(status: AuthStatus.unauthenticated);
  }

  /// Deletes the account server-side, then signs this device out. If the
  /// server call fails nothing changes locally (the error propagates).
  Future<void> deleteAccount() async {
    if (state.isGuest) throw const ApiException(ApiErrorKind.forbidden, guestModeMessage);
    await ref.read(accountDeletionServiceProvider).deleteAccount();
    state = const AuthState(status: AuthStatus.unauthenticated);
  }

  /// Fired by the API client when any 401 arrives.
  void forceSignOut() {
    state = const AuthState(status: AuthStatus.unauthenticated);
  }
}

final authControllerProvider =
    NotifierProvider<AuthController, AuthState>(AuthController.new);
