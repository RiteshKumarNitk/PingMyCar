import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/api_error.dart';
import '../../providers.dart';
import '../components/components.dart';

/// Unread count shown on the Messages tab. Always read from the backend
/// (dashboard summary) — never computed or cached as a second source of truth.
final unreadBadgeProvider = StateProvider<int>((ref) => 0);

/// Bottom-navigation shell — four destinations (Home, Messages, Vehicles,
/// Profile). QR and sticker actions live on the vehicle screens.
class HomeShell extends ConsumerStatefulWidget {
  const HomeShell({super.key, required this.child});

  final Widget child;

  @override
  ConsumerState<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends ConsumerState<HomeShell> {
  String? _lastPath;
  late final UnreadCountSignal _signal;

  @override
  void initState() {
    super.initState();
    // Keep the signal itself: ref must not be touched in dispose().
    _signal = ref.read(unreadCountSignalProvider)..addListener(_refreshUnread);
    _refreshUnread();
  }

  @override
  void dispose() {
    _signal.removeListener(_refreshUnread);
    super.dispose();
  }

  Future<void> _refreshUnread() async {
    try {
      final summary = await ref.read(dashboardRepositoryProvider).summary();
      if (mounted) ref.read(unreadBadgeProvider.notifier).state = summary.unreadMessageCount;
    } on ApiException {
      // Badge is best-effort; screens show their own errors.
    }
  }

  @override
  Widget build(BuildContext context) {
    final location = GoRouterState.of(context).uri.path;
    if (_lastPath != null && _lastPath != location) {
      // Tab switch (or returning from a thread): refresh the badge.
      WidgetsBinding.instance.addPostFrameCallback((_) => _refreshUnread());
    }
    _lastPath = location;

    final destinations = PrimaryBottomNavigation.destinations;
    final index = destinations.indexWhere((d) => location.startsWith(d.path));
    return Scaffold(
      body: widget.child,
      bottomNavigationBar: PrimaryBottomNavigation(
        selectedIndex: index < 0 ? 0 : index,
        unreadCount: ref.watch(unreadBadgeProvider),
        onSelected: (i) => context.go(destinations[i].path),
      ),
    );
  }
}
