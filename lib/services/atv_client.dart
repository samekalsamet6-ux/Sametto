import 'dart:async';
import 'dart:io';
import 'dart:typed_data';

import 'package:crypto/crypto.dart';

import 'atv_cert.dart';
import 'atv_messages.dart';
import 'keys.dart';
import 'proto.dart';
import 'tv_controller.dart';

const _serviceName = 'androidtvremote2';
const _clientName = 'TCL Kumanda';

SecurityContext _context(AtvCredentials c) => SecurityContext(withTrustedRoots: false)
  ..useCertificateChainBytes(c.certPem.codeUnits)
  ..usePrivateKeyBytes(c.keyPem.codeUnits);

/// One-time pairing with a Google/Android TV (port 6467). The TV shows a 6-char hex code.
class AtvPairing {
  AtvPairing._(this._socket, this._creds);

  final SecureSocket _socket;
  final AtvCredentials _creds;
  final _decoder = FrameDecoder();
  final _codePrompt = Completer<void>();
  final _done = Completer<void>();

  /// Connects and waits until the TV is displaying the pairing code.
  static Future<AtvPairing> start(String host, AtvCredentials creds, {int port = 6467}) async {
    final SecureSocket socket;
    try {
      socket = await SecureSocket.connect(host, port,
          context: _context(creds), onBadCertificate: (_) => true, timeout: const Duration(seconds: 6));
    } on Exception {
      throw const TvException('TV\'ye bağlanılamadı. TV açık ve aynı Wi-Fi ağında mı?');
    }
    final p = AtvPairing._(socket, creds);
    p._listen();
    socket.add(AtvPairingMsg.request(_serviceName, _clientName));
    await p._codePrompt.future.timeout(const Duration(seconds: 15),
        onTimeout: () => throw const TvException('TV eşleştirme kodunu göstermedi'));
    return p;
  }

  void _listen() {
    _socket.listen((chunk) {
      for (final frame in _decoder.add(chunk)) {
        final r = AtvPairingReply.parse(frame);
        if (r.status != 200) {
          _fail(TvException(r.status == 402 ? 'Kod hatalı' : 'TV eşleştirmeyi reddetti (${r.status})'));
          return;
        }
        switch (r.stage) {
          case AtvPairingStage.requestAck:
            _socket.add(AtvPairingMsg.option());
          case AtvPairingStage.option:
            _socket.add(AtvPairingMsg.configuration());
          case AtvPairingStage.configurationAck:
            if (!_codePrompt.isCompleted) _codePrompt.complete();
          case AtvPairingStage.secretAck:
            if (!_done.isCompleted) _done.complete();
          case AtvPairingStage.other:
            break;
        }
      }
    }, onError: (Object e) => _fail(TvException('Bağlantı hatası: $e')), onDone: () {
      _fail(const TvException('TV bağlantıyı kapattı'));
    });
  }

  void _fail(TvException e) {
    if (!_codePrompt.isCompleted) _codePrompt.completeError(e);
    if (!_done.isCompleted) _done.completeError(e);
  }

  static List<int> hashFor(RsaPublicParts client, RsaPublicParts server, List<int> codeTail) => sha256.convert([
        ...client.modulusBytes,
        ...client.exponentBytes,
        ...server.modulusBytes,
        ...server.exponentBytes,
        ...codeTail,
      ]).bytes;

  /// Secret = SHA256(clientN, clientE, serverN, serverE, code[1:]); first byte must equal code[0].
  static List<int> computeSecret(RsaPublicParts client, RsaPublicParts server, String code) {
    final bytes = [for (var i = 0; i < 6; i += 2) int.parse(code.substring(i, i + 2), radix: 16)];
    final h = hashFor(client, server, bytes.sublist(1));
    if (h[0] != bytes[0]) throw const TvException('Kod hatalı, TV ekranındaki kodu kontrol edin');
    return h;
  }

  Future<void> submitCode(String code) async {
    code = code.trim().toUpperCase();
    if (!RegExp(r'^[0-9A-F]{6}$').hasMatch(code)) {
      throw const TvException('Kod 6 karakter olmalı (0-9, A-F)');
    }
    final serverCert = _socket.peerCertificate;
    if (serverCert == null) throw const TvException('TV sertifikası alınamadı');
    final secret = computeSecret(
        RsaPublicParts.fromCertPem(_creds.certPem), RsaPublicParts.fromCertDer(serverCert.der), code);
    _socket.add(AtvPairingMsg.secret(secret));
    await _done.future.timeout(const Duration(seconds: 10), onTimeout: () => throw const TvException('TV yanıt vermedi'));
    await close();
  }

