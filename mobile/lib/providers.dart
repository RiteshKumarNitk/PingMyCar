import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'core/api_client.dart';
import 'core/api_error.dart';
import 'core/token_store.dart';
import 'models/models.dart';
import 'repositories/repositories.dart';
import 'services/google_sign_in_service.dart';
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

/// Auth state machine: unknown (booting) → unauthenticated → authenticated.
class AuthState {
  const AuthState({this.status = AuthStatus.unknown, this.user});

  final AuthStatus status;
  final UserProfile? user;

  AuthState copyWith({AuthStatus? status, UserProfile? user}) =>
      AuthState(status: status ?? this.status, user: user ?? this.user);
}

enum AuthStatus { unknown, unauthenticated, authenticated }

class AuthController extends Notifier<AuthState> {
  @override
  AuthState build() => const AuthState();

  /// Called at app start: restore session from the stored token.
  Future<void> restoreSession() async {
    try {
      final user = await ref.read(authRepositoryProvider).me();
      state = AuthState(status: AuthStatus.authenticated, user: user);
    } on ApiException {
      state = const AuthState(status: AuthStatus.unauthenticated);
    }
  }

  Future<void> signInWithGoogle() async {
    final user = await ref.read(googleSignInServiceProvider).completeSignIn();
    state = AuthState(status: AuthStatus.authenticated, user: user);
  }

  Future<void> signOut() async {
    await ref.read(signOutServiceProvider).performSignOut();
    state = const AuthState(status: AuthStatus.unauthenticated);
  }

  /// Fired by the API client when any 401 arrives.
  void forceSignOut() {
    state = const AuthState(status: AuthStatus.unauthenticated);
  }
}

final authControllerProvider =
    NotifierProvider<AuthController, AuthState>(AuthController.new);
