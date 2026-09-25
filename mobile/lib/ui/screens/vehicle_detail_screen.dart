import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/api_error.dart';
import '../../models/models.dart';
import '../../providers.dart';

class VehicleDetailScreen extends ConsumerStatefulWidget {
  const VehicleDetailScreen({super.key, required this.vehicleId});

  final String vehicleId;

  @override
  ConsumerState<VehicleDetailScreen> createState() => _VehicleDetailScreenState();
}

class _VehicleDetailScreenState extends ConsumerState<VehicleDetailScreen> {
  Vehicle? _vehicle;
  String? _error;
  bool _busy = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final v = await ref.read(vehicleRepositoryProvider).get(widget.vehicleId);
      if (!mounted) return;
      setState(() {
        _vehicle = v;
        _error = null;
      });
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() => _error = e.message);
    }
  }

  Future<void> _toggleQr(bool activate) async {
    setState(() => _busy = true);
    try {
      final v = await ref.read(vehicleRepositoryProvider).update(widget.vehicleId, qrActive: activate);
      if (!mounted) return;
      setState(() {
        _vehicle = v;
        _busy = false;
      });
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() {
        _busy = false;
        _error = e.message;
      });
    }
  }

  Future<void> _regenerate() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Generate a new QR?'),
        content: const Text('Old stickers stop working and need to be reprinted. Use this if a sticker was shared by mistake.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
          FilledButton(onPressed: () => Navigator.pop(context, true), child: const Text('Regenerate')),
        ],
      ),
    );
    if (confirmed != true) return;
    setState(() => _busy = true);
    try {
      final v = await ref.read(vehicleRepositoryProvider).update(widget.vehicleId, regenerateToken: true);
      if (!mounted) return;
      setState(() {
        _vehicle = v;
        _busy = false;
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('New QR generated — reprint your sticker.')));
        context.pushReplacement('/vehicles/${v.id}/qr');
      }
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() {
        _busy = false;
        _error = e.message;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final v = _vehicle;
    return Scaffold(
      appBar: AppBar(
        title: Text(v?.name ?? 'Vehicle'),
        actions: [
          IconButton(
            icon: const Icon(Icons.edit_outlined),
            onPressed: v == null ? null : () => context.push('/vehicles/${v.id}/edit'),
          ),
        ],
      ),
      body: _error != null && v == null
          ? Center(child: Text(_error!))
          : v == null
              ? const Center(child: CircularProgressIndicator())
              : ListView(
                  padding: const EdgeInsets.all(16),
                  children: [
                    Card(
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(v.name, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: Color(0xFF0D1926))),
                            const SizedBox(height: 4),
                            Text(
                              [v.registrationNumber, v.typeLabel, v.color].whereType<String>().where((s) => s.isNotEmpty).join(' · '),
                              style: const TextStyle(color: Color(0xFF5B6773)),
                            ),
                            const SizedBox(height: 12),
                            Row(
                              children: [
                                Icon(
                                  v.qrActive ? Icons.check_circle : Icons.pause_circle,
                                  size: 16,
                                  color: v.qrActive ? const Color(0xFF16A34A) : const Color(0xFFD97706),
                                ),
                                const SizedBox(width: 6),
                                Text(
                                  v.qrActive ? 'QR Active — accepting messages' : 'QR Paused — visitors see a paused page',
                                  style: const TextStyle(fontSize: 13.5, fontWeight: FontWeight.w600),
                                ),
                              ],
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
                            leading: const Icon(Icons.qr_code_2, color: Color(0xFF2563EB)),
                            title: const Text('QR Code & Sticker'),
                            subtitle: const Text('View, share, download, print'),
                            trailing: const Icon(Icons.chevron_right),
                            onTap: () => context.push('/vehicles/${v.id}/qr'),
                          ),
                          const Divider(indent: 16, endIndent: 16),
                          ListTile(
                            leading: const Icon(Icons.mail_outline, color: Color(0xFF2563EB)),
                            title: const Text('Messages'),
                            subtitle: const Text('Conversations about this vehicle'),
                            trailing: const Icon(Icons.chevron_right),
                            onTap: () => context.push('/messages?vehicle=${v.id}'),
                          ),
                          const Divider(indent: 16, endIndent: 16),
                          ListTile(
                            leading: const Icon(Icons.sticky_note_2_outlined, color: Color(0xFF2563EB)),
                            title: const Text('Sticker Preview'),
                            subtitle: const Text('Print-ready A4 sheet'),
                            trailing: const Icon(Icons.chevron_right),
                            onTap: () => context.push('/stickers/${v.id}'),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 12),
                    Card(
                      child: Column(
                        children: [
                          SwitchListTile(
                            value: v.qrActive,
                            onChanged: _busy ? null : _toggleQr,
                            title: const Text('QR Active'),
                            subtitle: const Text('Turn off to stop new visitor messages'),
                          ),
                          const Divider(indent: 16, endIndent: 16),
                          ListTile(
                            leading: const Icon(Icons.refresh, color: Color(0xFF2563EB)),
                            title: const Text('Regenerate QR'),
                            subtitle: const Text('Invalidates old stickers'),
                            trailing: const Icon(Icons.chevron_right),
                            onTap: _busy ? null : _regenerate,
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
    );
  }
}
