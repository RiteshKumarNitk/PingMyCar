import 'package:flutter/material.dart';
import '../../models/models.dart';
import '../theme.dart';
import 'status_badge.dart';

IconData vehicleTypeIcon(String? type) => switch (type) {
      'BIKE' => Icons.two_wheeler_outlined,
      'SCOOTER' => Icons.moped_outlined,
      'TRUCK' => Icons.local_shipping_outlined,
      'VAN' => Icons.airport_shuttle_outlined,
      _ => Icons.directions_car_outlined,
    };

/// Vehicle photo, or a type icon on a soft brand tile.
class VehicleAvatar extends StatelessWidget {
  const VehicleAvatar({super.key, required this.vehicle, this.size = 56});

  final Vehicle vehicle;
  final double size;

  @override
  Widget build(BuildContext context) {
    final c = AppColors.of(context);
    final radius = BorderRadius.circular(size * 0.25);
    final fallback = Container(
      width: size,
      height: size,
      decoration: BoxDecoration(color: c.primarySoft, borderRadius: radius),
      child: Icon(vehicleTypeIcon(vehicle.type), color: c.primary, size: size * 0.5),
    );
    final url = vehicle.photoUrl;
    if (url == null || url.isEmpty) return fallback;
    return ClipRRect(
      borderRadius: radius,
      child: Image.network(
        url,
        width: size,
        height: size,
        fit: BoxFit.cover,
        semanticLabel: vehicle.name,
        errorBuilder: (_, __, ___) => fallback,
      ),
    );
  }
}

/// Registration number styled like a number plate.
class PlateChip extends StatelessWidget {
  const PlateChip(this.registration, {super.key});
  final String registration;

  @override
  Widget build(BuildContext context) {
    final c = AppColors.of(context);
    return Semantics(
      label: 'Registration $registration',
      excludeSemantics: true,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
        decoration: BoxDecoration(
          color: c.surface2,
          borderRadius: BorderRadius.circular(5),
          border: Border.all(color: c.inputBorder),
        ),
        child: Text(
          registration.toUpperCase(),
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: Theme.of(context).textTheme.labelSmall?.copyWith(
                color: c.ink,
                fontSize: 11.5,
                letterSpacing: 1.2,
                fontFeatures: const [FontFeature.tabularFigures()],
              ),
        ),
      ),
    );
  }
}

/// Premium vehicle card: identity + status + message count, with the four
/// quick actions (View, QR, Messages, Edit) on a quiet action bar.
class VehicleCard extends StatelessWidget {
  const VehicleCard({
    super.key,
    required this.vehicle,
    required this.onView,
    required this.onQr,
    required this.onMessages,
    required this.onEdit,
    this.conversationCount,
    this.unreadCount = 0,
    this.countIsPartial = false,
  });

  final Vehicle vehicle;
  final VoidCallback onView;
  final VoidCallback onQr;
  final VoidCallback onMessages;
  final VoidCallback onEdit;

  /// Null when unknown (don't show a misleading 0).
  final int? conversationCount;
  final int unreadCount;

  /// True when the count only covers the most recent conversations.
  final bool countIsPartial;

  @override
  Widget build(BuildContext context) {
    final c = AppColors.of(context);
    final t = Theme.of(context).textTheme;
    final radius = BorderRadius.circular(Radii.lg);
    final count = conversationCount;

    return Container(
      decoration: BoxDecoration(
        color: c.surface,
        borderRadius: radius,
        border: Border.all(color: c.border),
        boxShadow: Shadows.card(context),
      ),
      clipBehavior: Clip.antiAlias,
      child: Material(
        type: MaterialType.transparency,
        child: Column(
          children: [
            InkWell(
              onTap: onView,
              child: Padding(
                padding: const EdgeInsets.all(Space.md),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    VehicleAvatar(vehicle: vehicle, size: 56),
                    const SizedBox(width: Space.md),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(vehicle.name, maxLines: 1, overflow: TextOverflow.ellipsis, style: t.titleMedium),
                          const SizedBox(height: 6),
                          Wrap(
                            spacing: Space.xs,
                            runSpacing: Space.xs,
                            crossAxisAlignment: WrapCrossAlignment.center,
                            children: [
                              if (vehicle.registrationNumber?.isNotEmpty == true)
                                PlateChip(vehicle.registrationNumber!)
                              else
                                Text(vehicle.typeLabel, style: t.bodySmall),
                              StatusBadge(
                                vehicle.qrActive ? StatusKind.active : StatusKind.inactive,
                                label: vehicle.qrActive ? 'QR active' : 'QR off',
                              ),
                            ],
                          ),
                          if (count != null || unreadCount > 0) ...[
                            const SizedBox(height: Space.xs),
                            Row(
                              children: [
                                Icon(Icons.chat_bubble_outline, size: 14, color: c.muted),
                                const SizedBox(width: 6),
                                if (count != null)
                                  Text(
                                    '$count${countIsPartial ? '+' : ''} ${count == 1 ? 'conversation' : 'conversations'}',
                                    style: t.bodySmall,
                                  ),
                                if (unreadCount > 0) ...[
                                  const SizedBox(width: Space.xs),
                                  StatusBadge(StatusKind.unread, label: '$unreadCount new'),
                                ],
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
            Container(height: 1, color: c.border),
            Row(
              children: [
                _Action(icon: Icons.visibility_outlined, label: 'View', onTap: onView),
                _divider(c),
                _Action(icon: Icons.qr_code_2_outlined, label: 'QR', onTap: onQr),
                _divider(c),
                _Action(icon: Icons.chat_bubble_outline, label: 'Messages', onTap: onMessages),
                _divider(c),
                _Action(icon: Icons.edit_outlined, label: 'Edit', onTap: onEdit),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _divider(AppColors c) => Container(width: 1, height: 28, color: c.border);
}

class _Action extends StatelessWidget {
  const _Action({required this.icon, required this.label, required this.onTap});

  final IconData icon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final c = AppColors.of(context);
    return Expanded(
      child: Semantics(
        button: true,
        label: label,
        excludeSemantics: true,
        child: InkWell(
          onTap: onTap,
          child: SizedBox(
            height: kMinTouch + 4,
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(icon, size: 20, color: c.slate),
                const SizedBox(height: 2),
                Text(
                  label,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: Theme.of(context).textTheme.labelMedium?.copyWith(fontSize: 12),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
