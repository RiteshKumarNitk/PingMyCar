import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../config.dart';
import '../../core/api_error.dart';
import '../../models/models.dart';
import '../../providers.dart';

/// Sticker catalog. The sticker designs live in the backend (same SVG
/// system the web app uses); the mobile app shows each vehicle's real QR
/// and opens the print-ready A4 sheet from the backend.
class StickersScreen extends ConsumerStatefulWidget {
  const StickersScreen({super.key});

  @override
  ConsumerState<StickersScreen> createState() => _StickersScreenState();
}

class _StickersScreenState extends ConsumerState<StickersScreen> {
  List<Vehicle>? _vehicles;
  Map<String, String> _authHeaders = {};
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final vehicles = await ref.read(vehicleRepositoryProvider).list();
      final token = await ref.read(tokenStoreProvider).readSessionToken();
      if (!mounted) return;
      setState(() {
        _vehicles = vehicles;
        _authHeaders = token == null ? {} : {'Authorization': 'Bearer $token'};
        _error = null;
      });
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() => _error = e.message);
    }
  }

  @override
  Widget build(BuildContext context) {
    final vehicles = _vehicles;
    return Scaffold(
      appBar: AppBar(title: const Text('Stickers')),
      body: _error != null && vehicles == null
          ? Center(child: Text(_error!))
          : vehicles == null
              ? const Center(child: CircularProgressIndicator())
              : vehicles.isEmpty
                  ? ListView(
                      children: const [
                        SizedBox(height: 110),
                        Icon(Icons.sticky_note_2_outlined, size: 48, color: Color(0xFF9AA6B2)),
                        SizedBox(height: 12),
                        Text('No vehicles yet', textAlign: TextAlign.center, style: TextStyle(fontWeight: FontWeight.w700, fontSize: 17)),
                        SizedBox(height: 6),
                        Text('Add a vehicle first — its sticker lives here.', textAlign: TextAlign.center, style: TextStyle(color: Color(0xFF5B6773))),
                      ],
                    )
                  : ListView.separated(
                      padding: const EdgeInsets.all(16),
                      itemCount: vehicles.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 12),
                      itemBuilder: (context, i) {
                        final v = vehicles[i];
                        return Card(
                          child: Padding(
                            padding: const EdgeInsets.all(16),
                            child: Column(
                              children: [
                                Text(v.name, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: Color(0xFF0D1926))),
                                const SizedBox(height: 4),
                                Text('Square format · QR large enough to scan reliably', style: const TextStyle(fontSize: 12.5, color: Color(0xFF5B6773))),
                                const SizedBox(height: 14),
                                Container(
                                  width: 150,
                                  height: 150,
                                  color: const Color(0xFFF0F3F7),
                                  child: _authHeaders.isEmpty
                                      ? const SizedBox()
                                      : Image.network(
                                          '${AppConfig.apiBaseUrl}/api/vehicles/${v.id}/qr.png',
                                          headers: _authHeaders,
                                          fit: BoxFit.contain,
                                        ),
                                ),
                                const SizedBox(height: 14),
                                Row(
                                  children: [
                                    Expanded(
                                      child: OutlinedButton(
                                        onPressed: () => context.push('/vehicles/${v.id}/qr'),
                                        child: const Text('QR Page'),
                                      ),
                                    ),
                                    const SizedBox(width: 10),
                                    Expanded(
                                      child: FilledButton(
                                        onPressed: () => context.push('/stickers/${v.id}'),
                                        child: const Text('Print / PDF'),
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
    );
  }
}
