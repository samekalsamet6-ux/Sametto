import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:tcl_kumanda/main.dart';
import 'package:tcl_kumanda/models/device.dart';
import 'package:tcl_kumanda/services/keys.dart';
import 'package:tcl_kumanda/services/store.dart';
import 'package:tcl_kumanda/services/tv_controller.dart';
import 'package:tcl_kumanda/ui/remote_screen.dart';

class FakeTv implements TvController {
  final keys = <TvKey>[];
  final apps = <TvApp>[];
  bool fail = false;
  @override
  bool get supportsText => false;
  @override
  Future<void> sendKey(TvKey key) async {
    if (fail) throw const TvException('TV yanıt vermiyor');
    keys.add(key);
  }

  @override
  Future<void> launch(TvApp app) async => apps.add(app);
  @override
  Future<void> sendText(String text) async {}
  @override
  Future<void> dispose() async {}
}

void main() {
  late Store store;
  setUp(() async {
    SharedPreferences.setMockInitialValues({});
    store = Store(await SharedPreferences.getInstance());
  });

  testWidgets('home shows empty state', (t) async {
    await t.pumpWidget(TclRemoteApp(store: store));
    expect(find.text('Henüz TV eklenmedi'), findsOneWidget);
  });

  testWidgets('remote buttons send keys, apps launch, errors surface', (t) async {
    final tv = FakeTv();
    const d = TvDevice(id: '1', name: 'Salon TCL', host: '10.0.0.5', kind: TvKind.roku);
    await t.pumpWidget(MaterialApp(home: RemoteScreen(device: d, store: store, controller: tv)));
    await t.tap(find.bySemanticsLabel('Güç'));
    await t.tap(find.bySemanticsLabel('Yukarı'));
    await t.tap(find.bySemanticsLabel('Tamam'));
    await t.ensureVisible(find.bySemanticsLabel('SES artır'));
    await t.pump();
    await t.tap(find.bySemanticsLabel('SES artır'));
    await t.pump(const Duration(milliseconds: 50));
    expect(tv.keys, [TvKey.power, TvKey.up, TvKey.ok, TvKey.volUp]);
    await t.ensureVisible(find.text('Netflix'));
    await t.tap(find.text('Netflix'));
    expect(tv.apps, [TvApp.netflix]);
    tv.fail = true;
    await t.tap(find.bySemanticsLabel('Ana sayfa'));
    await t.pump();
    expect(find.text('TV yanıt vermiyor'), findsOneWidget);
  });

  testWidgets('device store round-trips', (t) async {
    const d = TvDevice(id: '1', name: 'A', host: '1.2.3.4', kind: TvKind.android, paired: false);
    await store.saveDevices([d]);
    final back = store.loadDevices().single;
    expect((back.name, back.host, back.kind, back.paired), ('A', '1.2.3.4', TvKind.android, false));
  });
}
