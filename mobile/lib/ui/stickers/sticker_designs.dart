import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import '../../qr/website_qr.dart';

/// The five OwnerPing sticker designs, ported 1:1 from the website's
/// `stickerSvgMarkup()` (lib/qr/sticker.ts — the single source of truth).
///
/// Every shape, colour, font size/weight, letter-spacing and coordinate is
/// the website's, drawn in the same viewBox coordinate system and scaled
/// uniformly, so the app and the website render the same sticker. The QR
/// encodes the same URL the website does (public vehicle URL + `?s=<variant>`)
/// with a grid identical to the website's (see WebsiteQr).
///
/// Keep in sync with lib/qr/sticker.ts — change both together.
enum StickerVariant { square, wide, plate, round, arrow }

class StickerSpec {
  const StickerSpec({
    required this.label,
    required this.placement,
    required this.mmW,
    required this.mmH,
    required this.sizeLabel,
    required this.viewW,
    required this.viewH,
  });

  final String label;
  final String placement;

  /// Physical print size (STICKER_PRINT_MM).
  final double mmW;
  final double mmH;
  final String sizeLabel;

  /// SVG viewBox the design is drawn in (STICKER_SOURCE_PX).
  final double viewW;
  final double viewH;

  double get aspect => viewW / viewH;
}

/// STICKER_VARIANTS + STICKER_PRINT_MM + STICKER_SOURCE_PX, in website order.
const kStickerSpecs = <StickerVariant, StickerSpec>{
  StickerVariant.square: StickerSpec(label: 'Window vinyl', placement: 'Rear windshield', mmW: 50, mmH: 78, sizeLabel: '50 × 78 mm', viewW: 360, viewH: 560),
  StickerVariant.wide: StickerSpec(label: 'Bumper strip', placement: 'Bumper or plate surround', mmW: 90, mmH: 35, sizeLabel: '90 × 35 mm', viewW: 560, viewH: 220),
  StickerVariant.plate: StickerSpec(label: 'License-plate sticker', placement: 'Bumper — plate style', mmW: 90, mmH: 35, sizeLabel: '90 × 35 mm', viewW: 560, viewH: 220),
  StickerVariant.round: StickerSpec(label: 'Round badge', placement: 'Side window or helmet', mmW: 50, mmH: 50, sizeLabel: 'Ø 50 mm', viewW: 420, viewH: 420),
  StickerVariant.arrow: StickerSpec(label: 'Arrow badge', placement: 'Side window — arrow style', mmW: 50, mmH: 50, sizeLabel: 'Ø 50 mm', viewW: 420, viewH: 420),
};

/// VEHICLE_TYPE_LABELS (lib/validation/vehicle.ts).
const kVehicleTypeLabels = {
  'CAR': 'Car',
  'BIKE': 'Motorcycle',
  'SCOOTER': 'Scooter',
  'TRUCK': 'Truck',
  'VAN': 'Van',
  'OTHER': 'Other',
};

/// The URL a sticker's QR encodes — identical to the website: the public
/// vehicle URL tagged with its variant (per-sticker scan analytics).
String stickerQrUrl(String publicUrl, StickerVariant variant) {
  final sep = publicUrl.contains('?') ? '&' : '?';
  return '$publicUrl${sep}s=${variant.name}';
}

// Website palette (sticker.ts).
const _navy = Color(0xFF0D1926);
const _blue = Color(0xFF2563EB);
const _lightBlue = Color(0xFFE8EFFC);
const _white = Color(0xFFFFFFFF);

class StickerPainter extends CustomPainter {
  StickerPainter({required this.variant, required this.publicUrl, this.vehicleType, this.fontFamily})
      : qr = WebsiteQr.encode(stickerQrUrl(publicUrl, variant));

  final StickerVariant variant;
  final String publicUrl;

  /// Backend vehicle type (CAR…); null hides the type line, as on the web.
  final String? vehicleType;
  final WebsiteQr qr;

