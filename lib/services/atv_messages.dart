import 'dart:typed_data';

import 'proto.dart';

/// Android TV Remote Protocol v2 messages (pairing + remote), hand-encoded.
/// Field numbers match the protocol's .proto definitions.
class AtvPairingMsg {
  static Uint8List _wrap(int field, PbWriter inner) => PbWriter()
      .varint(1, 2) // protocol_version
      .varint(2, 200) // status OK
      .message(field, inner)
      .toDelimited();

  static PbWriter get _hex6 => PbWriter().varint(1, 3).varint(2, 6); // HEXADECIMAL, 6 symbols

  static Uint8List request(String serviceName, String clientName) =>
      _wrap(10, PbWriter().string(1, serviceName).string(2, clientName));

  static Uint8List option() => _wrap(20, PbWriter().message(1, _hex6).varint(3, 1));

  static Uint8List configuration() => _wrap(30, PbWriter().message(1, _hex6).varint(2, 1));

  static Uint8List secret(List<int> secret) => _wrap(40, PbWriter().bytes(1, secret));
}

enum AtvPairingStage { requestAck, option, configurationAck, secretAck, other }

class AtvPairingReply {
  final int status;
  final AtvPairingStage stage;
  AtvPairingReply(this.status, this.stage);

  factory AtvPairingReply.parse(List<int> frame) {
    final m = PbMessage.parse(frame);
    final stage = m.has(11)
        ? AtvPairingStage.requestAck
        : m.has(20)
            ? AtvPairingStage.option
            : m.has(31)
                ? AtvPairingStage.configurationAck
                : m.has(41)
                    ? AtvPairingStage.secretAck
                    : AtvPairingStage.other;
    return AtvPairingReply(m.intOf(2) ?? 0, stage);
  }
}

class AtvRemoteMsg {
  static Uint8List configure(String model, String vendor) => PbWriter()
      .message(
          1,
          PbWriter().varint(1, 622).message(
              2,
              PbWriter()
                  .string(1, model)
                  .string(2, vendor)
                  .varint(3, 1)
                  .string(4, '1')
                  .string(5, 'tcl-kumanda')
                  .string(6, '1.0.0')))
      .toDelimited();

  static Uint8List setActive() => PbWriter().message(2, PbWriter().varint(1, 622)).toDelimited();

  static Uint8List pingResponse(int val) => PbWriter().message(9, PbWriter().varint(1, val)).toDelimited();

  /// direction: 1 = start long press, 2 = end long press, 3 = short press.
  static Uint8List key(int keyCode, {int direction = 3}) =>
      PbWriter().message(10, PbWriter().varint(1, keyCode).varint(2, direction)).toDelimited();

  static Uint8List appLink(String link) => PbWriter().message(90, PbWriter().string(1, link)).toDelimited();
}

enum AtvRemoteEvent { configure, setActive, ping, error, other }

class AtvRemoteReply {
  final AtvRemoteEvent event;
  final int? pingValue;
  AtvRemoteReply(this.event, [this.pingValue]);

  factory AtvRemoteReply.parse(List<int> frame) {
    final m = PbMessage.parse(frame);
    if (m.has(1)) return AtvRemoteReply(AtvRemoteEvent.configure);
    if (m.has(2)) return AtvRemoteReply(AtvRemoteEvent.setActive);
    if (m.has(8)) return AtvRemoteReply(AtvRemoteEvent.ping, m.sub(8)?.intOf(1) ?? 0);
    if (m.has(3)) return AtvRemoteReply(AtvRemoteEvent.error);
    return AtvRemoteReply(AtvRemoteEvent.other);
  }
}
