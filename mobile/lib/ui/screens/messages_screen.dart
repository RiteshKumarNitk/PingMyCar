import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/api_error.dart';
import '../../models/models.dart';
import '../../providers.dart';
import '../../repositories/repositories.dart';
import '../components/components.dart';
import 'home_shell.dart' show unreadBadgeProvider;

/// Owner inbox: every conversation the owner has, one card each, newest
/// activity first. The header, search and filters render immediately; the
/// list area shows card-shaped skeletons until the first page arrives.
///
/// Data comes from the lightweight list endpoint (last message only), page by
/// page via its cursor — full histories load only when a thread is opened.
/// Filters: All / Unread, an optional vehicle (also `/messages?vehicle=ID`),
/// and a search over the loaded previews. Unread state is server-side.
class MessagesScreen extends ConsumerStatefulWidget {
  const MessagesScreen({super.key, this.initialVehicleId});

  final String? initialVehicleId;

  @override
  ConsumerState<MessagesScreen> createState() => _MessagesScreenState();
}

class _MessagesScreenState extends ConsumerState<MessagesScreen> {
  List<ConversationSummary>? _all;
  String? _nextCursor;
  bool _loadingMore = false;
  List<Vehicle>? _vehicles;
  Object? _error;
  bool _unreadOnly = false;
  String? _vehicleFilter;
  String _query = '';
  final _deleting = <String>{};
  final _scroll = ScrollController();
  final _search = TextEditingController();
  late final UnreadCountSignal _signal;

  /// Bumped on every first-page load so a stale "load more" can't append
  /// pages from a previous filter.
  int _generation = 0;

  @override
  void initState() {
    super.initState();
    _vehicleFilter = widget.initialVehicleId;
    _scroll.addListener(_maybeLoadMore);
    _load();
    _loadVehicles();
    _signal = ref.read(unreadCountSignalProvider)..addListener(_refreshOnPush);
  }

  @override
  void dispose() {
    _signal.removeListener(_refreshOnPush);
    _scroll.dispose();
    _search.dispose();
    super.dispose();
  }

  void _refreshOnPush() {
    if (mounted) _load();
  }

  ConversationRepository get _repo => ref.read(conversationRepositoryProvider);

