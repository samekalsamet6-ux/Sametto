'use strict';
// Platform-independent key names -> per-protocol codes.
// roku: ECP key name; android: androidtv-remote RemoteKeyCode name.
const KEYS = {
  power:     { roku: 'Power',        android: 'KEYCODE_POWER' },
  home:      { roku: 'Home',         android: 'KEYCODE_HOME' },
  back:      { roku: 'Back',         android: 'KEYCODE_BACK' },
  up:        { roku: 'Up',           android: 'KEYCODE_DPAD_UP' },
  down:      { roku: 'Down',         android: 'KEYCODE_DPAD_DOWN' },
  left:      { roku: 'Left',         android: 'KEYCODE_DPAD_LEFT' },
  right:     { roku: 'Right',        android: 'KEYCODE_DPAD_RIGHT' },
  ok:        { roku: 'Select',       android: 'KEYCODE_DPAD_CENTER' },
  menu:      { roku: 'Info',         android: 'KEYCODE_MENU' },
  info:      { roku: 'Info',         android: 'KEYCODE_INFO' },
  settings:  { roku: 'Info',         android: 'KEYCODE_SETTINGS' },
  search:    { roku: 'Search',       android: 'KEYCODE_SEARCH' },
  volup:     { roku: 'VolumeUp',     android: 'KEYCODE_VOLUME_UP' },
  voldown:   { roku: 'VolumeDown',   android: 'KEYCODE_VOLUME_DOWN' },
  mute:      { roku: 'VolumeMute',   android: 'KEYCODE_VOLUME_MUTE' },
  chup:      { roku: 'ChannelUp',    android: 'KEYCODE_CHANNEL_UP' },
  chdown:    { roku: 'ChannelDown',  android: 'KEYCODE_CHANNEL_DOWN' },
  guide:     { roku: 'Info',         android: 'KEYCODE_GUIDE' },
  playpause: { roku: 'Play',         android: 'KEYCODE_MEDIA_PLAY_PAUSE' },
  rewind:    { roku: 'Rev',          android: 'KEYCODE_MEDIA_REWIND' },
  forward:   { roku: 'Fwd',          android: 'KEYCODE_MEDIA_FAST_FORWARD' },
  stop:      { roku: 'Play',         android: 'KEYCODE_MEDIA_STOP' },
  input:     { roku: 'InputHDMI1',   android: 'KEYCODE_TV_INPUT' },
  hdmi1:     { roku: 'InputHDMI1',   android: 'KEYCODE_TV_INPUT_HDMI_1' },
  hdmi2:     { roku: 'InputHDMI2',   android: 'KEYCODE_TV_INPUT_HDMI_2' },
  hdmi3:     { roku: 'InputHDMI3',   android: 'KEYCODE_TV_INPUT_HDMI_3' },
  hdmi4:     { roku: 'InputHDMI4',   android: 'KEYCODE_TV_INPUT_HDMI_4' },
  red:       { roku: null,           android: 'KEYCODE_PROG_RED' },
  green:     { roku: null,           android: 'KEYCODE_PROG_GREEN' },
  yellow:    { roku: null,           android: 'KEYCODE_PROG_YELLOW' },
  blue:      { roku: null,           android: 'KEYCODE_PROG_BLUE' },
};
for (let i = 0; i <= 9; i++) KEYS['n' + i] = { roku: 'Lit_' + i, android: 'KEYCODE_NUMPAD_' + i };

// Apps: roku channel id, android deep link
const APPS = {
  netflix: { label: 'Netflix',   roku: '12',     android: 'https://www.netflix.com/title' },
  youtube: { label: 'YouTube',   roku: '837',    android: 'https://www.youtube.com' },
  prime:   { label: 'Prime',     roku: '13',     android: 'https://app.primevideo.com' },
  disney:  { label: 'Disney+',   roku: '291097', android: 'https://www.disneyplus.com' },
  spotify: { label: 'Spotify',   roku: '22297',  android: 'https://open.spotify.com' },
};

module.exports = { KEYS, APPS };
