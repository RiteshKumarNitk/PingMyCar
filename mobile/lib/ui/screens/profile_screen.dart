import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../providers.dart';

/// Profile: Google identity from the backend session + entry points to
/// settings. No extra personal information is collected or shown.
class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authControllerProvider).user;

    return Scaffold(
      appBar: AppBar(title: const Text('Profile')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const SizedBox(height: 8),
          CircleAvatar(
            radius: 44,
            backgroundColor: const Color(0xFFE8EFFC),
            backgroundImage: user?.image != null ? NetworkImage(user!.image!) : null,
            child: user?.image == null
                ? Text(
                    (user?.name ?? '?').isNotEmpty ? user!.name[0].toUpperCase() : '?',
                    style: const TextStyle(fontSize: 32, fontWeight: FontWeight.w700, color: Color(0xFF2563EB)),
                  )
                : null,
          ),
          const SizedBox(height: 14),
          Text(
            user?.hasRealName == true ? user!.name : 'PingMyCar owner',
            textAlign: TextAlign.center,
            style: const TextStyle(fontSize: 19, fontWeight: FontWeight.w800, color: Color(0xFF0D1926)),
          ),
          Text(
            user?.email ?? '',
            textAlign: TextAlign.center,
            style: const TextStyle(fontSize: 13.5, color: Color(0xFF5B6773)),
          ),
          const SizedBox(height: 20),
          Card(
            child: Column(
              children: [
                ListTile(
                  leading: const Icon(Icons.notifications_outlined, color: Color(0xFF2563EB)),
                  title: const Text('Notifications'),
                  subtitle: const Text('Permission and preferences'),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () => context.push('/settings/notifications'),
                ),
                const Divider(indent: 16, endIndent: 16),
                ListTile(
                  leading: const Icon(Icons.shield_outlined, color: Color(0xFF2563EB)),
                  title: const Text('Privacy'),
                  subtitle: const Text('What visitors can and cannot see'),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () => context.push('/settings/privacy'),
                ),
                const Divider(indent: 16, endIndent: 16),
                ListTile(
                  leading: const Icon(Icons.settings_outlined, color: Color(0xFF2563EB)),
                  title: const Text('Settings'),
                  subtitle: const Text('Account, app info'),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () => context.push('/settings'),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          Card(
            child: ListTile(
              leading: const Icon(Icons.logout, color: Color(0xFFDC2626)),
              title: const Text('Sign out', style: TextStyle(color: Color(0xFFDC2626))),
              onTap: () async {
                final confirmed = await showDialog<bool>(
                  context: context,
                  builder: (context) => AlertDialog(
                    title: const Text('Sign out?'),
                    content: const Text('You will need to sign in with Google again. This device will stop receiving notifications.'),
                    actions: [
                      TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
                      FilledButton(onPressed: () => Navigator.pop(context, true), child: const Text('Sign Out')),
                    ],
                  ),
                );
                if (confirmed == true && context.mounted) {
                  await ref.read(authControllerProvider.notifier).signOut();
                }
              },
            ),
          ),
        ],
      ),
    );
  }
}
