import 'package:qr/qr.dart';

/// QR matrices identical to the website's sticker QRs.
///
/// The website renders sticker QRs with the node `qrcode` package (error
/// correction M). The pure-Dart `qr` package produces the same data and
/// error-correction bits, but picks the mask pattern with a slightly
/// different penalty score — which yields a different (equally valid) grid.
/// To make the app's stickers module-for-module identical to the website,
/// the mask is chosen here with the exact penalty rules of `qrcode`
/// (lib/core/mask-pattern.js: N1 + N2 + N3 + N4, first lowest wins).
///
/// Nothing about the URL/token changes — the caller passes the same URL the
/// website encodes.
class WebsiteQr {
  WebsiteQr._(this.size, this._dark);

  final int size;
  final List<bool> _dark;

  bool isDark(int row, int col) => _dark[row * size + col];

  static final _cache = <String, WebsiteQr>{};

  /// Encodes [data] (cached — the grid only depends on the text).
  factory WebsiteQr.encode(String data) => _cache.putIfAbsent(data, () => _encode(data));

  static WebsiteQr _encode(String data) {
    final code = QrCode.fromData(data: data, errorCorrectLevel: QrErrorCorrectLevel.M);
    WebsiteQr? best;
    var lowest = double.infinity;
    for (var mask = 0; mask < 8; mask++) {
      final image = QrImage.withMaskPattern(code, mask);
      final n = image.moduleCount;
      final dark = List<bool>.generate(n * n, (i) => image.isDark(i ~/ n, i % n));
      final candidate = WebsiteQr._(n, dark);
      final penalty = candidate._penalty();
      if (penalty < lowest) {
        lowest = penalty.toDouble();
        best = candidate;
      }
    }
    return best!;
  }

  int _get(int r, int c) => _dark[r * size + c] ? 1 : 0;

  int _penalty() => _n1() + _n2() + _n3() + _n4();

  // Adjacent same-colour runs of 5+ in rows/columns: 3 + (run - 5).
  int _n1() {
    var points = 0;
    for (var row = 0; row < size; row++) {
      var sameCol = 0, sameRow = 0;
      int? lastCol, lastRow;
      for (var col = 0; col < size; col++) {
        var m = _get(row, col);
        if (m == lastCol) {
          sameCol++;
        } else {
          if (sameCol >= 5) points += 3 + (sameCol - 5);
          lastCol = m;
          sameCol = 1;
        }
        m = _get(col, row);
        if (m == lastRow) {
          sameRow++;
        } else {
          if (sameRow >= 5) points += 3 + (sameRow - 5);
          lastRow = m;
          sameRow = 1;
        }
      }
      if (sameCol >= 5) points += 3 + (sameCol - 5);
      if (sameRow >= 5) points += 3 + (sameRow - 5);
    }
    return points;
  }

  // 2×2 blocks of one colour: 3 each.
  int _n2() {
    var points = 0;
    for (var row = 0; row < size - 1; row++) {
      for (var col = 0; col < size - 1; col++) {
        final s = _get(row, col) + _get(row, col + 1) + _get(row + 1, col) + _get(row + 1, col + 1);
        if (s == 4 || s == 0) points++;
      }
    }
    return points * 3;
  }

  // Finder-like 1:1:3:1:1 patterns with 4 light modules: 40 each.
  int _n3() {
    var points = 0;
    for (var row = 0; row < size; row++) {
      var bitsCol = 0, bitsRow = 0;
      for (var col = 0; col < size; col++) {
        bitsCol = ((bitsCol << 1) & 0x7FF) | _get(row, col);
        if (col >= 10 && (bitsCol == 0x5D0 || bitsCol == 0x05D)) points++;
        bitsRow = ((bitsRow << 1) & 0x7FF) | _get(col, row);
        if (col >= 10 && (bitsRow == 0x5D0 || bitsRow == 0x05D)) points++;
      }
    }
    return points * 40;
  }

  // Dark-module proportion away from 50%, in 5% steps: 10 each.
  int _n4() {
    var dark = 0;
    for (final d in _dark) {
      if (d) dark++;
    }
    final total = _dark.length;
    final k = ((dark * 100 / total) / 5).ceil() - 10;
    return k.abs() * 10;
  }
}
