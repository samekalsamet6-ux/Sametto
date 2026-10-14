import '../models/device.dart';
import 'atv_client.dart';
import 'keys.dart';
import 'roku_client.dart';

class TvException implements Exception {
  final String message;
  final bool needsPairing;
  const TvException(this.message, {this.needsPairing = false});
  @override
  String toString() => message;
}

abstract class TvController {
  bool get supportsText;
  Future<void> sendKey(TvKey key);
  Future<void> launch(TvApp app);
  Future<void> sendText(String text);
  Future<void> dispose();

  static TvController forDevice(TvDevice d) =>
      d.kind == TvKind.roku ? RokuClient(d.host) : AtvRemoteClient(d.host);
}
