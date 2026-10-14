import 'dart:io';

import '../models/device.dart';
import 'atv_client.dart';
import 'roku_client.dart';

class FoundTv {
  final String host;
  final TvKind kind;
  final String name;
  const FoundTv(this.host, this.kind, this.name);
}

/// Detects the TV platform at [host]; null if neither a Roku TV nor an Android/Google TV answers.
Future<FoundTv?> identify(String host, {Duration timeout = const Duration(milliseconds: 1500)}) async {
  final roku = await RokuClient.probe(host, timeout: timeout);
  if (roku != null) {
    final vendor = roku.vendor == null ? '' : ' (${roku.vendor})';
    return FoundTv(host, TvKind.roku, '${roku.name}$vendor');
  }
  if (await AtvRemoteClient.probe(host, timeout: timeout)) {
    return FoundTv(host, TvKind.android, 'Google/Android TV');
  }
  return null;
}

/// Scans the phone's local /24 subnet(s) for TVs. Works without multicast/mDNS permissions.
Stream<FoundTv> scanNetwork() async* {
  final own = <String>{};
  final bases = <String>{};
  for (final nic in await NetworkInterface.list(type: InternetAddressType.IPv4, includeLoopback: false)) {
    for (final a in nic.addresses) {
      own.add(a.address);
      final p = a.address.split('.');
      if (p.length == 4) bases.add('${p[0]}.${p[1]}.${p[2]}');
    }
  }
  for (final base in bases) {
    final hosts = [for (var i = 1; i < 255; i++) '$base.$i'].where((h) => !own.contains(h)).toList();
    for (var i = 0; i < hosts.length; i += 64) {
      final batch = hosts.skip(i).take(64);
      final results = await Future.wait(batch.map(identify));
      for (final r in results.whereType<FoundTv>()) {
        yield r;
      }
    }
  }
}

bool isValidIPv4(String s) {
  final p = s.trim().split('.');
  return p.length == 4 && p.every((x) => int.tryParse(x) != null && int.parse(x) >= 0 && int.parse(x) <= 255);
}
