import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../config.dart';
import '../../core/api_error.dart';
import '../../models/models.dart';
import '../../providers.dart';
import '../components/components.dart';
import '../stickers/sticker_designs.dart';

/// Sticker management: which vehicle, its real QR, what's on the sheet,
/// where to place it, and print.
class StickersScreen extends ConsumerStatefulWidget {
  const StickersScreen({super.key});

  @override
  ConsumerState<StickersScreen> createState() => _StickersScreenState();
}

class _StickersScreenState extends ConsumerState<StickersScreen> {
  List<Vehicle>? _vehicles;
  Map<String, String> _authHeaders = {};
  Object? _error;

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
      setState(() => _error = e);
    }
  }

  @override
  Widget build(BuildContext context) {
    final vehicles = _vehicles;
    return Scaffold(
      appBar: AppBar(title: const Text('Stickers')),
      body: vehicles == null
          ? (_error != null
              ? ScrollableCenter(child: ErrorState(error: _error!, onRetry: _load))
              : const LoadingSkeleton(rows: 3, rowHeight: 120))
          : vehicles.isEmpty
              ? ScrollableCenter(
                  child: EmptyState(
                    icon: Icons.sell_outlined,
                    title: 'No stickers yet',
                    message: 'Add your vehicle to create your first private contact QR — its stickers appear here.',
                    actionLabel: 'Add Vehicle',
                    actionIcon: Icons.add,
                    onAction: () => context.push('/vehicles/new'),
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _load,
                  child: ListView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    padding: const EdgeInsets.fromLTRB(Space.page, Space.xs, Space.page, Space.xxl),
                    children: [
                      Text(
                        'Each A4 sheet has every design below, with your QR. Print at 100% (actual size).',
                        style: Theme.of(context).textTheme.bodyMedium,
                      ),
                      const SizedBox(height: Space.lg),
                      const SectionHeader(title: 'Your vehicles'),
                      for (final v in vehicles) ...[
                        _VehicleStickerRow(vehicle: v, headers: _authHeaders),
                        const SizedBox(height: Space.sm),
                      ],
                      const SizedBox(height: Space.md),
                      const SectionHeader(title: 'Sticker designs'),
                      _DesignGallery(vehicle: vehicles.first),
                      const SizedBox(height: Space.xl),
                      const SectionHeader(title: 'Placement tips'),
                      const _PlacementTips(),
                    ],
                  ),
                ),
    );
  }
}

class _VehicleStickerRow extends StatelessWidget {
  const _VehicleStickerRow({required this.vehicle, required this.headers});

  final Vehicle vehicle;
  final Map<String, String> headers;

  @override
  Widget build(BuildContext context) {
    final c = AppColors.of(context);
    final t = Theme.of(context).textTheme;
    return AppCard(
      child: Row(
        children: [
          // QR thumbnail — always black on white for scannability.
          Container(
            width: 76,
            height: 76,
            padding: const EdgeInsets.all(6),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(Radii.sm),
              border: Border.all(color: c.border),
            ),
            child: headers.isEmpty
                ? const SizedBox()
                : Image.network(
                    '${AppConfig.apiBaseUrl}/api/vehicles/${vehicle.id}/qr.png',
                    headers: headers,
                    fit: BoxFit.contain,
                    filterQuality: FilterQuality.none,
                    semanticLabel: 'QR code for ${vehicle.name}',
                    errorBuilder: (_, __, ___) => Icon(Icons.qr_code_2_outlined, color: c.muted),
                  ),
          ),
          const SizedBox(width: Space.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(vehicle.name, maxLines: 1, overflow: TextOverflow.ellipsis, style: t.titleSmall),
                const SizedBox(height: 4),
                StatusBadge(
                  vehicle.qrActive ? StatusKind.active : StatusKind.inactive,
                  label: vehicle.qrActive ? 'QR active' : 'QR off',
                ),
                const SizedBox(height: Space.xs),
                AppButton(
                  label: 'Choose design',
                  icon: Icons.style_outlined,
                  compact: true,
                  expand: false,
                  variant: AppButtonVariant.secondary,
                  onPressed: () => context.push('/stickers/${vehicle.id}'),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// The website's five designs, rendered for real (first vehicle's QR), each
/// opening the designer on that design.
class _DesignGallery extends StatelessWidget {
  const _DesignGallery({required this.vehicle});

  final Vehicle vehicle;

  @override
  Widget build(BuildContext context) {
    final c = AppColors.of(context);
    final t = Theme.of(context).textTheme;
    final publicUrl = '${AppConfig.apiBaseUrl}/v/${vehicle.publicToken}';
    return AppCard(
      padding: EdgeInsets.zero,
      child: Column(
        children: [
          for (var i = 0; i < StickerVariant.values.length; i++)
            InkWell(
              onTap: () => context.push('/stickers/${vehicle.id}?design=${StickerVariant.values[i].name}'),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: Space.md, vertical: Space.sm),
                decoration: BoxDecoration(
                  border: i < StickerVariant.values.length - 1 ? Border(bottom: BorderSide(color: c.border)) : null,
                ),
                child: Row(
                  children: [
                    SizedBox(
                      width: 64,
                      height: 64,
                      child: Center(
                        child: StickerView(
                          variant: StickerVariant.values[i],
                          publicUrl: publicUrl,
                          vehicleType: vehicle.type,
                          shadow: false,
                        ),
                      ),
                    ),
                    const SizedBox(width: Space.md),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(kStickerSpecs[StickerVariant.values[i]]!.label, style: t.titleSmall?.copyWith(fontWeight: FontWeight.w500)),
                          Text(kStickerSpecs[StickerVariant.values[i]]!.placement, style: t.bodySmall),
                        ],
                      ),
                    ),
                    Text(kStickerSpecs[StickerVariant.values[i]]!.sizeLabel, style: t.labelMedium),
                    const SizedBox(width: Space.xs),
                    Icon(Icons.chevron_right, color: c.muted),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _PlacementTips extends StatelessWidget {
  const _PlacementTips();

  static const _tips = [
    (Icons.visibility_outlined, 'Put it where someone standing next to the vehicle can see it.'),
    (Icons.cleaning_services_outlined, 'Clean and dry the surface before applying.'),
    (Icons.crop_free_outlined, "Keep the QR flat and uncovered — don't place it behind tint or wipers."),
    (Icons.straighten_outlined, 'Print at 100% so the QR scans reliably from about 1 metre.'),
  ];

  @override
  Widget build(BuildContext context) {
    final c = AppColors.of(context);
    final t = Theme.of(context).textTheme;
    return Column(
      children: [
        for (final (icon, text) in _tips)
          Padding(
            padding: const EdgeInsets.only(bottom: Space.sm),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Icon(icon, size: 18, color: c.slate),
                const SizedBox(width: Space.sm),
                Expanded(child: Text(text, style: t.bodyMedium)),
              ],
            ),
          ),
      ],
    );
  }
}
