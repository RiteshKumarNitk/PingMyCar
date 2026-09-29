import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/api_error.dart';
import '../../models/models.dart';
import '../../providers.dart';
import '../components/components.dart';

class VehiclesScreen extends ConsumerStatefulWidget {
  const VehiclesScreen({super.key});

  @override
  ConsumerState<VehiclesScreen> createState() => _VehiclesScreenState();
}

class _VehiclesScreenState extends ConsumerState<VehiclesScreen> {
  List<Vehicle>? _vehicles;
  ({Map<String, int> total, Map<String, int> unread, bool partial})? _counts;
  Object? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final v = await ref.read(vehicleRepositoryProvider).list();
      if (!mounted) return;
      setState(() {
        _vehicles = v;
        _error = null;
      });
    } on ApiException catch (e) {
      if (!mounted) return;
      if (_vehicles != null) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.message), action: SnackBarAction(label: 'Try again', onPressed: _load)),
        );
      }
      setState(() => _error = e);
      return;
    }
    // Message counts are secondary — a failure here never blocks the list.
    try {
      final counts = await ref.read(conversationRepositoryProvider).countsByVehicle();
      if (mounted) setState(() => _counts = counts);
    } on ApiException {
      if (mounted) setState(() => _counts = null);
    }
  }

  Future<void> _open(String route) async {
    await context.push(route);
    if (mounted) _load();
  }

  @override
  Widget build(BuildContext context) {
    final vehicles = _vehicles;
    final counts = _counts;
    // Header actions and the Add button are static: shown while loading, and
    // hidden only for a confirmed-empty garage (its empty state has the CTA).
    final showActions = vehicles?.isEmpty != true;
    return Scaffold(
      appBar: AppBar(
        title: const Text('Vehicles'),
        actions: [
          if (showActions)
            IconButton(
              tooltip: 'Stickers',
              icon: const Icon(Icons.sell_outlined),
              onPressed: () => context.push('/stickers'),
            ),
          const SizedBox(width: Space.xs),
        ],
      ),
      floatingActionButton: showActions
          ? FloatingActionButton.extended(
              onPressed: () => _open('/vehicles/new'),
              icon: const Icon(Icons.add),
              label: const Text('Add Vehicle'),
            )
          : null,
      body: RefreshIndicator(
        onRefresh: _load,
        child: vehicles == null
            ? (_error != null
                ? ScrollableCenter(child: ErrorState(error: _error!, title: 'Unable to load vehicles', onRetry: _load))
                : const LoadingSkeleton(rows: 3, rowHeight: 150, header: false))
            : vehicles.isEmpty
                ? ScrollableCenter(
                    child: EmptyState(
                      icon: Icons.directions_car_outlined,
                      title: 'No vehicles yet',
                      message: 'Add your vehicle to create your first private contact QR.',
                      actionLabel: 'Add Vehicle',
                      actionIcon: Icons.add,
                      onAction: () => _open('/vehicles/new'),
                    ),
                  )
                : ListView.separated(
                    physics: const AlwaysScrollableScrollPhysics(),
                    // Bottom padding clears the extended FAB.
                    padding: const EdgeInsets.fromLTRB(Space.page, Space.xs, Space.page, 96),
                    itemCount: vehicles.length,
                    separatorBuilder: (_, __) => const SizedBox(height: Space.sm),
                    itemBuilder: (context, i) {
                      final v = vehicles[i];
                      return VehicleCard(
                        vehicle: v,
                        conversationCount: counts == null ? null : (counts.total[v.id] ?? 0),
                        unreadCount: counts?.unread[v.id] ?? 0,
                        countIsPartial: counts?.partial ?? false,
                        onView: () => _open('/vehicles/${v.id}'),
                        onQr: () => _open('/vehicles/${v.id}/qr'),
                        onMessages: () => context.go('/messages?vehicle=${v.id}'),
                        onEdit: () => _open('/vehicles/${v.id}/edit'),
                      );
                    },
                  ),
      ),
    );
  }
}
