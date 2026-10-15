'use strict';
// Akvaryum Dünyam — Electron kabuğu: oyunun tek dosyalık sürümünü pencerede açar.
const { app, BrowserWindow, Menu, shell, globalShortcut } = require('electron');
const path = require('path');

app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');   // müzik ilk dokunuşu beklemeden başlayabilsin
app.commandLine.appendSwitch('ignore-gpu-blocklist');

function createWindow() {
  Menu.setApplicationMenu(null);
  const win = new BrowserWindow({
    width: 1280, height: 800, minWidth: 720, minHeight: 520, backgroundColor: '#04161f', title: 'Akvaryum Dünyam', autoHideMenuBar: true,
    webPreferences: { contextIsolation: true, sandbox: true, backgroundThrottling: true },
  });
  win.loadFile(path.join(__dirname, 'index.html'));
  win.webContents.setWindowOpenHandler(({ url }) => { if (/^https?:/.test(url)) shell.openExternal(url); return { action: 'deny' }; });
  win.webContents.on('will-navigate', (e, url) => { if (!url.startsWith('file:')) { e.preventDefault(); if (/^https?:/.test(url)) shell.openExternal(url); } });
  win.webContents.on('before-input-event', (e, input) => {
    if (input.type !== 'keyDown') return;
    if (input.key === 'F11') { win.setFullScreen(!win.isFullScreen()); e.preventDefault(); }
    else if (input.key === 'Escape' && win.isFullScreen()) { win.setFullScreen(false); }
    else if (input.key === 'F12' && input.control && input.shift) { win.webContents.toggleDevTools(); }
  });
}

app.whenReady().then(() => { createWindow(); app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); }); });
app.on('window-all-closed', () => { globalShortcut.unregisterAll(); app.quit(); });
