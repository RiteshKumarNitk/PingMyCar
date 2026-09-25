import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../services/fcm/fcm_bootstrap.dart';

/// Notification settings: permission status, enable via the primer flow
/// (native prompt only after the in-app explanation), token registration on
/// grant. Disabling on this device never affects the owner's other devices.
class NotificationsScreen extends ConsumerStatefulWidget {
  const NotificationsScreen({super.key});

  @override
  ConsumerState<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends ConsumerState<NotificationsScreen> {
  bool? _enabled;
  bool _working = false;

  @override
  void initState() {
    super.initState();
    _refresh();
  }

  Future<void> _refresh() async {
    final fcm = ref.read(fcmInstanceProvider);
    if (fcm == null) return;
    final granted = await fcm.hasPermission();
    if (mounted) setState(() => _enabled = granted);
  }

  Future<void> _enable() async {
    final fcm = ref.read(fcmInstanceProvider);
    if (fcm == null) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Notifications are not available on this device.')),
        );
      }
      return;
    }
    setState(() => _working = true);
    final granted = await fcm.requestPermission();
    if (granted) {
      try {
        await fcm.registerCurrentToken();
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text("You'll be notified when someone contacts your vehicle.")),
          );
        }
      } catch (_) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Could not register this device right now. Try again later.')),
          );
        }
      }
    }
    if (mounted) setState(() => _working = false);
    _refresh();
  }

  @override
  Widget build(BuildContext context) {
    final enabled = _enabled == true;
    return Scaffold(
      appBar: AppBar(title: const Text('Notifications')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            child: SwitchListTile(
              value: enabled,
              onChanged: _working ? null : (v) => v ? _enable() : _explainSystemSettings(),
              title: const Text('Visitor messages'),
              subtitle: Text(enabled
                  ? 'This device receives notifications when someone contacts your vehicle.'
                  : 'Notifications are off for this device.'),
            ),
          ),
          const SizedBox(height: 12),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('How it works', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 15)),
                  const SizedBox(height: 8),
                  const Text(
                    'When a visitor scans your QR and sends a message, PingMyCar notifies every signed-in device. '
                    'Turning notifications off here affects this device only — your other devices keep receiving them.',
                    style: TextStyle(fontSize: 13.5, height: 1.4, color: Color(0xFF5B6773)),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _explainSystemSettings() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('To turn notifications off, use system settings → PingMyCar → Notifications.')),
    );
  }
}
