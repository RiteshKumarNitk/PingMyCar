import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/api_error.dart';
import '../../models/models.dart';
import '../../providers.dart';
import '../components/components.dart';
import 'qr_actions.dart';

/// Dedicated QR screen. The QR shown is the real backend PNG (same
/// publicToken as the web dashboard); Share / Download fetch the same bytes
/// through the authenticated API. No QR generation or token logic here.
class VehicleQrScreen extends ConsumerStatefulWidget {
  const VehicleQrScreen({super.key, required this.vehicleId});

  final String vehicleId;

  @override
  ConsumerState<VehicleQrScreen> createState() => _VehicleQrScreenState();
}

class _VehicleQrScreenState extends ConsumerState<VehicleQrScreen> {
  Vehicle? _vehicle;
  String? _authHeader;
  Object? _error;
  bool _sharing = false;
  bool _saving = false;

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

  Future<void> _guarded(bool Function() isBusy, void Function(bool) setBusy, Future<void> Function() action) async {
    if (isBusy()) return;
    setState(() => setBusy(true));
    try {
      await action();
    } finally {
      if (mounted) setState(() => setBusy(false));
    }
  }

  @override
  Widget build(BuildContext context) {
    final v = _vehicle;
    return Scaffold(
      appBar: AppBar(title: const Text('QR code')),
      body: v == null
          ? (_error != null
              ? ScrollableCenter(child: ErrorState(error: _error!, onRetry: _load))
              : const LoadingSkeleton(rows: 2, rowHeight: 200))
          : _content(context, v),
    );
  }

  Widget _content(BuildContext context, Vehicle v) {
    final c = AppColors.of(context);
    final t = Theme.of(context).textTheme;
    final actions = QrActions(ref, context);
    final width = MediaQuery.sizeOf(context).width;
    final qrSize = (width - 2 * Space.page - 2 * Space.lg).clamp(180.0, 280.0).toDouble();

    return ListView(
      padding: const EdgeInsets.fromLTRB(Space.page, Space.xs, Space.page, Space.xxl),
      children: [
        Semantics(header: true, child: Text('Let people contact you privately', style: t.headlineSmall)),
        const SizedBox(height: Space.xs),
        Text(
          'Anyone can scan this QR code to send you a message without seeing your phone number or email.',
          style: t.bodyMedium,
        ),
        const SizedBox(height: Space.lg),
        Center(child: QrPreviewCard(vehicle: v, authHeader: _authHeader, qrSize: qrSize)),
        const SizedBox(height: Space.md),
        if (!v.qrActive)
          Container(
            padding: const EdgeInsets.all(Space.sm),
            margin: const EdgeInsets.only(bottom: Space.md),
            decoration: BoxDecoration(color: c.warningSoft, borderRadius: BorderRadius.circular(Radii.md)),
            child: Row(
              children: [
                Icon(Icons.pause_circle_outline, size: 18, color: c.warning),
                const SizedBox(width: Space.xs),
                Expanded(
                  child: Text(
                    'This QR is turned off. Visitors see a paused page until you turn it back on.',
                    style: t.bodySmall?.copyWith(color: c.warning),
                  ),
                ),
              ],
            ),
          ),
        AppButton(
          label: 'Share',
          icon: Icons.ios_share_outlined,
          loading: _sharing,
          onPressed: () => _guarded(() => _sharing, (b) => _sharing = b, () => actions.share(v)),
        ),
        const SizedBox(height: Space.sm),
        Row(
          children: [
            Expanded(
              child: AppButton(
                label: 'Download',
                icon: Icons.download_outlined,
                variant: AppButtonVariant.secondary,
                compact: true,
                loading: _saving,
                onPressed: () => _guarded(() => _saving, (b) => _saving = b, () => actions.download(v)),
              ),
            ),
            const SizedBox(width: Space.sm),
            Expanded(
              child: AppButton(
                label: 'Print',
                semanticLabel: 'Print sticker sheet',
                icon: Icons.print_outlined,
                variant: AppButtonVariant.secondary,
                compact: true,
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
                leading: const Icon(Icons.open_in_new_outlined),
                title: const Text('Open public page'),
                subtitle: const Text('See exactly what visitors see'),
                trailing: const Icon(Icons.chevron_right),
                onTap: () => actions.openPublicPage(v),
              ),
              const Divider(indent: Space.md, endIndent: Space.md),
              ListTile(
                leading: const Icon(Icons.link_outlined),
                title: const Text('Copy link'),
                subtitle: Text(actions.publicUrl(v), maxLines: 1, overflow: TextOverflow.ellipsis),
                onTap: () => actions.copyLink(v),
              ),
            ],
          ),
        ),
        const SizedBox(height: Space.lg),
        const PrivacyLabel('The QR contains only a link — no personal information.', center: true),
      ],
    );
  }
}