  /// First page (also used for refresh): replaces the list.
  Future<void> _load() async {
    final gen = ++_generation;
    try {
      final page = await _repo.listPage(vehicleId: _vehicleFilter);
      if (!mounted || gen != _generation) return;
      setState(() {
        _all = page.items;
        _nextCursor = page.nextCursor;
        _error = null;
      });
      _afterPage();
    } on ApiException catch (e) {
      if (!mounted || gen != _generation) return;
      if (_all != null) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.message), action: SnackBarAction(label: 'Try again', onPressed: _load)),
        );
      }
      setState(() => _error = e);
    }
  }

  /// Next page, appended. Runs when the list nears its end, when the first
  /// page doesn't fill the screen, or while a search needs every preview.
  Future<void> _loadMore() async {
    final cursor = _nextCursor;
    if (cursor == null || _loadingMore) return;
    final gen = _generation;
    setState(() => _loadingMore = true);
    try {
      final page = await _repo.listPage(vehicleId: _vehicleFilter, cursor: cursor);
      if (!mounted || gen != _generation) return;
      final seen = {for (final c in _all ?? const <ConversationSummary>[]) c.id};
      setState(() {
        _all = [...?_all, ...page.items.where((c) => !seen.contains(c.id))];
        _nextCursor = page.nextCursor;
      });
      _afterPage();
    } on ApiException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.message), action: SnackBarAction(label: 'Try again', onPressed: _loadMore)),
        );
      }
    } finally {
      if (mounted) setState(() => _loadingMore = false);
    }
  }

  void _afterPage() {
    if (_nextCursor == null) return;
    if (_query.isNotEmpty) {
      _loadMore();
      return;
    }
    WidgetsBinding.instance.addPostFrameCallback((_) => _maybeLoadMore());
  }

  void _maybeLoadMore() {
    if (!mounted || _nextCursor == null || _loadingMore) return;
    if (!_scroll.hasClients) return;
    final p = _scroll.position;
    if (p.maxScrollExtent - p.pixels < 400) _loadMore();
  }

  Future<void> _loadVehicles() async {
    try {
      final vehicles = await ref.read(vehicleRepositoryProvider).list();
      if (mounted) setState(() => _vehicles = vehicles);
    } on ApiException {
      // Only used for the vehicle filter and icons — the inbox works without it.
    }
  }

  List<ConversationSummary> get _visible {
    Iterable<ConversationSummary> items = _all ?? const <ConversationSummary>[];
    if (_unreadOnly) items = items.where((c) => c.unreadCount > 0 || c.unread);
    final q = _query.trim().toLowerCase();
    if (q.isNotEmpty) {
      items = items.where((c) =>
          c.vehicleName.toLowerCase().contains(q) ||
          c.reasonLabel.toLowerCase().contains(q) ||
          (c.lastMessageBody?.toLowerCase().contains(q) ?? false));
    }
    return items.toList();
  }

  Vehicle? _vehicle(String id) => _vehicles?.where((v) => v.id == id).firstOrNull;

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
      _nextCursor = null;
      _error = null;
    });
    _load();
  }

  void _onSearch(String value) {
    setState(() => _query = value);
    // Search covers every conversation, not just the pages loaded so far.
    if (value.trim().isNotEmpty) _loadMore();
  }

  Future<void> _open(ConversationSummary cv) async {
    await context.push('/messages/${cv.id}');
    if (mounted) _load(); // read state may have changed server-side
  }

  /// Owner deletes a conversation from the list, after confirming. The
  /// backend decides (ownership, open reports → 409); the card is removed
  /// only once it succeeds.
  Future<void> _delete(ConversationSummary cv) async {
    if (_deleting.contains(cv.id)) return;
    final c = AppColors.of(context);
    final ok = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete conversation?'),
        content: const Text('This will permanently remove this conversation from your messages.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: c.danger, foregroundColor: Colors.white),
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
    if (ok != true || !mounted) return;

    setState(() => _deleting.add(cv.id));
    String? toast;
    try {
      await _repo.delete(cv.id);
      _removeLocally(cv.id);
      toast = 'Conversation deleted';
    } on ApiException catch (e) {
      toast = switch (e.kind) {
        ApiErrorKind.conflict => 'This conversation cannot be deleted while an active report is open.',
        ApiErrorKind.notFound => 'This conversation no longer exists.',
        _ => e.message,
      };
      if (e.kind == ApiErrorKind.notFound) _removeLocally(cv.id);
    } finally {
      if (mounted) setState(() => _deleting.remove(cv.id));
    }
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(toast)));
    _refreshUnreadBadge();
  }

  void _removeLocally(String id) {
    if (!mounted) return;
    setState(() => _all = _all?.where((c) => c.id != id).toList());
  }

  Future<void> _refreshUnreadBadge() async {
    try {
      final summary = await ref.read(dashboardRepositoryProvider).summary();
      if (mounted) ref.read(unreadBadgeProvider.notifier).state = summary.unreadMessageCount;
    } on ApiException {
      // Best effort — the shell refreshes it again on the next tab switch.
    }
  }

  @override
  Widget build(BuildContext context) {
    final c = AppColors.of(context);
    final t = Theme.of(context).textTheme;
    final unread = ref.watch(unreadBadgeProvider);
    final filter = _vehicleFilter == null ? null : _vehicle(_vehicleFilter!);

    return Scaffold(
      appBar: AppBar(
        toolbarHeight: 64,
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Messages'),
            const SizedBox(height: 2),
            Text(
              unread > 0 ? 'Your conversations · $unread unread' : 'Your conversations',
              style: t.bodySmall?.copyWith(color: unread > 0 ? c.primaryInk : c.muted, fontWeight: FontWeight.w500),
            ),
          ],
        ),
      ),
      body: Column(
        children: [
          // Static controls — never wait for data.
          Padding(
            padding: const EdgeInsets.fromLTRB(Space.page, 0, Space.page, Space.sm),
            child: Column(
              children: [
                TextField(
                  controller: _search,
                  onChanged: _onSearch,
                  textInputAction: TextInputAction.search,
                  decoration: InputDecoration(
                    hintText: 'Search conversations',
                    prefixIcon: const Icon(Icons.search),
                    isDense: true,
                    contentPadding: const EdgeInsets.symmetric(vertical: 12),
                    suffixIcon: _query.isEmpty
                        ? null
                        : IconButton(
                            tooltip: 'Clear search',
                            icon: const Icon(Icons.close),
                            onPressed: () {
                              _search.clear();
                              _onSearch('');
                            },
                          ),
                  ),
                ),
                const SizedBox(height: Space.sm),
                Row(
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
                        avatar: Icon(Icons.directions_car_outlined, size: 18, color: filter != null ? c.primaryInk : c.slate),
                        label: Text(filter?.name ?? 'All vehicles', overflow: TextOverflow.ellipsis),
                        labelStyle: t.labelMedium?.copyWith(color: filter != null ? c.primaryInk : c.slate),
                        side: BorderSide(color: filter != null ? c.primaryInk.withValues(alpha: 0.4) : c.border),
                        backgroundColor: filter != null ? c.primarySoft : c.surface,
                        onPressed: _vehicles == null ? null : _pickVehicle,
                        tooltip: 'Filter by vehicle',
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          Expanded(
            child: RefreshIndicator(onRefresh: _load, child: _body(context)),
          ),
        ],
      ),
    );
  }

  Widget _body(BuildContext context) {
    final all = _all;
    if (all == null) {
      if (_error != null) {
        return ScrollableCenter(child: ErrorState(error: _error!, title: 'Unable to load messages', onRetry: _load));
      }
      return Semantics(
        label: 'Loading conversations',
        liveRegion: true,
        child: ListView.separated(
          physics: const NeverScrollableScrollPhysics(),
          padding: const EdgeInsets.fromLTRB(Space.page, Space.xs, Space.page, Space.xl),
          itemCount: 5,
          separatorBuilder: (_, __) => const SizedBox(height: Space.sm),
          itemBuilder: (_, __) => const ConversationCardSkeleton(),
        ),
      );
    }

    final items = _visible;
    if (items.isEmpty) {
      final Widget empty;
      if (_query.trim().isNotEmpty) {
        empty = EmptyState(
          icon: Icons.search_off_outlined,
          title: 'No matching conversations',
          message: _nextCursor != null ? 'Searching older conversations…' : 'Try a different vehicle, reason or word.',
        );
      } else if (_unreadOnly) {
        empty = const EmptyState(
          icon: Icons.mark_chat_read_outlined,
          title: "You're all caught up",
          message: 'No unread messages. New ones will show up here.',
        );
      } else {
        final vehicles = _vehicles ?? const <Vehicle>[];
        empty = EmptyState(
          icon: Icons.chat_bubble_outline,
          title: 'No messages yet',
          message: 'When someone scans your OwnerPing QR and contacts you, conversations will appear here.',
          actionLabel: vehicles.isEmpty ? 'Add Vehicle' : 'View QR',
          actionIcon: vehicles.isEmpty ? Icons.add : Icons.qr_code_2_outlined,
          onAction: () {
            if (vehicles.isEmpty) {
              context.push('/vehicles/new');
            } else {
              final target = _vehicleFilter == null ? vehicles.first : (_vehicle(_vehicleFilter!) ?? vehicles.first);
              context.push('/vehicles/${target.id}/qr');
            }
          },
        );
      }
      return ScrollableCenter(child: empty);
    }

    final more = _nextCursor != null;
    return ListView.separated(
      controller: _scroll,
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.fromLTRB(Space.page, Space.xs, Space.page, Space.xl),
      itemCount: items.length + 1,
      separatorBuilder: (_, __) => const SizedBox(height: Space.sm),
      itemBuilder: (context, i) {
        if (i == items.length) {
          return Padding(
            padding: const EdgeInsets.only(top: Space.xs),
            child: more
                ? const ConversationCardSkeleton()
                : const PrivacyLabel('Private conversations — your contact details stay hidden.', center: true),
          );
        }
        final cv = items[i];
        return ConversationCard(
          key: ValueKey(cv.id),
          conversation: cv,
          vehicleType: _vehicle(cv.vehicleId)?.type,
          busy: _deleting.contains(cv.id),
          onTap: () => _open(cv),
          onDelete: () => _delete(cv),
        );
      },
    );
  }
}
