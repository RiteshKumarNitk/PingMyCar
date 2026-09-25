import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../core/api_error.dart';
import '../../models/models.dart';
import '../../providers.dart';

/// Home dashboard. All values come from /api/dashboard/summary — nothing is
/// computed or faked locally.
class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  DashboardSummary? _summary;
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
    // FCM foreground notifications bump this signal — refresh then.
    // (Listener is registered here while ref is valid; Riverpod forbids
    // touching ref after dispose.)
    ref.read(unreadCountSignalProvider).addListener(_refreshOnPush);
  }

  void _refreshOnPush() {
    if (mounted) _load();
  }

  Future<void> _load() async {
    try {
      final s = await ref.read(dashboardRepositoryProvider).summary();
      if (!mounted) return;
      setState(() {
        _summary = s;
        _loading = false;
        _error = null;
      });
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.message;
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authControllerProvider).user;
    final hasVehicles = (_summary?.vehicleCount ?? 0) > 0;

    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(_greeting(user?.name), style: const TextStyle(fontSize: 16)),
            Text('Your PingMyCar', style: Theme.of(context).textTheme.bodySmall),
          ],
        ),
      ),
      body: RefreshIndicator(
        onRefresh: _load,
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(16),
          children: [
            if (_error != null && _summary == null)
              _ErrorRetry(message: _error!, onRetry: _load)
            else if (_loading && _summary == null)
              ..._skeleton()
            else ...[
              if (!hasVehicles) ...[
                const _WelcomeCard(),
                const SizedBox(height: 24),
              ] else ...[
                _StatsRow(summary: _summary!),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: FilledButton.icon(
                        onPressed: () => context.push('/vehicles/new'),
                        icon: const Icon(Icons.add),
                        label: const Text('Add Vehicle'),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () => context.push('/stickers'),
                        icon: const Icon(Icons.sticky_note_2_outlined),
                        label: const Text('Stickers'),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 24),
              ],
              _RecentMessages(summary: _summary),
            ],
          ],
        ),
      ),
    );
  }

  String _greeting(String? name) {
    final hour = DateTime.now().hour;
    final part = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    final first = (name ?? '').trim().split(' ').first;
    return first.isEmpty ? part : '$part, $first';
  }

  List<Widget> _skeleton() => [
        const _SkeletonBox(height: 88),
        const SizedBox(height: 12),
        const _SkeletonBox(height: 52),
        const SizedBox(height: 24),
        const _SkeletonBox(height: 220),
      ];
}

class _StatsRow extends StatelessWidget {
  const _StatsRow({required this.summary});

  final DashboardSummary summary;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 18, horizontal: 8),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
          children: [
            _Stat(value: summary.vehicleCount, label: 'Vehicles'),
            _verticalDivider(),
            _Stat(value: summary.activeQrCount, label: 'Active QR'),
            _verticalDivider(),
            _Stat(
              value: summary.unreadMessageCount,
              label: 'Unread',
              highlight: summary.unreadMessageCount > 0,
            ),
          ],
        ),
      ),
    );
  }

  Widget _verticalDivider() => Container(width: 1, height: 36, color: const Color(0xFFE5E9EF));
}

class _Stat extends StatelessWidget {
  const _Stat({required this.value, required this.label, this.highlight = false});

  final int value;
  final String label;
  final bool highlight;

  @override
  Widget build(BuildContext context) {
    final color = highlight ? const Color(0xFF2563EB) : const Color(0xFF0D1926);
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Text('$value', style: TextStyle(fontSize: 26, fontWeight: FontWeight.w800, color: color)),
        const SizedBox(height: 2),
        Text(label, style: const TextStyle(fontSize: 12.5, color: Color(0xFF5B6773))),
      ],
    );
  }
}

class _RecentMessages extends StatelessWidget {
  const _RecentMessages({required this.summary});

  final DashboardSummary? summary;

