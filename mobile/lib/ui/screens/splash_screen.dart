import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../providers.dart';
import '../components/components.dart';
import '../splash/splash_painters.dart';

/// Brand splash — the product story in ~3.3 s:
/// logo → QR appears → QR is scanned → QR moves onto the car's rear
/// windshield and becomes a sticker → a ping ripples out → "Connect
/// privately." → logo.
///
/// One AnimationController drives every beat through Intervals; the car and
/// QR are static CustomPainters behind RepaintBoundaries, so frames only
/// re-composite transforms/opacity. Fully offline — no network, no assets.
///
/// Navigation happens once BOTH the animation has finished (or was skipped)
/// AND the session restore has resolved: authenticated → /home (dashboard),
/// otherwise → /login (Google). Reduced motion: short fade of the final
/// composition only.
class SplashScreen extends ConsumerStatefulWidget {
  const SplashScreen({super.key});

  static const fullDuration = Duration(milliseconds: 3300);
  static const reducedDuration = Duration(milliseconds: 900);

  @override
  ConsumerState<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends ConsumerState<SplashScreen> with SingleTickerProviderStateMixin {
  late final AnimationController _controller = AnimationController(vsync: this, duration: SplashScreen.fullDuration);
  bool _reduced = false;
  bool _started = false;
  bool _animationDone = false;
  bool _navigated = false;
  ProviderSubscription<AuthState>? _authSub;

  // Beats, as fractions of 3.3 s.
  static const _t05 = 0.5 / 3.3, _t07 = 0.75 / 3.3, _t09 = 0.9 / 3.3, _t12 = 1.2 / 3.3;
  static const _t19 = 1.9 / 3.3, _t22 = 2.2 / 3.3, _t28 = 2.8 / 3.3, _t29 = 2.9 / 3.3;

  @override
  void initState() {
    super.initState();
    _controller.addStatusListener((status) {
      if (status == AnimationStatus.completed) {
        _animationDone = true;
        _maybeNavigate();
      }
    });
    // Session restore may finish before or after the animation.
    _authSub = ref.listenManual(authControllerProvider, (_, __) => _maybeNavigate());
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_started) return;
    _started = true;
    _reduced = MediaQuery.maybeDisableAnimationsOf(context) == true;
    _controller.duration = _reduced ? SplashScreen.reducedDuration : SplashScreen.fullDuration;
    _controller.forward();
  }

  @override
  void dispose() {
    _authSub?.close();
    _controller.dispose();
    super.dispose();
  }

  void _skip() {
    if (!_animationDone) _controller.value = 1; // completes → navigates
  }

  void _maybeNavigate() {
    if (_navigated || !_animationDone || !mounted) return;
    final status = ref.read(authControllerProvider).status;
    if (status == AuthStatus.unknown) {
      // Still restoring the session — show the waiting hint and wait.
      setState(() {});
      return;
    }
    _navigated = true;
    // Something else already moved on (a notification tap opened the
    // dashboard + conversation): don't wipe it with a second navigation.
    final router = GoRouter.of(context);
    if (router.routerDelegate.currentConfiguration.uri.path != '/splash') return;
    // Guests are never owners: only an authenticated session reaches the
    // dashboard; everyone else goes to Google sign-in.
    context.go(status == AuthStatus.authenticated ? '/home' : '/login');
  }

  double _seg(double begin, double end, [Curve curve = Curves.linear]) {
    final v = _controller.value;
    if (v <= begin) return 0;
    if (v >= end) return 1;
    return curve.transform((v - begin) / (end - begin));
  }

  @override
  Widget build(BuildContext context) {
    final c = AppColors.of(context);
    final dark = Theme.of(context).brightness == Brightness.dark;
    return Scaffold(
      backgroundColor: c.background,
      body: Stack(
        fit: StackFit.expand,
        children: [
          // The illustration is decorative: one spoken summary for it.
          Semantics(
            label: 'OwnerPing. Put the QR on your car so people can contact you privately.',
            hint: 'Double tap to skip',
            button: true,
            excludeSemantics: true,
            child: GestureDetector(
              behavior: HitTestBehavior.opaque,
              onTap: _skip,
              child: SafeArea(
                child: LayoutBuilder(
                  builder: (context, box) => AnimatedBuilder(
                    animation: _controller,
                    builder: (context, _) => _reduced ? _reducedScene(box, c, dark) : _scene(box, c, dark),
                  ),
                ),
              ),
            ),
          ),
          // Announced separately so screen readers hear the wait.
          if (_animationDone && !_navigated) const _RestoringHint(),
        ],
      ),
    );
  }

  // ---------------------------------------------------------------- layout