  /// The app font (TextPainter doesn't inherit the theme). The website's
  /// stack is 'Segoe UI', 'Helvetica Neue', Arial — on phones that resolves
  /// to the system sans (Roboto / SF), which is what the app uses too.
  final String? fontFamily;

  String? get _typeLine => vehicleType == null ? null : kVehicleTypeLabels[vehicleType];

  @override
  void paint(Canvas canvas, Size size) {
    final spec = kStickerSpecs[variant]!;
    canvas.save();
    canvas.scale(size.width / spec.viewW, size.height / spec.viewH);
    switch (variant) {
      case StickerVariant.square:
        _square(canvas);
      case StickerVariant.wide:
        _wide(canvas);
      case StickerVariant.plate:
        _plate(canvas);
      case StickerVariant.round:
        _round(canvas);
      case StickerVariant.arrow:
        _arrow(canvas);
    }
    canvas.restore();
  }

  @override
  bool shouldRepaint(StickerPainter old) =>
      old.variant != variant || old.publicUrl != publicUrl || old.vehicleType != vehicleType || old.fontFamily != fontFamily;

  // ------------------------------------------------------------ primitives

  static Paint _fill(Color c, [double opacity = 1]) => Paint()..color = c.withValues(alpha: opacity);

  static void _rect(Canvas c, double x, double y, double w, double h, double rx, Paint p) =>
      c.drawRRect(RRect.fromRectAndRadius(Rect.fromLTWH(x, y, w, h), Radius.circular(rx)), p);

  /// SVG `stroke-dasharray`, starting at the path's origin like SVG does.
  static void _dashed(Canvas c, Path path, Color color, double opacity, double width, List<double> dash) {
    final paint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = width
      ..color = color.withValues(alpha: opacity);
    for (final metric in path.computeMetrics()) {
      var d = 0.0;
      var i = 0;
      while (d < metric.length) {
        final seg = dash[i % dash.length];
        if (i.isEven) c.drawPath(metric.extractPath(d, (d + seg).clamp(0, metric.length)), paint);
        d += seg;
        i++;
      }
    }
  }

  /// SVG rect path starts at (x+rx, y) and runs clockwise — match it so the
  /// dash phase lines up with the website.
  static Path _rrectPath(double x, double y, double w, double h, double rx) => Path()
    ..moveTo(x + rx, y)
    ..lineTo(x + w - rx, y)
    ..arcToPoint(Offset(x + w, y + rx), radius: Radius.circular(rx))
    ..lineTo(x + w, y + h - rx)
    ..arcToPoint(Offset(x + w - rx, y + h), radius: Radius.circular(rx))
    ..lineTo(x + rx, y + h)
    ..arcToPoint(Offset(x, y + h - rx), radius: Radius.circular(rx))
    ..lineTo(x, y + rx)
    ..arcToPoint(Offset(x + rx, y), radius: Radius.circular(rx))
    ..close();

  /// SVG circle path starts at (cx+r, cy) and runs clockwise.
  static Path _circlePath(double cx, double cy, double r) =>
      Path()..addArc(Rect.fromCircle(center: Offset(cx, cy), radius: r), 0, 2 * 3.141592653589793 - 1e-6);

  /// SVG `<text>`: x/y is the anchor point on the alphabetic baseline;
  /// letter-spacing is in em (applied after every glyph, like browsers).
  void _text(
    Canvas c,
    String s,
    double x,
    double baseline, {
    required double size,
    FontWeight weight = FontWeight.w400,
    Color color = _navy,
    double opacity = 1,
    double letterEm = 0,
    TextAlign anchor = TextAlign.left,
  }) {
    final tp = TextPainter(
      text: TextSpan(
        text: s,
        style: TextStyle(
          fontFamily: fontFamily,
          fontSize: size,
          fontWeight: weight,
          color: color.withValues(alpha: opacity),
          letterSpacing: letterEm * size,
          height: 1,
        ),
      ),
      textDirection: TextDirection.ltr,
    )..layout();
    final ascent = tp.computeDistanceToActualBaseline(TextBaseline.alphabetic);
    final dx = switch (anchor) {
      TextAlign.center => x - tp.width / 2,
      TextAlign.right => x - tp.width,
      _ => x,
    };
    tp.paint(c, Offset(dx, baseline - ascent));
  }

