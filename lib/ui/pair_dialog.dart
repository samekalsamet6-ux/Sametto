import 'package:flutter/material.dart';

import '../models/device.dart';
import '../services/atv_client.dart';
import '../services/store.dart';
import '../services/tv_controller.dart';

/// Pairs with a Google/Android TV. Resolves true on success.
Future<bool?> showPairDialog(BuildContext context, TvDevice device, Store store) =>
    showDialog<bool>(context: context, barrierDismissible: false, builder: (_) => _PairDialog(device: device, store: store));

class _PairDialog extends StatefulWidget {
  const _PairDialog({required this.device, required this.store});
  final TvDevice device;
  final Store store;

  @override
  State<_PairDialog> createState() => _PairDialogState();
}

class _PairDialogState extends State<_PairDialog> {
  final code = TextEditingController();
  AtvPairing? pairing;
  String? error;
  bool starting = true;
  bool submitting = false;

  @override
  void initState() {
    super.initState();
    _start();
  }

  @override
  void dispose() {
    code.dispose();
    pairing?.close();
    super.dispose();
  }

  Future<void> _start() async {
    setState(() {
      starting = true;
      error = null;
    });
    try {
      final creds = await widget.store.credentials();
      pairing?.close();
      pairing = await AtvPairing.start(widget.device.host, creds);
    } on TvException catch (e) {
      error = e.message;
    } catch (e) {
      error = 'Eşleştirme başlatılamadı: $e';
    }
    if (mounted) setState(() => starting = false);
  }

  Future<void> _submit() async {
    setState(() {
      submitting = true;
      error = null;
    });
    try {
      await pairing!.submitCode(code.text);
      if (mounted) Navigator.pop(context, true);
      return;
    } on TvException catch (e) {
      error = e.message;
    } catch (e) {
      error = 'Eşleştirme başarısız: $e';
    }
    if (!mounted) return;
    setState(() => submitting = false);
    // Local code mistakes can be retried on the same session; anything else needs a fresh one.
    if (!(error ?? '').startsWith('Kod')) {
      final msg = error;
      await _start();
      if (mounted && msg != null && error == null) setState(() => error = msg);
    }
  }

  @override
  Widget build(BuildContext context) {
    final ready = !starting && pairing != null;
    return AlertDialog(
      title: const Text('TV eşleştirme'),
      content: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
        if (starting)
          const Row(children: [
            SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2)),
            SizedBox(width: 12),
            Expanded(child: Text('TV\'ye bağlanılıyor…')),
          ])
        else if (ready) ...[
          const Text('TV ekranında görünen 6 karakterlik kodu girin.'),
          const SizedBox(height: 12),
          TextField(
            controller: code,
            autofocus: true,
            maxLength: 6,
            textCapitalization: TextCapitalization.characters,
            textAlign: TextAlign.center,
            style: const TextStyle(fontSize: 28, letterSpacing: 6),
            decoration: const InputDecoration(border: OutlineInputBorder(), counterText: ''),
            onSubmitted: (_) => submitting ? null : _submit(),
          ),
        ],
        if (error != null) Padding(padding: const EdgeInsets.only(top: 12), child: Text(error!, style: TextStyle(color: Theme.of(context).colorScheme.error))),
      ]),
      actions: [
        TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Vazgeç')),
        if (!starting && !ready) FilledButton(onPressed: _start, child: const Text('Tekrar dene')),
        if (ready) FilledButton(onPressed: submitting ? null : _submit, child: const Text('Eşleştir')),
      ],
    );
  }
}
