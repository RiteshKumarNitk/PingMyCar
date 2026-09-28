import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/api_error.dart';
import '../../models/models.dart';
import '../../providers.dart';
import '../components/components.dart';
import 'home_shell.dart' show unreadBadgeProvider;

/// Home dashboard. Every number comes from the backend (dashboard summary +
/// vehicles) — nothing is computed or faked locally.
class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  DashboardSummary? _summary;
  List<Vehicle>? _vehicles;
  Object? _error;
  late final UnreadCountSignal _signal;

  @override
  void initState() {
    super.initState();
    _load();
    // FCM foreground pushes bump this signal — refresh then.
    _signal = ref.read(unreadCountSignalProvider)..addListener(_refreshOnPush);
  }

  @override
  void dispose() {
    _signal.removeListener(_refreshOnPush);
    super.dispose();
  }

  void _refreshOnPush() {
    if (mounted) _load();
  }

  Future<void> _load() async {
    try {
      final results = await Future.wait([
        ref.read(dashboardRepositoryProvider).summary(),
        ref.read(vehicleRepositoryProvider).list(),
      ]);
      if (!mounted) return;
      final summary = results[0] as DashboardSummary;
      ref.read(unreadBadgeProvider.notifier).state = summary.unreadMessageCount;
      setState(() {
        _summary = summary;
        _vehicles = results[1] as List<Vehicle>;
        _error = null;
      });
    } on ApiException catch (e) {
      if (!mounted) return;
      if (_summary != null) {
        // Keep showing what we have; offer a retry instead of a blank screen.
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.message), action: SnackBarAction(label: 'Retry', onPressed: _load)),
        );
      }
      setState(() => _error = e);
    }
  }

  @override
  Widget build(BuildContext context) {
    final summary = _summary;
    return Scaffold(
      body: SafeArea(
        bottom: false,
        child: RefreshIndicator(
          onRefresh: _load,
          child: summary == null
              ? (_error != null
                  ? ScrollableCenter(child: ErrorState(error: _error!, onRetry: _load))
                  : const _HomeSkeleton())
              : _content(context, summary),
        ),
      ),
    );
  }

  Widget _content(BuildContext context, DashboardSummary s) {
    final c = AppColors.of(context);
    final vehicles = _vehicles ?? const <Vehicle>[];
    final hasVehicles = s.vehicleCount > 0;

    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.fromLTRB(Space.page, Space.md, Space.page, Space.xl),
      children: [
        _Header(),
        const SizedBox(height: Space.lg),
        if (!hasVehicles)
          AppCard(
            padding: EdgeInsets.zero,
            child: EmptyState(
              icon: Icons.qr_code_2_outlined,
              title: 'Set up your first vehicle',
              message: 'Add your vehicle to create your first private contact QR.',
              actionLabel: 'Add Vehicle',
              actionIcon: Icons.add,
              onAction: () => context.push('/vehicles/new'),
            ),
          )
        else ...[
          Row(
            children: [
              Expanded(
                child: StatTile(
                  icon: Icons.mark_chat_unread_outlined,
                  label: 'Unread',
                  value: s.unreadMessageCount,
                  tone: c.comm,
                  onTap: () => context.go('/messages'),
                ),
              ),
              const SizedBox(width: Space.sm),
              Expanded(
                child: StatTile(
                  icon: Icons.directions_car_outlined,
                  label: 'Vehicles',
                  value: s.vehicleCount,
                  onTap: () => context.go('/vehicles'),
                ),
              ),
              const SizedBox(width: Space.sm),
              Expanded(
                child: StatTile(
                  icon: Icons.qr_code_2_outlined,
                  label: 'Active QR',
                  value: s.activeQrCount,
                  tone: c.success,
                  onTap: () => context.go('/vehicles'),
                ),
              ),
            ],
          ),
          const SizedBox(height: Space.md),
          Row(
            children: [
              Expanded(
                child: AppButton(
                  label: 'Add Vehicle',
                  icon: Icons.add,
                  compact: true,
                  onPressed: () => context.push('/vehicles/new'),
                ),
              ),
              const SizedBox(width: Space.sm),
              Expanded(
                child: AppButton(
                  label: 'Messages',
                  icon: Icons.chat_bubble_outline,
                  compact: true,
                  variant: AppButtonVariant.secondary,
                  onPressed: () => context.go('/messages'),
                ),
              ),
            ],
          ),
        ],
        const SizedBox(height: Space.xl),
        SectionHeader(
          title: 'Latest conversations',
          actionLabel: s.recentConversations.isEmpty ? null : 'View all',
          onAction: () => context.go('/messages'),
        ),
        if (s.recentConversations.isEmpty)
          AppCard(
            padding: EdgeInsets.zero,
            child: EmptyState(
              icon: Icons.chat_bubble_outline,
              title: 'No messages yet',
              message: 'When someone scans your QR code, their message will appear here.',
              actionLabel: hasVehicles ? 'View QR' : null,
              actionIcon: Icons.qr_code_2_outlined,
              onAction: hasVehicles && vehicles.isNotEmpty ? () => context.push('/vehicles/${vehicles.first.id}/qr') : null,
            ),
          )
        else
          AppCard(
            padding: EdgeInsets.zero,
            child: Column(
              children: [
                for (var i = 0; i < s.recentConversations.length; i++)
                  MessagePreview(
                    conversation: s.recentConversations[i],
                    showDivider: i < s.recentConversations.length - 1,
                    onTap: () => context.push('/messages/${s.recentConversations[i].id}'),
                  ),
              ],
            ),
          ),
        if (vehicles.isNotEmpty) ...[
          const SizedBox(height: Space.xl),
          SectionHeader(title: 'Your vehicles', actionLabel: 'Manage', onAction: () => context.go('/vehicles')),
          AppCard(
            padding: EdgeInsets.zero,
            child: Column(
              children: [
                for (var i = 0; i < vehicles.length && i < 3; i++)
                  _VehicleRow(vehicle: vehicles[i], showDivider: i < vehicles.length - 1 && i < 2),
              ],
            ),
          ),
        ],
        const SizedBox(height: Space.lg),
        const PrivacyLabel('Visitors never see your phone number or email.', center: true),
      ],
    );
  }
}

