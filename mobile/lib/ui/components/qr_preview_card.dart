import 'package:flutter/material.dart';
import '../../config.dart';
import '../../models/models.dart';
import '../theme.dart';
import 'vehicle_card.dart';

/// The vehicle's real QR (backend PNG — same token/URL as the web app),
/// always rendered black-on-white with a quiet zone so it stays high
/// contrast and scannable, even in dark mode.
class QrPreviewCard extends StatelessWidget {
  const QrPreviewCard({
    super.key,
    required this.vehicle,
    required this.authHeader,
    this.qrSize = 232,
    this.showHeader = true,
    this.showIdentity = true,
  });

  final Vehicle vehicle;

  /// `Bearer` auth header value for the QR endpoint; null while loading.
  final String? authHeader;
  final double qrSize;
  final bool showHeader;

  /// Vehicle name + plate under the QR (off where the screen already shows them).
  final bool showIdentity;

  @override
  Widget build(BuildContext context) {
    final c = AppColors.of(context);
    final t = Theme.of(context).textTheme;
    const qrPaper = QrColors.paper;
    const qrInk = QrColors.ink;

    return Container(
      decoration: BoxDecoration(
        color: qrPaper,
        borderRadius: BorderRadius.circular(Radii.xl),
        border: Border.all(color: c.border),
        boxShadow: Shadows.raised(context),
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        children: [
          if (showHeader)
            Container(
              width: double.infinity,
              color: c.navy,
              padding: const EdgeInsets.symmetric(vertical: 12, horizontal: Space.md),
              child: Text(
                'SCAN TO CONTACT THE OWNER',
                textAlign: TextAlign.center,
                style: t.labelSmall?.copyWith(color: c.onNavy, letterSpacing: 2, fontSize: 11.5),
              ),
            ),
          Padding(
            padding: const EdgeInsets.fromLTRB(Space.lg, Space.lg, Space.lg, Space.md),
            child: Semantics(
              image: true,
              label: 'QR code for ${vehicle.name}. Scanning it opens the private contact page.',
              child: SizedBox(
                width: qrSize,
                height: qrSize,
                child: authHeader == null
                    ? const Center(child: CircularProgressIndicator())
                    : Image.network(
                        '${AppConfig.apiBaseUrl}/api/vehicles/${vehicle.id}/qr.png',
                        headers: {'Authorization': authHeader!},
                        fit: BoxFit.contain,
                        filterQuality: FilterQuality.none, // keep modules crisp
                        loadingBuilder: (context, child, progress) =>
                            progress == null ? child : const Center(child: CircularProgressIndicator()),
                        errorBuilder: (_, __, ___) => Center(
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(Icons.qr_code_2_outlined, size: 56, color: QrColors.placeholder),
                              const SizedBox(height: Space.xs),
                              Text("Couldn't load the QR", style: t.bodySmall?.copyWith(color: QrColors.placeholder)),
                            ],
                          ),
                        ),
                      ),
              ),
            ),
          ),
          if (showIdentity) ...[
            Text(vehicle.name, textAlign: TextAlign.center, style: t.titleMedium?.copyWith(color: qrInk)),
            if (vehicle.registrationNumber?.isNotEmpty == true) ...[
              const SizedBox(height: 6),
              PlateChip(vehicle.registrationNumber!),
            ],
            const SizedBox(height: Space.lg),
          ] else
            const SizedBox(height: Space.xs),
        ],
      ),
    );
  }
}
