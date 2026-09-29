import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/api_error.dart';
import '../../providers.dart';
import '../components/components.dart';

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
    if (_saving || !_formKey.currentState!.validate()) return;
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
            style: FilledButton.styleFrom(backgroundColor: AppColors.of(context).danger),
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
    if (confirmed != true || _saving) return;
    setState(() => _saving = true);
    try {
      await ref.read(vehicleRepositoryProvider).delete(widget.vehicleId!);
      if (mounted) context.go('/vehicles');
    } on ApiException catch (e) {
      if (mounted) {
        setState(() {
          _saving = false;
          _error = e.message;
        });
      }
    }
  }

  static const _types = [
    ('CAR', 'Car', Icons.directions_car_outlined),
    ('BIKE', 'Motorcycle', Icons.two_wheeler_outlined),
    ('SCOOTER', 'Scooter', Icons.moped_outlined),
    ('TRUCK', 'Truck', Icons.local_shipping_outlined),
    ('VAN', 'Van', Icons.airport_shuttle_outlined),
    ('OTHER', 'Other', Icons.category_outlined),
  ];

  @override
  Widget build(BuildContext context) {
    final c = AppColors.of(context);
    final t = Theme.of(context).textTheme;
    return Scaffold(
      appBar: AppBar(title: Text(_isEdit ? 'Edit vehicle' : 'Add vehicle')),
      bottomNavigationBar: _loading
          ? null
          : Container(
              decoration: BoxDecoration(color: c.surface, border: Border(top: BorderSide(color: c.border))),
              // Rides above the keyboard; respects the gesture bar.
              padding: EdgeInsets.fromLTRB(
                Space.page,
                Space.sm,
                Space.page,
                Space.sm + MediaQuery.viewInsetsOf(context).bottom,
              ),
              child: SafeArea(
                top: false,
                child: AppButton(
                  label: _isEdit ? 'Save changes' : 'Create QR code',
                  icon: _isEdit ? Icons.check : Icons.qr_code_2_outlined,
                  loading: _saving,
                  onPressed: _save,
                ),
              ),
            ),
      body: _loading
          ? const LoadingSkeleton(rows: 4, rowHeight: 56)
          : AbsorbPointer(
              absorbing: _saving,
              child: Form(
                key: _formKey,
                child: ListView(
                  padding: const EdgeInsets.fromLTRB(Space.page, Space.xs, Space.page, Space.xl),
                  children: [
                    if (!_isEdit) ...[
                      Text(
                        'Your vehicle gets its own private QR code. People who scan it can message you — they never see your number or email.',
                        style: t.bodyMedium,
                      ),
                      const SizedBox(height: Space.xl),
                    ],
                    Text('Vehicle', style: t.titleMedium),
                    const SizedBox(height: Space.md),
                    AppTextField(
                      controller: _name,
                      label: 'Name',
                      hint: 'e.g. Honda City',
                      helper: 'Shown to you in the app. You choose later whether visitors see it.',
                      textCapitalization: TextCapitalization.words,
                      textInputAction: TextInputAction.next,
                      maxLength: 80,
                      validator: (v) => (v == null || v.trim().isEmpty) ? 'Give your vehicle a name' : null,
                    ),
                    const SizedBox(height: Space.lg),
                    Text('Type', style: t.titleSmall?.copyWith(fontWeight: FontWeight.w500)),
                    const SizedBox(height: Space.xs),
                    Wrap(
                      spacing: Space.xs,
                      runSpacing: Space.xs,
                      children: [
                        for (final (value, label, icon) in _types)
                          ChoiceChip(
                            avatar: Icon(icon, size: 18, color: _type == value ? c.primaryInk : c.slate),
                            label: Text(label),
                            selected: _type == value,
                            showCheckmark: false,
                            selectedColor: c.primarySoft,
                            side: BorderSide(color: _type == value ? c.primaryInk : c.border),
                            labelStyle: t.labelMedium?.copyWith(color: _type == value ? c.primaryInk : c.ink),
                            onSelected: (_) => setState(() => _type = value),
                          ),
                      ],
                    ),
                    const SizedBox(height: Space.xl),
                    Text('Details', style: t.titleMedium),
                    const SizedBox(height: Space.md),
                    AppTextField(
                      controller: _reg,
                      label: 'Registration number',
                      optional: true,
                      hint: 'e.g. RJ14 CD 4521',
                      helper: 'Hidden from visitors unless you turn it on.',
                      prefixIcon: Icons.badge_outlined,
                      textCapitalization: TextCapitalization.characters,
                      textInputAction: TextInputAction.next,
                      maxLength: 20,
                    ),
                    const SizedBox(height: Space.md),
                    AppTextField(
                      controller: _color,
                      label: 'Color',
                      optional: true,
                      hint: 'e.g. Silver',
                      prefixIcon: Icons.palette_outlined,
                      textCapitalization: TextCapitalization.words,
                      textInputAction: TextInputAction.done,
                      maxLength: 30,
                      onFieldSubmitted: (_) => _save(),
                    ),
                    if (_error != null) ...[
                      const SizedBox(height: Space.md),
                      Semantics(
                        liveRegion: true,
                        child: Container(
                          padding: const EdgeInsets.all(Space.sm),
                          decoration: BoxDecoration(color: c.dangerSoft, borderRadius: BorderRadius.circular(Radii.md)),
                          child: Row(
                            children: [
                              Icon(Icons.error_outline, size: 18, color: c.danger),
                              const SizedBox(width: Space.xs),
                              Expanded(child: Text(_error!, style: t.bodyMedium?.copyWith(color: c.danger))),
                            ],
                          ),
                        ),
                      ),
                    ],
                    if (_isEdit) ...[
                      const SizedBox(height: Space.xxl),
                      Container(
                        padding: const EdgeInsets.all(Space.md),
                        decoration: BoxDecoration(
                          color: c.dangerSoft.withValues(alpha: 0.5),
                          borderRadius: BorderRadius.circular(Radii.lg),
                          border: Border.all(color: c.danger.withValues(alpha: 0.25)),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('Delete vehicle', style: t.titleSmall?.copyWith(color: c.danger)),
                            const SizedBox(height: 4),
                            Text("Its QR stops working and its conversations are removed. This can't be undone.", style: t.bodySmall),
                            const SizedBox(height: Space.sm),
                            AppButton(
                              label: 'Delete vehicle',
                              icon: Icons.delete_outline,
                              variant: AppButtonVariant.danger,
                              compact: true,
                              expand: false,
                              onPressed: _saving ? null : _delete,
                            ),
                          ],
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ),
    );
  }
}
