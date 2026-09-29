import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api_error.dart';
import '../../../providers.dart';
import '../../components/components.dart';

/// Profile → Account → Delete account.
///
/// Explains exactly what happens, needs an explicit "I understand" plus a
/// final confirmation, then asks the server to delete the account. On
/// success the router's auth redirect returns to Google sign-in (no
/// authenticated screen stays reachable); on failure the owner stays signed
/// in, sees why, and can retry.
class DeleteAccountScreen extends ConsumerStatefulWidget {
  const DeleteAccountScreen({super.key});

  @override
  ConsumerState<DeleteAccountScreen> createState() => _DeleteAccountScreenState();
}

class _DeleteAccountScreenState extends ConsumerState<DeleteAccountScreen> {
  bool _understood = false;
  bool _deleting = false;
  String? _error;

  Future<void> _delete() async {
    if (_deleting) return;
    final c = AppColors.of(context);
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete your OwnerPing account?'),
        content: const Text(
          'Your account and associated personal data will be permanently removed according to our deletion policy.\n\nThis action cannot be undone.',
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: c.danger, foregroundColor: Colors.white),
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Delete Account'),
          ),
        ],
      ),
    );
    if (confirmed != true || !mounted) return;

    setState(() {
      _deleting = true;
      _error = null;
    });
    try {
      await ref.read(authControllerProvider.notifier).deleteAccount();
      // Signed out: the router's auth redirect moves to sign-in. The snackbar
      // is shown by the root messenger, so it survives the navigation.
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Your OwnerPing account was deleted.')));
      }
    } on ApiException catch (e) {
      if (mounted) setState(() => _error = e.message);
    } catch (_) {
      if (mounted) setState(() => _error = "We couldn't delete your account. Please try again.");
    } finally {
      if (mounted) setState(() => _deleting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final c = AppColors.of(context);
    final t = Theme.of(context).textTheme;

    Widget point(IconData icon, String text) => Padding(
          padding: const EdgeInsets.only(bottom: Space.sm),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(icon, size: 18, color: c.slate),
              const SizedBox(width: Space.sm),
              Expanded(child: Text(text, style: t.bodyMedium)),
            ],
          ),
        );

    return Scaffold(
      appBar: AppBar(title: const Text('Delete account')),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(Space.page, Space.xs, Space.page, Space.xxl),
        children: [
          AppCard(
            borderColor: c.danger.withValues(alpha: 0.35),
            padding: const EdgeInsets.all(Space.lg),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(color: c.dangerSoft, borderRadius: BorderRadius.circular(Radii.md)),
                  child: Icon(Icons.delete_forever_outlined, color: c.danger),
                ),
                const SizedBox(height: Space.md),
                Semantics(header: true, child: Text('Delete your OwnerPing account', style: t.titleMedium)),
                const SizedBox(height: Space.xs),
                Text('This is permanent and cannot be undone.', style: t.bodyMedium?.copyWith(color: c.danger)),
              ],
            ),
          ),
          const SizedBox(height: Space.xl),
          const SectionHeader(title: 'What will be deleted'),
          point(Icons.person_off_outlined, 'Your account, Google sign-in link, name, email and photo.'),
          point(Icons.directions_car_outlined, 'All your vehicles and their photos.'),
          point(Icons.qr_code_2_outlined, 'Their QR codes — printed stickers will stop working.'),
          point(Icons.chat_bubble_outline, 'All conversations and messages.'),
          point(Icons.notifications_off_outlined, 'Notifications on all your devices.'),
          const SizedBox(height: Space.xs),
          Text(
            'If a conversation is under an open abuse report, it is kept in anonymized form until our moderators finish the review.',
            style: t.bodySmall,
          ),
          const SizedBox(height: Space.lg),
          CheckboxListTile(
            value: _understood,
            onChanged: _deleting ? null : (v) => setState(() => _understood = v ?? false),
            controlAffinity: ListTileControlAffinity.leading,
            contentPadding: EdgeInsets.zero,
            title: Text('I understand my account and data will be permanently deleted.', style: t.bodyMedium?.copyWith(color: c.ink)),
          ),
          if (_error != null) ...[
            const SizedBox(height: Space.sm),
            Container(
              padding: const EdgeInsets.all(Space.sm),
              decoration: BoxDecoration(color: c.dangerSoft, borderRadius: BorderRadius.circular(Radii.md)),
              child: Semantics(
                liveRegion: true,
                child: Text(_error!, style: t.bodyMedium?.copyWith(color: c.danger)),
              ),
            ),
          ],
          const SizedBox(height: Space.md),
          AppButton(
            label: _error == null ? 'Delete Account' : 'Try again',
            icon: Icons.delete_forever_outlined,
            variant: AppButtonVariant.danger,
            loading: _deleting,
            onPressed: _understood ? _delete : null,
          ),
        ],
      ),
    );
  }
}
