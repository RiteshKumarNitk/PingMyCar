import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class WelcomeScreen extends StatelessWidget {
  const WelcomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 40),
              Container(
                width: 92,
                height: 92,
                decoration: BoxDecoration(
                  color: const Color(0xFFE8EFFC),
                  borderRadius: BorderRadius.circular(28),
                ),
                child: const Icon(
                  Icons.qr_code_2_rounded,
                  size: 48,
                  color: Color(0xFF2563EB),
                ),
              ),
              const SizedBox(height: 22),
              Text(
                'Welcome to PingMyCar',
                textAlign: TextAlign.center,
                style: theme.textTheme.headlineMedium?.copyWith(
                  fontWeight: FontWeight.w800,
                  color: const Color(0xFF0D1926),
                  letterSpacing: -0.7,
                ),
              ),
              const SizedBox(height: 12),
              const Text(
                'Manage your vehicles, protect your number, and reply to visitors privately from one place.',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 15,
                  height: 1.5,
                  color: Color(0xFF5B6773),
                ),
              ),
              const SizedBox(height: 32),
              _FeatureTile(
                icon: Icons.directions_car_rounded,
                title: 'Vehicle dashboard',
                subtitle: 'Track your cars, QR codes, and active listings.',
              ),
              const SizedBox(height: 16),
              _FeatureTile(
                icon: Icons.lock_outline_rounded,
                title: 'Private contact',
                subtitle: 'Keep your personal details hidden while still receiving messages.',
              ),
              const SizedBox(height: 16),
              _FeatureTile(
                icon: Icons.notifications_active_outlined,
                title: 'Real-time updates',
                subtitle: 'Stay on top of visitors and new messages as they arrive.',
              ),
              const Spacer(),
              FilledButton.icon(
                onPressed: () => context.go('/login'),
                icon: const Icon(Icons.arrow_forward_rounded),
                label: const Text('Get started'),
              ),
              const SizedBox(height: 12),
              TextButton(
                onPressed: () => context.go('/login'),
                child: const Text('Already have an account? Sign in'),
              ),
              const SizedBox(height: 20),
            ],
          ),
        ),
      ),
    );
  }
}

class _FeatureTile extends StatelessWidget {
  const _FeatureTile({
    required this.icon,
    required this.title,
    required this.subtitle,
  });

  final IconData icon;
  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE5E9EF)),
      ),
      child: Row(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: const Color(0xFFE8EFFC),
              borderRadius: BorderRadius.circular(14),
            ),
            child: Icon(icon, color: const Color(0xFF2563EB)),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF0D1926),
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  subtitle,
                  style: const TextStyle(
                    fontSize: 13,
                    color: Color(0xFF5B6773),
                    height: 1.4,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
