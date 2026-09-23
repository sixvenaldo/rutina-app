// Genera index.html, manifest, service worker e íconos PNG (sin dependencias)
const fs = require('fs'), zlib = require('zlib'), path = require('path');
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
    { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
  ]
}, null, 2));

fs.writeFileSync(out('sw.js'), `const CACHE = 'rutina-v1';
const SHELL = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL))); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))); self.clients.claim(); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(fetch(e.request).then(r => { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return r; })
    .catch(() => caches.match(e.request).then(r => r || caches.match('index.html'))));
});
`);

// --- ícono: fondo negro, palomita ámbar (w×h, glifo centrado) ---
function png(w, h = w, { transparent = false, glyph = 1 } = {}) {
  const px = Buffer.alloc(w * h * 4);
  const bg = [5, 5, 6], ac = [245, 185, 66];
  const s = Math.min(w, h) * glyph, ox = (w - s) / 2, oy = (h - s) / 2;
  const pts = [[0.31, 0.52], [0.44, 0.65], [0.70, 0.37]].map(([x, y]) => [ox + x * s, oy + y * s]);
  const lw = s * 0.045, ringR = s * 0.30, ringW = s * 0.018, cx = w / 2, cy = h / 2;
  const segDist = (px_, py, [ax, ay], [bx, by]) => {
    const dx = bx - ax, dy = by - ay, t = Math.max(0, Math.min(1, ((px_ - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
    return Math.hypot(px_ - ax - t * dx, py - ay - t * dy);
  };
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const fx = x + .5, fy = y + .5;
    const d = Math.min(segDist(fx, fy, pts[0], pts[1]), segDist(fx, fy, pts[1], pts[2]));
    const a = Math.max(Math.max(0, Math.min(1, lw - d + .5)),
                       Math.max(0, Math.min(1, ringW - Math.abs(Math.hypot(fx - cx, fy - cy) - ringR) + .5)) * 0.35);
    const i = (y * w + x) * 4;
    if (transparent) { for (let c = 0; c < 3; c++) px[i + c] = ac[c]; px[i + 3] = Math.round(a * 255); }
    else { for (let c = 0; c < 3; c++) px[i + c] = Math.round(bg[c] * (1 - a) + ac[c] * a); px[i + 3] = 255; }
  }
  const raw = Buffer.alloc(h * (w * 4 + 1));
  for (let y = 0; y < h; y++) px.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4);
  const crcT = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
  const crc = b => { let c = 0xffffffff; for (const x of b) c = crcT[(c ^ x) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  const chunk = (type, data) => { const l = Buffer.alloc(4); l.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type), data]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([l, td, c]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}
fs.writeFileSync(out('icon-192.png'), png(192));
fs.writeFileSync(out('icon-512.png'), png(512));
const RES = 'android/app/src/main/res';
if (fs.existsSync(RES)) {
  const dens = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };
  for (const [d, k] of Object.entries(dens)) {
    const dir = path.join(RES, 'mipmap-' + d);
    fs.writeFileSync(path.join(dir, 'ic_launcher.png'), png(48 * k));
    fs.writeFileSync(path.join(dir, 'ic_launcher_round.png'), png(48 * k));
    fs.writeFileSync(path.join(dir, 'ic_launcher_foreground.png'), png(108 * k, 108 * k, { transparent: true }));
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
    fs.writeFileSync(f, png(head.readUInt32BE(16), head.readUInt32BE(20), { glyph: 0.35 }));
  }
  console.log('Íconos y splash de Android actualizados');
}
console.log('Listo:', fs.readdirSync(OUT).join(', '));
