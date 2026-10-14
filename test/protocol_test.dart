// Expected bytes were produced by the reference `androidtv-remote` (protobufjs) implementation.
import 'dart:convert';
import 'dart:typed_data';

import 'package:flutter_test/flutter_test.dart';
import 'package:tcl_kumanda/services/atv_messages.dart';
import 'package:tcl_kumanda/services/proto.dart';

String hex(List<int> b) => b.map((x) => x.toRadixString(16).padLeft(2, '0')).join();

void main() {
  test('pairing messages match reference bytes', () {
    expect(hex(AtvPairingMsg.request('androidtvremote2', 'Virtual machine')),
        '2a080210c80152230a10616e64726f6964747672656d6f746532120f5669727475616c206d616368696e65');
    expect(hex(AtvPairingMsg.option()), '10080210c801a201080a04080310061801');
    expect(hex(AtvPairingMsg.configuration()), '10080210c801f201080a04080310061001');
    expect(hex(AtvPairingMsg.secret(List.generate(32, (i) => i))),
        '2a080210c801c202220a20000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f');
  });

  test('remote messages match reference bytes', () {
    expect(hex(AtvRemoteMsg.key(23)), '06520408171003');
    expect(hex(AtvRemoteMsg.appLink('https://www.netflix.com/title')),
        '22d2051f0a1d68747470733a2f2f7777772e6e6574666c69782e636f6d2f7469746c65');
    expect(hex(AtvRemoteMsg.pingResponse(5)), '044a020805');
    expect(hex(AtvRemoteMsg.setActive()), '05120308ee04');
    expect(hex(AtvRemoteMsg.configure('Virtual machine', '')),
        '330a3108ee04122c0a0f5669727475616c206d616368696e65120018012201312a0b${hex(utf8.encode('tcl-kumanda'))}3205312e302e30');
  });

  test('frame decoder handles split and coalesced chunks', () {
    final a = AtvRemoteMsg.key(23), b = AtvRemoteMsg.pingResponse(5);
    final all = Uint8List.fromList([...a, ...b]);
    final d = FrameDecoder();
    final out = <Uint8List>[];
    for (var i = 0; i < all.length; i++) {
      out.addAll(d.add([all[i]]));
    }
    expect(out.length, 2);
    expect(hex(out[0]), hex(a.sublist(1)));
    final d2 = FrameDecoder();
    expect(d2.add(all).length, 2);
  });

  test('reply parsing', () {
    final ping = PbWriter().message(8, PbWriter().varint(1, 7).varint(2, 1)).toBytes();
    final r = AtvRemoteReply.parse(ping);
    expect(r.event, AtvRemoteEvent.ping);
    expect(r.pingValue, 7);
    final ack = PbWriter().varint(1, 2).varint(2, 200).message(11, PbWriter().string(1, 'tv')).toBytes();
    final p = AtvPairingReply.parse(ack);
    expect(p.stage, AtvPairingStage.requestAck);
    expect(p.status, 200);
  });
}
