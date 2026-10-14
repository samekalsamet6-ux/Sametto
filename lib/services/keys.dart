/// Platform-independent remote keys and their per-platform codes.
enum TvKey {
  power('Power', 26),
  home('Home', 3),
  back('Back', 4),
  up('Up', 19),
  down('Down', 20),
  left('Left', 21),
  right('Right', 22),
  ok('Select', 23),
  menu('Info', 82),
  info('Info', 165),
  settings('Info', 176),
  search('Search', 84),
  volUp('VolumeUp', 24),
  volDown('VolumeDown', 25),
  mute('VolumeMute', 164),
  chUp('ChannelUp', 166),
  chDown('ChannelDown', 167),
  guide('Info', 172),
  playPause('Play', 85),
  rewind('Rev', 89),
  forward('Fwd', 90),
  stop('Play', 86),
  input('InputHDMI1', 178),
  hdmi1('InputHDMI1', 243),
  hdmi2('InputHDMI2', 244),
  hdmi3('InputHDMI3', 245),
  hdmi4('InputHDMI4', 246),
  red(null, 183),
  green(null, 184),
  yellow(null, 185),
  blue(null, 186),
  n0('Lit_0', 144),
  n1('Lit_1', 145),
  n2('Lit_2', 146),
  n3('Lit_3', 147),
  n4('Lit_4', 148),
  n5('Lit_5', 149),
  n6('Lit_6', 150),
  n7('Lit_7', 151),
  n8('Lit_8', 152),
  n9('Lit_9', 153);

  const TvKey(this.roku, this.android);

  /// Roku ECP key name, or null if the key does not exist on Roku TV.
  final String? roku;

  /// Android KeyEvent code.
  final int android;
}

enum TvApp {
  netflix('Netflix', '12', 'https://www.netflix.com/title'),
  youtube('YouTube', '837', 'https://www.youtube.com'),
  prime('Prime Video', '13', 'https://app.primevideo.com'),
  disney('Disney+', '291097', 'https://www.disneyplus.com'),
  spotify('Spotify', '22297', 'https://open.spotify.com');

  const TvApp(this.label, this.rokuId, this.androidLink);
  final String label;
  final String rokuId;
  final String androidLink;
}
