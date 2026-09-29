import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';
import '../../config.dart';
import '../../core/api_error.dart';
import '../../models/models.dart';
import '../../providers.dart';
import '../components/components.dart';
import '../stickers/sticker_designs.dart';

/// Vehicle → QR sticker → choose one of the website's five designs.
///
/// The designs are native ports of the website's (lib/qr/sticker.ts) and the
/// QR encodes the website's exact URL (public vehicle URL + `?s=<design>`).
/// Download / Share export the selected design as a 300-dpi PNG drawn from
/// the same vector painter; Print opens the existing server-generated vector
/// A4 sheet (all five designs, actual size).
class StickerDesignerScreen extends ConsumerStatefulWidget {
  const StickerDesignerScreen({super.key, required this.vehicleId, this.initialDesign});

  final String vehicleId;
  final String? initialDesign;

  @override
  ConsumerState<StickerDesignerScreen> createState() => _StickerDesignerScreenState();
}

class _StickerDesignerScreenState extends ConsumerState<StickerDesignerScreen> {
  Vehicle? _vehicle;
  Object? _error;
  late StickerVariant _design = StickerVariant.values.firstWhere(
    (v) => v.name == widget.initialDesign,
    orElse: () => StickerVariant.square,
  );
  bool _saving = false;
  bool _sharing = false;

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
      if (mounted) setState(() => _error = e);
    }
  }

  /// Same public URL the website encodes (publicVehicleUrl).
  String get _publicUrl => '${AppConfig.apiBaseUrl}/v/${_vehicle!.publicToken}';

  Future<File> _exportPng(Directory dir) async {
    final v = _vehicle!;
    final bytes = await renderStickerPng(
      variant: _design,
      publicUrl: _publicUrl,
      vehicleType: v.type,
      fontFamily: Theme.of(context).textTheme.bodyMedium?.fontFamily,
    );
    final file = File('${dir.path}/ownerping-sticker-${_design.name}-${v.publicToken}.png');
    await file.writeAsBytes(bytes, flush: true);
    return file;
  }

  Future<void> _download() async {
    if (_saving) return;
    setState(() => _saving = true);
    try {
      await _exportPng(await getApplicationDocumentsDirectory());
      _toast('${kStickerSpecs[_design]!.label} saved to this device.');
    } catch (_) {
      _toast("Couldn't save the sticker. Please try again.");
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Future<void> _share() async {
    if (_sharing) return;
    setState(() => _sharing = true);
    try {
      final file = await _exportPng(await getTemporaryDirectory());
      await Share.shareXFiles(
        [XFile(file.path)],
        text: 'Scan to contact me about my ${_vehicle!.name} — private, no phone number needed.',
      );
    } catch (_) {
      _toast("Couldn't share the sticker. Please try again.");
    } finally {
      if (mounted) setState(() => _sharing = false);
    }
  }

  void _toast(String message) {
    if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
  }

  @override
  Widget build(BuildContext context) {
    final c = AppColors.of(context);
    final t = Theme.of(context).textTheme;
    final v = _vehicle;
    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('OWNERPING', style: t.labelSmall?.copyWith(color: c.primaryInk, letterSpacing: 1.6)),
            Text('QR Sticker', style: t.titleLarge),
          ],
        ),
      ),
      body: v == null
          ? (_error != null
              ? ScrollableCenter(child: ErrorState(error: _error!, onRetry: _load))
              : const LoadingSkeleton(rows: 2, rowHeight: 240))
          : _content(context, v),
    );
  }

  Widget _content(BuildContext context, Vehicle v) {
    final c = AppColors.of(context);
    final t = Theme.of(context).textTheme;
    final spec = kStickerSpecs[_design]!;
    final size = MediaQuery.sizeOf(context);
    // Large preview, never taller than ~half the screen, never stretched.
    final maxPreviewH = size.height * 0.5;
    final maxPreviewW = size.width - 2 * Space.page - 2 * Space.lg;
    final previewW = (spec.aspect * maxPreviewH).clamp(0.0, maxPreviewW).toDouble();

    return ListView(
      padding: const EdgeInsets.fromLTRB(Space.page, Space.xs, Space.page, Space.xxl),
      children: [
        // Vehicle
        Row(
          children: [
            VehicleAvatar(vehicle: v, size: 44),
            const SizedBox(width: Space.sm),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(v.name, maxLines: 1, overflow: TextOverflow.ellipsis, style: t.titleMedium),
                  const SizedBox(height: 4),
                  Wrap(
                    spacing: Space.xs,
                    runSpacing: 4,
                    crossAxisAlignment: WrapCrossAlignment.center,
                    children: [
                      if (v.registrationNumber?.isNotEmpty == true) PlateChip(v.registrationNumber!),
                      StatusBadge(v.qrActive ? StatusKind.active : StatusKind.inactive, label: v.qrActive ? 'QR active' : 'QR off'),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
        if (!v.qrActive) ...[
          const SizedBox(height: Space.sm),
          Container(
            padding: const EdgeInsets.all(Space.sm),
            decoration: BoxDecoration(color: c.warningSoft, borderRadius: BorderRadius.circular(Radii.md)),
            child: Text(
              'This QR is turned off — scans show a paused page until you turn it back on.',
              style: t.bodySmall?.copyWith(color: c.warning),
            ),
          ),
        ],
        const SizedBox(height: Space.xl),

        // Design selector
        Semantics(header: true, child: Text('Choose sticker design', style: t.titleMedium)),
        const SizedBox(height: Space.sm),
        SizedBox(
          height: 150,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            itemCount: StickerVariant.values.length,
            separatorBuilder: (_, __) => const SizedBox(width: Space.sm),
            itemBuilder: (context, i) {
              final variant = StickerVariant.values[i];
              return _DesignTile(
                variant: variant,
                publicUrl: _publicUrl,
                vehicleType: v.type,
                selected: variant == _design,
                onTap: () => setState(() => _design = variant),
              );
            },
          ),
        ),
        const SizedBox(height: Space.lg),

        // Live preview
        Container(
          padding: const EdgeInsets.symmetric(vertical: Space.xl, horizontal: Space.lg),
          decoration: BoxDecoration(
            color: c.surface2,
            borderRadius: BorderRadius.circular(Radii.xl),
            border: Border.all(color: c.border),
          ),
          child: Center(
            child: AnimatedSwitcher(
              duration: Motion.of(context, Motion.medium),
              child: SizedBox(
                key: ValueKey(_design),
                width: previewW,
                child: StickerView(variant: _design, publicUrl: _publicUrl, vehicleType: v.type),
              ),
            ),
          ),
        ),
        const SizedBox(height: Space.sm),
        Text(
          '${spec.label} · Prints at ${spec.sizeLabel} · ${spec.placement}',
          textAlign: TextAlign.center,
          style: t.bodySmall,
        ),
        const SizedBox(height: Space.lg),

        // Actions
        AppButton(label: 'Share', icon: Icons.ios_share_outlined, loading: _sharing, onPressed: _share),
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
                onPressed: _download,
              ),
            ),
            const SizedBox(width: Space.sm),
            Expanded(
              child: AppButton(
                label: 'Print',
                semanticLabel: 'Print the A4 sticker sheet',
                icon: Icons.print_outlined,
                variant: AppButtonVariant.secondary,
                compact: true,
                onPressed: () => context.push('/stickers/${v.id}/print'),
              ),
            ),
          ],
        ),
        const SizedBox(height: Space.md),
        const PrivacyLabel('Print uses the A4 sheet with all five designs at actual size.', icon: Icons.straighten_outlined, center: true),
      ],
    );
  }
}

