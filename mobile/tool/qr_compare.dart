// ignore_for_file: avoid_print
// Dev tool: verifies WebsiteQr matches the website's node `qrcode` output.
import 'dart:convert';
import 'dart:io';
import 'package:pingmycar_mobile/qr/website_qr.dart';

void main(List<String> args) {
  final ref = jsonDecode(File(args[0]).readAsStringSync()) as Map<String, dynamic>;
  var same = 0;
  for (final e in ref.entries) {
    final q = WebsiteQr.encode(e.key);
    final sb = StringBuffer();
    for (var y = 0; y < q.size; y++) {
      for (var x = 0; x < q.size; x++) {
        sb.write(q.isDark(y, x) ? '1' : '0');
      }
    }
    if (sb.toString() == (e.value as Map)['s']) {
      same++;
    } else {
      print('MISMATCH ${e.key}');
    }
  }
  print('identical: $same / ${ref.length}');
}
