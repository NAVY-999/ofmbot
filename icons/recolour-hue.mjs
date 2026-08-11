import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import fs from 'fs';

const UP = '/root/.claude/uploads/db7feb07-060c-50bf-9531-596232677000/';

// Les trois marques Google sont des dégradés continus, pas des aplats : on ne les
// redessine pas, on fait glisser chaque pixel sur une rampe bleue selon sa teinte.
// Trois points décident du résultat :
//   — la rampe est relevée sur les pixels mêmes de OneDrive ;
//   — la teinte passe par la répartition cumulée de la marque et non par une règle
//     de trois entre ses extrêmes, sinon les teintes serrées se confondent ;
//   — le sens de parcours est choisi d'après la marque : arc ouvert pour Gmail et
//     Google, cercle entier pour Maps, dont le dégradé fait tout le tour.
const JOBS = [
  { key: 'gmail',    file: '4367de47-1000024631.jpg', remap: true },
  { key: 'maps',     file: '943cd77a-1000024633.jpg', remap: true },
  { key: 'google',   file: 'd4ff4e30-1000024629.jpg', remap: true },
  { key: 'onedrive', file: 'c4b89f50-1000024635.jpg', remap: false },
  { key: 'authenticator', file: 'e51f167c-1000024647.jpg', remap: true, flat: true },
  { key: 'drive',    file: 'ad7b1e83-1000024667.jpg', remap: true },
  { key: 'chrome',   file: '4d4ad800-1000024669.jpg', remap: true },
  // Play Store n'a pas de capture en grand : elle est prise sur l'écran d'accueil.
  // Le fond d'écran y est en niveaux de gris et la pastille est blanche, donc c'est
  // la saturation qui isole la marque, et non le blanc du panneau.
  { key: 'playstore', file: 'b46477ab-1000024665.jpg', remap: true,
    box: [0, 0.30, 0.32, 0.80], sat: true }
];

// rampe relevée sur les pixels mêmes de OneDrive, remontée d'un cran en clarté
const RAMP = [[26,86,208],[28,118,236],[25,152,250],[24,180,250],[32,203,251],[52,226,244]];

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const page = await browser.newPage();
await page.goto('about:blank');

const out = {};

