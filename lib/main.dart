import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'services/atv_client.dart';
import 'services/store.dart';
import 'ui/home_screen.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final store = Store(await SharedPreferences.getInstance());
  AtvRemoteClient.defaultCredentialsLoader = store.loadCredentials;
  runApp(TclRemoteApp(store: store));
}

const tclRed = Color(0xFFE4002B);

class TclRemoteApp extends StatelessWidget {
  const TclRemoteApp({super.key, required this.store});
  final Store store;

  @override
  Widget build(BuildContext context) {
    ThemeData theme(Brightness b) => ThemeData(
          useMaterial3: true,
          colorScheme: ColorScheme.fromSeed(seedColor: tclRed, brightness: b),
        );
    return MaterialApp(
      title: 'TCL Kumanda',
      debugShowCheckedModeBanner: false,
      theme: theme(Brightness.light),
      darkTheme: theme(Brightness.dark),
      home: HomeScreen(store: store),
    );
  }
}
