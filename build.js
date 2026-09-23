// Genera www/ (index.html, manifest, service worker, íconos) y los íconos/splash de Android
const fs = require('fs'), path = require('path');
const OUT = 'www';
fs.mkdirSync(OUT, {recursive: true});
const out = f => path.join(OUT, f);

const body = fs.readFileSync('app.html', 'utf8');
fs.writeFileSync(out('index.html'), `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#050506">
<meta name="mobile-web-app-capable" content="yes">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" href="icon-192.png">
<link rel="apple-touch-icon" href="icon-192.png">
<style>html,body{margin:0}:root{padding-top:env(safe-area-inset-top,0px)}[hidden]{display:none!important}</style>
</head>
<body>
${body}
</body>
</html>
`);

fs.writeFileSync(out('manifest.webmanifest'), JSON.stringify({
  name: 'Rutina', short_name: 'Rutina',
  description: 'Checklist diario con historial',
  start_url: './', scope: './', display: 'standalone', orientation: 'portrait',
  background_color: '#050506', theme_color: '#050506', lang: 'es',
  icons: [
    { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
    { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
  ]
}, null, 2));

fs.writeFileSync(out('sw.js'), `const CACHE = 'rutina-v2';
const SHELL = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL))); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))); self.clients.claim(); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(fetch(e.request).then(r => { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return r; })
    .catch(() => caches.match(e.request).then(r => r || caches.match('index.html'))));
});
`);

// --- íconos: se dibujan desde logo.js (SVG) con resvg ---
const { Resvg } = require('@resvg/resvg-js');
const { logoSVG } = require('./logo');
const render = (svg, w) => new Resvg(svg, { fitTo: { mode: 'width', value: w } }).render().asPng();
const icon = (size, opts) => render(logoSVG(opts), size);
const FG_SCALE = 0.8; // símbolo dentro de la zona segura del ícono adaptativo
function splash(w, h) {
  const s = Math.round(Math.min(w, h) * 0.5);
  const inner = logoSVG({ background: false }).replace(/<svg[^>]*>/, '').replace('</svg>', '');
  return render(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <rect width="${w}" height="${h}" fill="#050506"/>
    <svg x="${(w - s) / 2}" y="${(h - s) / 2}" width="${s}" height="${s}" viewBox="0 0 1024 1024">${inner}</svg></svg>`, w);
}
fs.writeFileSync(out('icon-192.png'), icon(192));
fs.writeFileSync(out('icon-512.png'), icon(512));
fs.writeFileSync(out('icon-maskable-512.png'), icon(512, { scale: FG_SCALE }));
const RES = 'android/app/src/main/res';
if (fs.existsSync(RES)) {
  const dens = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };
  for (const [d, k] of Object.entries(dens)) {
    const dir = path.join(RES, 'mipmap-' + d);
    fs.writeFileSync(path.join(dir, 'ic_launcher.png'), icon(48 * k));
    fs.writeFileSync(path.join(dir, 'ic_launcher_round.png'), icon(48 * k));
    fs.writeFileSync(path.join(dir, 'ic_launcher_foreground.png'), icon(108 * k, { background: false, scale: FG_SCALE }));
    fs.writeFileSync(path.join(dir, 'ic_launcher_bg.png'), icon(108 * k, { symbol: false }));
    fs.writeFileSync(path.join(dir, 'ic_launcher_monochrome.png'), icon(108 * k, { background: false, mono: true, scale: FG_SCALE }));
  }
  fs.writeFileSync(path.join(RES, 'values/ic_launcher_background.xml'),
    `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">#050506</color>
</resources>
`);
  for (const dir of fs.readdirSync(RES).filter(n => n.startsWith('drawable'))) {
    const f = path.join(RES, dir, 'splash.png');
    if (!fs.existsSync(f)) continue;
    const head = fs.readFileSync(f);
    fs.writeFileSync(f, splash(head.readUInt32BE(16), head.readUInt32BE(20)));
  }
  console.log('Íconos y splash de Android actualizados');
}
console.log('Listo:', fs.readdirSync(OUT).join(', '));
