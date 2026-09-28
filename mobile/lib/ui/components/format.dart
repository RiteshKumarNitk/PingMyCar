import 'package:intl/intl.dart';

/// Relative time for lists ("just now", "5m", "3h", "Yesterday", "12 Sep").
String timeAgo(DateTime? time, {DateTime? now}) {
  if (time == null) return '';
  final n = now ?? DateTime.now();
  final local = time.toLocal();
  final diff = n.difference(local);
  if (diff.inMinutes < 1) return 'just now';
  if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
  if (diff.inHours < 24) return '${diff.inHours}h ago';
  if (diff.inDays == 1) return 'Yesterday';
  if (local.year == n.year) return DateFormat('d MMM').format(local);
  return DateFormat('d MMM yyyy').format(local);
}

/// Message timestamp: time today, otherwise date + time.
String messageTime(DateTime time, {DateTime? now}) {
  final n = now ?? DateTime.now();
  final local = time.toLocal();
  final sameDay = local.year == n.year && local.month == n.month && local.day == n.day;
  return sameDay ? DateFormat('h:mm a').format(local) : DateFormat('d MMM, h:mm a').format(local);
}

/// Time-of-day greeting from the device clock.
String greetingFor(DateTime now) {
  final h = now.hour;
  return h < 12 ? 'Good morning' : (h < 17 ? 'Good afternoon' : 'Good evening');
}
