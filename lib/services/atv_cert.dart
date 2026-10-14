import 'dart:convert';
import 'dart:isolate';
import 'dart:typed_data';

import 'package:asn1lib/asn1lib.dart';
import 'package:basic_utils/basic_utils.dart';

/// Client identity (self-signed cert + key) that the TV remembers after pairing.
class AtvCredentials {
  final String certPem;
  final String keyPem;
  const AtvCredentials(this.certPem, this.keyPem);

  /// RSA-2048 key generation is CPU heavy; run it off the UI isolate.
  static Future<AtvCredentials> generate() => Isolate.run(_generateSync);

  static AtvCredentials _generateSync() {
    final pair = CryptoUtils.generateRSAKeyPair(keySize: 2048);
    final priv = pair.privateKey as RSAPrivateKey;
    final pub = pair.publicKey as RSAPublicKey;
    final csr = X509Utils.generateRsaCsrPem(
      {'CN': 'tcl-kumanda', 'O': 'TCL Kumanda'},
      priv,
      pub,
    );
    // Keep expiry before 2050: UTCTime two-digit years would otherwise wrap and look expired.
    final cert = X509Utils.generateSelfSignedCertificate(priv, csr, 3650);
    return AtvCredentials(cert, CryptoUtils.encodeRSAPrivateKeyToPemPkcs1(priv));
  }
}

/// RSA public key parts needed for the pairing secret hash.
class RsaPublicParts {
  final BigInt modulus;
  final BigInt exponent;
  const RsaPublicParts(this.modulus, this.exponent);

  /// Big-endian bytes without leading zeros (matches the TV's hash input).
  Uint8List get modulusBytes => _bigToBytes(modulus);
  Uint8List get exponentBytes => _bigToBytes(exponent);

  static Uint8List _bigToBytes(BigInt v) {
    var hex = v.toRadixString(16);
    if (hex.length.isOdd) hex = '0$hex';
    return Uint8List.fromList([for (var i = 0; i < hex.length; i += 2) int.parse(hex.substring(i, i + 2), radix: 16)]);
  }

  /// Extracts the RSA public key from an X.509 certificate in DER form.
  factory RsaPublicParts.fromCertDer(List<int> der) {
    final cert = ASN1Parser(Uint8List.fromList(der)).nextObject() as ASN1Sequence;
    final tbs = cert.elements[0] as ASN1Sequence;
    // tbsCertificate: [0] version (optional), serial, sigAlg, issuer, validity, subject, spki
    final hasVersion = tbs.elements[0].tag == 0xA0;
    final spki = tbs.elements[hasVersion ? 6 : 5] as ASN1Sequence;
    final bits = spki.elements[1] as ASN1BitString;
    final rsa = ASN1Parser(bits.contentBytes()).nextObject() as ASN1Sequence;
    return RsaPublicParts(
      (rsa.elements[0] as ASN1Integer).valueAsBigInteger,
      (rsa.elements[1] as ASN1Integer).valueAsBigInteger,
    );
  }

  factory RsaPublicParts.fromCertPem(String pem) {
    final body = pem.replaceAll(RegExp(r'-----[A-Z ]+-----|\s'), '');
    return RsaPublicParts.fromCertDer(base64.decode(body));
  }
}
