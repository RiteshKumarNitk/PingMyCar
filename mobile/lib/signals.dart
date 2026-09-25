import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Signal the UI listens to when a push arrives in the foreground — screens
/// refresh unread counts/data without reloading the whole app.
class UnreadCountSignal {
  final _listeners = <void Function()>[];

  void addListener(void Function() cb) => _listeners.add(cb);
  void removeListener(void Function() cb) => _listeners.remove(cb);

  void bump() {
    for (final cb in List.of(_listeners)) {
      cb();
    }
  }
}

/// Carries a notification-tap route to the router. The route is only a
/// hint — the backend re-verifies ownership when the target screen fetches.
class DeepLinkSignal {
  final _listeners = <void Function(String?)>[];

  void addListener(void Function(String?) cb) => _listeners.add(cb);
  void removeListener(void Function(String?) cb) => _listeners.remove(cb);

  void emitRoute(String? route) {
    for (final cb in List.of(_listeners)) {
      cb(route);
    }
  }
}

final unreadCountSignalProvider = Provider<UnreadCountSignal>((ref) => UnreadCountSignal());
final deepLinkSignalProvider = Provider<DeepLinkSignal>((ref) => DeepLinkSignal());
