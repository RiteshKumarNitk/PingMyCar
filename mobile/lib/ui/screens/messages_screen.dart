import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/api_error.dart';
import '../../models/models.dart';
import '../../providers.dart';

/// Owner inbox: All / Unread tabs plus an optional vehicle filter, mirroring
/// the web dashboard's semantics. Unread state is server-side (readAt).
class MessagesScreen extends ConsumerStatefulWidget {
  const MessagesScreen({super.key});

  @override
  ConsumerState<MessagesScreen> createState() => _MessagesScreenState();
}

class _MessagesScreenState extends ConsumerState<MessagesScreen> {
  List<ConversationSummary>? _all;
  List<Vehicle>? _vehicles;
  String? _error;
  bool _unreadOnly = false;
  String? _vehicleFilter;
  bool _loaded = false;

  @override
  void initState() {
    super.initState();
    _load();
    ref.read(unreadCountSignalProvider).addListener(_refreshOnPush);
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
        _loaded = true;
      });
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.message;
        _loaded = true;
      });
    }
  }

  List<ConversationSummary> get _visible {
    var items = _all ?? const <ConversationSummary>[];
    if (_unreadOnly) items = items.where((c) => c.unreadCount > 0).toList();
    return items;
  }

  @override
  Widget build(BuildContext context) {
    final items = _visible;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Messages'),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(64),
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 10),
            child: Row(
              children: [
                Expanded(
                  child: SegmentedButton<bool>(
                    segments: const [
                      ButtonSegment(value: false, label: Text('All')),
                      ButtonSegment(value: true, label: Text('Unread')),
                    ],
                    selected: {_unreadOnly},
                    onSelectionChanged: (s) => setState(() => _unreadOnly = s.first),
                  ),
                ),
                const SizedBox(width: 10),
                DropdownMenu<String>(
                  width: 160,
                  requestFocusOnTap: false,
                  initialSelection: _vehicleFilter,
                  hintText: 'Vehicle',
                  dropdownMenuEntries: [
                    const DropdownMenuEntry(value: '', label: 'All vehicles'),
                    ...?_vehicles?.map((v) => DropdownMenuEntry(value: v.id, label: v.name)),
                  ],
                  onSelected: (v) {
                    setState(() => _vehicleFilter = v!.isEmpty ? null : v);
                    _load();
                  },
                ),
              ],
            ),
          ),
        ),
      ),
      body: RefreshIndicator(
        onRefresh: _load,
        child: _error != null && _all == null
            ? ListView(children: [
                const SizedBox(height: 120),
                Center(child: Text(_error!, textAlign: TextAlign.center)),
              ])
            : !_loaded
                ? const SizedBox()
                : items.isEmpty
                    ? ListView(
                        children: [
                          const SizedBox(height: 110),
                          Icon(_unreadOnly ? Icons.mark_email_read_outlined : Icons.mail_outline, size: 48, color: const Color(0xFF9AA6B2)),
                          const SizedBox(height: 12),
                          Text(
                            _unreadOnly ? "You're all caught up." : 'No messages here yet.',
                            textAlign: TextAlign.center,
                            style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w700, color: Color(0xFF0D1926)),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            _unreadOnly
                                ? 'No unread messages. New ones will show up here.'
                                : 'When someone scans your vehicle’s QR, their message will appear here.',
                            textAlign: TextAlign.center,
                            style: const TextStyle(color: Color(0xFF5B6773)),
                          ),
                        ],
                      )
                    : ListView.separated(
                        padding: const EdgeInsets.all(16),
                        itemCount: items.length,
                        separatorBuilder: (_, __) => const SizedBox(height: 10),
                        itemBuilder: (context, i) {
                          final c = items[i];
                          return Card(
                            child: InkWell(
                              borderRadius: BorderRadius.circular(16),
                              onTap: () => context.push('/messages/${c.id}'),
                              child: Padding(
                                padding: const EdgeInsets.all(14),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      children: [
                                        Expanded(
                                          child: Text(
                                            c.reasonLabel,
                                            style: TextStyle(
                                              fontWeight: c.unreadCount > 0 ? FontWeight.w800 : FontWeight.w600,
                                              color: const Color(0xFF0D1926),
                                            ),
                                          ),
                                        ),
                                        _StatusChip(status: c.status),
                                      ],
                                    ),
                                    if (c.lastMessageBody != null) ...[
                                      const SizedBox(height: 4),
                                      Text(
                                        c.lastMessageBody!,
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                        style: const TextStyle(fontSize: 13.5, color: Color(0xFF5B6773)),
                                      ),
                                    ],
                                    const SizedBox(height: 6),
                                    Row(
                                      children: [
                                        Expanded(child: Text(c.vehicleName, style: const TextStyle(fontSize: 12, color: Color(0xFF9AA6B2)))),
                                        if (c.unreadCount > 0)
                                          Container(
                                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                            decoration: BoxDecoration(color: const Color(0xFFE8EFFC), borderRadius: BorderRadius.circular(10)),
                                            child: Text(
                                              '${c.unreadCount} new',
                                              style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: Color(0xFF2563EB)),
                                            ),
                                          ),
                                      ],
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          );
                        },
                      ),
      ),
    );
  }
}

class _StatusChip extends StatelessWidget {
  const _StatusChip({required this.status});
  final String status;

  @override
  Widget build(BuildContext context) {
    final (label, color) = switch (status) {
      'OPEN' => ('Open', const Color(0xFF16A34A)),
      'BLOCKED' => ('Blocked', const Color(0xFFDC2626)),
      _ => ('Closed', const Color(0xFF5B6773)),
    };
    return Text(label, style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.w700, color: color));
  }
}
