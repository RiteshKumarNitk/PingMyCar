import 'package:flutter/material.dart';
import '../theme.dart';

/// The OwnerPing mark: a QR tile on midnight navy with a teal "ping" dot —
/// the same mark as the web app.
class BrandMark extends StatelessWidget {
  const BrandMark({super.key, this.size = 40, this.inverse = false});

  final double size;

  /// For navy backgrounds: translucent tile instead of solid navy.
  final bool inverse;

  @override
  Widget build(BuildContext context) {
    final c = AppColors.of(context);
    final dot = size * 0.3;
    // On dark backgrounds a navy tile vanishes — use the translucent style.
    final onDark = inverse || Theme.of(context).brightness == Brightness.dark;
    return Semantics(
      label: 'OwnerPing',
      image: true,
      child: SizedBox(
        width: size,
        height: size,
        child: Stack(
          clipBehavior: Clip.none,
          children: [
            Container(
              width: size,
              height: size,
              decoration: BoxDecoration(
                color: onDark ? c.onNavy.withValues(alpha: 0.1) : c.navy,
                borderRadius: BorderRadius.circular(size * 0.28),
                border: onDark ? Border.all(color: c.onNavy.withValues(alpha: 0.16)) : null,
              ),
              child: Icon(Icons.qr_code_2_outlined, size: size * 0.58, color: c.onNavy),
            ),
            Positioned(
              right: -dot * 0.2,
              top: -dot * 0.2,
              child: Container(
                width: dot,
                height: dot,
                decoration: BoxDecoration(
                  color: c.comm,
                  shape: BoxShape.circle,
                  border: Border.all(color: inverse ? c.navy : c.background, width: 2),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Mark + wordmark.
class BrandLogo extends StatelessWidget {
  const BrandLogo({super.key, this.markSize = 36, this.inverse = false});

  final double markSize;
  final bool inverse;

  @override
  Widget build(BuildContext context) {
    final c = AppColors.of(context);
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        BrandMark(size: markSize, inverse: inverse),
        SizedBox(width: markSize * 0.3),
        Text(
          'OwnerPing',
          style: Theme.of(context).textTheme.titleLarge?.copyWith(
                color: inverse ? c.onNavy : c.ink,
                fontSize: markSize * 0.52,
                letterSpacing: -0.3,
              ),
        ),
      ],
    );
  }
}