  Future<void> close() async {
    try {
      await _socket.close();
    } catch (_) {}
    _socket.destroy();
  }
}

/// Remote control session with a paired TV (port 6466). Reconnects on demand.
class AtvRemoteClient implements TvController {
  AtvRemoteClient(this.host, {Future<AtvCredentials?> Function()? credentialsLoader, this.port = 6466})
      : credentialsLoader = credentialsLoader ?? (() => defaultCredentialsLoader());
  final String host;
  final int port;
  final Future<AtvCredentials?> Function() credentialsLoader;

  /// Set by the app at startup to read credentials from secure storage.
  static Future<AtvCredentials?> Function() defaultCredentialsLoader = () async => null;

  SecureSocket? _socket;
  Future<SecureSocket>? _connecting;

  @override
  bool get supportsText => false;

  Future<SecureSocket> _connect() async {
    final creds = await credentialsLoader();
    if (creds == null) throw const TvException('Bu TV henüz eşleştirilmedi', needsPairing: true);
    final SecureSocket s;
    try {
      s = await SecureSocket.connect(host, port,
          context: _context(creds), onBadCertificate: (_) => true, timeout: const Duration(seconds: 6));
    } on HandshakeException {
      throw const TvException('Eşleştirme geçersiz, TV\'yi yeniden eşleştirin', needsPairing: true);
    } on Exception {
      throw const TvException('TV\'ye bağlanılamadı. TV açık ve aynı Wi-Fi ağında mı?');
    }
    final ready = Completer<void>();
    final decoder = FrameDecoder();
    s.listen((chunk) {
      for (final frame in decoder.add(chunk)) {
        final r = AtvRemoteReply.parse(frame);
        switch (r.event) {
          case AtvRemoteEvent.configure:
            s.add(AtvRemoteMsg.configure('Telefon', 'TCL Kumanda'));
            if (!ready.isCompleted) ready.complete();
          case AtvRemoteEvent.setActive:
            s.add(AtvRemoteMsg.setActive());
          case AtvRemoteEvent.ping:
            s.add(AtvRemoteMsg.pingResponse(r.pingValue ?? 0));
          case AtvRemoteEvent.error:
          case AtvRemoteEvent.other:
            break;
        }
      }
    }, onError: (Object _) {
      _drop(s);
      if (!ready.isCompleted) ready.completeError(const TvException('Bağlantı hatası'));
    }, onDone: () {
      _drop(s);
      if (!ready.isCompleted) {
        ready.completeError(const TvException('TV bağlantıyı kapattı; eşleştirme gerekebilir', needsPairing: true));
      }
    });
    try {
      await ready.future.timeout(const Duration(seconds: 8),
          onTimeout: () => throw const TvException('TV yanıt vermedi'));
    } catch (_) {
      s.destroy();
      rethrow;
    }
    return s;
  }

  void _drop(SecureSocket s) {
    if (identical(_socket, s)) {
      _socket = null;
      _connecting = null;
    }
  }

  Future<SecureSocket> _session() async {
    final cur = _socket;
    if (cur != null) return cur;
    final pending = _connecting ??= _connect();
    try {
      final s = await pending;
      _socket = s;
      return s;
    } finally {
      _connecting = null;
    }
  }

  Future<void> _send(Uint8List data) async {
    var s = await _session();
    try {
      s.add(data);
      await s.flush();
    } catch (_) {
      // Stale socket: reconnect once.
      _drop(s);
      s.destroy();
      s = await _session();
      s.add(data);
      await s.flush();
    }
  }

  @override
  Future<void> sendKey(TvKey key) => _send(AtvRemoteMsg.key(key.android));

  @override
  Future<void> launch(TvApp app) => _send(AtvRemoteMsg.appLink(app.androidLink));

  @override
  Future<void> sendText(String text) async =>
      throw const TvException('Bu TV\'de yazı gönderme desteklenmiyor; TV\'nin ekran klavyesini kullanın');

  @override
  Future<void> dispose() async {
    _socket?.destroy();
    _socket = null;
  }

  /// True if the Android TV remote service port is reachable.
  static Future<bool> probe(String host, {Duration timeout = const Duration(milliseconds: 1500)}) async {
    try {
      final s = await Socket.connect(host, 6466, timeout: timeout);
      s.destroy();
      return true;
    } catch (_) {
      return false;
    }
  }
}
