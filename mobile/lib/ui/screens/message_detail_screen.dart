import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../core/api_error.dart';
import '../../models/models.dart';
import '../../providers.dart';
import '../components/components.dart';

/// Message thread. The id comes from a deep link or the list, but it is
/// never trusted: the backend only returns conversations owned by the
/// authenticated session (else 404), and opening marks visitor messages
/// read server-side.
class MessageDetailScreen extends ConsumerStatefulWidget {
  const MessageDetailScreen({super.key, required this.conversationId});

  final String conversationId;

  @override
  ConsumerState<MessageDetailScreen> createState() => _MessageDetailScreenState();
}

class _MessageDetailScreenState extends ConsumerState<MessageDetailScreen> {
  ConversationDetail? _conversation;
  Object? _error;
  bool _sending = false;
  bool _busy = false;
  final _replyController = TextEditingController();
  final _scroll = ScrollController();

  @override
  void initState() {
    super.initState();
    _replyController.addListener(() => setState(() {}));
    _load();
  }

  @override
  void dispose() {
    _replyController.dispose();
    _scroll.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    try {
      final repo = ref.read(conversationRepositoryProvider);
      final c = await repo.get(widget.conversationId);
      // Server-side read state (same rule as the web thread page).
      await repo.markRead(widget.conversationId);
      if (!mounted) return;
      setState(() {
        _conversation = c;
        _error = null;
      });
      _scrollToEnd();
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() => _error = e);
    }
  }

  void _scrollToEnd() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!_scroll.hasClients || !mounted) return;
      final end = _scroll.position.maxScrollExtent;
      final duration = Motion.of(context, Motion.medium);
      // Reduced motion → Duration.zero, which animateTo rejects: jump instead.
      if (duration == Duration.zero) {
        _scroll.jumpTo(end);
      } else {
        _scroll.animateTo(end, duration: duration, curve: Curves.easeOut);
      }
    });
  }

  Future<void> _reply() async {
    final body = _replyController.text.trim();
    if (body.isEmpty || _sending) return;
    setState(() => _sending = true);
    try {
      await ref.read(conversationRepositoryProvider).reply(widget.conversationId, body);
      _replyController.clear();
      await _load();
    } on ApiException catch (e) {
      _toast(e.message, retry: _reply);
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  void _toast(String message, {VoidCallback? retry}) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message), action: retry == null ? null : SnackBarAction(label: 'Retry', onPressed: retry)),
    );
  }

  Future<bool> _confirm({
    required String title,
    required String body,
    required String confirm,
    bool destructive = false,
  }) async {
    final c = AppColors.of(context);
    final ok = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(title),
        content: Text(body),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
          FilledButton(
            style: destructive ? FilledButton.styleFrom(backgroundColor: c.danger) : null,
            onPressed: () => Navigator.pop(context, true),
            child: Text(confirm),
          ),
        ],
      ),
    );
    return ok == true;
  }

  Future<void> _report() async {
    if (!await _confirm(
      title: 'Report this conversation?',
      body: 'Our team will review it. You can also block the conversation to stop further messages.',
      confirm: 'Report',
    )) {
      return;
    }
    await _run(() => ref.read(conversationRepositoryProvider).report(widget.conversationId), 'Reported. Thank you.');
  }

  Future<void> _block() async {
    if (!await _confirm(
      title: 'Block this conversation?',
      body: 'The visitor won\'t be able to send more messages here, and you won\'t be able to reply.',
      confirm: 'Block',
      destructive: true,
    )) {
      return;
    }
    await _run(() => ref.read(conversationRepositoryProvider).block(widget.conversationId), 'Conversation blocked.');
    await _load();
  }

  Future<void> _delete() async {
    if (!await _confirm(
      title: 'Delete this conversation?',
      body: 'All messages are permanently deleted, and the visitor\'s link stops working.',
      confirm: 'Delete',
      destructive: true,
    )) {
      return;
    }
    final ok = await _run(() => ref.read(conversationRepositoryProvider).delete(widget.conversationId), 'Conversation deleted.');
    if (ok && mounted) context.pop();
  }

  /// Runs a mutation once (guards double taps), toasting success/failure.
  Future<bool> _run(Future<void> Function() action, String success) async {
    if (_busy) return false;
    setState(() => _busy = true);
    try {
      await action();
      _toast(success);
      return true;
    } on ApiException catch (e) {
      // e.g. 409 "has an open report" — the server's reason is shown as-is.
      _toast(e.message);
      return false;
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final c = _conversation;
    final open = c != null && c.status == 'OPEN';
    return Scaffold(
      appBar: AppBar(
        title: Text(c?.reasonLabel ?? 'Conversation', maxLines: 1, overflow: TextOverflow.ellipsis),
        actions: [
          if (c != null)
            PopupMenuButton<String>(
              tooltip: 'Conversation actions',
              icon: const Icon(Icons.more_vert),
              enabled: !_busy,
              onSelected: (action) => switch (action) {
                'report' => _report(),
                'block' => _block(),
                'delete' => _delete(),
                _ => null,
              },
              itemBuilder: (_) => [
                const PopupMenuItem(value: 'report', child: _MenuRow(Icons.flag_outlined, 'Report conversation')),
                if (open) const PopupMenuItem(value: 'block', child: _MenuRow(Icons.block_outlined, 'Block conversation')),
                const PopupMenuItem(value: 'delete', child: _MenuRow(Icons.delete_outline, 'Delete conversation', danger: true)),
              ],
            ),
        ],
      ),
      body: c == null
          ? (_error != null
              ? ScrollableCenter(child: ErrorState(error: _error!, onRetry: _load))
              : const LoadingSkeleton(rows: 3, rowHeight: 64))
          : Column(
              children: [
                _ThreadHeader(conversation: c),
                Expanded(
                  child: RefreshIndicator(
                    onRefresh: _load,
                    child: ListView.builder(
                      controller: _scroll,
                      physics: const AlwaysScrollableScrollPhysics(),
                      padding: const EdgeInsets.fromLTRB(Space.md, Space.md, Space.md, Space.lg),
                      itemCount: c.messages.length,
                      itemBuilder: (context, i) => _Bubble(
                        message: c.messages[i],
                        showSender: i == 0 || c.messages[i - 1].senderType != c.messages[i].senderType,
                        showDate: i == 0 || !_sameDay(c.messages[i - 1].createdAt, c.messages[i].createdAt),
                      ),
                    ),
                  ),
                ),
                if (open) _Composer(controller: _replyController, sending: _sending, onSend: _reply) else _ClosedBar(status: c.status),
              ],
            ),
    );
  }

  bool _sameDay(DateTime a, DateTime b) {
    final x = a.toLocal(), y = b.toLocal();
    return x.year == y.year && x.month == y.month && x.day == y.day;
  }
}

