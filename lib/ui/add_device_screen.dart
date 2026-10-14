import 'dart:async';

import 'package:flutter/material.dart';

import '../models/device.dart';
import '../services/discovery.dart';
import '../services/store.dart';
import 'pair_dialog.dart';

class AddDeviceScreen extends StatefulWidget {
  const AddDeviceScreen({super.key, required this.store, required this.existing});
  final Store store;
  final List<TvDevice> existing;

  @override
  State<AddDeviceScreen> createState() => _AddDeviceScreenState();
}

class _AddDeviceScreenState extends State<AddDeviceScreen> {
  final found = <FoundTv>[];
  final ip = TextEditingController();
  StreamSubscription<FoundTv>? _sub;
  bool scanning = false;
  bool busy = false;

  @override
  void initState() {
    super.initState();
    _scan();
  }

  @override
  void dispose() {
    _sub?.cancel();
    ip.dispose();
    super.dispose();
  }

  bool _known(String host) => widget.existing.any((d) => d.host == host);

  void _scan() {
    _sub?.cancel();
    setState(() {
      found.clear();
      scanning = true;
    });
    _sub = scanNetwork().listen(
      (f) {
        if (!_known(f.host) && mounted) setState(() => found.add(f));
      },
      onDone: () => mounted ? setState(() => scanning = false) : null,
      onError: (_) => mounted ? setState(() => scanning = false) : null,
    );
  }

  void _msg(String m) => ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(m)));

  Future<void> _select(FoundTv f) async {
    if (busy) return;
    setState(() => busy = true);
    try {
      var d = TvDevice(
        id: '${DateTime.now().microsecondsSinceEpoch}',
        name: f.name,
        host: f.host,
        kind: f.kind,
        paired: f.kind == TvKind.roku,
      );
      if (f.kind == TvKind.android) {
        final ok = await showPairDialog(context, d, widget.store);
        if (ok != true) return;
        d = d.copyWith(paired: true);
      }
      if (mounted) Navigator.of(context).pop(d);
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  Future<void> _manual() async {
    final host = ip.text.trim();
    if (!isValidIPv4(host)) return _msg('Geçerli bir IP adresi girin (ör. 192.168.1.20)');
    if (_known(host)) return _msg('Bu TV zaten ekli');
    setState(() => busy = true);
    final f = await identify(host, timeout: const Duration(seconds: 3));
    if (!mounted) return;
    setState(() => busy = false);
    if (f == null) return _msg('TV bulunamadı. TV açık ve aynı Wi-Fi ağında mı?');
    await _select(f);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('TV ekle')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Row(children: [
            Expanded(child: Text('Ağdaki TV\'ler', style: Theme.of(context).textTheme.titleMedium)),
            if (scanning)
              const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
            else
              TextButton.icon(onPressed: _scan, icon: const Icon(Icons.refresh), label: const Text('Yeniden ara')),
          ]),
          if (found.isEmpty && !scanning)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 12),
              child: Text('TV bulunamadı. TV\'nin açık ve telefonla aynı Wi-Fi ağında olduğundan emin olun '
                  'veya IP adresini elle girin.'),
            ),
          for (final f in found)
            Card(
              child: ListTile(
                leading: const Icon(Icons.tv),
                title: Text(f.name),
                subtitle: Text('${f.host} • ${f.kind == TvKind.roku ? 'Roku TV' : 'Google/Android TV'}'),
                onTap: busy ? null : () => _select(f),
              ),
            ),
          const Divider(height: 32),
          Text('IP adresiyle ekle', style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 8),
          TextField(
            controller: ip,
            keyboardType: TextInputType.number,
            decoration: const InputDecoration(border: OutlineInputBorder(), hintText: '192.168.1.20', labelText: 'TV IP adresi'),
            onSubmitted: (_) => _manual(),
          ),
          const SizedBox(height: 12),
          FilledButton(onPressed: busy ? null : _manual, child: const Text('Ekle')),
          const SizedBox(height: 8),
          const Text('IP adresi: TV Ayarlar > Ağ > Ağ durumu.', style: TextStyle(fontSize: 12)),
        ],
      ),
    );
  }
}
