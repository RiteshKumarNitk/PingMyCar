import 'package:flutter/material.dart';
import '../theme.dart';

/// The OwnerPing mark — the real logo tile (assets/brand/logo_mark.png, cut
/// from the app icon): navy tile, white QR-car, teal ping.
class BrandMark extends StatelessWidget {
  const BrandMark({super.key, this.size = 40, this.inverse = false});

  final double size;

  /// On navy/dark backgrounds: adds a hairline edge so the navy tile stays
  /// defined against a similar background.
  final bool inverse;

  static const asset = 'assets/brand/logo_mark.png';

  @override
  Widget build(BuildContext context) {
    final c = AppColors.of(context);
    final onDark = inverse || Theme.of(context).brightness == Brightness.dark;
    final radius = BorderRadius.circular(size * 0.2);
    return Semantics(
      label: 'OwnerPing',
      image: true,
      child: Container(
        width: size,
        height: size,
        foregroundDecoration: onDark
            ? BoxDecoration(borderRadius: radius, border: Border.all(color: c.onNavy.withValues(alpha: 0.18)))
            : null,
        child: ClipRRect(
          borderRadius: radius,
          child: Image.asset(
            asset,
            width: size,
            height: size,
            fit: BoxFit.cover,
            filterQuality: FilterQuality.medium,
            cacheWidth: (size * MediaQuery.devicePixelRatioOf(context)).round(),
            excludeFromSemantics: true,
          ),
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
