import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../config.dart';
import '../../core/api_error.dart';
import '../../models/models.dart';
import '../../providers.dart';

/// QR actions shared by the vehicle detail and QR screens. They all use the
/// backend's real QR PNG (same publicToken as the web app) through the
/// authenticated API — no QR is generated on the device.
class QrActions {
  QrActions(this.ref, this.context);

  final WidgetRef ref;
  final BuildContext context;

  String publicUrl(Vehicle v) => '${AppConfig.apiBaseUrl}/v/${v.publicToken}';

  Future<void> share(Vehicle v) async {
    try {
      final file = await ref.read(vehicleRepositoryProvider).downloadQrPng(v.id, v.publicToken);
      await Share.shareXFiles(
        [XFile(file.path)],
        text: 'Scan to contact me about my ${v.name} — private, no phone number needed.',
      );
    } on ApiException catch (e) {
      _toast(e.message);
    }
  }

  Future<void> download(Vehicle v) async {
    try {
      final docs = await getApplicationDocumentsDirectory();
      await ref.read(vehicleRepositoryProvider).downloadQrPng(
            v.id,
            v.publicToken,
            toPath: '${docs.path}/pingmycar-qr-${v.publicToken}.png',
          );
      _toast('QR saved to this device.');
    } on ApiException catch (e) {
      _toast(e.message);
    }
  }

  Future<void> openPublicPage(Vehicle v) async {
    final uri = Uri.parse(publicUrl(v));
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    } else {
      await Clipboard.setData(ClipboardData(text: publicUrl(v)));
      _toast('Link copied');
    }
  }

  Future<void> copyLink(Vehicle v) async {
    await Clipboard.setData(ClipboardData(text: publicUrl(v)));
    _toast('Link copied');
  }

  void _toast(String message) {
    if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
  }
}
