import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../config.dart';
import '../../core/api_error.dart';
import '../../providers.dart';
import '../components/components.dart';

/// The only sign-in surface: Continue with Google (backend Google OAuth).
/// No OTP, no password, no magic link — by product rule.
class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  bool _loading = false;
  String? _error;

  Future<void> _signIn() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      await ref.read(authControllerProvider.notifier).signInWithGoogle();
    } catch (e) {
      setState(() {
        _loading = false;
        _error = e is ApiException ? e.message : 'Sign-in failed. Please try again.';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final c = AppColors.of(context);
    final t = Theme.of(context).textTheme;
    return Scaffold(
      body: SafeArea(
        child: LayoutBuilder(
          builder: (context, constraints) => SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: Space.xl),
            child: ConstrainedBox(
              constraints: BoxConstraints(minHeight: constraints.maxHeight),
              child: IntrinsicHeight(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const SizedBox(height: Space.xl),
                    const Align(alignment: Alignment.centerLeft, child: BrandLogo(markSize: 36)),
                    const Spacer(),
                    Text(
                      'Connect with your vehicle without sharing personal information.',
                      style: t.headlineMedium,
                    ),
                    const SizedBox(height: Space.sm),
                    Text(
                      'People who scan your QR sticker can message you privately. You reply from here.',
                      style: t.bodyLarge?.copyWith(color: c.slate),
                    ),
                    const SizedBox(height: Space.xxl),
                    if (!AppConfig.googleConfigured) ...[
                      Container(
                        padding: const EdgeInsets.all(Space.sm + 2),
                        decoration: BoxDecoration(
                          color: c.warningSoft,
                          borderRadius: BorderRadius.circular(Radii.md),
                        ),
                        child: Text(
                          "Google sign-in isn't configured for this build. Run:\n"
                          'flutter run --dart-define=PINGMYCAR_GOOGLE_CLIENT_ID=<web-client-id>\n'
                          'See mobile/lib/config.dart for the full setup.',
                          style: t.bodySmall?.copyWith(color: c.warning, height: 1.45),
                        ),
                      ),
                      const SizedBox(height: Space.md),
                    ],
                    _GoogleButton(loading: _loading, onPressed: _signIn),
                    if (_error != null) ...[
                      const SizedBox(height: Space.sm),
                      Semantics(
                        liveRegion: true,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: Space.sm, vertical: 10),
                          decoration: BoxDecoration(color: c.dangerSoft, borderRadius: BorderRadius.circular(Radii.md)),
                          child: Row(
                            children: [
                              Icon(Icons.error_outline, size: 18, color: c.danger),
                              const SizedBox(width: Space.xs),
                              Expanded(child: Text(_error!, style: t.bodyMedium?.copyWith(color: c.danger))),
                            ],
                          ),
                        ),
                      ),
                    ],
                    const SizedBox(height: Space.md),
                    const PrivacyLabel('Your contact details are never shared with visitors.', center: true),
                    const Spacer(),
                    Padding(
                      padding: const EdgeInsets.only(bottom: Space.lg, top: Space.xl),
                      child: Text(
                        "Scanned a sticker? Visitors don't need this app — just send your message from the page that opened.",
                        textAlign: TextAlign.center,
                        style: t.bodySmall,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// Primary owner CTA — Google is the only owner sign-in.
class _GoogleButton extends StatelessWidget {
  const _GoogleButton({required this.loading, required this.onPressed});

  final bool loading;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    final c = AppColors.of(context);
    return Semantics(
      button: true,
      label: loading ? 'Signing in with Google' : 'Continue with Google',
      excludeSemantics: true,
      child: FilledButton(
        onPressed: loading ? null : onPressed,
        style: FilledButton.styleFrom(
          minimumSize: const Size.fromHeight(56),
          disabledBackgroundColor: c.primary.withValues(alpha: 0.7),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 28,
              height: 28,
              alignment: Alignment.center,
              decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(7)),
              child: loading
                  ? SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: c.primary))
                  : const _GoogleG(),
            ),
            const SizedBox(width: Space.sm),
            Flexible(
              child: Text(
                loading ? 'Signing in…' : 'Continue with Google',
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Google's four-color G, drawn inline (no asset dependency).
class _GoogleG extends StatelessWidget {
  const _GoogleG();

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 20,
      height: 20,
      child: CustomPaint(painter: _GoogleGPainter()),
    );
  }
}

class _GoogleGPainter extends CustomPainter {
  // Google brand colors — must stay exact (brand asset, not theme colors).
  static const _blue = Color(0xFF4285F4);
  static const _green = Color(0xFF34A853);
  static const _yellow = Color(0xFFFBBC05);
  static const _red = Color(0xFFEA4335);

  @override
  void paint(Canvas canvas, Size size) {
    final s = size.width / 24;
    final stroke = 4.2 * s;
    final center = Offset(12 * s, 12 * s);
    final rect = Rect.fromCircle(center: center, radius: 9 * s);
    Paint arc(Color color) => Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = stroke;
    double deg(double d) => d * 3.1415926535 / 180;

    // Ring segments (angles clockwise from 3 o'clock), open at the upper right.
    canvas.drawArc(rect, deg(-150), deg(108), false, arc(_red));
    canvas.drawArc(rect, deg(150), deg(60), false, arc(_yellow));
    canvas.drawArc(rect, deg(45), deg(105), false, arc(_green));
    canvas.drawArc(rect, deg(0), deg(46), false, arc(_blue));
    // Blue crossbar from the center to the ring's right edge.
    canvas.drawRect(
      Rect.fromLTRB(12 * s, 12 * s - stroke / 2, 12 * s + 9 * s + stroke / 2, 12 * s + stroke / 2),
      Paint()..color = _blue,
    );
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
