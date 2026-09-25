import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import 'token_store.dart';

TokenStore createTokenStore() => TokenStoreIO();

/// IO implementation (Android/iOS): keychain / encrypted shared prefs.
class TokenStoreIO implements TokenStore {
  static const _storage = FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
    iOptions: IOSOptions(accessibility: KeychainAccessibility.first_unlock),
  );

  static const _sessionKey = 'pmc.session_token';
  static const _deviceIdKey = 'pmc.device_id';

  @override
  Future<void> saveSessionToken(String token) =>
      _storage.write(key: _sessionKey, value: token);

  @override
  Future<String?> readSessionToken() => _storage.read(key: _sessionKey);

  @override
  Future<void> clearSessionToken() => _storage.delete(key: _sessionKey);

  @override
  Future<String> readOrCreateDeviceId() async {
    var id = await _storage.read(key: _deviceIdKey);
    if (id == null) {
      id = DateTime.now().microsecondsSinceEpoch.toRadixString(36) +
          (100000 + DateTime.now().millisecondsSinceEpoch % 900000).toString();
      await _storage.write(key: _deviceIdKey, value: id);
    }
    return id;
  }
}
