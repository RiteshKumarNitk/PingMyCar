import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/api_error.dart';
import '../../providers.dart';

/// Add / edit vehicle. Fields mirror the backend model: type, registration
/// number, nickname (name), brand/model go in the name, color. No extra
/// personal info is collected.
class VehicleFormScreen extends ConsumerStatefulWidget {
  const VehicleFormScreen({super.key, this.vehicleId});

  final String? vehicleId;

  @override
  ConsumerState<VehicleFormScreen> createState() => _VehicleFormScreenState();
}

class _VehicleFormScreenState extends ConsumerState<VehicleFormScreen> {
  final _formKey = GlobalKey<FormState>();
  final _name = TextEditingController();
  final _reg = TextEditingController();
  final _color = TextEditingController();
  String? _type;
  bool _loading = false;
  bool _saving = false;
  String? _error;

  bool get _isEdit => widget.vehicleId != null;

  @override
  void initState() {
    super.initState();
    if (_isEdit) _loadExisting();
  }

  Future<void> _loadExisting() async {
    setState(() => _loading = true);
    try {
      final v = await ref.read(vehicleRepositoryProvider).get(widget.vehicleId!);
      if (!mounted) return;
      _name.text = v.name;
      _reg.text = v.registrationNumber ?? '';
      _color.text = v.color ?? '';
      setState(() {
        _type = v.type;
        _loading = false;
      });
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = e.message;
      });
    }
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() {
      _saving = true;
      _error = null;
    });
    try {
      final repo = ref.read(vehicleRepositoryProvider);
      if (_isEdit) {
        await repo.update(
          widget.vehicleId!,
          name: _name.text.trim(),
          type: _type,
          registrationNumber: _reg.text.trim(),
          color: _color.text.trim(),
        );
        if (mounted) context.pop();
      } else {
        final v = await repo.create(
          name: _name.text.trim(),
          type: _type,
          registrationNumber: _reg.text.trim(),
          color: _color.text.trim(),
        );
        if (!mounted) return;
        // Straight to the QR screen — that's the point of adding a vehicle.
        context.pushReplacement('/vehicles/${v.id}/qr');
      }
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() {
        _saving = false;
        _error = e.message;
      });
    }
  }

  Future<void> _delete() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete vehicle?'),
        content: const Text('Its QR stops working and its messages are removed. This cannot be undone.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: const Color(0xFFDC2626)),
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
    if (confirmed != true) return;
    try {
      await ref.read(vehicleRepositoryProvider).delete(widget.vehicleId!);
      if (mounted) context.go('/vehicles');
    } on ApiException catch (e) {
      if (mounted) setState(() => _error = e.message);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_isEdit ? 'Edit Vehicle' : 'Add Vehicle'),
        actions: [
          if (_isEdit)
            IconButton(icon: const Icon(Icons.delete_outline), onPressed: _saving ? null : _delete),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : AbsorbPointer(
              absorbing: _saving,
              child: Form(
                key: _formKey,
                child: ListView(
                  padding: const EdgeInsets.all(16),
                  children: [
                    TextFormField(
                      controller: _name,
                      textCapitalization: TextCapitalization.words,
                      decoration: const InputDecoration(labelText: 'Nickname (e.g. Honda City)'),
                      validator: (v) => (v == null || v.trim().isEmpty) ? 'Give your vehicle a name' : null,
                    ),
                    const SizedBox(height: 14),
                    DropdownButtonFormField<String>(
                      initialValue: _type,
                      decoration: const InputDecoration(labelText: 'Type'),
                      items: const [
                        DropdownMenuItem(value: 'CAR', child: Text('Car')),
                        DropdownMenuItem(value: 'BIKE', child: Text('Motorcycle')),
                        DropdownMenuItem(value: 'SCOOTER', child: Text('Scooter')),
                        DropdownMenuItem(value: 'TRUCK', child: Text('Truck')),
                        DropdownMenuItem(value: 'VAN', child: Text('Van')),
                        DropdownMenuItem(value: 'OTHER', child: Text('Other')),
                      ],
                      onChanged: (v) => setState(() => _type = v),
                    ),
                    const SizedBox(height: 14),
                    TextFormField(
                      controller: _reg,
                      textCapitalization: TextCapitalization.characters,
                      decoration: const InputDecoration(labelText: 'Registration number (optional)'),
                    ),
                    const SizedBox(height: 14),
                    TextFormField(
                      controller: _color,
                      textCapitalization: TextCapitalization.words,
                      decoration: const InputDecoration(labelText: 'Color (optional)'),
                    ),
                    if (_error != null) ...[
                      const SizedBox(height: 16),
                      Text(_error!, style: const TextStyle(color: Color(0xFFDC2626))),
                    ],
                    const SizedBox(height: 24),
                    FilledButton(
                      onPressed: _saving ? null : _save,
                      child: _saving
                          ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                          : Text(_isEdit ? 'Save Changes' : 'Add Vehicle'),
                    ),
                  ],
                ),
              ),
            ),
    );
  }
}