class _DesignTile extends StatelessWidget {
  const _DesignTile({
    required this.variant,
    required this.publicUrl,
    required this.vehicleType,
    required this.selected,
    required this.onTap,
  });

  final StickerVariant variant;
  final String publicUrl;
  final String? vehicleType;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final c = AppColors.of(context);
    final t = Theme.of(context).textTheme;
    final spec = kStickerSpecs[variant]!;
    return Semantics(
      button: true,
      selected: selected,
      label: '${spec.label}, ${spec.sizeLabel}',
      excludeSemantics: true,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(Radii.lg),
        child: AnimatedContainer(
          duration: Motion.of(context, Motion.fast),
          width: 112,
          padding: const EdgeInsets.all(Space.xs),
          decoration: BoxDecoration(
            color: selected ? c.primarySoft : c.surface,
            borderRadius: BorderRadius.circular(Radii.lg),
            border: Border.all(color: selected ? c.primaryInk : c.border, width: selected ? 2 : 1),
          ),
          child: Column(
            children: [
              Expanded(
                child: Center(
                  child: FittedBox(
                    fit: BoxFit.contain,
                    child: SizedBox(
                      width: spec.aspect >= 1 ? 96 : 96 * spec.aspect * 1.4,
                      child: StickerView(variant: variant, publicUrl: publicUrl, vehicleType: vehicleType, shadow: false),
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 6),
              Text(spec.label, maxLines: 1, overflow: TextOverflow.ellipsis, style: t.labelMedium?.copyWith(color: c.ink, fontSize: 12)),
              Text(spec.sizeLabel, style: t.bodySmall?.copyWith(fontSize: 11)),
            ],
          ),
        ),
      ),
    );
  }
}
