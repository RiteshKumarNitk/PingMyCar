import 'package:flutter/material.dart';
import '../../components/components.dart';

/// Static privacy explainer — reflects the backend's real behavior:
/// visitors never see owner contact info; the QR only exposes the public flow.
class PrivacyScreen extends StatelessWidget {
  const PrivacyScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final c = AppColors.of(context);
    final t = Theme.of(context).textTheme;
    return Scaffold(
      appBar: AppBar(title: const Text('Privacy')),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(Space.page, Space.xs, Space.page, Space.xxl),
        children: [
          Text('Visitors reach you through OwnerPing — never directly.', style: t.bodyLarge?.copyWith(color: c.slate)),
          const SizedBox(height: Space.lg),
          _Group(
            title: 'What visitors can see',
            icon: Icons.check_circle_outline,
            color: c.success,
            items: const [
              'Your vehicle\'s name or type — only if you enable it for that vehicle',
              'A form to send you a private message',
            ],
          ),
          const SizedBox(height: Space.md),
          _Group(
            title: 'What visitors never see',
            icon: Icons.remove_circle_outline,
            color: c.danger,
            items: const [
              'Your phone number',
              'Your email address',
              'Your registration number (unless you enable it)',
              'Your Google account or profile photo (unless you enable it)',
            ],
          ),
          const SizedBox(height: Space.md),
          AppCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(Icons.qr_code_2_outlined, color: c.primary),
                    const SizedBox(width: Space.sm),
                    Text('About the QR code', style: t.titleSmall),
                  ],
                ),
                const SizedBox(height: Space.xs),
                Text(
                  'The QR contains only a public link to your vehicle\'s contact page — no personal information and no account ids. You can turn it off anytime, or regenerate it so old stickers stop working.',
                  style: t.bodyMedium,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _Group extends StatelessWidget {
  const _Group({required this.title, required this.icon, required this.color, required this.items});

  final String title;
  final IconData icon;
  final Color color;
  final List<String> items;

  @override
  Widget build(BuildContext context) {
    final t = Theme.of(context).textTheme;
    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: t.titleSmall),
          const SizedBox(height: Space.sm),
          for (final item in items)
            Padding(
              padding: const EdgeInsets.only(bottom: Space.xs),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(icon, size: 18, color: color),
                  const SizedBox(width: Space.sm),
                  Expanded(child: Text(item, style: t.bodyMedium)),
                ],
              ),
            ),
        ],
      ),
    );
  }
}
