import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../providers.dart';

class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authControllerProvider).user;

    return Scaffold(
      appBar: AppBar(title: const Text('Settings')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Account', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 15, color: Color(0xFF0D1926))),
                  const SizedBox(height: 8),
                  Text(user?.hasRealName == true ? user!.name : 'Signed in', style: const TextStyle(fontWeight: FontWeight.w600)),
                  Text(user?.email ?? '', style: const TextStyle(fontSize: 13, color: Color(0xFF5B6773))),
                  const SizedBox(height: 6),
                  const Text(
                    'Signed in with Google. Your contact details are never shared with visitors.',
                    style: TextStyle(fontSize: 12.5, color: Color(0xFF5B6773)),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 12),
          Card(
            child: Column(
              children: [
                ListTile(
                  leading: const Icon(Icons.notifications_outlined),
                  title: const Text('Notifications'),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () => context.push('/settings/notifications'),
                ),
                const Divider(indent: 16, endIndent: 16),
                ListTile(
                  leading: const Icon(Icons.shield_outlined),
                  title: const Text('Privacy'),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () => context.push('/settings/privacy'),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          const Center(child: Text('PingMyCar mobile · v0.1.0', style: TextStyle(fontSize: 12, color: Color(0xFF9AA6B2)))),
        ],
      ),
    );
  }
}
