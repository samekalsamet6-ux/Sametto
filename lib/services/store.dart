import 'dart:convert';

import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../models/device.dart';
import 'atv_cert.dart';

/// Persists the TV list (shared prefs) and the pairing identity (secure storage).
class Store {
  Store(this._prefs, [FlutterSecureStorage? secure]) : _secure = secure ?? const FlutterSecureStorage();
  final SharedPreferences _prefs;
  final FlutterSecureStorage _secure;

  static const _kDevices = 'devices';
  static const _kCert = 'atv_cert';
  static const _kKey = 'atv_key';

  List<TvDevice> loadDevices() {
    final raw = _prefs.getString(_kDevices);
    if (raw == null) return [];
    try {
      return [for (final j in jsonDecode(raw) as List) TvDevice.fromJson(j as Map<String, dynamic>)];
    } catch (_) {
      return [];
    }
  }

  Future<void> saveDevices(List<TvDevice> d) => _prefs.setString(_kDevices, jsonEncode([for (final x in d) x.toJson()]));

  Future<AtvCredentials?> loadCredentials() async {
    final c = await _secure.read(key: _kCert);
    final k = await _secure.read(key: _kKey);
    return (c == null || k == null) ? null : AtvCredentials(c, k);
  }

  /// Returns the stored identity, generating (and storing) one on first use.
  Future<AtvCredentials> credentials() async {
    final cur = await loadCredentials();
    if (cur != null) return cur;
    final fresh = await AtvCredentials.generate();
    await _secure.write(key: _kCert, value: fresh.certPem);
    await _secure.write(key: _kKey, value: fresh.keyPem);
    return fresh;
  }
}
