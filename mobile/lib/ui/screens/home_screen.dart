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
      final results = await Future.wait([ref.read(dashboardRepositoryProvider).summary(), ref.read(vehicleRepositoryProvider).list()]);
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
          SnackBar(
            content: Text(e.message),
            action: SnackBarAction(label: 'Retry', onPressed: _load),
          ),
        );
      }
      setState(() => _error = e);
    }
  }

  @override
  Widget build(BuildContext context) {
    // The layout (hero, actions, section headers) renders immediately; only
    // the data areas show skeletons until the backend answers.
    return Scaffold(
      body: SafeArea(
        bottom: false,
        child: RefreshIndicator(onRefresh: _load, child: _content(context, _summary)),
      ),
    );
  }

  Widget _content(BuildContext context, DashboardSummary? s) {
    final vehicles = _vehicles ?? const <Vehicle>[];
    // While loading, assume the common case (has vehicles) so the layout
    // keeps its shape when the data lands.
    final hasVehicles = s == null || s.vehicleCount > 0;
    final failed = s == null && _error != null;

    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.fromLTRB(Space.page, Space.md, Space.page, Space.xl),
      children: [
        _BrandHero(summary: s, hasVehicles: hasVehicles),
        const SizedBox(height: Space.lg),
        if (failed)
          AppCard(
            padding: EdgeInsets.zero,
            child: ErrorState(error: _error!, title: 'Unable to load your dashboard', onRetry: _load),
          )
        else if (!hasVehicles)
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
        else
          Row(
            children: [
              Expanded(
                child: AppButton(label: 'Add Vehicle', icon: Icons.add, compact: true, onPressed: () => context.push('/vehicles/new')),
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
        if (!failed) ..._sections(context, s, vehicles, hasVehicles),
        const SizedBox(height: Space.lg),
        const PrivacyLabel('Visitors never see your phone number or email.', center: true),
      ],
    );
  }

  List<Widget> _sections(BuildContext context, DashboardSummary? s, List<Vehicle> vehicles, bool hasVehicles) {
    if (s == null) {
      // Skeletons with the footprint of the real sections.
      return const [
        SizedBox(height: Space.xl),
        SectionHeader(title: 'Latest conversations'),
        _SectionSkeleton(rows: 2),
        SizedBox(height: Space.xl),
        SectionHeader(title: 'Your vehicles'),
        _SectionSkeleton(rows: 2),
      ];
    }
    return [
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
    ];
  }
}

/// Brand hero: navy gradient tile (glow at the top), white type, electric-
/// blue accents, and the three live counts (placeholders until loaded).
class _BrandHero extends ConsumerWidget {
  const _BrandHero({required this.summary, required this.hasVehicles});

  final DashboardSummary? summary;
  final bool hasVehicles;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final c = AppColors.of(context);
    final t = Theme.of(context).textTheme;
    final user = ref.watch(authControllerProvider).user;
    final first = (user?.hasRealName ?? false) ? user!.name.trim().split(RegExp(r'\s+')).first : '';
    final initial = first.isNotEmpty ? first[0].toUpperCase() : '?';
    final onNavySoft = c.onNavy.withValues(alpha: 0.72);

    return Container(
      padding: const EdgeInsets.fromLTRB(Space.lg, Space.lg, Space.lg, Space.lg),
      decoration: BoxDecoration(
        gradient: c.brandGradient,
        borderRadius: BorderRadius.circular(Radii.xl),
        boxShadow: Shadows.raised(context),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const BrandMark(size: 28, inverse: true),
              const SizedBox(width: Space.xs),
              Text('OwnerPing', style: t.titleSmall?.copyWith(color: c.onNavy, letterSpacing: 0.2)),
              if (ref.watch(authControllerProvider).isGuest) ...[
                const SizedBox(width: Space.xs),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(color: c.accent.withValues(alpha: 0.18), borderRadius: BorderRadius.circular(Radii.pill)),
                  child: Text('Demo', style: t.labelSmall?.copyWith(color: c.accent, letterSpacing: 0.4)),
                ),
              ],
              const Spacer(),
              Semantics(
                button: true,
                label: 'Profile',
                child: InkWell(
                  customBorder: const CircleBorder(),
                  onTap: () => context.go('/profile'),
                  child: CircleAvatar(
                    radius: 18,
                    backgroundColor: c.primary,
                    foregroundImage: user?.image != null ? NetworkImage(user!.image!) : null,
                    child: Text(initial, style: t.titleSmall?.copyWith(color: c.onPrimary)),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: Space.lg),
          Text(greetingFor(DateTime.now()), style: t.bodyLarge?.copyWith(color: onNavySoft)),
          const SizedBox(height: 2),
          Semantics(
            header: true,
            child: Text(
              first.isEmpty ? 'Welcome back' : first,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: t.headlineMedium?.copyWith(color: c.onNavy),
            ),
          ),
          if (hasVehicles) ...[
            const SizedBox(height: Space.lg),
            Row(
              children: [
                Expanded(
                  child: _HeroStat(
                    icon: Icons.mark_chat_unread_outlined,
                    label: 'Unread',
                    value: summary?.unreadMessageCount,
                    highlight: (summary?.unreadMessageCount ?? 0) > 0,
                    onTap: () => context.go('/messages'),
                  ),
                ),
                const SizedBox(width: Space.xs),
                Expanded(
                  child: _HeroStat(
                    icon: Icons.directions_car_outlined,
                    label: 'Vehicles',
                    value: summary?.vehicleCount,
                    onTap: () => context.go('/vehicles'),
                  ),
                ),
                const SizedBox(width: Space.xs),
                Expanded(
                  child: _HeroStat(
                    icon: Icons.qr_code_2_outlined,
                    label: 'Active QR',
                    value: summary?.activeQrCount,
                    onTap: () => context.go('/vehicles'),
                  ),
                ),
              ],
            ),
          ] else ...[
            const SizedBox(height: Space.xs),
            Text('Connect Vehicle Owners — privately.', style: t.bodyMedium?.copyWith(color: onNavySoft)),
          ],
        ],
      ),
    );
  }
}

