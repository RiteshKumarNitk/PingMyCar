// Sticker designs: every website design renders natively, keeps its exact
// aspect ratio, and encodes the website's per-variant URL.
// PMC_STICKERS=<dir> also writes each design as PNG for the website
// comparison (tool/compare_stickers.cjs).
import 'dart:io';
import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:pingmycar_mobile/ui/stickers/sticker_designs.dart';

import 'support/fakes.dart';

const _publicUrl = 'https://ping-my-car.vercel.app/v/ABCD2345';

void main() {
  setUpAll(() async {
    TestWidgetsFlutterBinding.ensureInitialized();
    await loadRealFonts();
  });

  test('QR URL matches the website: public URL + ?s=<variant>', () {
    expect(stickerQrUrl(_publicUrl, StickerVariant.square), '$_publicUrl?s=square');
    expect(stickerQrUrl('$_publicUrl?x=1', StickerVariant.plate), '$_publicUrl?x=1&s=plate');
  });

  test('specs mirror the website (5 designs, sizes, viewBoxes)', () {
    expect(kStickerSpecs.length, 5);
    expect(StickerVariant.values.map((v) => v.name), ['square', 'wide', 'plate', 'round', 'arrow']);
    expect(kStickerSpecs[StickerVariant.square]!.viewW / kStickerSpecs[StickerVariant.square]!.viewH, closeTo(360 / 560, 1e-9));
    expect(kStickerSpecs[StickerVariant.round]!.aspect, 1);
  });

  for (final variant in StickerVariant.values) {
    testWidgets('${variant.name} renders at its exact aspect ratio', (tester) async {
      final spec = kStickerSpecs[variant]!;
      final key = GlobalKey();
      tester.view.physicalSize = Size(spec.viewW * 2 + 40, spec.viewH * 2 + 40);
      tester.view.devicePixelRatio = 1;
      addTearDown(tester.view.reset);
      await tester.pumpWidget(
        // Real app context: the platform font (Roboto on Android) via the theme.
        MaterialApp(
          debugShowCheckedModeBanner: false,
          theme: ThemeData(fontFamily: 'Roboto'),
          home: ColoredBox(
            color: Colors.white,
            child: Center(
              child: SizedBox(
                width: spec.viewW * 2,
                child: RepaintBoundary(
                  key: key,
                  child: StickerView(variant: variant, publicUrl: _publicUrl, vehicleType: 'CAR', shadow: false),
                ),
              ),
            ),
          ),
        ),
      );
      expect(tester.takeException(), isNull);
      final box = tester.getSize(find.byType(StickerView));
      expect(box.width / box.height, closeTo(spec.aspect, 0.01));

      final dir = Platform.environment['PMC_STICKERS'];
      if (dir != null) {
        await tester.runAsync(() async {
          final boundary = key.currentContext!.findRenderObject()! as RenderRepaintBoundary;
          final ui.Image image = await boundary.toImage(pixelRatio: 1);
          final bytes = await image.toByteData(format: ui.ImageByteFormat.png);
          Directory(dir).createSync(recursive: true);
          File('$dir/flutter-${variant.name}.png').writeAsBytesSync(bytes!.buffer.asUint8List());
        });
      }
    });
  }

  test('print export keeps physical size (300 dpi) and aspect', () async {
    final png = await renderStickerPng(variant: StickerVariant.square, publicUrl: _publicUrl, vehicleType: 'CAR');
    // PNG IHDR: width/height big-endian at bytes 16..23.
    int be(int o) => (png[o] << 24) | (png[o + 1] << 16) | (png[o + 2] << 8) | png[o + 3];
    final w = be(16), h = be(20);
    expect(w, (50 / 25.4 * 300).round()); // 50 mm wide
    expect(w / h, closeTo(360 / 560, 0.005));
  });
}
