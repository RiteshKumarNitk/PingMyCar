import 'dart:math' as math;

import 'package:flutter/material.dart';
import '../theme/tokens.dart';
import 'brand_qr_data.dart';

/// Paints the brand QR (real, scannable) as crisp square modules inside the
/// given size. The caller provides the white card/quiet zone around it.
class BrandQrPainter extends CustomPainter {
  const BrandQrPainter({this.color = QrColors.ink});

  final Color color;

  @override
  void paint(Canvas canvas, Size size) {
    final n = kBrandQrRows.length;
    final cell = size.shortestSide / n;
    // One path, one draw call — cheap to repaint and to rasterize once.
    final path = Path();
    for (var y = 0; y < n; y++) {
      final row = kBrandQrRows[y];
      var x = 0;
      while (x < n) {
        if (row.codeUnitAt(x) != 0x23 /* # */) {
          x++;
          continue;
        }
        final start = x;
        while (x < n && row.codeUnitAt(x) == 0x23) {
          x++;
        }
        // Merge horizontal runs; +0.02 overlap avoids hairline seams.
        path.addRect(Rect.fromLTWH(start * cell, y * cell, (x - start) * cell + 0.02, cell + 0.02));
      }
    }
    canvas.drawPath(path, Paint()..color = color..isAntiAlias = false);
  }

  @override
  bool shouldRepaint(BrandQrPainter oldDelegate) => oldDelegate.color != color;
}

/// Where the QR sticker sits on the car, as fractions of the car box.
/// Rear windshield, centered, slightly below its middle.
const Rect kStickerOnCar = Rect.fromLTWH(0.425, 0.185, 0.15, 0.15 * kCarAspect);

/// Car box aspect (width / height).
const double kCarAspect = 1.45;

/// Minimal rear view of a modern car: soft body gradient, dark glass rear
/// windshield, full-width light bar, plate, tyres and a ground shadow.
/// Static — it never repaints during the animation (only its transform and
/// opacity change), so it rasterizes once behind a RepaintBoundary.
class RearCarPainter extends CustomPainter {
  const RearCarPainter({required this.dark});

  final bool dark;

  @override
  void paint(Canvas canvas, Size size) {
    final w = size.width, h = size.height;
    Offset p(double x, double y) => Offset(x * w, y * h);

    final bodyTop = dark ? const Color(0xFF34466A) : const Color(0xFF22324F);
    final bodyBottom = dark ? const Color(0xFF1C2944) : const Color(0xFF0B1524);
    final glassTop = dark ? const Color(0xFF5E6F8E) : const Color(0xFF55667F);
    final glassBottom = dark ? const Color(0xFF26344F) : const Color(0xFF1A273D);

    // Ground shadow.
    canvas.drawOval(
      Rect.fromCenter(center: p(0.5, 0.965), width: 0.94 * w, height: 0.07 * h),
      Paint()
        ..color = Colors.black.withValues(alpha: dark ? 0.45 : 0.16)
        ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 8),
    );

    // Tyres.
    final tyre = Paint()..color = dark ? const Color(0xFF26324A) : const Color(0xFF070C14);
    for (final x in [0.085, 0.775]) {
      canvas.drawRRect(
        RRect.fromRectAndRadius(Rect.fromLTWH(x * w, 0.74 * h, 0.14 * w, 0.225 * h), Radius.circular(0.03 * w)),
        tyre,
      );
    }

    // Lower body (trunk + bumper).
    final body = Path()
      ..moveTo(0.06 * w, 0.44 * h)
      ..quadraticBezierTo(0.08 * w, 0.40 * h, 0.16 * w, 0.40 * h)
      ..lineTo(0.84 * w, 0.40 * h)
      ..quadraticBezierTo(0.92 * w, 0.40 * h, 0.94 * w, 0.44 * h)
      ..lineTo(0.985 * w, 0.66 * h)
      ..quadraticBezierTo(0.995 * w, 0.84 * h, 0.94 * w, 0.855 * h)
      ..lineTo(0.06 * w, 0.855 * h)
      ..quadraticBezierTo(0.005 * w, 0.84 * h, 0.015 * w, 0.66 * h)
      ..close();

    // Cabin (greenhouse): tapered, rounded roof.
    final cabin = Path()
      ..moveTo(0.14 * w, 0.44 * h)
      ..lineTo(0.27 * w, 0.10 * h)
      ..quadraticBezierTo(0.29 * w, 0.055 * h, 0.35 * w, 0.055 * h)
      ..lineTo(0.65 * w, 0.055 * h)
      ..quadraticBezierTo(0.71 * w, 0.055 * h, 0.73 * w, 0.10 * h)
      ..lineTo(0.86 * w, 0.44 * h)
      ..close();

    final bodyPaint = Paint()
      ..shader = LinearGradient(
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
        colors: [bodyTop, bodyBottom],
      ).createShader(Offset.zero & size);
    canvas.drawPath(cabin, bodyPaint);
    canvas.drawPath(body, bodyPaint);

    // Mirrors.
    for (final x in [0.085, 0.855]) {
      canvas.drawRRect(
        RRect.fromRectAndRadius(Rect.fromLTWH(x * w, 0.30 * h, 0.06 * w, 0.06 * h), Radius.circular(0.015 * w)),
        Paint()..color = bodyTop,
      );
    }