  @override
  Widget build(BuildContext context) {
    final recent = summary?.recentConversations ?? [];
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text('Recent Messages', style: TextStyle(fontSize: 17, fontWeight: FontWeight.w700, color: Color(0xFF0D1926))),
            TextButton(onPressed: () => context.go('/messages'), child: const Text('View all')),
          ],
        ),
        if (recent.isEmpty)
          Card(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                children: [
                  const Icon(Icons.mail_outline, size: 36, color: Color(0xFF9AA6B2)),
                  const SizedBox(height: 8),
                  const Text('No messages yet.', style: TextStyle(fontWeight: FontWeight.w600)),
                  const SizedBox(height: 4),
                  const Text(
                    'Once someone scans your vehicle’s QR, their message will appear here.',
                    textAlign: TextAlign.center,
                    style: TextStyle(fontSize: 13, color: Color(0xFF5B6773)),
                  ),
                ],
              ),
            ),
          )
        else
          ...recent.map((c) => _RecentConversationTile(conversation: c)),
      ],
    );
  }
}

class _RecentConversationTile extends StatelessWidget {
  const _RecentConversationTile({required this.conversation});

  final ConversationSummary conversation;

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: () => context.push('/messages/${conversation.id}'),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      conversation.reasonLabel,
                      style: TextStyle(
                        fontWeight: conversation.unread ? FontWeight.w800 : FontWeight.w600,
                        color: const Color(0xFF0D1926),
                      ),
                    ),
                  ),
                  if (conversation.unread)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(color: const Color(0xFF2563EB), borderRadius: BorderRadius.circular(10)),
                      child: const Text('NEW', style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w700)),
                    ),
                ],
              ),
              if (conversation.lastMessageBody != null) ...[
                const SizedBox(height: 4),
                Text(
                  conversation.lastMessageBody!,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(fontSize: 13.5, color: Color(0xFF5B6773)),
                ),
              ],
              const SizedBox(height: 6),
              Text(
                '${conversation.vehicleName}  ·  ${_timeAgo(conversation.lastMessageAt)}',
                style: const TextStyle(fontSize: 12, color: Color(0xFF9AA6B2)),
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _timeAgo(DateTime? time) {
    if (time == null) return '';
    final diff = DateTime.now().difference(time);
    if (diff.inMinutes < 1) return 'just now';
    if (diff.inMinutes < 60) return '${diff.inMinutes} min ago';
    if (diff.inHours < 24) return '${diff.inHours} hr ago';
    return DateFormat('d MMM').format(time);
  }
}

class _WelcomeCard extends StatelessWidget {
  const _WelcomeCard();

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            const Text('👋', style: TextStyle(fontSize: 40)),
            const SizedBox(height: 12),
            const Text('Welcome to PingMyCar', style: TextStyle(fontSize: 19, fontWeight: FontWeight.w800, color: Color(0xFF0D1926))),
            const SizedBox(height: 6),
            const Text(
              'Add your first vehicle and create your PingMyCar QR — anyone who scans it can reach you without seeing your number.',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 14, color: Color(0xFF5B6773)),
            ),
            const SizedBox(height: 20),
            FilledButton.icon(
              onPressed: () => context.push('/vehicles/new'),
              icon: const Icon(Icons.add),
              label: const Text('Add Vehicle'),
            ),
          ],
        ),
      ),
    );
  }
}

class _SkeletonBox extends StatelessWidget {
  const _SkeletonBox({required this.height});
  final double height;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: height,
      decoration: BoxDecoration(
        color: const Color(0xFFEDF0F4),
        borderRadius: BorderRadius.circular(16),
      ),
    );
  }
}

class _ErrorRetry extends StatelessWidget {
  const _ErrorRetry({required this.message, required this.onRetry});

  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            const Icon(Icons.wifi_off, size: 36, color: Color(0xFF9AA6B2)),
            const SizedBox(height: 12),
            Text(message, textAlign: TextAlign.center, style: const TextStyle(color: Color(0xFF5B6773))),
            const SizedBox(height: 16),
            OutlinedButton(onPressed: onRetry, child: const Text('Try again')),
          ],
        ),
      ),
    );
  }
}