/// Glass stat chip on the navy hero; blue when it needs attention. A null
/// [value] (still loading) shows a placeholder bar of the same height.
class _HeroStat extends StatelessWidget {
  const _HeroStat({required this.icon, required this.label, required this.value, required this.onTap, this.highlight = false});

  final IconData icon;
  final String label;
  final int? value;
  final VoidCallback onTap;
  final bool highlight;

  @override
  Widget build(BuildContext context) {
    final c = AppColors.of(context);
    final t = Theme.of(context).textTheme;
    return Semantics(
      button: true,
      label: value == null ? '$label: loading' : '$label: $value',
      excludeSemantics: true,
      child: Material(
        color: highlight ? c.primary : c.onNavy.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(Radii.md),
        child: InkWell(
          borderRadius: BorderRadius.circular(Radii.md),
          onTap: onTap,
          child: Container(
            padding: const EdgeInsets.fromLTRB(Space.sm, Space.sm, Space.xs, Space.sm),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(Radii.md),
              border: highlight ? null : Border.all(color: c.onNavy.withValues(alpha: 0.12)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Icon(icon, size: 18, color: highlight ? c.onPrimary : c.accent),
                const SizedBox(height: Space.xs),
                SizedBox(
                  height: 22,
                  child: value == null
                      ? Align(
                          alignment: Alignment.centerLeft,
                          child: Container(
                            width: 28,
                            height: 18,
                            decoration: BoxDecoration(
                              color: c.onNavy.withValues(alpha: 0.14),
                              borderRadius: BorderRadius.circular(Radii.sm),
                            ),
                          ),
                        )
                      : Text(
                          '$value',
                          style: t.headlineSmall?.copyWith(
                            fontWeight: FontWeight.w700,
                            height: 1,
                            color: highlight ? c.onPrimary : c.onNavy,
                          ),
                        ),
                ),
                const SizedBox(height: 4),
                Text(
                  label,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: t.bodySmall?.copyWith(color: highlight ? c.onPrimary : c.onNavy.withValues(alpha: 0.72)),
                ),
              ],
            ),
          ),
        ),
      ),
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
        decoration: BoxDecoration(
          border: showDivider ? Border(bottom: BorderSide(color: c.border)) : null,
        ),
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
                  StatusBadge(vehicle.qrActive ? StatusKind.active : StatusKind.inactive, label: vehicle.qrActive ? 'QR active' : 'QR off'),
                ],
              ),
            ),
            IconButton(
              tooltip: 'QR code for ${vehicle.name}',
              icon: Icon(Icons.qr_code_2_outlined, color: c.primaryInk),
              onPressed: () => context.push('/vehicles/${vehicle.id}/qr'),
            ),
          ],
        ),
      ),
    );
  }
}

/// Card-shaped placeholder for a Home section.
class _SectionSkeleton extends StatelessWidget {
  const _SectionSkeleton({required this.rows});

  final int rows;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: 'Loading',
      liveRegion: true,
      child: AppCard(
        padding: const EdgeInsets.all(Space.md),
        child: Column(
          children: [
            for (var i = 0; i < rows; i++) ...[
              if (i > 0) const SizedBox(height: Space.md),
              const Row(
                children: [
                  SkeletonBox(width: 44, height: 44),
                  SizedBox(width: Space.sm),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [SkeletonBox(width: 150, height: 14, radius: 6), SizedBox(height: 10), SkeletonBox(height: 12, radius: 6)],
                    ),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }
}
