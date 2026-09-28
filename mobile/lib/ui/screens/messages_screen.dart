import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/api_error.dart';
import '../../models/models.dart';
import '../../providers.dart';
import '../components/components.dart';

/// Owner inbox: All / Unread plus an optional vehicle filter (also reachable
/// as `/messages?vehicle=ID`). Unread state is server-side (readAt).
class MessagesScreen extends ConsumerStatefulWidget {
  const MessagesScreen({super.key, this.initialVehicleId});

  final String? initialVehicleId;

  @override
  ConsumerState<MessagesScreen> createState() => _MessagesScreenState();
}

class _MessagesScreenState extends ConsumerState<MessagesScreen> {
  List<ConversationSummary>? _all;
  List<Vehicle>? _vehicles;
  Object? _error;
  bool _unreadOnly = false;
  String? _vehicleFilter;
  late final UnreadCountSignal _signal;

  @override
  void initState() {
    super.initState();
    _vehicleFilter = widget.initialVehicleId;
    _load();
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
      final futures = await Future.wait([
        ref.read(conversationRepositoryProvider).list(vehicleId: _vehicleFilter),
        if (_vehicles == null) ref.read(vehicleRepositoryProvider).list() else Future.value(_vehicles),
      ]);
      if (!mounted) return;
      setState(() {
        _all = futures[0] as List<ConversationSummary>;
        _vehicles = futures[1] as List<Vehicle>?;
        _error = null;
      });
    } on ApiException catch (e) {
      if (!mounted) return;
      if (_all != null) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.message), action: SnackBarAction(label: 'Retry', onPressed: _load)),
        );
      }
      setState(() => _error = e);
    }
  }

  List<ConversationSummary> get _visible {
    final items = _all ?? const <ConversationSummary>[];
    return _unreadOnly ? items.where((c) => c.unreadCount > 0).toList() : items;
  }

  Vehicle? get _filterVehicle =>
      _vehicleFilter == null ? null : _vehicles?.where((v) => v.id == _vehicleFilter).firstOrNull;

  Future<void> _pickVehicle() async {
    final vehicles = _vehicles ?? const <Vehicle>[];
    final picked = await showModalBottomSheet<String>(
      context: context,
      builder: (context) => SafeArea(
        child: ListView(
          shrinkWrap: true,
          padding: const EdgeInsets.only(bottom: Space.md),
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(Space.page, 0, Space.page, Space.xs),
              child: Text('Filter by vehicle', style: Theme.of(context).textTheme.titleMedium),
            ),
            ListTile(
              leading: const Icon(Icons.all_inclusive_outlined),
              title: const Text('All vehicles'),
              trailing: _vehicleFilter == null ? const Icon(Icons.check) : null,
              onTap: () => Navigator.pop(context, ''),
            ),
            for (final v in vehicles)
              ListTile(
                leading: VehicleAvatar(vehicle: v, size: 36),
                title: Text(v.name),
                trailing: _vehicleFilter == v.id ? const Icon(Icons.check) : null,
                onTap: () => Navigator.pop(context, v.id),
              ),
          ],
        ),
      ),
    );
    if (picked == null || !mounted) return;
    setState(() {
      _vehicleFilter = picked.isEmpty ? null : picked;
      _all = null;
    });
    _load();
  }

  @override
  Widget build(BuildContext context) {
    final c = AppColors.of(context);
    final t = Theme.of(context).textTheme;
    final items = _visible;
    final filter = _filterVehicle;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Messages'),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(60),
          child: Padding(
            padding: const EdgeInsets.fromLTRB(Space.page, 0, Space.page, Space.sm),
            child: Row(
              children: [
                Expanded(
                  child: SegmentedButton<bool>(
                    showSelectedIcon: false,
                    segments: const [
                      ButtonSegment(value: false, label: Text('All')),
                      ButtonSegment(value: true, label: Text('Unread')),
                    ],
                    selected: {_unreadOnly},
                    onSelectionChanged: (s) => setState(() => _unreadOnly = s.first),
                  ),
                ),
                const SizedBox(width: Space.xs),
                Flexible(
                  child: ActionChip(
                    avatar: Icon(Icons.directions_car_outlined, size: 18, color: filter != null ? c.primary : c.slate),
                    label: Text(filter?.name ?? 'All vehicles', overflow: TextOverflow.ellipsis),
                    labelStyle: t.labelMedium?.copyWith(color: filter != null ? c.primary : c.slate),
                    side: BorderSide(color: filter != null ? c.primary.withValues(alpha: 0.4) : c.border),
                    backgroundColor: filter != null ? c.primarySoft : c.surface,
                    onPressed: _vehicles == null ? null : _pickVehicle,
                    tooltip: 'Filter by vehicle',
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
      body: RefreshIndicator(
        onRefresh: _load,
        child: _all == null
            ? (_error != null
                ? ScrollableCenter(child: ErrorState(error: _error!, onRetry: _load))
                : const LoadingSkeleton(rows: 5, header: false))
            : items.isEmpty
                ? ScrollableCenter(
                    child: _unreadOnly
                        ? const EmptyState(
                            icon: Icons.mark_chat_read_outlined,
                            title: "You're all caught up",
                            message: 'No unread messages. New ones will show up here.',
                          )
                        : EmptyState(
                            icon: Icons.chat_bubble_outline,
                            title: 'No messages yet',
                            message: 'When someone scans your QR code, their message will appear here.',
                            actionLabel: (_vehicles?.isEmpty ?? true) ? 'Add Vehicle' : 'View QR',
                            actionIcon: (_vehicles?.isEmpty ?? true) ? Icons.add : Icons.qr_code_2_outlined,
                            onAction: () {
                              final vehicles = _vehicles ?? const <Vehicle>[];
                              if (vehicles.isEmpty) {
                                context.push('/vehicles/new');
                              } else {
                                context.push('/vehicles/${(filter ?? vehicles.first).id}/qr');
                              }
                            },
                          ),
                  )
                : ListView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    padding: const EdgeInsets.fromLTRB(Space.page, Space.xs, Space.page, Space.xl),
                    children: [
                      AppCard(
                        padding: EdgeInsets.zero,
                        child: Column(
                          children: [
                            for (var i = 0; i < items.length; i++)
                              MessagePreview(
                                conversation: items[i],
                                showDivider: i < items.length - 1,
                                onTap: () async {
                                  await context.push('/messages/${items[i].id}');
                                  if (mounted) _load(); // read state changed server-side
                                },
                              ),
                          ],
                        ),
                      ),
                      const SizedBox(height: Space.md),
                      const PrivacyLabel('Private conversations — your contact details stay hidden.', center: true),
                    ],
                  ),
      ),
    );
  }
}
