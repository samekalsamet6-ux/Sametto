import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../models/device.dart';
import '../services/keys.dart';
import '../services/store.dart';
import '../services/tv_controller.dart';
import 'pair_dialog.dart';

class RemoteScreen extends StatefulWidget {
  const RemoteScreen({super.key, required this.device, required this.store, this.controller});
  final TvDevice device;
  final Store store;

  /// Injectable for tests.
  final TvController? controller;

  @override
  State<RemoteScreen> createState() => _RemoteScreenState();
}

class _RemoteScreenState extends State<RemoteScreen> {
  late TvDevice device = widget.device;
  late TvController ctl = widget.controller ?? TvController.forDevice(device);

  @override
  void initState() {
    super.initState();
    if (device.kind == TvKind.android && !device.paired) {
      WidgetsBinding.instance.addPostFrameCallback((_) => _pair());
    }
  }

  @override
  void dispose() {
    ctl.dispose();
    super.dispose();
  }

  Future<void> _pair() async {
    final ok = await showPairDialog(context, device, widget.store);
    if (ok == true && mounted) {
      setState(() => device = device.copyWith(paired: true));
      ctl.dispose();
      ctl = TvController.forDevice(device);
    }
  }

  Future<void> _run(Future<void> Function() action) async {
    try {
      await action();
    } on TvException catch (e) {
      if (!mounted) return;
      final messenger = ScaffoldMessenger.of(context);
      messenger
        ..hideCurrentSnackBar()
        ..showSnackBar(SnackBar(
          content: Text(e.message),
          action: e.needsPairing ? SnackBarAction(label: 'Eşleştir', onPressed: _pair) : null,
        ));
    }
  }

  void _key(TvKey k) {
    HapticFeedback.lightImpact();
    _run(() => ctl.sendKey(k));
  }

  void _showNumbers() {
    showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      builder: (_) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            _row([TvKey.n1, TvKey.n2, TvKey.n3]),
            _row([TvKey.n4, TvKey.n5, TvKey.n6]),
            _row([TvKey.n7, TvKey.n8, TvKey.n9]),
            _row([TvKey.info, TvKey.n0, TvKey.settings], labels: const ['Bilgi', '0', 'Ayarlar']),
            _row([TvKey.hdmi1, TvKey.hdmi2, TvKey.hdmi3, TvKey.hdmi4], labels: const ['HDMI 1', 'HDMI 2', 'HDMI 3', 'HDMI 4']),
            if (device.kind == TvKind.android) _row([TvKey.red, TvKey.green, TvKey.yellow, TvKey.blue], labels: const ['K', 'Y', 'S', 'M']),
          ]),
        ),
      ),
    );
  }

  Widget _row(List<TvKey> keys, {List<String>? labels}) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 4),
        child: Row(children: [
          for (var i = 0; i < keys.length; i++)
            Expanded(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 4),
                child: FilledButton.tonal(
                  onPressed: () => _key(keys[i]),
                  child: Text(labels?[i] ?? keys[i].name.substring(1)),
                ),
              ),
            ),
        ]),
      );

  Future<void> _text() async {
    final c = TextEditingController();
    final text = await showDialog<String>(
      context: context,
      builder: (d) => AlertDialog(
        title: const Text('TV\'ye yaz'),
        content: TextField(controller: c, autofocus: true, onSubmitted: (v) => Navigator.pop(d, v)),
        actions: [
          TextButton(onPressed: () => Navigator.pop(d), child: const Text('Vazgeç')),
          FilledButton(onPressed: () => Navigator.pop(d, c.text), child: const Text('Gönder')),
        ],
      ),
    );
    if (text != null && text.isNotEmpty) _run(() => ctl.sendText(text));
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop) Navigator.pop(context, device);
      },
      child: Scaffold(
        appBar: AppBar(
          title: Text(device.name, overflow: TextOverflow.ellipsis),
          actions: [
            if (device.kind == TvKind.android)
              IconButton(tooltip: 'Yeniden eşleştir', icon: const Icon(Icons.link), onPressed: _pair),
          ],
        ),
        body: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Center(
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 420),
                child: Column(children: [
                  Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                    _RemoteButton(icon: Icons.power_settings_new, onTap: () => _key(TvKey.power), filled: true, semantic: 'Güç'),
                    _RemoteButton(icon: Icons.input, onTap: () => _key(TvKey.input), semantic: 'Giriş'),
                    _RemoteButton(icon: Icons.volume_off, onTap: () => _key(TvKey.mute), semantic: 'Sessiz'),
                  ]),
                  const SizedBox(height: 20),
                  _DPad(onKey: _key),
                  const SizedBox(height: 20),
                  Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                    _RemoteButton(icon: Icons.arrow_back, onTap: () => _key(TvKey.back), semantic: 'Geri'),
                    _RemoteButton(icon: Icons.home, onTap: () => _key(TvKey.home), semantic: 'Ana sayfa'),
                    _RemoteButton(icon: Icons.menu, onTap: () => _key(TvKey.menu), semantic: 'Menü'),
                  ]),
                  const SizedBox(height: 20),
                  Row(mainAxisAlignment: MainAxisAlignment.spaceEvenly, children: [
                    _Rocker(label: 'SES', up: () => _key(TvKey.volUp), down: () => _key(TvKey.volDown)),
                    _Rocker(label: 'KANAL', up: () => _key(TvKey.chUp), down: () => _key(TvKey.chDown)),
                  ]),
                  const SizedBox(height: 20),
                  Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                    _RemoteButton(icon: Icons.fast_rewind, onTap: () => _key(TvKey.rewind), semantic: 'Geri sar'),
                    _RemoteButton(icon: Icons.play_arrow, onTap: () => _key(TvKey.playPause), semantic: 'Oynat/Duraklat'),
                    _RemoteButton(icon: Icons.fast_forward, onTap: () => _key(TvKey.forward), semantic: 'İleri sar'),
                  ]),
                  const SizedBox(height: 20),
                  Wrap(spacing: 8, runSpacing: 8, alignment: WrapAlignment.center, children: [
                    for (final a in TvApp.values)
                      ActionChip(label: Text(a.label), onPressed: () => _run(() => ctl.launch(a))),
                  ]),
                  const SizedBox(height: 12),
                  Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                    TextButton.icon(onPressed: _showNumbers, icon: const Icon(Icons.dialpad), label: const Text('Rakamlar / Giriş')),
                    if (ctl.supportsText) TextButton.icon(onPressed: _text, icon: const Icon(Icons.keyboard), label: const Text('Yaz')),
                  ]),
                ]),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _RemoteButton extends StatelessWidget {
  const _RemoteButton({required this.icon, required this.onTap, required this.semantic, this.filled = false});
  final IconData icon;
  final VoidCallback onTap;
  final String semantic;
  final bool filled;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Semantics(
      button: true,
      label: semantic,
      child: Material(
        color: filled ? cs.primary : cs.secondaryContainer,
        shape: const StadiumBorder(),
        child: InkWell(
          customBorder: const StadiumBorder(),
          onTap: onTap,
          child: SizedBox(width: 88, height: 56, child: Icon(icon, color: filled ? cs.onPrimary : cs.onSecondaryContainer)),
        ),
      ),
    );
  }
}

