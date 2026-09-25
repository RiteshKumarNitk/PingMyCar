import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../config.dart';
import '../../core/api_error.dart';
import '../../providers.dart';

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
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Spacer(),
              Container(
                width: 88,
                height: 88,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: const Color(0xFFE8EFFC),
                  borderRadius: BorderRadius.circular(24),
                ),
                child: const Text('🚗', style: TextStyle(fontSize: 44)),
              ),
              const SizedBox(height: 24),
              const Text(
                'PingMyCar',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 32, fontWeight: FontWeight.w800, color: Color(0xFF0D1926)),
              ),
              const SizedBox(height: 8),
              const Text(
                'Contact your vehicle. Keep your number private.',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 15, color: Color(0xFF5B6773)),
              ),
              const SizedBox(height: 48),
              if (!AppConfig.googleConfigured)
                Container(
                  padding: const EdgeInsets.all(14),
                  margin: const EdgeInsets.only(bottom: 16),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFDF3E2),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Text(
                    'Google sign-in isn\'t configured for this build. Run:\n'
                    'flutter run --dart-define=PINGMYCAR_GOOGLE_CLIENT_ID=<web-client-id>\n'
                    'See mobile/lib/config.dart for the full setup.',
                    style: TextStyle(fontSize: 12.5, color: Color(0xFF92610A), height: 1.4),
                  ),
                ),
              FilledButton.icon(
                onPressed: _loading ? null : _signIn,
                icon: _loading
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                      )
                    : const _GoogleG(),
                label: Text(_loading ? 'Signing in…' : 'Continue with Google'),
              ),
              if (_error != null) ...[
                const SizedBox(height: 16),
                Text(
                  _error!,
                  textAlign: TextAlign.center,
                  style: const TextStyle(color: Color(0xFFDC2626), fontSize: 14),
                ),
              ],
              const Spacer(),
              const Text(
                'Visitors never need this app — they just scan the QR sticker.',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 12.5, color: Color(0xFF9AA6B2)),
              ),
            ],
          ),
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
  @override
  void paint(Canvas canvas, Size size) {
    final s = size.width / 24;
    final blue = Paint()..color = const Color(0xFF4285F4);
    final green = Paint()..color = const Color(0xFF34A853);
    final yellow = Paint()..color = const Color(0xFFFBBC05);
    final red = Paint()..color = const Color(0xFFEA4335);

    // Blue bar: right side of the G.
    canvas.drawRRect(
      RRect.fromRectAndRadius(
        Rect.fromLTWH(12 * s, 10.27 * s, 11.49 * s, 4.51 * s),
        Radius.circular(2.25 * s),
      ),
      blue,
    );
    // Green: bottom-left arc.
    canvas.drawArc(
      Rect.fromLTWH(1.29 * s, 1.29 * s, 21.42 * s, 21.42 * s),
      0.35, // radians, sweep below-left
      1.1,
      true,
      green,
    );
    // Yellow: left bar.
    canvas.drawRRect(
      RRect.fromRectAndRadius(
        Rect.fromLTWH(0, 10.27 * s, 4.6 * s, 7.6 * s),
        Radius.circular(2.3 * s),
      ),
      yellow,
    );
    // Red: top-left arc.
    canvas.drawArc(
      Rect.fromLTWH(1.29 * s, 1.29 * s, 21.42 * s, 21.42 * s),
      3.5,
      1.2,
      true,
      red,
    );
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