class _MenuRow extends StatelessWidget {
  const _MenuRow(this.icon, this.label, {this.danger = false});
  final IconData icon;
  final String label;
  final bool danger;

  @override
  Widget build(BuildContext context) {
    final c = AppColors.of(context);
    final color = danger ? c.danger : c.ink;
    return Row(children: [Icon(icon, size: 20, color: color), const SizedBox(width: Space.sm), Text(label, style: TextStyle(color: color))]);
  }
}

class _ThreadHeader extends StatelessWidget {
  const _ThreadHeader({required this.conversation});
  final ConversationDetail conversation;

  @override
  Widget build(BuildContext context) {
    final c = AppColors.of(context);
    final t = Theme.of(context).textTheme;
    final started = conversation.messages.isEmpty ? null : conversation.messages.first.createdAt;
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(Space.page, 0, Space.page, Space.sm),
      decoration: BoxDecoration(color: c.background, border: Border(bottom: BorderSide(color: c.border))),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.directions_car_outlined, size: 16, color: c.slate),
              const SizedBox(width: 6),
              Expanded(
                child: Text(
                  [conversation.vehicleName, if (started != null) 'Started ${DateFormat('d MMM').format(started.toLocal())}'].join(' · '),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: t.bodyMedium,
                ),
              ),
              const SizedBox(width: Space.xs),
              StatusBadge.conversation(conversation.status),
            ],
          ),
          const SizedBox(height: 6),
          const PrivacyLabel('Private conversation · Contact details hidden'),
        ],
      ),
    );
  }
}

class _Bubble extends StatelessWidget {
  const _Bubble({required this.message, required this.showSender, required this.showDate});

  final ConversationMessage message;
  final bool showSender;
  final bool showDate;