  /// All geometry derives from the available box, so portrait, landscape
  /// and small screens compose the same scene.
  ({Rect car, Rect sticker, Rect qrStart, double textTop, double logoTop}) _layout(BoxConstraints box) {
    final w = box.maxWidth, h = box.maxHeight;
    final carW = math.min(math.min(w * 0.76, 340.0), h * 0.42 * kCarAspect);
    final carH = carW / kCarAspect;
    final carTop = h * 0.50 - carH / 2;
    final car = Rect.fromLTWH((w - carW) / 2, carTop, carW, carH);
    final sticker = Rect.fromLTWH(
      car.left + kStickerOnCar.left * carW,
      car.top + kStickerOnCar.top * carH,
      kStickerOnCar.width * carW,
      kStickerOnCar.width * carW,
    );
    final qrSize = math.min(math.min(w * 0.5, 210.0), h * 0.34);
    final qrStart = Rect.fromCenter(center: Offset(w / 2, h * 0.47), width: qrSize, height: qrSize);
    return (car: car, sticker: sticker, qrStart: qrStart, textTop: car.bottom + h * 0.035, logoTop: h * 0.07);
  }

  // ----------------------------------------------------------------- scene

  Widget _scene(BoxConstraints box, AppColors c, bool dark) {
    final l = _layout(box);

    // Beat 1: logo in (0–0.5s), hands off to the QR (0.5–0.75s).
    final logoIn = _seg(0, _t05, Curves.easeOutCubic);
    final logoOut = _seg(_t05, _t07, Curves.easeInCubic);
    // Beat 2: QR appears (0.5–0.9s) and is scanned (0.75–1.2s).
    final qrIn = _seg(_t05, _t09, Curves.easeOutCubic);
    final scan = _seg(_t07, _t12, Curves.easeInOutSine);
    // Beat 3: car arrives (1.2–1.9s); QR travels onto it (1.2–2.2s).
    final carIn = _seg(_t12, _t19, Curves.easeOutCubic);
    final travel = _seg(_t12, _t22, Curves.easeInOutCubic);
    // Beat 4: attaches as a sticker (2.2–2.8s).
    final attach = _seg(_t22, _t28, Curves.easeOutCubic);
    // Beat 5: ping + message + logo (2.8–3.3s).
    final ping = _seg(_t28, 1.0);
    final message = _seg(_t28, 1.0, Curves.easeOutCubic);
    final logoBack = _seg(_t29, 1.0, Curves.easeOutCubic);

    // QR card geometry: centered card → sticker on the windshield, with a
    // small "press" (1.06 → 1.0) as it attaches.
    final rect = Rect.lerp(l.qrStart, l.sticker, travel)!;
    final press = 1 + 0.06 * (1 - attach) * (travel >= 1 ? 1 : 0);
    final qrRect = Rect.fromCenter(center: rect.center, width: rect.width * press, height: rect.height * press);
    final qrScaleIn = 0.88 + 0.12 * qrIn;

    return Stack(
      clipBehavior: Clip.none,
      children: [
        // Opening logo (center).
        if (logoOut < 1)
          Positioned.fill(
            child: Opacity(
              opacity: (logoIn * (1 - logoOut)).clamp(0.0, 1.0),
              child: Transform.translate(
                offset: Offset(0, -16 * logoOut),
                child: Transform.scale(scale: 0.92 + 0.08 * logoIn, child: const Center(child: _LogoLockup(markSize: 64))),
              ),
            ),
          ),

        // Car (rises in).
        if (carIn > 0)
          Positioned.fromRect(
            rect: l.car,
            child: Opacity(
              opacity: carIn,
              child: Transform.translate(
                offset: Offset(0, 36 * (1 - carIn)),
                child: RepaintBoundary(child: CustomPaint(painter: RearCarPainter(dark: dark))),
              ),
            ),
          ),

        // Ping ripple around the sticker.
        if (ping > 0)
          Positioned.fromRect(
            rect: Rect.fromCenter(center: l.sticker.center, width: l.sticker.width * 5, height: l.sticker.width * 5),
            child: IgnorePointer(
              child: CustomPaint(
                painter: PingRipplePainter(progress: ping, color: c.comm, baseRadius: l.sticker.width * 0.7),
              ),
            ),
          ),

        // QR card → sticker.
        if (qrIn > 0)
          Positioned.fromRect(
            rect: qrRect,
            child: Opacity(
              opacity: qrIn,
              child: Transform.scale(
                scale: travel > 0 ? 1 : qrScaleIn,
                child: _QrCard(
                  radius: _lerp(18, 3, travel),
                  shadow: 1 - travel,
                  scan: scan,
                  gloss: attach,
                  beam: c.comm,
                ),
              ),
            ),
          ),

        // "Connect privately."
        if (message > 0)
          Positioned(
            left: 0,
            right: 0,
            top: l.textTop,
            child: Opacity(
              opacity: message,
              child: Transform.translate(offset: Offset(0, 10 * (1 - message)), child: const _PrivacyMessage()),
            ),
          ),

        // Logo returns (top).
        if (logoBack > 0)
          Positioned(
            left: 0,
            right: 0,
            top: l.logoTop,
            child: Opacity(
              opacity: logoBack,
              child: const Center(child: _LogoLockup(markSize: 40)),
            ),
          ),

      ],
    );
  }