  /// qrPanelMarkup(): light-blue rounded frame, white panel (quiet zone),
  /// sharp navy modules sized from the inner white area.
  void _qrPanel(Canvas c, double tx, double ty, double panel, double pad) {
    c.save();
    c.translate(tx, ty);
    _rect(c, 0, 0, panel, panel, 14, _fill(_lightBlue));
    final inner = panel - pad * 2;
    _rect(c, pad, pad, inner, inner, 9, _fill(_white));
    final cell = inner / qr.size;
    final modules = Path();
    for (var r = 0; r < qr.size; r++) {
      for (var col = 0; col < qr.size; col++) {
        if (qr.isDark(r, col)) modules.addRect(Rect.fromLTWH(pad + col * cell, pad + r * cell, cell, cell));
      }
    }
    // Sharp modules (no rounding) — same as the website, for reliable scans.
    c.drawPath(modules, Paint()..color = _navy..isAntiAlias = false);
    c.restore();
  }

  // -------------------------------------------------------------- designs

  void _square(Canvas c) {
    const w = 360.0, h = 560.0, cx = w / 2;
    const pad = 26.0, title = 26.0, scan = 22.0, brand = 20.0, body = 12.0, qrSize = 240.0;
    _rect(c, 0, 0, w, h, 28, _fill(const Color(0xFFD7DDE6)));
    _rect(c, 6, 8, w - 12, h - 14, 24, _fill(const Color(0xFFC5CCD6)));
    _rect(c, 4, 4, w - 8, h - 12, 26, _fill(_white));
    _dashed(c, _rrectPath(10, 10, w - 20, h - 24, 20), _navy, 0.28, 1.5, const [5, 4]);
    c.drawPath(Path()..moveTo(w - 58, 8)..lineTo(w - 12, 8)..lineTo(w - 12, 54)..close(), _fill(_lightBlue));
    c.drawLine(
      const Offset(w - 58, 8),
      const Offset(w - 12, 54),
      Paint()..color = _navy.withValues(alpha: 0.18)..strokeWidth = 1,
    );
    _text(c, 'CONNECT WITH', cx, pad + 24, size: title, weight: FontWeight.w800, letterEm: 0.12, anchor: TextAlign.center);
    _text(c, 'VEHICLE OWNER', cx, pad + 24 + 32, size: title, weight: FontWeight.w800, letterEm: 0.12, anchor: TextAlign.center);
    _qrPanel(c, (w - qrSize) / 2, pad + 66, qrSize, 12);
    _text(c, 'SCAN HERE', cx, pad + 66 + qrSize + 42, size: scan, weight: FontWeight.w700, color: _blue, letterEm: 0.32, anchor: TextAlign.center);
    final type = _typeLine;
    if (type != null) {
      _text(c, type, cx, pad + 66 + qrSize + 66, size: body + 1, opacity: 0.8, anchor: TextAlign.center);
    }
    _text(c, 'Scan to connect with the vehicle owner.', cx, pad + 66 + qrSize + (type != null ? 88 : 76),
        size: body, opacity: 0.65, anchor: TextAlign.center);
    _rect(c, (w - 56) / 2, h - 66, 56, 3, 1.5, _fill(_blue));
    _text(c, 'OwnerPing', cx, h - 36, size: brand, weight: FontWeight.w800, letterEm: 0.02, anchor: TextAlign.center);
    _text(c, 'Your contact info stays private', cx, h - 16, size: 10, opacity: 0.6, anchor: TextAlign.center);
  }

