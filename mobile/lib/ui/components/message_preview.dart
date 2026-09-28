import 'package:flutter/material.dart';
import '../../models/models.dart';
import '../theme.dart';
import 'format.dart';
import 'status_badge.dart';

/// Inbox row: unread dot, reason, vehicle, latest message, time, status.
class MessagePreview extends StatelessWidget {
  const MessagePreview({super.key, required this.conversation, required this.onTap, this.showDivider = true});

  final ConversationSummary conversation;
  final VoidCallback onTap;
  final bool showDivider;

  @override
  Widget build(BuildContext context) {
    final c = AppColors.of(context);
    final t = Theme.of(context).textTheme;
    final unread = conversation.unread || conversation.unreadCount > 0;
    final when = timeAgo(conversation.lastMessageAt);

    return Semantics(
      button: true,
      label: [
        if (unread) 'Unread',
        conversation.reasonLabel,
        'about ${conversation.vehicleName}',
        if (conversation.lastMessageBody != null) conversation.lastMessageBody!,
        when,
      ].join(', '),
      excludeSemantics: true,
      child: InkWell(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.fromLTRB(Space.md, 14, Space.md, 14),
          decoration: BoxDecoration(
            border: showDivider ? Border(bottom: BorderSide(color: c.border)) : null,
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Padding(
                padding: const EdgeInsets.only(top: 7, right: 10),
                child: Container(
                  width: 8,
                  height: 8,
                  decoration: BoxDecoration(color: unread ? c.comm : Colors.transparent, shape: BoxShape.circle),
                ),
              ),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.baseline,
                      textBaseline: TextBaseline.alphabetic,
                      children: [
                        Expanded(
                          child: Text(
                            conversation.reasonLabel,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: t.titleSmall?.copyWith(
                              fontSize: 15,
                              fontWeight: unread ? FontWeight.w700 : FontWeight.w500,
                            ),
                          ),
                        ),
                        const SizedBox(width: Space.xs),
                        Text(when, style: t.bodySmall?.copyWith(color: unread ? c.comm : c.muted)),
                      ],
                    ),
                    const SizedBox(height: 2),
                    Text(conversation.vehicleName, maxLines: 1, overflow: TextOverflow.ellipsis, style: t.bodySmall),
                    if (conversation.lastMessageBody != null) ...[
                      const SizedBox(height: 4),
                      Text(
                        conversation.lastMessageBody!,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: t.bodyMedium?.copyWith(color: unread ? c.ink : c.slate),
                      ),
                    ],
                    if (conversation.unreadCount > 0 || conversation.status != 'OPEN') ...[
                      const SizedBox(height: Space.xs),
                      Wrap(
                        spacing: 6,
                        runSpacing: 6,
                        children: [
                          if (conversation.unreadCount > 0)
                            StatusBadge(StatusKind.unread, label: '${conversation.unreadCount} new'),
                          if (conversation.status != 'OPEN') StatusBadge.conversation(conversation.status),
                        ],
                      ),
                    ],
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