  @override
  Widget build(BuildContext context) {
    final c = AppColors.of(context);
    final t = Theme.of(context).textTheme;
    final mine = message.senderType == 'OWNER';
    final maxWidth = MediaQuery.sizeOf(context).width * 0.8;
    return Column(
      crossAxisAlignment: mine ? CrossAxisAlignment.end : CrossAxisAlignment.start,
      children: [
        if (showDate)
          Padding(
            padding: const EdgeInsets.symmetric(vertical: Space.sm),
            child: Center(
              child: Text(DateFormat('EEE, d MMM').format(message.createdAt.toLocal()), style: t.bodySmall),
            ),
          ),
        if (showSender && !mine)
          Padding(
            padding: const EdgeInsets.only(left: 4, bottom: 4),
            child: Text('Visitor', style: t.labelSmall),
          ),
        Semantics(
          label: '${mine ? 'You' : 'Visitor'}: ${message.body}. ${messageTime(message.createdAt)}',
          excludeSemantics: true,
          child: Container(
            constraints: BoxConstraints(maxWidth: maxWidth),
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            decoration: BoxDecoration(
              color: mine ? c.primary : c.surface,
              borderRadius: BorderRadius.only(
                topLeft: const Radius.circular(Radii.lg),
                topRight: const Radius.circular(Radii.lg),
                bottomLeft: Radius.circular(mine ? Radii.lg : 4),
                bottomRight: Radius.circular(mine ? 4 : Radii.lg),
              ),
              border: mine ? null : Border.all(color: c.border),
            ),
            child: Text(
              message.body,
              style: t.bodyLarge?.copyWith(fontSize: 15, color: mine ? Colors.white : c.ink, height: 1.4),
            ),
          ),
        ),
        Padding(
          padding: const EdgeInsets.only(top: 4, bottom: Space.sm, left: 4, right: 4),
          child: Text('${mine ? 'You · ' : ''}${messageTime(message.createdAt)}', style: t.bodySmall?.copyWith(fontSize: 11)),
        ),
      ],
    );
  }
}

class _Composer extends StatelessWidget {
  const _Composer({required this.controller, required this.sending, required this.onSend});

  final TextEditingController controller;
  final bool sending;
  final VoidCallback onSend;

  @override
  Widget build(BuildContext context) {
    final c = AppColors.of(context);
    final canSend = controller.text.trim().isNotEmpty && !sending;
    return Container(
      decoration: BoxDecoration(color: c.surface, border: Border(top: BorderSide(color: c.border))),
      padding: const EdgeInsets.fromLTRB(Space.md, Space.xs + 2, Space.xs, Space.xs + 2),
      child: SafeArea(
        top: false,
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Expanded(
              child: TextField(
                controller: controller,
                minLines: 1,
                maxLines: 5,
                maxLength: 500,
                textCapitalization: TextCapitalization.sentences,
                textInputAction: TextInputAction.newline,
                decoration: InputDecoration(
                  hintText: 'Reply to the visitor…',
                  counterText: '',
                  filled: true,
                  fillColor: c.surface2,
                  isDense: true,
                  contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(Radii.xl), borderSide: BorderSide.none),
                  enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(Radii.xl), borderSide: BorderSide.none),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(Radii.xl),
                    borderSide: BorderSide(color: c.primary, width: 1.4),
                  ),
                ),
              ),
            ),
            const SizedBox(width: 4),
            AnimatedSwitcher(
              duration: Motion.of(context, Motion.fast),
              child: sending
                  ? const SizedBox(
                      key: ValueKey('sending'),
                      width: kMinTouch,
                      height: kMinTouch,
                      child: Center(child: SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))),
                    )
                  : IconButton.filled(
                      key: const ValueKey('send'),
                      tooltip: 'Send reply',
                      onPressed: canSend ? onSend : null,
                      icon: const Icon(Icons.send_outlined, size: 20),
                    ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ClosedBar extends StatelessWidget {
  const _ClosedBar({required this.status});
  final String status;

  @override
  Widget build(BuildContext context) {
    final c = AppColors.of(context);
    final t = Theme.of(context).textTheme;
    return Container(
      width: double.infinity,
      decoration: BoxDecoration(color: c.surface2, border: Border(top: BorderSide(color: c.border))),
      padding: const EdgeInsets.all(Space.md),
      child: SafeArea(
        top: false,
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.lock_outline, size: 16, color: c.slate),
            const SizedBox(width: Space.xs),
            Flexible(
              child: Text(
                status == 'BLOCKED' ? 'This conversation is blocked.' : 'This conversation has ended.',
                style: t.bodyMedium,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
