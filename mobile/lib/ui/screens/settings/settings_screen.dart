import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../providers.dart';
import '../../components/components.dart';

/// Account: the Google identity (read-only), settings, account deletion and
/// app info (developer + contact).
class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});

  static final _website = Uri.parse('https://innovatex-technology.com/');
  static final _email = Uri.parse('mailto:info@innovatex-technology.com');

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final c = AppColors.of(context);
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
                  'You sign in with Google. OwnerPing never shows your name, email or phone number to visitors unless you choose to show your name on a vehicle page.',
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
          const SizedBox(height: Space.md),
          AppCard(
            padding: EdgeInsets.zero,
            child: ListTile(
              leading: Icon(Icons.delete_forever_outlined, color: c.danger),
              title: Text('Delete account', style: TextStyle(color: c.danger)),
              subtitle: const Text('Permanently delete your account and data'),
              trailing: const Icon(Icons.chevron_right),
              onTap: () => context.push('/settings/delete-account'),
            ),
          ),
          const SizedBox(height: Space.md),
          AppCard(
            padding: EdgeInsets.zero,
            child: Column(
              children: [
                ListTile(
                  leading: const Icon(Icons.mail_outline),
                  title: const Text('Contact us'),
                  subtitle: const Text('info@innovatex-technology.com'),
                  onTap: () => launchUrl(_email),
                ),
                const Divider(indent: 56),
                ListTile(
                  leading: const Icon(Icons.language_outlined),
                  title: const Text('Developed by InnovateX Technology'),
                  subtitle: const Text('innovatex-technology.com'),
                  trailing: const Icon(Icons.open_in_new, size: 18),
                  onTap: () => launchUrl(_website, mode: LaunchMode.externalApplication),
                ),
              ],
            ),
          ),
          const SizedBox(height: Space.xl),
          Center(child: Text('OwnerPing · v0.1.0', style: t.bodySmall)),
          const SizedBox(height: 2),
          Center(child: Text('Developed by InnovateX Technology', style: t.bodySmall)),
        ],
      ),
    );
  }
}
