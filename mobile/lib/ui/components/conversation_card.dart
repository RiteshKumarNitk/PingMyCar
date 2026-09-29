import 'package:flutter/material.dart';
import '../../models/models.dart';
import '../theme.dart';
import 'app_card.dart';
import 'format.dart';
import 'states.dart';
import 'status_badge.dart';
import 'vehicle_card.dart' show vehicleTypeIcon;

/// Inbox card — one per conversation: vehicle, reason, latest message,
/// time, unread count and status, plus a ⋮ menu so the owner can delete a
/// conversation without opening it. Built only from the list preview (last
/// message), never from a full history.
class ConversationCard extends StatelessWidget {
  const ConversationCard({
    super.key,
    required this.conversation,
    required this.onTap,
    required this.onDelete,
    this.vehicleType,
    this.busy = false,
  });

  final ConversationSummary conversation;
  final VoidCallback onTap;
  final VoidCallback onDelete;
  final String? vehicleType;

  /// A delete for this card is in flight: the menu is disabled meanwhile.
  final bool busy;

  @override
  Widget build(BuildContext context) {
    final c = AppColors.of(context);
    final t = Theme.of(context).textTheme;
    final cv = conversation;
    final unread = cv.unread || cv.unreadCount > 0;
    final when = timeAgo(cv.lastMessageAt);

    return AppCard(
      padding: EdgeInsets.zero,
      borderColor: unread ? c.comm.withValues(alpha: 0.35) : null,
      onTap: onTap,
      semanticLabel: [
        if (unread) cv.unreadCount > 0 ? '${cv.unreadCount} unread' : 'Unread',
        cv.vehicleName,
        cv.reasonLabel,
        if (cv.lastMessageBody != null) cv.lastMessageBody!,
        when,
        if (cv.status != 'OPEN') cv.status.toLowerCase(),
      ].join(', '),
      // Min (not fixed) height: same footprint as the skeleton, but grows
      // with the user's text scale instead of clipping.
      child: ConstrainedBox(
        constraints: const BoxConstraints(minHeight: ConversationCardSkeleton.height),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: ExcludeSemantics(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(Space.md, Space.md, 0, Space.sm),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        width: 44,
                        height: 44,
                        decoration: BoxDecoration(color: c.primarySoft, borderRadius: BorderRadius.circular(Radii.md)),
                        child: Icon(vehicleTypeIcon(vehicleType), color: c.primaryInk, size: 22),
                      ),
                      const SizedBox(width: Space.sm),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Expanded(
                                  child: Text(
                                    cv.vehicleName,
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: t.titleSmall?.copyWith(fontSize: 15, fontWeight: unread ? FontWeight.w700 : FontWeight.w600),
                                  ),
                                ),
                                const SizedBox(width: Space.xs),
                                Text(when, style: t.bodySmall?.copyWith(color: unread ? c.primaryInk : c.muted)),
                              ],
                            ),
                            const SizedBox(height: 2),
                            Text(
                              cv.reasonLabel,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: t.labelMedium?.copyWith(color: c.primaryInk, fontWeight: FontWeight.w600),
                            ),
                            const SizedBox(height: 4),
                            Row(
                              children: [
                                Expanded(
                                  child: Text(
                                    cv.lastMessageBody ?? 'No messages yet',
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: t.bodyMedium?.copyWith(color: unread ? c.ink : c.slate),
                                  ),
                                ),
                                if (cv.status != 'OPEN') ...[
                                  const SizedBox(width: Space.xs),
                                  StatusBadge.conversation(cv.status),
                                ],
                                if (cv.unreadCount > 0) ...[
                                  const SizedBox(width: Space.xs),
                                  CountBadge(cv.unreadCount),
                                ],
                              ],
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.only(top: 4, right: 4),
              child: PopupMenuButton<String>(
                enabled: !busy,
                tooltip: 'More actions',
                icon: busy
                    ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2))
                    : Icon(Icons.more_vert, color: c.muted),
                onSelected: (v) {
                  if (v == 'delete') onDelete();
                },
                itemBuilder: (context) => [
                  PopupMenuItem(
                    value: 'delete',
                    child: Row(
                      children: [
                        Icon(Icons.delete_outline, color: c.danger, size: 20),
                        const SizedBox(width: Space.sm),
                        Text('Delete conversation', style: TextStyle(color: c.danger)),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Placeholder with the exact footprint of a [ConversationCard], so real
/// data fills the same space without shifting the layout.
class ConversationCardSkeleton extends StatelessWidget {
  const ConversationCardSkeleton({super.key});

  static const double height = 96;

  @override
  Widget build(BuildContext context) {
    return AppCard(
      padding: const EdgeInsets.fromLTRB(Space.md, Space.md, Space.md, Space.sm),
      child: const SizedBox(
        height: height - Space.md - Space.sm,
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SkeletonBox(width: 44, height: 44),
            SizedBox(width: Space.sm),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(child: Align(alignment: Alignment.centerLeft, child: SkeletonBox(width: 140, height: 14, radius: 6))),
                      SkeletonBox(width: 44, height: 10, radius: 5),
                    ],
                  ),
                  SizedBox(height: 10),
                  SkeletonBox(width: 90, height: 10, radius: 5),
                  SizedBox(height: 10),
                  SkeletonBox(height: 12, radius: 6),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
