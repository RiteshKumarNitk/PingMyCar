import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../services/fcm/fcm_bootstrap.dart';
import '../../components/components.dart';

/// Notification settings: permission status, enable via the in-app primer
/// (native prompt only after this explanation), token registration on grant.
/// Turning off on this device never affects the owner's other devices.
class NotificationsScreen extends ConsumerStatefulWidget {
  const NotificationsScreen({super.key});

  @override
  ConsumerState<NotificationsScreen> createState() => _NotificationsScreenState();
}

enum _PermState { checking, unavailable, off, on, registrationFailed }

class _NotificationsScreenState extends ConsumerState<NotificationsScreen> {
  _PermState _state = _PermState.checking;
  bool _working = false;

  @override
  void initState() {
    super.initState();
    _refresh();
  }

  Future<void> _refresh() async {
    final fcm = ref.read(fcmInstanceProvider);
    if (fcm == null) {
      if (mounted) setState(() => _state = _PermState.unavailable);
      return;
    }
    final granted = await fcm.hasPermission();
    if (mounted) {
      setState(() {
        if (_state != _PermState.registrationFailed || !granted) {
          _state = granted ? _PermState.on : _PermState.off;
        }
      });
    }
  }

  Future<void> _enable() async {
    final fcm = ref.read(fcmInstanceProvider);
    if (fcm == null || _working) return;
    setState(() => _working = true);
    final granted = await fcm.requestPermission();
    var state = granted ? _PermState.on : _PermState.off;
    if (granted) {
      try {
        await fcm.registerCurrentToken();
        _toast("You'll be notified when someone contacts your vehicle.");
      } catch (_) {
        // Offline or server hiccup — FCM's token-refresh path retries later.
        state = _PermState.registrationFailed;
      }
    } else {
      _toast('Notifications are blocked. You can allow them in system settings.');
    }
    if (mounted) {
      setState(() {
        _working = false;
        _state = state;
      });
    }
  }

  void _toast(String message) {
    if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
  }

  @override
  Widget build(BuildContext context) {
    final c = AppColors.of(context);
    final t = Theme.of(context).textTheme;

    final (StatusKind kind, String badge, String headline, String body) = switch (_state) {
      _PermState.checking => (StatusKind.pending, 'Checking', 'Checking notifications…', ''),
      _PermState.unavailable => (
          StatusKind.inactive,
          'Unavailable',
          'Notifications aren\'t available',
          'This build or device can\'t receive push notifications. Messages still appear in the app.',
        ),
      _PermState.off => (
          StatusKind.inactive,
          'Off',
          'Get notified about new messages',
          'We\'ll alert this device when someone scans your QR and sends a message. Alerts never include the visitor\'s contact details.',
        ),
      _PermState.on => (
          StatusKind.active,
          'On',
          'Notifications are on',
          'This device is alerted when someone contacts your vehicle.',
        ),
      _PermState.registrationFailed => (
          StatusKind.pending,
          'Not connected',
          'Couldn\'t connect this device',
          'Permission is on, but we couldn\'t register this device. Check your connection and try again.',
        ),
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
                        _state == _PermState.on ? Icons.notifications_active_outlined : Icons.notifications_outlined,
                        color: c.comm,
                      ),
                    ),
                    const Spacer(),
                    StatusBadge(kind, label: badge),
                  ],
                ),
                const SizedBox(height: Space.md),
                Text(headline, style: t.titleMedium),
                if (body.isNotEmpty) ...[
                  const SizedBox(height: Space.xs),
                  Text(body, style: t.bodyMedium),
                ],
                if (_state == _PermState.off || _state == _PermState.registrationFailed) ...[
                  const SizedBox(height: Space.lg),
                  AppButton(
                    label: _state == _PermState.off ? 'Turn on notifications' : 'Try again',
                    icon: Icons.notifications_active_outlined,
                    loading: _working,
                    onPressed: _enable,
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(height: Space.xl),
          const SectionHeader(title: 'How it works'),
          for (final (icon, text) in const [
            (Icons.qr_code_scanner_outlined, 'A visitor scans your QR and sends a message.'),
            (Icons.notifications_outlined, 'Every device you\'re signed in on gets an alert.'),
            (Icons.touch_app_outlined, 'Tap the alert to open that conversation.'),
            (Icons.phonelink_erase_outlined, 'Turning alerts off here affects this device only. To turn them off, use system settings → OwnerPing → Notifications.'),
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
