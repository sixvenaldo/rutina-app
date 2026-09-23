// Logo de Rutina: tres casillas apiladas (los días que van quedando atrás)
// y al frente una casilla dorada marcada. Genera SVG; build.js lo convierte a PNG.

const S = 420;            // lado de cada casilla
const R = 112;            // radio de las esquinas
const STEP = 72;          // desplazamiento entre casillas
const INK = '#1a1204';

function mark({ mono = false } = {}) {
  // casilla del frente, centrada en todo el conjunto
  const fx = 512 - S / 2 - STEP, fy = 512 - S / 2 + STEP;
  const tile = (i, fill, op) =>
    `<rect x="${fx + STEP * i}" y="${fy - STEP * i}" width="${S}" height="${S}" rx="${R}" fill="${fill}" opacity="${op}"/>`;
  const check = `M${fx + S * .25} ${fy + S * .52} L${fx + S * .43} ${fy + S * .70} L${fx + S * .77} ${fy + S * .32}`;

  if (mono) {
    return `
    <mask id="cut"><rect width="1024" height="1024" fill="#fff"/>
      <path d="${check}" fill="none" stroke="#000" stroke-width="60" stroke-linecap="round" stroke-linejoin="round"/></mask>
    ${tile(2, '#fff', .35)}${tile(1, '#fff', .6)}
    <rect x="${fx}" y="${fy}" width="${S}" height="${S}" rx="${R}" fill="#fff" mask="url(#cut)"/>`;
  }
  return `
    ${tile(2, '#f5b942', .16)}
    ${tile(1, '#f5b942', .40)}
    <rect x="${fx + 10}" y="${fy + 34}" width="${S - 20}" height="${S - 20}" rx="${R}" fill="#f29a2e" opacity=".55" filter="url(#glow)"/>
    <rect x="${fx}" y="${fy}" width="${S}" height="${S}" rx="${R}" fill="url(#gold)"/>
    <rect x="${fx}" y="${fy}" width="${S}" height="${S}" rx="${R}" fill="url(#shine)"/>
    <path d="${check}" fill="none" stroke="${INK}" stroke-width="60" stroke-linecap="round" stroke-linejoin="round"/>`;
}

const DEFS = `
  <defs>
    <radialGradient id="bg" cx=".5" cy=".38" r=".75">
      <stop offset="0" stop-color="#1d170c"/><stop offset=".55" stop-color="#0b0a08"/><stop offset="1" stop-color="#050506"/>
    </radialGradient>
    <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ffdc8f"/><stop offset=".5" stop-color="#f5b942"/><stop offset="1" stop-color="#e98a2c"/>
    </linearGradient>
    <linearGradient id="shine" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fff" stop-opacity=".28"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/>
    </linearGradient>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="46"/></filter>
  </defs>`;

// scale: tamaño del símbolo respecto al lienzo (1 = diseño base)
function logoSVG({ background = true, mono = false, scale = 1, symbol = true } = {}) {
  const t = `translate(512 512) scale(${scale}) translate(-512 -512)`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">${DEFS}
  ${background ? '<rect width="1024" height="1024" fill="url(#bg)"/>' : ''}
  ${symbol ? `<g transform="${t}">${mark({ mono })}</g>` : ''}
</svg>`;
}

module.exports = { logoSVG };