/// Repeats [onTap] while held (volume / channel / d-pad).
class _Hold extends StatefulWidget {
  const _Hold({required this.onTap, required this.child});
  final VoidCallback onTap;
  final Widget child;

  @override
  State<_Hold> createState() => _HoldState();
}

class _HoldState extends State<_Hold> {
  Timer? _t;

  void _stop() {
    _t?.cancel();
    _t = null;
  }

  @override
  void dispose() {
    _stop();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTapDown: (_) {
          widget.onTap();
          _stop();
          _t = Timer.periodic(const Duration(milliseconds: 400), (_) => widget.onTap());
        },
        onTapUp: (_) => _stop(),
        onTapCancel: _stop,
        child: widget.child,
      );
}

class _Rocker extends StatelessWidget {
  const _Rocker({required this.label, required this.up, required this.down});
  final String label;
  final VoidCallback up, down;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    Widget btn(IconData i, VoidCallback f, String s) => Semantics(
          button: true,
          label: '$label $s',
          child: _Hold(onTap: f, child: SizedBox(width: 88, height: 64, child: Icon(i, size: 30, color: cs.onSecondaryContainer))),
        );
    return Container(
      decoration: BoxDecoration(color: cs.secondaryContainer, borderRadius: BorderRadius.circular(44)),
      child: Column(children: [
        btn(Icons.add, up, 'artır'),
        Text(label, style: TextStyle(fontSize: 11, color: cs.onSecondaryContainer.withValues(alpha: .7))),
        btn(Icons.remove, down, 'azalt'),
      ]),
    );
  }
}

class _DPad extends StatelessWidget {
  const _DPad({required this.onKey});
  final void Function(TvKey) onKey;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    Widget cell(IconData? icon, TvKey? k, String s) {
      if (k == null) return const SizedBox.shrink();
      final ok = k == TvKey.ok;
      return Semantics(
        button: true,
        label: s,
        excludeSemantics: true,
        child: _Hold(
          onTap: () => onKey(k),
          child: Container(
            margin: const EdgeInsets.all(4),
            decoration: BoxDecoration(shape: ok ? BoxShape.circle : BoxShape.rectangle, borderRadius: ok ? null : BorderRadius.circular(18), color: ok ? cs.primary : cs.surfaceContainerHighest),
            alignment: Alignment.center,
            child: icon == null
                ? Text('OK', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 20, color: cs.onPrimary))
                : Icon(icon, size: 32, color: cs.onSurface),
          ),
        ),
      );
    }

    return Container(
      padding: const EdgeInsets.all(8),
      decoration: BoxDecoration(color: cs.surfaceContainerLow, borderRadius: BorderRadius.circular(36)),
      child: AspectRatio(
        aspectRatio: 1,
        child: GridView.count(
          crossAxisCount: 3,
          physics: const NeverScrollableScrollPhysics(),
          children: [
            cell(null, null, ''),
            cell(Icons.keyboard_arrow_up, TvKey.up, 'Yukarı'),
            cell(null, null, ''),
            cell(Icons.keyboard_arrow_left, TvKey.left, 'Sol'),
            cell(null, TvKey.ok, 'Tamam'),
            cell(Icons.keyboard_arrow_right, TvKey.right, 'Sağ'),
            cell(null, null, ''),
            cell(Icons.keyboard_arrow_down, TvKey.down, 'Aşağı'),
            cell(null, null, ''),
          ],
        ),
      ),
    );
  }
}