class _Header extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final c = AppColors.of(context);
    final t = Theme.of(context).textTheme;
    final user = ref.watch(authControllerProvider).user;
    final first = (user?.hasRealName ?? false) ? user!.name.trim().split(RegExp(r'\s+')).first : '';
    final initial = first.isNotEmpty ? first[0].toUpperCase() : '?';

    return Row(
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(greetingFor(DateTime.now()), style: t.bodyLarge?.copyWith(color: c.slate)),
              const SizedBox(height: 2),
              Semantics(
                header: true,
                child: Text(
                  first.isEmpty ? 'Welcome back' : first,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: t.headlineMedium,
                ),
              ),
            ],
          ),
        ),
        Semantics(
          button: true,
          label: 'Profile',
          child: InkWell(
            customBorder: const CircleBorder(),
            onTap: () => context.go('/profile'),
            child: CircleAvatar(
              radius: 22,
              backgroundColor: c.primarySoft,
              foregroundImage: user?.image != null ? NetworkImage(user!.image!) : null,
              child: Text(initial, style: t.titleMedium?.copyWith(color: c.primary)),
            ),
          ),
        ),
      ],
    );
  }
}

class _VehicleRow extends StatelessWidget {
  const _VehicleRow({required this.vehicle, required this.showDivider});

  final Vehicle vehicle;
  final bool showDivider;

  @override
  Widget build(BuildContext context) {
    final c = AppColors.of(context);
    final t = Theme.of(context).textTheme;
    return InkWell(
      onTap: () => context.push('/vehicles/${vehicle.id}'),
      child: Container(
        padding: const EdgeInsets.fromLTRB(Space.md, Space.sm, Space.xs, Space.sm),
        decoration: BoxDecoration(border: showDivider ? Border(bottom: BorderSide(color: c.border)) : null),
        child: Row(
          children: [
            VehicleAvatar(vehicle: vehicle, size: 44),
            const SizedBox(width: Space.sm),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(vehicle.name, maxLines: 1, overflow: TextOverflow.ellipsis, style: t.titleSmall),
                  const SizedBox(height: 4),
                  StatusBadge(
                    vehicle.qrActive ? StatusKind.active : StatusKind.inactive,
                    label: vehicle.qrActive ? 'QR active' : 'QR off',
                  ),
                ],
              ),
            ),
            IconButton(
              tooltip: 'QR code for ${vehicle.name}',
              icon: Icon(Icons.qr_code_2_outlined, color: c.primary),
              onPressed: () => context.push('/vehicles/${vehicle.id}/qr'),
            ),
          ],
        ),
      ),
    );
  }
}

class _HomeSkeleton extends StatelessWidget {
  const _HomeSkeleton();

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: 'Loading dashboard',
      liveRegion: true,
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(Space.page, Space.md, Space.page, Space.xl),
        children: const [
          SkeletonBox(width: 120, height: 16),
          SizedBox(height: Space.xs),
          SkeletonBox(width: 180, height: 28),
          SizedBox(height: Space.lg),
          Row(children: [
            Expanded(child: SkeletonBox(height: 96, radius: Radii.lg)),
            SizedBox(width: Space.sm),
            Expanded(child: SkeletonBox(height: 96, radius: Radii.lg)),
            SizedBox(width: Space.sm),
            Expanded(child: SkeletonBox(height: 96, radius: Radii.lg)),
          ]),
          SizedBox(height: Space.md),
          SkeletonBox(height: 44),
          SizedBox(height: Space.xl),
          SkeletonBox(width: 180, height: 18),
          SizedBox(height: Space.sm),
          SkeletonBox(height: 220, radius: Radii.lg),
        ],
      ),
    );
  }
}