for (const job of JOBS) {
  const b64 = fs.readFileSync(UP + job.file).toString('base64');
  const res = await page.evaluate(async ({ b64, remap, flat, box, sat, key, RAMP }) => {
    const img = new Image();
    img.src = 'data:image/jpeg;base64,' + b64;
    await img.decode();

    let W = img.naturalWidth, H = img.naturalHeight, sx = 0, sy = 0;
    if (box) {
      sx = Math.round(box[0] * W); sy = Math.round(box[1] * H);
      W = Math.round((box[2] - box[0]) * img.naturalWidth);
      H = Math.round((box[3] - box[1]) * img.naturalHeight);
    }
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, sx, sy, W, H, 0, 0, W, H);
    const px = ctx.getImageData(0, 0, W, H).data;
    const smooth = (v, a, b) => Math.max(0, Math.min(1, (v - a) / (b - a)));
    const clamp = v => Math.max(0, Math.min(255, Math.round(v)));

    // le panneau blanc, entre les bandes noires de l'écran
    const rowOk = [];
    for (let y = 0; y < H; y++) {
      let n = 0;
      for (let x = 0; x < W; x += 4) {
        const i = (y * W + x) * 4;
        if (px[i] > 225 && px[i+1] > 225 && px[i+2] > 225) n++;
      }
      rowOk.push(n / (W / 4) > 0.10);
    }
    let best = [0, H], run = -1;
    if (!sat) {
      best = [0, 0];
      for (let y = 0; y <= H; y++) {
        if (y < H && rowOk[y]) { if (run < 0) run = y; }
        else if (run >= 0) { if (y - run > best[1] - best[0]) best = [run, y]; run = -1; }
      }
    }
    const [y0, y1] = best, ch = y1 - y0;

    // la marque : tout ce qui n'est pas le blanc du fond — ou, sur une capture
    // d'écran d'accueil, tout ce qui a de la couleur, le fond y étant gris
    const alpha = new Float32Array(W * ch);
    for (let y = 0; y < ch; y++) for (let x = 0; x < W; x++) {
      const i = ((y + y0) * W + x) * 4;
      const mx = Math.max(px[i], px[i+1], px[i+2]), mn = Math.min(px[i], px[i+1], px[i+2]);
      alpha[y * W + x] = sat ? smooth((mx - mn) / (mx || 1), 0.17, 0.33)
                             : 1 - smooth(mn, 200, 246);
    }

    // composantes : écarte la barre d'état et les boutons
    const lab = new Int32Array(W * ch).fill(-1), st = new Int32Array(W * ch), comps = [];
    for (let p0 = 0; p0 < W * ch; p0++) {
      if (alpha[p0] < 0.5 || lab[p0] >= 0) continue;
      const id = comps.length; let sp = 0, n = 0, a0 = W, a1 = 0, b0 = ch, b1 = 0;
      st[sp++] = p0; lab[p0] = id;
      while (sp > 0) {
        const p = st[--sp], x = p % W, y = (p / W) | 0; n++;
        if (x < a0) a0 = x; if (x > a1) a1 = x; if (y < b0) b0 = y; if (y > b1) b1 = y;
        for (const q of [x > 0 ? p-1 : -1, x < W-1 ? p+1 : -1, y > 0 ? p-W : -1, y < ch-1 ? p+W : -1])
          if (q >= 0 && lab[q] < 0 && alpha[q] >= 0.5) { lab[q] = id; st[sp++] = q; }
      }
      comps.push({ id, n, a0, a1, b0, b1 });
    }
    const big = comps.reduce((a, b) => (b.n > a.n ? b : a));
    const keepIds = new Set(comps.filter(c => c.n >= big.n * 0.05).map(c => c.id));
    let bx0 = W, bx1 = 0, by0 = ch, by1 = 0;
    for (const c of comps) if (keepIds.has(c.id)) {
      bx0 = Math.min(bx0, c.a0); bx1 = Math.max(bx1, c.a1);
      by0 = Math.min(by0, c.b0); by1 = Math.max(by1, c.b1);
    }
    const inMark = p => lab[p] >= 0 && keepIds.has(lab[p]);
    const at = p => ((((p / W) | 0) + y0) * W + (p % W)) * 4;

    // La teinte est lue sur une version adoucie, pas sur les pixels bruts : le JPEG
    // sous-échantillonne la chrominance par blocs de 8, et la répartition cumulée,
    // qui est raide, transformerait ces blocs en taches. Flou séparable de rayon 5,
    // limité à la marque pour ne pas aspirer le blanc du fond.
    const sm = new Float32Array(W * ch * 3);
    {
      const tmp = new Float32Array(W * ch * 4), R = 5;
      for (let y = 0; y < ch; y++) for (let x = 0; x < W; x++) {
        let sr = 0, sg = 0, sb = 0, n = 0;
        for (let k = -R; k <= R; k++) {
          const qx = x + k;
          if (qx < 0 || qx >= W) continue;
          const q = y * W + qx;
          if (!inMark(q)) continue;
          const i = at(q); sr += px[i]; sg += px[i+1]; sb += px[i+2]; n++;
        }
        const p = y * W + x;
        tmp[p*4] = sr; tmp[p*4+1] = sg; tmp[p*4+2] = sb; tmp[p*4+3] = n;
      }
      for (let y = 0; y < ch; y++) for (let x = 0; x < W; x++) {
        let sr = 0, sg = 0, sb = 0, n = 0;
        for (let k = -R; k <= R; k++) {
          const qy = y + k;
          if (qy < 0 || qy >= ch) continue;
          const q = qy * W + x;
          sr += tmp[q*4]; sg += tmp[q*4+1]; sb += tmp[q*4+2]; n += tmp[q*4+3];
        }
        const p = y * W + x, i = at(p);
        if (n) { sm[p*3] = sr/n; sm[p*3+1] = sg/n; sm[p*3+2] = sb/n; }
        else { sm[p*3] = px[i]; sm[p*3+1] = px[i+1]; sm[p*3+2] = px[i+2]; }
      }
    }

    // teinte sur le cercle entier : plus aucun déroulage, donc plus aucune couture
    const hueOf = (r, g, b) => {
      const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
      if (!d) return null;
      let h;
      if (mx === r) h = ((g - b) / d) % 6;
      else if (mx === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h *= 60; return h < 0 ? h + 360 : h;
    };

    let cdf = null, phase = 0, mode = '', Lmed = 0.52, coef = 0.85, peaks = [];
    const lums = [];
    if (remap) {
      const hist = new Float64Array(360);
      for (let p = 0; p < W * ch; p++) {
        if (alpha[p] < 0.95 || !inMark(p)) continue;
        const i = at(p), mx = Math.max(px[i],px[i+1],px[i+2]), mn = Math.min(px[i],px[i+1],px[i+2]);
        lums.push((mx + mn) / 510);
        if ((mx - mn) / (mx || 1) < 0.28) continue;
        const h = hueOf(sm[p*3], sm[p*3+1], sm[p*3+2]);
        if (h !== null) hist[Math.round(h) % 360]++;
      }
      lums.sort((a, b) => a - b);
      Lmed = lums.length ? lums[lums.length >> 1] : 0.52;
      // L'ombrage est calibré sur l'étalement de clarté propre à la marque, pas au
      // même taux pour toutes : les dégradés Google s'étalent sur 0,24, l'étoile
      // d'Authenticator sur 0,14 seulement. À taux fixe, son triangle central —
      // là où deux branches se croisent — ressortait plus clair que la branche
      // elle-même, alors qu'il est plus sombre dans l'original.
      const q10 = lums.length ? lums[Math.floor(lums.length * 0.10)] : 0.42;
      const q90 = lums.length ? lums[Math.floor(lums.length * 0.90)] : 0.64;
      coef = Math.max(0.6, Math.min(2.2, 0.207 / Math.max(0.02, q90 - q10)));

      // deux lissages : un large pour trouver l'arc vide, un serré pour la
      // répartition cumulée — large, il étalerait le pic du rouge de Gmail sur
      // trente degrés là où les pixels n'en occupent que cinq, et la marque
      // ressortirait unie
      const box = (R) => {
        const o = new Float64Array(360);
        for (let i = 0; i < 360; i++) {
          let s = 0;
          for (let k = -R; k <= R; k++) s += hist[(i + k + 360) % 360];
          o[i] = s / (2 * R + 1);
        }
        return o;
      };
      const wide = box(12), blur = box(6);
      const peak = Math.max(...wide);

      // le plus grand arc vide de l'histogramme : s'il existe, c'est là que la rampe
      // se coupe, et la coupure ne se voit pas puisqu'aucun pixel ne s'y trouve.
      // Le dégradé de Maps fait le tour complet : il n'y a pas d'arc vide, la rampe
      // fait donc l'aller-retour — sombre, clair, sombre — sans discontinuité.
      let gapLen = 0, gapEnd = 0, cur = 0;
      for (let i = 0; i < 720; i++) {
        if (wide[i % 360] < peak * 0.05) { cur++; if (cur > gapLen && i >= 360) { gapLen = cur; gapEnd = i % 360; } }
        else cur = 0;
      }
      gapLen = Math.min(gapLen, 360);
      const cyclic = gapLen < 40;
      mode = cyclic ? 'cercle entier' : 'arc, coupure à ' + Math.round((gapEnd - gapLen / 2 + 360) % 360) + '°';
      phase = cyclic ? 0 : (gapEnd - gapLen / 2 + 360) % 360;   // aller-retour ancré sur le rouge

      // répartition cumulée, avec un socle uniforme : les teintes serrées reçoivent
      // assez de rampe pour se distinguer, sans que le bruit du JPEG s'y amplifie
      let tot = 0;
      for (let i = 0; i < 360; i++) tot += blur[i];
      const floor = 0.35 * tot / 360;
      cdf = new Float64Array(361);
      let acc = 0;
      for (let i = 0; i < 360; i++) {
        acc += blur[(Math.round(phase) + i) % 360] + floor;
        cdf[i + 1] = acc;
      }
      for (let i = 0; i <= 360; i++) cdf[i] /= acc;
      // la répartition cumulée monte par marches, une par couleur de la marque, et
      // ces marches se voyaient comme des démarcations franches ; on l'adoucit pour
      // que chaque passage d'une couleur à l'autre soit un fondu et non une arête
      const soft = new Float64Array(361), S = 14;
      for (let i = 0; i <= 360; i++) {
        let a = 0, n = 0;
        for (let k = -S; k <= S; k++) {
          const j = i + k;
          if (j < 0 || j > 360) continue;
          a += cdf[j]; n++;
        }
        soft[i] = a / n;
      }
      // le lissage rogne les deux bouts ; on les rend en réétalant sur [0, 1],
      // sinon la rampe perd ses extrêmes et la marque perd du contraste
      const lo = soft[0], hi = soft[360];
      for (let i = 0; i <= 360; i++) cdf[i] = (soft[i] - lo) / (hi - lo || 1);

      // Une même couleur d'origine doit donner le même bleu d'une icône à l'autre.
      // Or chaque marque calcule sa répartition sur ses seules teintes : le vert de
      // Drive tombait à 0,40 de la rampe et celui de Play Store à 0,88, tout en haut,
      // là où le bleu est le plus cyan — d'où l'impression de vert. La répartition est
      // donc recalée sur des repères communs, les quatre couleurs Google, par une
      // déformation monotone qui laisse intact l'étalement entre deux repères.
      if (!cyclic) {
        const ANCHORS = [[4.5, 0.16], [44.6, 0.36], [136.7, 0.58], [217, 0.88]];
        const from = [0], to = [0];
        for (const [h, target] of ANCHORS) {
          const dd = (h - phase + 360) % 360, jj = Math.floor(dd), ff = dd - jj;
          const tt = cdf[jj] + (cdf[jj + 1] - cdf[jj]) * ff;
          if (tt > from[from.length - 1] + 0.01 && target > to[to.length - 1]) {
            from.push(tt); to.push(target);
          }
        }
        from.push(1); to.push(1);
        const warp = t => {
          let i = 1;
          while (i < from.length - 1 && t > from[i]) i++;
          const f = (t - from[i-1]) / Math.max(1e-6, from[i] - from[i-1]);
          return to[i-1] + (to[i] - to[i-1]) * Math.max(0, Math.min(1, f));
        };
        for (let i = 0; i <= 360; i++) cdf[i] = warp(cdf[i]);
        mode += ', recalé';
      }

      if (cyclic) for (let i = 0; i <= 360; i++) cdf[i] = 1 - Math.abs(2 * cdf[i] - 1);

      // Marque en aplats : ses branches n'ont pas de dégradé interne, et le triangle
      // où deux d'entre elles se croisent n'est pas une couleur de plus — c'est le
      // produit du recouvrement. Chaque pixel est donc ramené sur la couleur de
      // marque la plus proche, et le recouvrement rejoint la branche dont il est à
      // dix degrés. Sans quoi il occupe à lui seul le haut de la rampe, là où le
      // bleu vire au cyan.
      if (flat) {
        const mx2 = Math.max(...blur);
        const raw = [];
        for (let i = 0; i < 360; i++) {
          const a = blur[(i + 359) % 360], b = blur[i], d = blur[(i + 1) % 360];
          if (b >= a && b > d && b > mx2 * 0.08) raw.push({ h: i, w: b });
        }
        raw.sort((a, b) => b.w - a.w);
        const arc = (a, b) => { const d = Math.abs(a - b) % 360; return d > 180 ? 360 - d : d; };
        for (const q of raw) if (!peaks.some(o => arc(o.h, q.h) < 28)) peaks.push(q);
        peaks.sort((a, b) => a.h - b.h);
        mode += ', aplats ' + peaks.map(q => q.h + '°').join(' ');
      }
    }

    const ramp = t => {
      const u = Math.max(0, Math.min(1, t)) * (RAMP.length - 1);
      const i = Math.min(RAMP.length - 2, Math.floor(u)), f = u - i;
      return [0,1,2].map(k => RAMP[i][k] + (RAMP[i+1][k] - RAMP[i][k]) * f);
    };

    // Écart bleu-vert le long de la rampe, échantillonné une fois : il sert à
    // trouver la position la plus haute qui reste assez bleue.
    const GB = new Float64Array(257);
    for (let i = 0; i <= 256; i++) { const c2 = ramp(i / 256); GB[i] = c2[1] - c2[2]; }
    const descend = (t, target) => {
      let i = Math.min(256, Math.max(0, Math.round(t * 256)));
      while (i > 0 && GB[i] > target) i--;
      return i / 256;
    };

    const src = document.createElement('canvas');
    src.width = W; src.height = ch;
    const sctx = src.getContext('2d');
    const idata = sctx.createImageData(W, ch);
    for (let p = 0; p < W * ch; p++) {
      const on = inMark(p);
      const a = on || alpha[p] < 0.5 ? alpha[p] : 0;
      const i = at(p);
      let r = px[i], g = px[i+1], b = px[i+2];
      if (remap && a > 0.02) {
        let h = hueOf(sm[p*3], sm[p*3+1], sm[p*3+2]);
        if (h !== null && peaks.length) {
          let bi = 0, bd = 1e9;
          for (let q = 0; q < peaks.length; q++) {
            const e = Math.abs(h - peaks[q].h) % 360, dd = e > 180 ? 360 - e : e;
            if (dd < bd) { bd = dd; bi = q; }
          }
          h = peaks[bi].h;
        }
        const d = h === null ? 0 : (h - phase + 360) % 360;
        const j = Math.floor(d), f = d - j;
        const t = h === null ? 0.5 : cdf[j] + (cdf[j+1] - cdf[j]) * f;
        // L'ombrage d'origine est reporté, sinon la marque s'aplatit. Un pixel plus
        // sombre que la médiane redescend la rampe au lieu d'être seulement
        // multiplié : multiplier un cyan clair donne un vert-canard sale, alors que
        // la rampe, elle, ne contient que des bleus. C'est ce qui arrivait au
        // triangle central d'Authenticator, là où deux branches se croisent.
        const L = (Math.max(r, g, b) + Math.min(r, g, b)) / 510;
        // en aplats, aucune modulation : une branche est d'une seule couleur
        const sh = flat ? 0 : (L - Lmed) * coef;
        const k = Math.max(0.78, Math.min(1.28, 1.0 + sh));
        // Le haut de la rampe est un cyan, dont le vert et le bleu sont presque à
        // égalité. Clair, il se lit cyan ; assombri, la multiplication garde le
        // rapport et il tourne au vert-canard — c'est ce qui arrivait au triangle
        // central d'Authenticator. Seuls les pixels qu'on assombrit redescendent
        // donc la rampe, juste ce qu'il faut pour garder au bleu une avance nette
        // sur le vert. Les pixels clairs gardent tout leur cyan.
        const [rr, gg, bb] = ramp(k < 1 ? descend(t, -62 / k) : t);
        r = rr * k; g = gg * k; b = bb * k;
      }
      // Le haut de la gamme était un cyan franc — vert et bleu à égalité, rouge
      // quasi nul — et un cyan clair se lit vert. On lui rend du rouge et on lui
      // retire un peu de vert, d'autant plus qu'il est cyan : le clair devient un
      // bleu ciel pâle au lieu d'un turquoise. La correction est appliquée à toute
      // la famille, OneDrive compris, sinon lui seul garderait le turquoise.
      {
        const cy = Math.max(0, Math.min(g, b) - r) / 255;
        const w = Math.pow(cy, 2.2);
        r += w * 170; g -= w * 34;
      }
      idata.data[p*4] = clamp(r); idata.data[p*4+1] = clamp(g);
      idata.data[p*4+2] = clamp(b); idata.data[p*4+3] = clamp(a * 255);
    }
    sctx.putImageData(idata, 0, 0);

    const cx = (bx0 + bx1) / 2, cy = (by0 + by1) / 2;
    const half = Math.max(bx1 - bx0, by1 - by0) / 2 * 1.05;
    const N = 600, dst = document.createElement('canvas');
    dst.width = dst.height = N;
    const d2 = dst.getContext('2d');
    d2.imageSmoothingQuality = 'high';
    d2.drawImage(src, cx - half, cy - half, half*2, half*2, 0, 0, N, N);

    return {
      png: dst.toDataURL('image/png'),
      info: key.padEnd(9) + ' panneau ' + y0 + '-' + y1 + ', ' + keepIds.size + '/' + comps.length +
            ' comp' + (remap ? ', L méd ' + Lmed.toFixed(3) + ', ' + mode + ', ombrage ×' + coef.toFixed(2) : '')
    };
  }, { b64, remap: job.remap, flat: !!job.flat, box: job.box || null,
       sat: !!job.sat, key: job.key, RAMP });

  console.log(res.info);
  out[job.key] = res.png;
  fs.writeFileSync(`bleu-${job.key}.png`, Buffer.from(res.png.split(',')[1], 'base64'));
}

fs.writeFileSync('masks4.json', JSON.stringify(out));
await browser.close();
