import 'package:flutter/material.dart';

import '../models/device.dart';
import '../services/store.dart';
import 'add_device_screen.dart';
import 'remote_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key, required this.store});
  final Store store;

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  late List<TvDevice> devices = widget.store.loadDevices();

  Future<void> _persist() async {
    await widget.store.saveDevices(devices);
    if (mounted) setState(() {});
  }

  Future<void> _add() async {
    final d = await Navigator.of(context).push<TvDevice>(
      MaterialPageRoute(builder: (_) => AddDeviceScreen(store: widget.store, existing: devices)),
    );
    if (d == null) return;
    devices = [...devices, d];
    await _persist();
    if (mounted) _open(d);
  }

  Future<void> _open(TvDevice d) async {
    final updated = await Navigator.of(context).push<TvDevice>(
      MaterialPageRoute(builder: (_) => RemoteScreen(device: d, store: widget.store)),
    );
    if (updated != null) {
      devices = [for (final x in devices) x.id == updated.id ? updated : x];
      await _persist();
    }
  }

  Future<void> _delete(TvDevice d) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (c) => AlertDialog(
        title: const Text('TV silinsin mi?'),
        content: Text(d.name),
        actions: [
          TextButton(onPressed: () => Navigator.pop(c, false), child: const Text('Vazgeç')),
          FilledButton(onPressed: () => Navigator.pop(c, true), child: const Text('Sil')),
        ],
      ),
    );
    if (ok == true) {
      devices = devices.where((x) => x.id != d.id).toList();
      await _persist();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('TCL Kumanda')),
      body: devices.isEmpty
          ? Center(
              child: Padding(
                padding: const EdgeInsets.all(32),
                child: Column(mainAxisSize: MainAxisSize.min, children: [
                  const Icon(Icons.settings_remote, size: 72),
                  const SizedBox(height: 16),
                  Text('Henüz TV eklenmedi', style: Theme.of(context).textTheme.titleLarge),
                  const SizedBox(height: 8),
                  const Text('Telefon ve TCL TV aynı Wi-Fi ağında olmalı.', textAlign: TextAlign.center),
                  const SizedBox(height: 24),
                  FilledButton.icon(onPressed: _add, icon: const Icon(Icons.add), label: const Text('TV ekle')),
                ]),
              ),
            )
          : ListView(
              children: [
                for (final d in devices)
                  ListTile(
                    leading: const Icon(Icons.tv),
                    title: Text(d.name),
                    subtitle: Text('${d.kindLabel} • ${d.host}${d.paired ? '' : ' • eşleştirilmedi'}'),
                    trailing: IconButton(icon: const Icon(Icons.delete_outline), onPressed: () => _delete(d)),
                    onTap: () => _open(d),
                  ),
              ],
            ),
      floatingActionButton: devices.isEmpty ? null : FloatingActionButton(onPressed: _add, child: const Icon(Icons.add)),
    );
  }
}
