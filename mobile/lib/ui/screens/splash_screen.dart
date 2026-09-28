import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../providers.dart';
import '../components/components.dart';

class SplashScreen extends ConsumerStatefulWidget {
  const SplashScreen({super.key});

  @override
  ConsumerState<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends ConsumerState<SplashScreen> {
  @override
  void initState() {
    super.initState();
    unawaited(_startFlow());
  }

  Future<void> _startFlow() async {
    await Future<void>.delayed(const Duration(milliseconds: 1400));
    if (!mounted) return;

    final status = ref.read(authControllerProvider).status;
    if (status == AuthStatus.authenticated) {
      context.go('/home');
      return;
    }

    context.go('/login');
  }

  @override
  Widget build(BuildContext context) {
    final c = AppColors.of(context);
    final t = Theme.of(context).textTheme;
    return Scaffold(
      backgroundColor: c.navy,
      body: SafeArea(
        child: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const BrandMark(size: 72, inverse: true),
              const SizedBox(height: Space.lg),
              Text('PingMyCar', style: t.headlineMedium?.copyWith(color: c.onNavy)),
              const SizedBox(height: Space.xs),
              Text('Private vehicle contact', style: t.bodyMedium?.copyWith(color: c.onNavy.withValues(alpha: 0.7))),
              const SizedBox(height: Space.xxl),
              SizedBox(
                width: 22,
                height: 22,
                child: CircularProgressIndicator(
                  strokeWidth: 2.4,
                  color: c.onNavy.withValues(alpha: 0.85),
                  semanticsLabel: 'Loading',
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