  /// Reduced motion: no travel, no scan, no ripple — the final composition
  /// fades in once, then we continue.
  Widget _reducedScene(BoxConstraints box, AppColors c, bool dark) {
    final l = _layout(box);
    final fade = _seg(0, 0.55, Curves.easeOut);
    return Opacity(
      opacity: fade,
      child: Stack(
        children: [
          Positioned(left: 0, right: 0, top: l.logoTop, child: const Center(child: _LogoLockup(markSize: 40))),
          Positioned.fromRect(rect: l.car, child: RepaintBoundary(child: CustomPaint(painter: RearCarPainter(dark: dark)))),
          Positioned.fromRect(rect: l.sticker, child: _QrCard(radius: 3, shadow: 0, scan: 0, gloss: 1, beam: c.comm)),
          Positioned(left: 0, right: 0, top: l.textTop, child: const _PrivacyMessage()),
        ],
      ),
    );
  }
}

double _lerp(double a, double b, double t) => a + (b - a) * t;

/// White card with the brand QR, a quiet zone, the scan beam and — once it
/// is a sticker — a faint gloss.
class _QrCard extends StatelessWidget {
  const _QrCard({required this.radius, required this.shadow, required this.scan, required this.gloss, required this.beam});

  final double radius;
  final double shadow; // 1 = floating card, 0 = flat sticker
  final double scan;
  final double gloss;
  final Color beam;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, box) {
        final size = box.maxWidth;
        final pad = size * 0.09; // quiet zone
        return DecoratedBox(
          decoration: BoxDecoration(
            color: QrColors.paper,
            borderRadius: BorderRadius.circular(radius),
            boxShadow: [
              BoxShadow(
                color: const Color(0xFF152033).withValues(alpha: 0.10 + 0.08 * shadow),
                blurRadius: 4 + 22 * shadow,
                offset: Offset(0, 1 + 9 * shadow),
                spreadRadius: -2 * shadow,
              ),
            ],
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(radius),
            child: Stack(
              fit: StackFit.expand,
              children: [
                Padding(
                  padding: EdgeInsets.all(pad),
                  child: const RepaintBoundary(child: CustomPaint(painter: BrandQrPainter())),
                ),
                if (scan > 0 && scan < 1) CustomPaint(painter: ScanBeamPainter(progress: scan, beam: beam)),
                if (gloss > 0)
                  DecoratedBox(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                        colors: [
                          Colors.white.withValues(alpha: 0.35 * gloss),
                          Colors.white.withValues(alpha: 0),
                          Colors.white.withValues(alpha: 0),
                        ],
                        stops: const [0, 0.35, 1],
                      ),
                    ),
                  ),
              ],
            ),
          ),
        );
      },
    );
  }
}

class _LogoLockup extends StatelessWidget {
  const _LogoLockup({required this.markSize});
  final double markSize;

  @override
  Widget build(BuildContext context) => BrandLogo(markSize: markSize);
}

class _PrivacyMessage extends StatelessWidget {
  const _PrivacyMessage();

  @override
  Widget build(BuildContext context) {
    final c = AppColors.of(context);
    final t = Theme.of(context).textTheme;
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 26,
              height: 26,
              decoration: BoxDecoration(color: c.commSoft, shape: BoxShape.circle),
              child: Icon(Icons.lock_outline, size: 15, color: c.comm),
            ),
            const SizedBox(width: Space.xs),
            Text('Connect Vehicle Owners', style: t.titleLarge),
          ],
        ),
        const SizedBox(height: 6),
        Text('No phone number required.', style: t.bodyMedium),
      ],
    );
  }
}

/// Only shown if the session restore is still running after the animation
/// (slow network) — never a generic spinner up front.
class _RestoringHint extends StatelessWidget {
  const _RestoringHint();

  @override
  Widget build(BuildContext context) {
    final c = AppColors.of(context);
    return Positioned(
      left: 0,
      right: 0,
      bottom: Space.xl,
      child: Center(
        child: SizedBox(
          width: 18,
          height: 18,
          child: CircularProgressIndicator(strokeWidth: 2, color: c.muted, semanticsLabel: 'Signing you in'),
        ),
      ),
    );
  }
}
