import 'package:flutter/material.dart';
import '../theme.dart';

enum StatusKind { active, inactive, pending, verified, unread, read, open, closed, blocked, reported, suspended }

/// One status vocabulary for the whole app. Color is never the only signal:
/// every badge has a dot and a text label.
class StatusBadge extends StatelessWidget {
  const StatusBadge(this.kind, {super.key, this.label});

  /// Conversation status from the backend (OPEN | CLOSED | BLOCKED).
  factory StatusBadge.conversation(String status, {Key? key}) => StatusBadge(
        switch (status) {
          'OPEN' => StatusKind.open,
          'BLOCKED' => StatusKind.blocked,
          _ => StatusKind.closed,
        },
        key: key,
      );

  final StatusKind kind;
  final String? label;

  static const _labels = {
    StatusKind.active: 'Active',
    StatusKind.inactive: 'Inactive',
    StatusKind.pending: 'Pending',
    StatusKind.verified: 'Verified',
    StatusKind.unread: 'Unread',
    StatusKind.read: 'Read',
    StatusKind.open: 'Open',
    StatusKind.closed: 'Closed',
    StatusKind.blocked: 'Blocked',
    StatusKind.reported: 'Reported',
    StatusKind.suspended: 'Suspended',
  };

  @override
  Widget build(BuildContext context) {
    final c = AppColors.of(context);
    final (Color fg, Color bg) = switch (kind) {
      StatusKind.active || StatusKind.verified || StatusKind.open => (c.success, c.successSoft),
      StatusKind.pending || StatusKind.reported => (c.warning, c.warningSoft),
      StatusKind.unread => (c.comm, c.commSoft),
      StatusKind.blocked || StatusKind.suspended => (c.danger, c.dangerSoft),
      StatusKind.inactive || StatusKind.read || StatusKind.closed => (c.slate, c.surface2),
    };
    final text = label ?? _labels[kind]!;
    return Semantics(
      label: 'Status: $text',
      excludeSemantics: true,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
        decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(Radii.pill)),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(width: 6, height: 6, decoration: BoxDecoration(color: fg, shape: BoxShape.circle)),
            const SizedBox(width: 6),
            Text(
              text,
              style: Theme.of(context).textTheme.labelMedium?.copyWith(color: fg, fontSize: 12, fontWeight: FontWeight.w600),
            ),
          ],
        ),
      ),
    );
  }
}

/// Small teal count pill (unread messages).
class CountBadge extends StatelessWidget {
  const CountBadge(this.count, {super.key});
  final int count;

  @override
  Widget build(BuildContext context) {
    final c = AppColors.of(context);
    if (count <= 0) return const SizedBox.shrink();
    return Semantics(
      label: '$count unread',
      excludeSemantics: true,
      child: Container(
        constraints: const BoxConstraints(minWidth: 20),
        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
        decoration: BoxDecoration(color: c.comm, borderRadius: BorderRadius.circular(Radii.pill)),
        child: Text(
          count > 99 ? '99+' : '$count',
          textAlign: TextAlign.center,
          style: Theme.of(context).textTheme.labelSmall?.copyWith(color: Colors.white, letterSpacing: 0, fontSize: 11),
        ),
      ),
    );
  }
}