  void _wide(Canvas c) {
    const w = 560.0, h = 220.0;
    const pad = 24.0, qrSize = 190.0, gap = 12.0, title = 26.0, scan = 22.0, brand = 18.0, body = 12.0;
    const qrY = (h - qrSize) / 2;
    const textX = pad + qrSize + gap + 16;
    _rect(c, 0, 0, w, h, 18, _fill(const Color(0xFFC5CCD6)));
    _rect(c, 4, 4, w - 8, h - 10, 16, _fill(_white));
    _dashed(c, _rrectPath(10, 10, w - 20, h - 22, 12), _navy, 0.28, 1.5, const [6, 4]);
    _qrPanel(c, pad, qrY, qrSize, 10);
    _text(c, 'CONNECT WITH', textX, qrY + 34, size: title, weight: FontWeight.w800, letterEm: 0.12);
    _text(c, 'VEHICLE OWNER', textX, qrY + 34 + 30, size: title, weight: FontWeight.w800, letterEm: 0.12);
    _text(c, 'SCAN HERE', textX, qrY + 106, size: scan, weight: FontWeight.w700, color: _blue, letterEm: 0.32);
    _text(c, 'Scan to connect with the vehicle owner.', textX, qrY + 130, size: body, opacity: 0.65);
    final type = _typeLine;
    if (type != null) _text(c, type, textX, qrY + 150, size: body + 1, opacity: 0.8);
    _text(c, 'OwnerPing', textX, h - pad - 6, size: brand, weight: FontWeight.w800);
  }

  void _plate(Canvas c) {
    const w = 560.0, h = 220.0, qrSize = 150.0;
    const qrY = (h - qrSize) / 2;
    _rect(c, 0, 0, w, h, 22, _fill(_navy));
    _rect(c, 10, 10, w - 20, h - 20, 14, _fill(const Color(0xFFF5F7FB)));
    _rect(c, 10, 10, 56, h - 20, 14, _fill(_blue));
    _rect(c, 52, 10, 14, h - 20, 0, _fill(_blue));
    c.drawCircle(const Offset(38, 46), 7, _fill(_white, 0.9));
    c.drawCircle(const Offset(38, h - 46), 7, _fill(_white, 0.9));
    c.save();
    c.translate(38, h / 2);
    c.rotate(-3.141592653589793 / 2);
    c.translate(-38, -h / 2);
    _text(c, 'PMC', 38, h / 2 + 6, size: 17, weight: FontWeight.w900, color: _white, anchor: TextAlign.center);
    c.restore();
    _qrPanel(c, 88, qrY, qrSize, 9);
    _text(c, 'SCAN ME', 262, qrY + 62, size: 46, weight: FontWeight.w900, letterEm: 0.06);
    _text(c, 'Point a camera — message the owner.', 262, qrY + 94, size: 13, opacity: 0.75);
    final type = _typeLine;
    if (type != null) _text(c, type, 262, qrY + 118, size: 12, weight: FontWeight.w700, color: _blue);
    _text(c, 'OwnerPing', 262, h - 26, size: 12, weight: FontWeight.w800);
    _text(c, 'Your number stays private', w - 18, h - 26, size: 11, opacity: 0.6, anchor: TextAlign.right);
  }

