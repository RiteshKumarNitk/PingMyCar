import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/api_error.dart';
import '../../models/models.dart';
import '../../providers.dart';

class VehiclesScreen extends ConsumerStatefulWidget {
  const VehiclesScreen({super.key});

  @override
  ConsumerState<VehiclesScreen> createState() => _VehiclesScreenState();
}

class _VehiclesScreenState extends ConsumerState<VehiclesScreen> {
  List<Vehicle>? _vehicles;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final v = await ref.read(vehicleRepositoryProvider).list();
      if (!mounted) return;
      setState(() {
        _vehicles = v;
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
      appBar: AppBar(title: const Text('Vehicles')),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.push('/vehicles/new'),
        icon: const Icon(Icons.add),
        label: const Text('Add'),
      ),
      body: RefreshIndicator(
        onRefresh: _load,
        child: _error != null && vehicles == null
            ? ListView(children: [
                const SizedBox(height: 120),
                Center(child: Text(_error!, textAlign: TextAlign.center)),
                const SizedBox(height: 12),
                Center(child: OutlinedButton(onPressed: _load, child: const Text('Try again'))),
              ])
            : vehicles == null
                ? const SizedBox()
                : vehicles.isEmpty
                    ? ListView(
                        children: const [
                          SizedBox(height: 120),
                          Icon(Icons.directions_car_outlined, size: 48, color: Color(0xFF9AA6B2)),
                          SizedBox(height: 12),
                          Text(
                            'No vehicles yet',
                            textAlign: TextAlign.center,
                            style: TextStyle(fontSize: 17, fontWeight: FontWeight.w700, color: Color(0xFF0D1926)),
                          ),
                          SizedBox(height: 6),
                          Text(
                            'Add your first vehicle to get its QR sticker.',
                            textAlign: TextAlign.center,
                            style: TextStyle(color: Color(0xFF5B6773)),
                          ),
                        ],
                      )
                    : ListView.separated(
                        padding: const EdgeInsets.all(16),
                        itemCount: vehicles.length,
                        separatorBuilder: (_, __) => const SizedBox(height: 10),
                        itemBuilder: (context, i) {
                          final v = vehicles[i];
                          return Card(
                            child: ListTile(
                              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                              leading: CircleAvatar(
                                backgroundColor: const Color(0xFFE8EFFC),
                                child: Icon(_iconFor(v.type), color: const Color(0xFF2563EB)),
                              ),
                              title: Text(v.name, style: const TextStyle(fontWeight: FontWeight.w700)),
                              subtitle: Text(v.registrationNumber ?? v.typeLabel),
                              trailing: _QrBadge(active: v.qrActive),
                              onTap: () => context.push('/vehicles/${v.id}'),
                            ),
                          );
                        },
                      ),
      ),
    );
  }

  IconData _iconFor(String? type) {
    switch (type) {
      case 'BIKE':
        return Icons.two_wheeler;
      case 'SCOOTER':
        return Icons.moped;
      case 'TRUCK':
        return Icons.local_shipping;
      case 'VAN':
        return Icons.airport_shuttle;
      default:
        return Icons.directions_car;
    }
  }
}

class _QrBadge extends StatelessWidget {
  const _QrBadge({required this.active});
  final bool active;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: active ? const Color(0xFFE8F7EE) : const Color(0xFFFDF3E2),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(active ? Icons.check_circle : Icons.pause_circle, size: 14, color: active ? const Color(0xFF16A34A) : const Color(0xFFD97706)),
          const SizedBox(width: 4),
          Text(
            active ? 'Active' : 'Paused',
            style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.w700, color: active ? const Color(0xFF16A34A) : const Color(0xFFD97706)),
          ),
        ],
      ),
    );
  }
}
