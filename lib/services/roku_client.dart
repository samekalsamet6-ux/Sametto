import 'dart:async';
import 'dart:io';

import 'package:http/http.dart' as http;

import 'keys.dart';
import 'tv_controller.dart';

/// TCL Roku TV control via Roku External Control Protocol (HTTP, port 8060).
class RokuClient implements TvController {
  RokuClient(this.host, {http.Client? client}) : _http = client ?? http.Client();
  final String host;
  final http.Client _http;

  @override
  bool get supportsText => true;

  Uri _uri(String path) => Uri(scheme: 'http', host: host, port: 8060, path: path);

  Future<void> _post(String path) async {
    try {
      final r = await _http.post(_uri(path)).timeout(const Duration(seconds: 4));
      if (r.statusCode == 403) {
        throw const TvException('TV erişimi reddetti. TV\'de Ayarlar > Sistem > Gelişmiş sistem ayarları > '
            'Harici kontrol ayarında "Ağ erişimi"ni etkinleştirin.');
      }
      if (r.statusCode >= 400) throw TvException('TV hata döndürdü (${r.statusCode})');
    } on TimeoutException {
      throw const TvException('TV yanıt vermiyor. Açık ve aynı Wi-Fi ağında mı?');
    } on SocketException {
      throw const TvException('TV\'ye ulaşılamıyor. Açık ve aynı Wi-Fi ağında mı?');
    }
  }

  @override
  Future<void> sendKey(TvKey key) {
    final name = key.roku;
    if (name == null) throw const TvException('Bu tuş Roku TV\'de yok');
    return _post('/keypress/$name');
  }

  @override
  Future<void> launch(TvApp app) => _post('/launch/${app.rokuId}');

  @override
  Future<void> sendText(String text) async {
    for (final ch in text.runes.map(String.fromCharCode)) {
      await _post('/keypress/Lit_${Uri.encodeComponent(ch)}');
    }
  }

  @override
  Future<void> dispose() async => _http.close();

  /// Returns device info if [host] is a Roku, else null.
  static Future<RokuInfo?> probe(String host, {Duration timeout = const Duration(seconds: 2)}) async {
    try {
      final r = await http.get(Uri(scheme: 'http', host: host, port: 8060, path: '/query/device-info')).timeout(timeout);
      if (r.statusCode != 200) return null;
      String? tag(String t) => RegExp('<$t>([^<]*)</$t>').firstMatch(r.body)?.group(1);
      return RokuInfo(tag('user-device-name') ?? tag('friendly-device-name') ?? 'Roku TV', tag('vendor-name'));
    } catch (_) {
      return null;
    }
  }
}

class RokuInfo {
  final String name;
  final String? vendor;
  const RokuInfo(this.name, this.vendor);
}