  void _roundLike(Canvas c, {required bool arrow}) {
    const s = 420.0, cx = s / 2;
    final qrSize = arrow ? 190.0 : 200.0;
    c.drawCircle(const Offset(cx, cx), 204, _fill(arrow ? _blue : const Color(0xFFC5CCD6)));
    c.drawCircle(const Offset(cx, cx), arrow ? 197 : 198, _fill(_white));
    _dashed(c, _circlePath(cx, cx, arrow ? 187 : 188), _navy, 0.28, 1.5, const [5, 4]);
    if (arrow) {
      _text(c, 'CONNECT WITH VEHICLE OWNER', cx, 76, size: 13.5, weight: FontWeight.w800, letterEm: 0.12, anchor: TextAlign.center);
      c.drawPath(
        Path()..moveTo(58, 148)..lineTo(116, 191)..lineTo(58, 234),
        Paint()
          ..style = PaintingStyle.stroke
          ..color = _blue
          ..strokeWidth = 15
          ..strokeCap = StrokeCap.round
          ..strokeJoin = StrokeJoin.round,
      );
      _qrPanel(c, 146, 102, qrSize, 10);
    } else {
      _text(c, 'CONNECT WITH OWNER', cx, 72, size: 15, weight: FontWeight.w800, letterEm: 0.18, anchor: TextAlign.center);
      _qrPanel(c, (s - qrSize) / 2, 88, qrSize, 10);
    }
    final y = arrow ? 328.0 : 318.0;
    _text(c, 'SCAN HERE', cx, y, size: 16, weight: FontWeight.w700, color: _blue, letterEm: 0.3, anchor: TextAlign.center);
    final type = _typeLine;
    if (type != null) _text(c, type, cx, arrow ? 349 : 340, size: 12, opacity: 0.8, anchor: TextAlign.center);
    _text(c, 'OwnerPing', cx, arrow ? 370 : 362, size: 13, weight: FontWeight.w800, anchor: TextAlign.center);
    _text(c, 'Number stays private', cx, arrow ? 388 : 380, size: 10, opacity: 0.6, anchor: TextAlign.center);
  }

  void _round(Canvas c) => _roundLike(c, arrow: false);
  void _arrow(Canvas c) => _roundLike(c, arrow: true);
}

/// A sticker at a given width, keeping the design's exact aspect ratio.
class StickerView extends StatelessWidget {
  const StickerView({super.key, required this.variant, required this.publicUrl, this.vehicleType, this.shadow = true});

  final StickerVariant variant;
  final String publicUrl;
  final String? vehicleType;

  /// Soft drop shadow, like the website preview (`drop-shadow-md`).
  final bool shadow;

  @override
  Widget build(BuildContext context) {
    final spec = kStickerSpecs[variant]!;
    final round = variant == StickerVariant.round || variant == StickerVariant.arrow;
    return Semantics(
      image: true,
      label: '${spec.label} QR sticker, ${spec.sizeLabel}',
      child: AspectRatio(
        aspectRatio: spec.aspect,
        child: DecoratedBox(
          decoration: shadow
              ? BoxDecoration(
                  shape: round ? BoxShape.circle : BoxShape.rectangle,
                  borderRadius: round ? null : BorderRadius.circular(18),
                  boxShadow: const [
                    BoxShadow(color: Color(0x1A000000), blurRadius: 6, offset: Offset(0, 4)),
                    BoxShadow(color: Color(0x0F000000), blurRadius: 3, offset: Offset(0, 2)),
                  ],
                )
              : const BoxDecoration(),
          child: RepaintBoundary(
            child: CustomPaint(
              painter: StickerPainter(
                variant: variant,
                publicUrl: publicUrl,
                vehicleType: vehicleType,
                // Theme font, not DefaultTextStyle: outside a Material, MaterialApp's
                // default style is its (monospace) error style.
                fontFamily: Theme.of(context).textTheme.bodyMedium?.fontFamily,
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// Renders a design to PNG at its physical print size and [dpi] — drawn from
/// the same vector painter (not a screenshot), for Download/Share.
Future<List<int>> renderStickerPng({
  required StickerVariant variant,
  required String publicUrl,
  String? vehicleType,
  String? fontFamily,
  double dpi = 300,
}) async {
  final spec = kStickerSpecs[variant]!;
  final width = (spec.mmW / 25.4 * dpi).round();
  final height = (width / spec.aspect).round(); // keep the design's exact aspect
  final recorder = ui.PictureRecorder();
  final canvas = Canvas(recorder);
  StickerPainter(variant: variant, publicUrl: publicUrl, vehicleType: vehicleType, fontFamily: fontFamily)
      .paint(canvas, Size(width.toDouble(), height.toDouble()));
  final image = await recorder.endRecording().toImage(width, height);
  final bytes = await image.toByteData(format: ui.ImageByteFormat.png);
  image.dispose();
  return bytes!.buffer.asUint8List();
}
