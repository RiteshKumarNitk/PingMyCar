import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../providers.dart';
import '../../components/components.dart';

/// Account: the Google identity (read-only) and app info.
class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = Theme.of(context).textTheme;
    final user = ref.watch(authControllerProvider).user;

    return Scaffold(
      appBar: AppBar(title: const Text('Account')),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(Space.page, Space.xs, Space.page, Space.xxl),
        children: [
          AppCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Google account', style: t.labelMedium),
                const SizedBox(height: Space.xs),
                Text(user?.hasRealName == true ? user!.name : 'Signed in', style: t.titleMedium),
                Text(user?.email ?? '', style: t.bodyMedium),
                const SizedBox(height: Space.sm),
                Text(
                  'You sign in with Google. PingMyCar never shows your name, email or phone number to visitors unless you choose to show your name on a vehicle page.',
                  style: t.bodySmall,
                ),
              ],
            ),
          ),
          const SizedBox(height: Space.md),
          AppCard(
            padding: EdgeInsets.zero,
            child: Column(
              children: [
                ListTile(
                  leading: const Icon(Icons.notifications_outlined),
                  title: const Text('Notifications'),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () => context.push('/settings/notifications'),
                ),
                const Divider(indent: 56),
                ListTile(
                  leading: const Icon(Icons.shield_outlined),
                  title: const Text('Privacy'),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () => context.push('/settings/privacy'),
                ),
              ],
            ),
          ),
          const SizedBox(height: Space.xl),
          Center(child: Text('PingMyCar · v0.1.0', style: t.bodySmall)),
        ],
      ),
    );
  }
}
