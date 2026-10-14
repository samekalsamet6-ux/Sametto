import 'dart:convert';
import 'dart:typed_data';

/// Minimal protobuf wire-format writer/reader (only what the Android TV
/// Remote v2 and pairing protocols need).
class PbWriter {
  final BytesBuilder _b = BytesBuilder(copy: false);

  void _varint(int v) {
    while (v >= 0x80) {
      _b.addByte((v & 0x7f) | 0x80);
      v >>= 7;
    }
    _b.addByte(v);
  }

  void _tag(int field, int wire) => _varint((field << 3) | wire);

  PbWriter varint(int field, int v) {
    _tag(field, 0);
    _varint(v);
    return this;
  }

  PbWriter bytes(int field, List<int> v) {
    _tag(field, 2);
    _varint(v.length);
    _b.add(v);
    return this;
  }

  PbWriter string(int field, String v) => bytes(field, utf8.encode(v));

  PbWriter message(int field, PbWriter m) => bytes(field, m.toBytes());

  Uint8List toBytes() => _b.toBytes();

  /// Length-delimited frame (varint length prefix), as used on the TV sockets.
  Uint8List toDelimited() {
    final body = toBytes();
    final w = PbWriter().._varint(body.length);
    return (BytesBuilder(copy: false)
          ..add(w.toBytes())
          ..add(body))
        .toBytes();
  }
}

/// Parsed message: field number -> list of values (int, or Uint8List for length-delimited).
class PbMessage {
  final Map<int, List<Object>> fields;
  PbMessage(this.fields);

  factory PbMessage.parse(List<int> data) {
    final f = <int, List<Object>>{};
    var i = 0;
    int varint() {
      var shift = 0, r = 0;
      while (true) {
        if (i >= data.length) throw const FormatException('truncated varint');
        final b = data[i++];
        r |= (b & 0x7f) << shift;
        if (b < 0x80) return r;
        shift += 7;
      }
    }

    while (i < data.length) {
      final tag = varint();
      final field = tag >> 3;
      switch (tag & 7) {
        case 0:
          f.putIfAbsent(field, () => []).add(varint());
        case 2:
          final len = varint();
          if (i + len > data.length) throw const FormatException('truncated field');
          f.putIfAbsent(field, () => []).add(Uint8List.fromList(data.sublist(i, i + len)));
          i += len;
        case 1:
          i += 8;
        case 5:
          i += 4;
        default:
          throw FormatException('unsupported wire type ${tag & 7}');
      }
    }
    return PbMessage(f);
  }

  bool has(int field) => fields.containsKey(field);
  int? intOf(int field) {
    final v = fields[field]?.first;
    return v is int ? v : null;
  }

  PbMessage? sub(int field) {
    final v = fields[field]?.first;
    return v is Uint8List ? PbMessage.parse(v) : null;
  }

  String? stringOf(int field) {
    final v = fields[field]?.first;
    return v is Uint8List ? utf8.decode(v, allowMalformed: true) : null;
  }
}

/// Splits a byte stream into length-delimited frames.
class FrameDecoder {
  final BytesBuilder _buf = BytesBuilder();

  List<Uint8List> add(List<int> chunk) {
    _buf.add(chunk);
    final out = <Uint8List>[];
    var data = _buf.takeBytes();
    var pos = 0;
    while (true) {
      var i = pos, shift = 0, len = 0;
      var ok = false;
      while (i < data.length) {
        final b = data[i++];
        len |= (b & 0x7f) << shift;
        shift += 7;
        if (b < 0x80) {
          ok = true;
          break;
        }
      }
      if (!ok || i + len > data.length) break;
      out.add(Uint8List.sublistView(data, i, i + len));
      pos = i + len;
    }
    if (pos < data.length) _buf.add(Uint8List.sublistView(data, pos));
    return out;
  }
}
