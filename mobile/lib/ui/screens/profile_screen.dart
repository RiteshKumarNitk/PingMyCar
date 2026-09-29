import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../providers.dart';
import '../components/components.dart';

/// Profile: the Google identity from the backend session + settings entry
/// points. No phone/OTP settings exist — owners sign in with Google only.
class ProfileScreen extends ConsumerStatefulWidget {
  const ProfileScreen({super.key});

  @override
  ConsumerState<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends ConsumerState<ProfileScreen> {
  bool _signingOut = false;

  Future<void> _signOut() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Log out?'),
        content: const Text('You\'ll need to continue with Google again. This device will stop receiving notifications.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
          FilledButton(onPressed: () => Navigator.pop(context, true), child: const Text('Log out')),
        ],
      ),
    );
    if (confirmed != true || !mounted || _signingOut) return;
    setState(() => _signingOut = true);
    await ref.read(authControllerProvider.notifier).signOut();
    // The router redirects to sign-in; no need to reset state here.
  }

  @override
  Widget build(BuildContext context) {
    final c = AppColors.of(context);
    final t = Theme.of(context).textTheme;
    final user = ref.watch(authControllerProvider).user;
    final name = user?.hasRealName == true ? user!.name : 'OwnerPing owner';
    final initial = name.isNotEmpty ? name[0].toUpperCase() : '?';

    return Scaffold(
      appBar: AppBar(title: const Text('Profile')),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(Space.page, Space.xs, Space.page, Space.xxl),
        children: [
          // Google account on the brand gradient (logo tile colours).
          Container(
            padding: const EdgeInsets.all(Space.lg),
            decoration: BoxDecoration(
              gradient: c.brandGradient,
              borderRadius: BorderRadius.circular(Radii.xl),
              boxShadow: Shadows.raised(context),
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(2),
                  decoration: BoxDecoration(shape: BoxShape.circle, border: Border.all(color: c.accent, width: 2)),
                  child: CircleAvatar(
                    radius: 30,
                    backgroundColor: c.primary,
                    foregroundImage: user?.image != null ? NetworkImage(user!.image!) : null,
                    child: Text(initial, style: t.headlineSmall?.copyWith(color: c.onPrimary)),
                  ),
                ),
                const SizedBox(width: Space.md),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(name, maxLines: 1, overflow: TextOverflow.ellipsis, style: t.titleMedium?.copyWith(color: c.onNavy)),
                      const SizedBox(height: 2),
                      Text(
                        user?.email ?? '',
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: t.bodyMedium?.copyWith(color: c.onNavy.withValues(alpha: 0.72)),
                      ),
                      const SizedBox(height: Space.xs),
                      Row(
                        children: [
                          Icon(Icons.verified_outlined, size: 16, color: c.accent),
                          const SizedBox(width: 6),
                          Text('Signed in with Google', style: t.labelMedium?.copyWith(color: c.accent)),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: Space.sm),
          const PrivacyLabel('Your contact details are never shared with visitors.', icon: Icons.shield_outlined),
          const SizedBox(height: Space.xl),
          const SectionHeader(title: 'Settings'),
          AppCard(
            padding: EdgeInsets.zero,
            child: Column(
              children: [
                _Row(
                  icon: Icons.notifications_outlined,
                  title: 'Notifications',
                  subtitle: 'New message alerts on this device',
                  onTap: () => context.push('/settings/notifications'),
                ),
                const Divider(indent: 56),
                _Row(
                  icon: Icons.shield_outlined,
                  title: 'Privacy',
                  subtitle: 'What visitors can and cannot see',
                  onTap: () => context.push('/settings/privacy'),
                ),
                const Divider(indent: 56),
                _Row(
                  icon: Icons.sell_outlined,
                  title: 'Stickers',
                  subtitle: 'Designs, sizes and printing',
                  onTap: () => context.push('/stickers'),
                ),
                const Divider(indent: 56),
                _Row(
                  icon: Icons.manage_accounts_outlined,
                  title: 'Account',
                  subtitle: 'Google account and app info',
                  onTap: () => context.push('/settings'),
                ),
              ],
            ),
          ),
          const SizedBox(height: Space.xl),
          AppButton(
            label: 'Log out',
            icon: Icons.logout_outlined,
            variant: AppButtonVariant.secondary,
            loading: _signingOut,
            onPressed: _signOut,
          ),
        ],
      ),
    );
  }
}

class _Row extends StatelessWidget {
  const _Row({required this.icon, required this.title, required this.subtitle, required this.onTap});

  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: Icon(icon),
      title: Text(title),
      subtitle: Text(subtitle),
      trailing: const Icon(Icons.chevron_right),
      onTap: onTap,
    );
  }
}
