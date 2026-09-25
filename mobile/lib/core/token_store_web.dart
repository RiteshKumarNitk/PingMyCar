// Web backend for TokenStore (dev/preview builds). The `dart:html`
// dependency is intentional and confined to this file, which is only
// selected on web via token_store.dart's conditional import.
// ignore_for_file: avoid_web_libraries_in_flutter, deprecated_member_use

import 'dart:html' as html;

import 'token_store.dart';

TokenStore createTokenStore() => TokenStoreWeb();

/// Web implementation: localStorage. Not cryptographically secure (web
/// can't be), acceptable for development/preview builds; the shipped app
/// targets Android/iOS where the keystore-backed store is used.
class TokenStoreWeb implements TokenStore {
  static const _sessionKey = 'pmc.session_token';
  static const _deviceIdKey = 'pmc.device_id';

  @override
  Future<void> saveSessionToken(String token) async =>
      html.window.localStorage[_sessionKey] = token;

  @override
  Future<String?> readSessionToken() async => html.window.localStorage[_sessionKey];

  @override
  Future<void> clearSessionToken() async => html.window.localStorage.remove(_sessionKey);

  @override
  Future<String> readOrCreateDeviceId() async {
    var id = html.window.localStorage[_deviceIdKey];
    if (id == null) {
      id = DateTime.now().microsecondsSinceEpoch.toRadixString(36);
      html.window.localStorage[_deviceIdKey] = id;
    }
    return id;
  }
}
