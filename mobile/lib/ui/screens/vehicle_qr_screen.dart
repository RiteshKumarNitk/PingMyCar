import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../config.dart';
import '../../core/api_error.dart';
import '../../models/models.dart';
import '../../providers.dart';

/// Clean QR screen per spec: vehicle name, status, the QR itself, then
/// Share / Save / Open Public Page / Sticker actions. The displayed QR is
/// the real backend PNG (same publicToken as the web dashboard); Share and
/// Save download the same bytes through the authenticated API.
class VehicleQrScreen extends ConsumerStatefulWidget {
  const VehicleQrScreen({super.key, required this.vehicleId});

  final String vehicleId;

  @override
  ConsumerState<VehicleQrScreen> createState() => _VehicleQrScreenState();
}

class _VehicleQrScreenState extends ConsumerState<VehicleQrScreen> {
  Vehicle? _vehicle;
  String? _authHeader;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final v = await ref.read(vehicleRepositoryProvider).get(widget.vehicleId);
      final token = await ref.read(tokenStoreProvider).readSessionToken();
      if (!mounted) return;
      setState(() {
        _vehicle = v;
        _authHeader = token == null ? null : 'Bearer $token';
        _error = null;
      });
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() => _error = e.message);
    }
  }

  String get _publicUrl => '${AppConfig.apiBaseUrl}/v/${_vehicle!.publicToken}';

  Future<void> _shareQr() async {
    try {
      final file = await ref.read(vehicleRepositoryProvider).downloadQrPng(_vehicle!.id, _vehicle!.publicToken);
      await Share.shareXFiles([XFile(file.path)], text: 'Scan to contact me about my ${_vehicle!.name}');
    } on ApiException catch (e) {
      _toast(e.message);
    }
  }

  Future<void> _saveQr() async {
    try {
      final docs = await getApplicationDocumentsDirectory();
      final file = await ref.read(vehicleRepositoryProvider).downloadQrPng(
            _vehicle!.id,
            _vehicle!.publicToken,
            toPath: '${docs.path}/pingmycar-qr-${_vehicle!.publicToken}.png',
          );
      _toast('QR saved: ${file.uri.pathSegments.last}');
    } on ApiException catch (e) {
      _toast(e.message);
    }
  }

  Future<void> _openPublicPage() async {
    final uri = Uri.parse(_publicUrl);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    } else {
      await Clipboard.setData(ClipboardData(text: _publicUrl));
      _toast('Link copied');
    }
  }

  void _toast(String message) {
    if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
  }

  @override
  Widget build(BuildContext context) {
    final v = _vehicle;
    return Scaffold(
      appBar: AppBar(title: Text(v?.name ?? 'QR Code')),
      body: _error != null && v == null
          ? Center(child: Padding(padding: const EdgeInsets.all(24), child: Text(_error!, textAlign: TextAlign.center)))
          : v == null
              ? const Center(child: CircularProgressIndicator())
              : ListView(
                  padding: const EdgeInsets.all(16),
                  children: [
                    Card(
                      child: Padding(
                        padding: const EdgeInsets.all(20),
                        child: Column(
                          children: [
                            Text(v.name, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: Color(0xFF0D1926))),
                            if (v.registrationNumber?.isNotEmpty == true) ...[
                              const SizedBox(height: 2),
                              Text(v.registrationNumber!, style: const TextStyle(color: Color(0xFF5B6773))),
                            ],
                            const SizedBox(height: 8),
                            Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(
                                  v.qrActive ? Icons.check_circle : Icons.pause_circle,
                                  size: 14,
                                  color: v.qrActive ? const Color(0xFF16A34A) : const Color(0xFFD97706),
                                ),
                                const SizedBox(width: 6),
                                Text(
                                  v.qrActive ? 'Active' : 'Paused',
                                  style: TextStyle(
                                    fontSize: 12.5,
                                    fontWeight: FontWeight.w700,
                                    color: v.qrActive ? const Color(0xFF16A34A) : const Color(0xFFD97706),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 16),
                            SizedBox(
                              width: 240,
                              height: 240,
                              child: _authHeader == null
                                  ? const Center(child: CircularProgressIndicator())
                                  : Image.network(
                                      '${AppConfig.apiBaseUrl}/api/vehicles/${v.id}/qr.png',
                                      headers: {'Authorization': _authHeader!},
                                      fit: BoxFit.contain,
                                      errorBuilder: (_, __, ___) => const Icon(Icons.qr_code_2, size: 64, color: Color(0xFF9AA6B2)),
                                    ),
                            ),
                            const SizedBox(height: 12),
                            Text(
                              _publicUrl,
                              textAlign: TextAlign.center,
                              style: const TextStyle(fontSize: 11.5, color: Color(0xFF9AA6B2)),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                    FilledButton.icon(
                      onPressed: _shareQr,
                      icon: const Icon(Icons.ios_share),
                      label: const Text('Share QR'),
                    ),
                    const SizedBox(height: 10),
                    OutlinedButton.icon(
                      onPressed: _saveQr,
                      icon: const Icon(Icons.download_outlined),
                      label: const Text('Save QR'),
                    ),
                    const SizedBox(height: 10),
                    OutlinedButton.icon(
                      onPressed: _openPublicPage,
                      icon: const Icon(Icons.open_in_new),
                      label: const Text('Open Public Page'),
                    ),
                    const SizedBox(height: 10),
                    OutlinedButton.icon(
                      onPressed: () => context.push('/stickers/${v.id}'),
                      icon: const Icon(Icons.sticky_note_2_outlined),
                      label: const Text('Sticker'),
                    ),
                    const SizedBox(height: 10),
                    OutlinedButton.icon(
                      onPressed: () => context.push('/vehicles/${v.id}'),
                      icon: const Icon(Icons.tune),
                      label: const Text('Manage QR'),
                    ),
                  ],
                ),
    );
  }
}
