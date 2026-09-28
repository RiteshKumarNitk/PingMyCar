import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/api_error.dart';
import '../../models/models.dart';
import '../../providers.dart';
import '../components/components.dart';
import 'qr_actions.dart';

class VehicleDetailScreen extends ConsumerStatefulWidget {
  const VehicleDetailScreen({super.key, required this.vehicleId});

  final String vehicleId;

  @override
  ConsumerState<VehicleDetailScreen> createState() => _VehicleDetailScreenState();
}

class _VehicleDetailScreenState extends ConsumerState<VehicleDetailScreen> {
  Vehicle? _vehicle;
  String? _authHeader;
  Object? _error;
  bool _busy = false;

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
      setState(() => _error = e);
    }
  }

  void _toast(String message) {
    if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
  }

  Future<void> _toggleQr(bool activate) async {
    if (_busy) return;
    setState(() => _busy = true);
    try {
      final v = await ref.read(vehicleRepositoryProvider).update(widget.vehicleId, qrActive: activate);
      if (!mounted) return;
      setState(() => _vehicle = v);
      _toast(activate ? 'QR turned on — visitors can message you.' : 'QR turned off — new messages are paused.');
    } on ApiException catch (e) {
      _toast(e.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _regenerate() async {
    final c = AppColors.of(context);
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Generate a new QR?'),
        content: const Text('Old stickers stop working and need to be reprinted. Use this if a sticker was shared by mistake.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: c.danger),
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Regenerate'),
          ),
        ],
      ),
    );
    if (confirmed != true || _busy) return;
    setState(() => _busy = true);
    try {
      final v = await ref.read(vehicleRepositoryProvider).update(widget.vehicleId, regenerateToken: true);
      if (!mounted) return;
      setState(() => _vehicle = v);
      _toast('New QR generated — reprint your sticker.');
      context.pushReplacement('/vehicles/${v.id}/qr');
    } on ApiException catch (e) {
      _toast(e.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final v = _vehicle;
    return Scaffold(
      appBar: AppBar(
        title: const Text('Vehicle'),
        actions: [
          if (v != null)
            IconButton(
              tooltip: 'Edit vehicle',
              icon: const Icon(Icons.edit_outlined),
              onPressed: () async {
                await context.push('/vehicles/${v.id}/edit');
                if (mounted) _load();
              },
            ),
          const SizedBox(width: Space.xs),
        ],
      ),
      body: v == null
          ? (_error != null
              ? ScrollableCenter(child: ErrorState(error: _error!, onRetry: _load))
              : const LoadingSkeleton(rows: 3, rowHeight: 120))
          : RefreshIndicator(onRefresh: _load, child: _content(context, v)),
    );
  }

  Widget _content(BuildContext context, Vehicle v) {
    final c = AppColors.of(context);
    final t = Theme.of(context).textTheme;
    final actions = QrActions(ref, context);
    final qrSize = (MediaQuery.sizeOf(context).width - 2 * Space.page - 2 * Space.lg).clamp(160.0, 220.0);

    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.fromLTRB(Space.page, Space.xs, Space.page, Space.xxl),
      children: [
        Row(
          children: [
            VehicleAvatar(vehicle: v, size: 64),
            const SizedBox(width: Space.md),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(v.name, maxLines: 2, overflow: TextOverflow.ellipsis, style: t.headlineSmall),
                  const SizedBox(height: 6),
                  Wrap(
                    spacing: Space.xs,
                    runSpacing: Space.xs,
                    crossAxisAlignment: WrapCrossAlignment.center,
                    children: [
                      if (v.registrationNumber?.isNotEmpty == true) PlateChip(v.registrationNumber!),
                      Text(
                        [v.typeLabel, if (v.color?.isNotEmpty == true) v.color!].join(' · '),
                        style: t.bodySmall,
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
        const SizedBox(height: Space.lg),
        Center(child: QrPreviewCard(vehicle: v, authHeader: _authHeader, qrSize: qrSize.toDouble(), showIdentity: false)),
        const SizedBox(height: Space.sm),
        Center(
          child: StatusBadge(
            v.qrActive ? StatusKind.active : StatusKind.inactive,
            label: v.qrActive ? 'QR active — accepting messages' : 'QR off — new messages paused',
          ),
        ),
        const SizedBox(height: Space.lg),
        AppButton(label: 'View QR', icon: Icons.qr_code_2_outlined, onPressed: () => context.push('/vehicles/${v.id}/qr')),
        const SizedBox(height: Space.sm),
        Row(
          children: [
            Expanded(
              child: AppButton(
                label: 'Download',
                icon: Icons.download_outlined,
                compact: true,
                variant: AppButtonVariant.secondary,
                onPressed: () => actions.download(v),
              ),
            ),
            const SizedBox(width: Space.sm),
            Expanded(
              child: AppButton(
                label: 'Print',
                semanticLabel: 'Print sticker sheet',
                icon: Icons.print_outlined,
                compact: true,
                variant: AppButtonVariant.secondary,
                onPressed: () => context.push('/stickers/${v.id}'),
              ),
            ),
          ],
        ),
        const SizedBox(height: Space.lg),
        AppCard(
          padding: EdgeInsets.zero,
          child: Column(
            children: [
              ListTile(
                leading: Icon(Icons.chat_bubble_outline, color: c.comm),
                title: const Text('Messages'),
                subtitle: const Text('Conversations about this vehicle'),
                trailing: const Icon(Icons.chevron_right),
                onTap: () => context.go('/messages?vehicle=${v.id}'),
              ),
              const Divider(indent: Space.md, endIndent: Space.md),
              ListTile(
                leading: const Icon(Icons.edit_outlined),
                title: const Text('Edit vehicle'),
                subtitle: const Text('Name, type, registration, color'),
                trailing: const Icon(Icons.chevron_right),
                onTap: () async {
                  await context.push('/vehicles/${v.id}/edit');
                  if (mounted) _load();
                },
              ),
            ],
          ),
        ),
        const SizedBox(height: Space.xl),
        Text('QR settings', style: t.titleMedium),
        const SizedBox(height: Space.xs),
        AppCard(
          padding: EdgeInsets.zero,
          child: Column(
            children: [
              SwitchListTile(
                value: v.qrActive,
                onChanged: _busy ? null : _toggleQr,
                title: const Text('Accept messages'),
                subtitle: const Text('Turn off to pause new visitor messages'),
              ),
              const Divider(indent: Space.md, endIndent: Space.md),
              ListTile(
                leading: const Icon(Icons.autorenew_outlined),
                title: const Text('Regenerate QR'),
                subtitle: const Text('Makes old stickers stop working'),
                trailing: _busy
                    ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
                    : const Icon(Icons.chevron_right),
                onTap: _busy ? null : _regenerate,
              ),
            ],
          ),
        ),
      ],
    );
  }
}