    // Rear windshield glass.
    final glass = Path()
      ..moveTo(0.215 * w, 0.405 * h)
      ..lineTo(0.315 * w, 0.125 * h)
      ..quadraticBezierTo(0.325 * w, 0.10 * h, 0.35 * w, 0.10 * h)
      ..lineTo(0.65 * w, 0.10 * h)
      ..quadraticBezierTo(0.675 * w, 0.10 * h, 0.685 * w, 0.125 * h)
      ..lineTo(0.785 * w, 0.405 * h)
      ..close();
    canvas.drawPath(
      glass,
      Paint()
        ..shader = LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [glassTop, glassBottom],
        ).createShader(Rect.fromLTWH(0, 0.1 * h, w, 0.31 * h)),
    );
    // Soft diagonal reflection on the glass.
    canvas.save();
    canvas.clipPath(glass);
    canvas.drawPath(
      Path()
        ..moveTo(0.30 * w, 0.40 * h)
        ..lineTo(0.44 * w, 0.10 * h)
        ..lineTo(0.52 * w, 0.10 * h)
        ..lineTo(0.38 * w, 0.40 * h)
        ..close(),
      Paint()..color = Colors.white.withValues(alpha: 0.06),
    );
    canvas.restore();

    // Roof highlight.
    canvas.drawLine(
      p(0.36, 0.075),
      p(0.64, 0.075),
      Paint()
        ..color = Colors.white.withValues(alpha: 0.12)
        ..strokeWidth = 0.006 * w
        ..strokeCap = StrokeCap.round,
    );

    // Full-width light bar with a soft glow.
    final lightBar = RRect.fromRectAndRadius(Rect.fromLTWH(0.05 * w, 0.49 * h, 0.90 * w, 0.045 * h), Radius.circular(0.02 * w));
    canvas.drawRRect(
      lightBar.inflate(0.006 * w),
      Paint()
        ..color = const Color(0xFFE5484D).withValues(alpha: 0.35)
        ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 4),
    );
    canvas.drawRRect(
      lightBar,
      Paint()
        ..shader = const LinearGradient(
          colors: [Color(0xFFB4232A), Color(0xFFEF5A5F), Color(0xFFB4232A)],
        ).createShader(lightBar.outerRect),
    );

    // Trunk line + badge dot.
    canvas.drawLine(
      p(0.12, 0.58),
      p(0.88, 0.58),
      Paint()
        ..color = Colors.white.withValues(alpha: 0.07)
        ..strokeWidth = 0.004 * w,
    );

    // Licence plate (blank — no real registration shown).
    final plate = RRect.fromRectAndRadius(Rect.fromLTWH(0.37 * w, 0.62 * h, 0.26 * w, 0.095 * h), Radius.circular(0.012 * w));
    canvas.drawRRect(plate, Paint()..color = const Color(0xFFF2F4F8));
    canvas.drawRRect(
      plate,
      Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = 0.004 * w
        ..color = const Color(0xFF9AA5B8),
    );
    final dash = Paint()
      ..color = const Color(0xFFC3CAD6)
      ..strokeWidth = 0.012 * h
      ..strokeCap = StrokeCap.round;
    canvas.drawLine(p(0.41, 0.667), p(0.59, 0.667), dash);

    // Lower bumper band.
    canvas.drawRRect(
      RRect.fromRectAndRadius(Rect.fromLTWH(0.04 * w, 0.785 * h, 0.92 * w, 0.07 * h), Radius.circular(0.03 * w)),
      Paint()..color = Colors.black.withValues(alpha: 0.28),
    );
  }

  @override
  bool shouldRepaint(RearCarPainter oldDelegate) => oldDelegate.dark != dark;
}

/// Horizontal scan beam (brand blue → cyan → teal) with a soft trail.
class ScanBeamPainter extends CustomPainter {
  const ScanBeamPainter({required this.progress, required this.beam});

  /// 0..1 across the QR, top to bottom.
  final double progress;
  final Color beam;

  @override
  void paint(Canvas canvas, Size size) {
    if (progress <= 0 || progress >= 1) return;
    final y = size.height * progress;
    // Fade in at the start and out at the end of the sweep.
    final alpha = math.sin(progress * math.pi).clamp(0.0, 1.0);
    final trail = size.height * 0.22;
    canvas.drawRect(
      Rect.fromLTRB(0, (y - trail).clamp(0, size.height), size.width, y),
      Paint()
        ..shader = LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [beam.withValues(alpha: 0), beam.withValues(alpha: 0.18 * alpha)],
        ).createShader(Rect.fromLTRB(0, y - trail, size.width, y)),
    );
    canvas.drawRect(
      Rect.fromLTWH(0, y - 1.5, size.width, 3),
      Paint()
        ..shader = LinearGradient(colors: [
          const Color(0xFF2563EB).withValues(alpha: alpha),
          const Color(0xFF22B8CF).withValues(alpha: alpha),
          beam.withValues(alpha: alpha),
        ]).createShader(Rect.fromLTWH(0, y, size.width, 3)),
    );
  }

  @override
  bool shouldRepaint(ScanBeamPainter oldDelegate) => oldDelegate.progress != progress;
}

/// Two soft rings expanding from the sticker — "someone can reach you".
class PingRipplePainter extends CustomPainter {
  const PingRipplePainter({required this.progress, required this.color, required this.baseRadius});

  final double progress;
  final Color color;
  final double baseRadius;

  @override
  void paint(Canvas canvas, Size size) {
    if (progress <= 0) return;
    final center = size.center(Offset.zero);
    for (final delay in [0.0, 0.35]) {
      final t = ((progress - delay) / (1 - delay)).clamp(0.0, 1.0);
      if (t <= 0) continue;
      final eased = Curves.easeOutCubic.transform(t);
      canvas.drawCircle(
        center,
        baseRadius * (0.75 + 1.1 * eased),
        Paint()
          ..style = PaintingStyle.stroke
          ..strokeWidth = 2
          ..color = color.withValues(alpha: 0.55 * (1 - t)),
      );
    }
  }

  @override
  bool shouldRepaint(PingRipplePainter oldDelegate) => oldDelegate.progress != progress;
}
