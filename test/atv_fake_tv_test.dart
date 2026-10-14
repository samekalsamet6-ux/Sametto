@Timeout(Duration(minutes: 3))
library;

// End-to-end test of pairing + remote against a fake Android TV (TLS server on localhost).
import 'dart:async';
import 'dart:io';
import 'dart:typed_data';

import 'package:basic_utils/basic_utils.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:tcl_kumanda/services/atv_cert.dart';
import 'package:tcl_kumanda/services/atv_client.dart';
import 'package:tcl_kumanda/services/keys.dart';
import 'package:tcl_kumanda/services/proto.dart';

Future<RawSecureServerSocket> _server(AtvCredentials serverCreds, int port, AtvCredentials trustedClient) => RawSecureServerSocket.bind(
      InternetAddress.loopbackIPv4,
      port,
      SecurityContext(withTrustedRoots: false)
        ..useCertificateChainBytes(serverCreds.certPem.codeUnits)
        ..usePrivateKeyBytes(serverCreds.keyPem.codeUnits)
        ..setTrustedCertificatesBytes(trustedClient.certPem.codeUnits),
      requestClientCertificate: true,
    );

void main() {
  late AtvCredentials client, tv;
  setUpAll(() async {
    client = await AtvCredentials.generate();
    tv = await AtvCredentials.generate();
  });

  test('generated cert parses to RSA-2048 parts', () {
    final p = RsaPublicParts.fromCertPem(client.certPem);
    expect(p.modulus.bitLength, 2048);
    expect(p.exponent, BigInt.from(65537));
    expect(p.exponentBytes, [1, 0, 1]);
    final x = X509Utils.x509CertificateFromPem(client.certPem);
    expect(x.tbsCertificate!.subject['2.5.4.3'], 'tcl-kumanda');
  });

  test('pairing handshake with correct and wrong code', () async {
    final server = await _server(tv, 0, client);
    final port = server.port;
    String? shownCode;
    server.listen((raw) {
      final dec = FrameDecoder();
      final tvParts = RsaPublicParts.fromCertPem(tv.certPem);
      raw.listen((ev) {
        if (ev == RawSocketEvent.read) {
          final data = raw.read();
          if (data == null) return;
          for (final frame in dec.add(data)) {
            final m = PbMessage.parse(frame);
            Uint8List reply(int field, PbWriter inner) =>
                PbWriter().varint(1, 2).varint(2, 200).message(field, inner).toDelimited();
            if (m.has(10)) {
              raw.write(reply(11, PbWriter().string(1, 'Fake TV')));
            } else if (m.has(20)) {
              raw.write(reply(20, PbWriter().message(1, PbWriter().varint(1, 3).varint(2, 6)).varint(3, 2)));
            } else if (m.has(30)) {
              raw.write(reply(31, PbWriter()));
              final clientParts = RsaPublicParts.fromCertDer(raw.peerCertificate!.der);
              // the TV computes the same secret the user would read off the screen
              shownCode = '';
              final h = _expected(clientParts, tvParts);
              shownCode = h.$1;
              expectedSecret = h.$2;
            } else if (m.has(40)) {
              final secret = m.sub(40)!.fields[1]!.first as Uint8List;
              if (secret.toString() == expectedSecret.toString()) {
                raw.write(reply(41, PbWriter().bytes(1, secret)));
              }
            }
          }
        }
      });
    });

    final pairing = await AtvPairing.start('127.0.0.1', client, port: port);
    expect(shownCode, isNotNull);
    final wrong = ((int.parse(shownCode!.substring(0, 2), radix: 16) + 1) & 0xff).toRadixString(16).padLeft(2, '0') + shownCode!.substring(2);
    await expectLater(pairing.submitCode(wrong), throwsA(isA<Object>()));
    await pairing.submitCode(shownCode!.toLowerCase());
    await server.close();
  });

  test('remote session: configure handshake, ping, key + app link', () async {
    final server = await _server(tv, 0, client);
    final received = <PbMessage>[];
    final gotKey = Completer<void>();
    server.listen((raw) {
      final dec = FrameDecoder();
      raw.writeEventsEnabled = true;
      raw.write(PbWriter().message(1, PbWriter().varint(1, 622)).toDelimited()); // remote_configure
      raw.write(PbWriter().message(2, PbWriter().varint(1, 1)).toDelimited()); // set_active
      raw.write(PbWriter().message(8, PbWriter().varint(1, 9)).toDelimited()); // ping
      raw.listen((ev) {
        if (ev != RawSocketEvent.read) return;
        final data = raw.read();
        if (data == null) return;
        for (final f in dec.add(data)) {
          received.add(PbMessage.parse(f));
          if (received.any((m) => m.has(90)) && !gotKey.isCompleted) gotKey.complete();
        }
      });
    });
    final c = AtvRemoteClient('127.0.0.1', port: server.port, credentialsLoader: () async => client);
    await c.sendKey(TvKey.volUp);
    await c.launch(TvApp.netflix);
    await gotKey.future.timeout(const Duration(seconds: 5));
    final key = received.firstWhere((m) => m.has(10)).sub(10)!;
    expect(key.intOf(1), 24);
    expect(key.intOf(2), 3);
    expect(received.any((m) => m.has(1)), isTrue, reason: 'client configure');
    expect(received.any((m) => m.has(2)), isTrue, reason: 'set_active reply');
    final pong = received.firstWhere((m) => m.has(9));
    expect(pong.sub(9)!.intOf(1), 9);
    expect(received.firstWhere((m) => m.has(90)).sub(90)!.stringOf(1), TvApp.netflix.androidLink);
    await c.dispose();
    await server.close();
  });
}

List<int> expectedSecret = [];

/// What a real TV does: derive a code the user reads on screen from the same hash.
(String, List<int>) _expected(RsaPublicParts client, RsaPublicParts tv) {
  // choose the 2 trailing bytes arbitrarily; first byte is determined by the hash
  const tail = [0x12, 0x34];
  final h = AtvPairing.hashFor(client, tv, tail);
  final code = '${h[0].toRadixString(16).padLeft(2, '0')}1234';
  return (code.toUpperCase(), h);
}
