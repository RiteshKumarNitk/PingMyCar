import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../core/api_error.dart';
import '../../models/models.dart';
import '../../providers.dart';

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
  String? _error;
  bool _sending = false;
  final _replyController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _load();
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
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() => _error = e.message);
    }
  }

  Future<void> _reply() async {
    final body = _replyController.text.trim();
    if (body.isEmpty) return;
    setState(() => _sending = true);
    try {
      await ref.read(conversationRepositoryProvider).reply(widget.conversationId, body);
      _replyController.clear();
      await _load();
    } on ApiException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
      }
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  Future<void> _report() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Report this conversation?'),
        content: const Text('Our team will review it. Reporting also hides nothing immediately — you can block the conversation separately.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
          FilledButton(onPressed: () => Navigator.pop(context, true), child: const Text('Report')),
        ],
      ),
    );
    if (confirmed != true) return;
    try {
      await ref.read(conversationRepositoryProvider).report(widget.conversationId);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Reported. Thank you.')));
      }
    } on ApiException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
      }
    }
  }

  Future<void> _block() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Block this conversation?'),
        content: const Text('The visitor will not be able to send further messages in this thread.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: const Color(0xFFDC2626)),
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Block'),
          ),
        ],
      ),
    );
    if (confirmed != true) return;
    try {
      await ref.read(conversationRepositoryProvider).block(widget.conversationId);
      await _load();
    } on ApiException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final c = _conversation;
    final closed = c == null || c.status != 'OPEN';
    return Scaffold(
      appBar: AppBar(
        title: const Text('Message'),
        actions: [
          if (c != null)
            PopupMenuButton<String>(
              onSelected: (action) {
                if (action == 'report') _report();
                if (action == 'block' && !closed) _block();
              },
              itemBuilder: (_) => [
                const PopupMenuItem(value: 'report', child: Text('Report conversation')),
                if (!closed) const PopupMenuItem(value: 'block', child: Text('Block visitor')),
              ],
            ),
        ],
      ),
      body: _error != null && c == null
          ? Center(child: Padding(padding: const EdgeInsets.all(24), child: Text(_error!, textAlign: TextAlign.center)))
          : c == null
              ? const Center(child: CircularProgressIndicator())
              : Column(
                  children: [
                    Container(
                      width: double.infinity,
                      color: Colors.white,
                      padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(c.reasonLabel, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: Color(0xFF0D1926))),
                          const SizedBox(height: 2),
                          Text(
                            '${c.vehicleName} · Started ${DateFormat('d MMM yyyy').format(c.messages.first.createdAt)}',
                            style: const TextStyle(fontSize: 12.5, color: Color(0xFF5B6773)),
                          ),
                        ],
                      ),
                    ),
                    Expanded(
                      child: ListView.builder(
                        padding: const EdgeInsets.all(16),
                        reverse: false,
                        itemCount: c.messages.length,
                        itemBuilder: (context, i) {
                          final m = c.messages[i];
                          final mine = m.senderType == 'OWNER';
                          return Align(
                            alignment: mine ? Alignment.centerRight : Alignment.centerLeft,
                            child: Container(
                              margin: const EdgeInsets.only(bottom: 10),
                              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                              constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.78),
                              decoration: BoxDecoration(
                                color: mine ? const Color(0xFF2563EB) : Colors.white,
                                borderRadius: BorderRadius.only(
                                  topLeft: const Radius.circular(16),
                                  topRight: const Radius.circular(16),
                                  bottomLeft: Radius.circular(mine ? 16 : 4),
                                  bottomRight: Radius.circular(mine ? 4 : 16),
                                ),
                                border: mine ? null : Border.all(color: const Color(0xFFE5E9EF)),
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    m.body,
                                    style: TextStyle(fontSize: 14.5, color: mine ? Colors.white : const Color(0xFF0D1926), height: 1.35),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    DateFormat('d MMM, h:mm a').format(m.createdAt),
                                    style: TextStyle(fontSize: 10.5, color: mine ? Colors.white70 : const Color(0xFF9AA6B2)),
                                  ),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
                    ),
                    if (!closed)
                      Container(
                        color: Colors.white,
                        padding: EdgeInsets.only(
                          left: 16,
                          right: 16,
                          top: 10,
                          bottom: MediaQuery.of(context).padding.bottom + 10,
                        ),
                        child: Row(
                          children: [
                            Expanded(
                              child: TextField(
                                controller: _replyController,
                                maxLines: null,
                                minLines: 1,
                                textInputAction: TextInputAction.send,
                                onSubmitted: (_) => _reply(),
                                decoration: const InputDecoration(hintText: 'Reply to visitor…'),
                              ),
                            ),
                            const SizedBox(width: 10),
                            IconButton.filled(
                              onPressed: _sending ? null : _reply,
                              icon: _sending
                                  ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                                  : const Icon(Icons.send),
                            ),
                          ],
                        ),
                      ),
                  ],
                ),
    );
  }
}
