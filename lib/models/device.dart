enum TvKind { roku, android }

class TvDevice {
  final String id;
  final String name;
  final String host;
  final TvKind kind;

  /// Android/Google TV only: whether pairing has been completed.
  final bool paired;

  const TvDevice({required this.id, required this.name, required this.host, required this.kind, this.paired = true});

  TvDevice copyWith({String? name, bool? paired}) =>
      TvDevice(id: id, name: name ?? this.name, host: host, kind: kind, paired: paired ?? this.paired);

  Map<String, dynamic> toJson() => {'id': id, 'name': name, 'host': host, 'kind': kind.name, 'paired': paired};

  factory TvDevice.fromJson(Map<String, dynamic> j) => TvDevice(
        id: j['id'] as String,
        name: j['name'] as String,
        host: j['host'] as String,
        kind: TvKind.values.byName(j['kind'] as String),
        paired: j['paired'] as bool? ?? true,
      );

  String get kindLabel => kind == TvKind.roku ? 'Roku TV' : 'Google/Android TV';
}
