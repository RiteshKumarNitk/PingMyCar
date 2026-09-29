import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../providers.dart';
import '../../../services/fcm/fcm_bootstrap.dart';
import '../../components/components.dart';

/// Notification settings for this device.
///
/// Always shows the REAL state, read from the OS — and re-read every time
/// the app returns to the foreground (e.g. after the owner changes it in
/// system settings). "Turn on notifications" asks Android first; if Android
/// won't show its dialog (already denied) it opens Settings → Apps →
/// OwnerPing → Notifications. Once enabled, this device's token is
/// registered with the backend. Other devices are never affected.
class NotificationsScreen extends ConsumerStatefulWidget {
  const NotificationsScreen({super.key});

  @override
  ConsumerState<NotificationsScreen> createState() => _NotificationsScreenState();
}

enum _View { checking, unavailable, off, denied, channelOff, on, registrationFailed }

class _NotificationsScreenState extends ConsumerState<NotificationsScreen> with WidgetsBindingObserver {
  _View _view = _View.checking;
  bool _working = false;

  /// Set once the OS refused (no dialog, or the owner said no) — the next
  /// step is system settings, so the copy says so.
  bool _refused = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _refresh();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    // Back from system settings (or anywhere): re-check the real state.
    if (state == AppLifecycleState.resumed) _refresh(fromResume: true);
  }

  Future<void> _refresh({bool fromResume = false}) async {
    // Demo sessions never register this device for real owner notifications.
    if (ref.read(authControllerProvider).isGuest) {
      if (mounted) setState(() => _view = _View.unavailable);
      return;
    }
    final fcm = ref.read(fcmInstanceProvider);
    if (fcm == null) return; // Firebase still starting — the listener in build re-runs this.
    final status = await fcm.status();
    if (!mounted) return;
    if (status == NotificationStatus.enabled) {
      final wasOff = _view != _View.on && _view != _View.checking;
      setState(() => _view = _View.on);
      // Make sure the backend can reach this device (throttled; no-op if
      // already registered for this owner).
      final ok = await fcm.syncToken(force: wasOff && fromResume);
      if (!mounted) return;
      if (!ok) setState(() => _view = _View.registrationFailed);
      if (ok && wasOff && fromResume) _toast("Notifications are on. You'll be alerted about new messages.");
      return;
    }
    setState(() {
      _view = switch (status) {
        NotificationStatus.unavailable => _View.unavailable,
        NotificationStatus.channelOff => _View.channelOff,
        _ => _refused ? _View.denied : _View.off,
      };
    });
  }

  Future<void> _turnOn() async {
    final fcm = ref.read(fcmInstanceProvider);
    if (fcm == null || _working) return;
    setState(() => _working = true);
    try {
      if (_view == _View.off) {
        final status = await fcm.requestPermission();
        if (status == NotificationStatus.enabled) {
          await _refresh();
          if (mounted && _view == _View.on) _toast("You'll be notified when someone contacts your vehicle.");
          return;
        }
        _refused = true;
      }
      // Denied for good, switched off for the app, or the message channel
      // is muted: only system settings can change it. The state is
      // re-checked when the owner comes back (didChangeAppLifecycleState).
      final opened = await fcm.openSystemSettings(channel: _view == _View.channelOff);
      if (!opened) _toast('Open Settings → Apps → OwnerPing → Notifications to allow alerts.');
      await _refresh();
    } finally {
      if (mounted) setState(() => _working = false);
    }
  }

  Future<void> _retryRegistration() async {
    final fcm = ref.read(fcmInstanceProvider);
    if (fcm == null || _working) return;
    setState(() => _working = true);
    final ok = await fcm.syncToken(force: true);
    if (mounted) {
      setState(() {
        _working = false;
        _view = ok ? _View.on : _View.registrationFailed;
      });
    }
    if (ok) _toast("You'll be notified when someone contacts your vehicle.");
  }

  void _toast(String message) {
    if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
  }

  @override
  Widget build(BuildContext context) {
    final c = AppColors.of(context);
    final t = Theme.of(context).textTheme;
    // Firebase initializes after the first frame; check as soon as it's ready.
    ref.listen(fcmInstanceProvider, (prev, next) {
      if (prev == null && next != null) _refresh();
    });

    final (StatusKind kind, String badge, String headline, String body) = switch (_view) {
      _View.checking => (StatusKind.pending, 'Checking', 'Notifications', 'Checking this device\'s notification settings…'),
      _View.unavailable => ref.read(authControllerProvider).isGuest
          ? (
              StatusKind.inactive,
              'Demo',
              'Not available in demo mode',
              'Sign in with Google to get alerts on this device when someone contacts your vehicle.',
            )
          : (
              StatusKind.inactive,
              'Unavailable',
              'Notifications aren\'t available',
              'This build or device can\'t receive push notifications. Messages still appear in the app.',
            ),
      _View.off => (
          StatusKind.inactive,
          'Off',
          'Notifications are off',
          'Get notified when someone contacts you through your OwnerPing QR. Alerts never include the visitor\'s contact details.',
        ),
      _View.denied => (
          StatusKind.blocked,
          'Denied',
          'Notifications permission is denied',
          'Allow notifications for OwnerPing in system settings: Settings → Apps → OwnerPing → Notifications.',
        ),
      _View.channelOff => (
          StatusKind.blocked,
          'Muted',
          'Message alerts are muted',
          'OwnerPing is allowed to notify, but the "OwnerPing messages" category is turned off in system settings.',
        ),
      _View.on => (
          StatusKind.active,
          'On',
          'Notifications enabled',
          'This device is alerted when someone contacts your vehicle.',
        ),
      _View.registrationFailed => (
          StatusKind.pending,
          'Not connected',
          'Couldn\'t connect this device',
          'Notifications are allowed, but we couldn\'t register this device with OwnerPing. Check your connection and try again.',
        ),
    };

    final Widget? action = switch (_view) {
      _View.off => AppButton(label: 'Turn on notifications', icon: Icons.notifications_active_outlined, loading: _working, onPressed: _turnOn),
      _View.denied || _View.channelOff =>
        AppButton(label: 'Open Settings', icon: Icons.settings_outlined, loading: _working, onPressed: _turnOn),
      _View.registrationFailed => AppButton(label: 'Try again', icon: Icons.refresh_outlined, loading: _working, onPressed: _retryRegistration),
      _ => null,
    };

    return Scaffold(
      appBar: AppBar(title: const Text('Notifications')),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(Space.page, Space.xs, Space.page, Space.xxl),
        children: [
          AppCard(
            padding: const EdgeInsets.all(Space.lg),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      width: 44,
                      height: 44,
                      decoration: BoxDecoration(color: c.commSoft, borderRadius: BorderRadius.circular(Radii.md)),
                      child: Icon(
                        _view == _View.on ? Icons.notifications_active_outlined : Icons.notifications_outlined,
                        color: c.comm,
                      ),
                    ),
                    const Spacer(),
                    // Checking: a small loader in place of the badge — the
                    // card itself never jumps.
                    if (_view == _View.checking)
                      const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
                    else
                      StatusBadge(kind, label: badge),
                  ],
                ),
                const SizedBox(height: Space.md),
                Row(
                  children: [
                    if (_view == _View.on) ...[
                      Icon(Icons.check_circle, size: 20, color: c.success),
                      const SizedBox(width: Space.xs),
                    ],
                    Expanded(child: Text(headline, style: t.titleMedium)),
                  ],
                ),
                const SizedBox(height: Space.xs),
                Text(body, style: t.bodyMedium),
                if (action != null) ...[const SizedBox(height: Space.lg), action],
              ],
            ),
          ),
          const SizedBox(height: Space.xl),
          const SectionHeader(title: 'How it works'),
          for (final (icon, text) in const [
            (Icons.qr_code_scanner_outlined, 'A visitor scans your QR and sends a message.'),
            (Icons.notifications_outlined, 'Every device you\'re signed in on gets an alert.'),
            (Icons.touch_app_outlined, 'Tap the alert to open that conversation.'),
            (Icons.phonelink_erase_outlined, 'This setting affects this device only. To turn alerts off, use system settings → OwnerPing → Notifications.'),
          ])
            Padding(
              padding: const EdgeInsets.only(bottom: Space.sm),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(icon, size: 18, color: c.slate),
                  const SizedBox(width: Space.sm),
                  Expanded(child: Text(text, style: t.bodyMedium)),
                ],
              ),
            ),
        ],
      ),
    );
  }
}
