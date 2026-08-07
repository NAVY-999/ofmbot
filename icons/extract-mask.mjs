import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import fs from 'fs';

const UP = '/root/.claude/uploads/db7feb07-060c-50bf-9531-596232677000/';

// rule : comment isoler la marque du fond, canal par canal
const JOBS = [
  { key: 'whatsapp',  file: '8d0fd36d-1000024514.jpg', rule: 'lightOnColor' },
  { key: 'snapchat',  file: 'ab00fa5c-1000024516.jpg', rule: 'darkOnLight'  },
  { key: 'pinterest', file: '0821f6ba-1000024518.jpg', rule: 'lightOnColor' }
];

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const page = await browser.newPage();
await page.goto('about:blank');

const out = {};

for (const job of JOBS) {
  const b64 = fs.readFileSync(UP + job.file).toString('base64');
  const res = await page.evaluate(async ({ b64, rule, key }) => {
    const img = new Image();
    img.src = 'data:image/jpeg;base64,' + b64;
    await img.decode();

    const W = img.naturalWidth, H = img.naturalHeight;
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, 0, 0);
    const px = ctx.getImageData(0, 0, W, H).data;

    const at = (x, y) => { const i = (y * W + x) * 4; return [px[i], px[i + 1], px[i + 2]]; };
    const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

    // 1. le panneau : la plage de lignes où la couleur de fond domine
    const bg = at(Math.round(W * 0.06), Math.round(H * 0.5));
    const rowOk = [];
    for (let y = 0; y < H; y++) {
      let n = 0;
      for (let x = 0; x < W; x += 4) if (dist(at(x, y), bg) < 70) n++;
      rowOk.push(n / (W / 4) > 0.12);
    }
    let best = [0, 0], run = -1;
    for (let y = 0; y <= H; y++) {
      if (y < H && rowOk[y]) { if (run < 0) run = y; }
      else if (run >= 0) { if (y - run > best[1] - best[0]) best = [run, y]; run = -1; }
    }
    const [y0, y1] = best, ch = y1 - y0;

    // 2. l'alpha de la marque
    const smooth = (v, a, b) => Math.max(0, Math.min(1, (v - a) / (b - a)));
    const alpha = new Float32Array(W * ch);
    for (let y = 0; y < ch; y++) {
      for (let x = 0; x < W; x++) {
        const [r, g, bl] = at(x, y + y0);
        alpha[y * W + x] = rule === 'darkOnLight'
          ? 1 - smooth(Math.max(r, g, bl), 70, 155)
          : smooth(Math.min(r, g, bl), 95, 185);
      }
    }

    // 3. composantes connexes : écarte les éléments d'interface
    const lab = new Int32Array(W * ch).fill(-1);
    const comps = [];
    const st = new Int32Array(W * ch);
    for (let p0 = 0; p0 < W * ch; p0++) {
      if (alpha[p0] < 0.5 || lab[p0] >= 0) continue;
      const id = comps.length;
      let sp = 0, n = 0, minX = W, maxX = 0, minY = ch, maxY = 0;
      st[sp++] = p0; lab[p0] = id;
      while (sp > 0) {
        const p = st[--sp], x = p % W, y = (p / W) | 0;
        n++;
        if (x < minX) minX = x; if (x > maxX) maxX = x;
        if (y < minY) minY = y; if (y > maxY) maxY = y;
        const nb = [x > 0 ? p - 1 : -1, x < W - 1 ? p + 1 : -1,
                    y > 0 ? p - W : -1, y < ch - 1 ? p + W : -1];
        for (const q of nb) if (q >= 0 && lab[q] < 0 && alpha[q] >= 0.5) { lab[q] = id; st[sp++] = q; }
      }
      comps.push({ id, n, minX, maxX, minY, maxY });
    }
    if (!comps.length) return { error: 'aucune forme trouvée' };
    const biggest = comps.reduce((a, b) => (b.n > a.n ? b : a));
    const keep = comps.filter(c => c.n >= biggest.n * 0.05);
    const keepSet = new Set(keep.map(c => c.id));

    let bx0 = W, bx1 = 0, by0 = ch, by1 = 0;
    for (const c of keep) {
      bx0 = Math.min(bx0, c.minX); bx1 = Math.max(bx1, c.maxX);
      by0 = Math.min(by0, c.minY); by1 = Math.max(by1, c.maxY);
    }

    // 4. carré + marge, puis rendu du masque en blanc sur noir
    const cx = (bx0 + bx1) / 2, cy = (by0 + by1) / 2;
    const half = Math.max(bx1 - bx0, by1 - by0) / 2 * 1.07;
    const N = 600;
    const src = document.createElement('canvas');
    src.width = W; src.height = ch;
    const sctx = src.getContext('2d');
    const idata = sctx.createImageData(W, ch);
    for (let p = 0; p < W * ch; p++) {
      const on = lab[p] >= 0 && keepSet.has(lab[p]);
      const v = Math.round(255 * (on ? 1 : alpha[p] > 0.5 ? 0 : alpha[p] * 0.9));
      idata.data[p * 4] = idata.data[p * 4 + 1] = idata.data[p * 4 + 2] = v;
      idata.data[p * 4 + 3] = 255;
    }
    sctx.putImageData(idata, 0, 0);

    const dst = document.createElement('canvas');
    dst.width = N; dst.height = N;
    const dctx = dst.getContext('2d');
    dctx.fillStyle = '#000'; dctx.fillRect(0, 0, N, N);
    dctx.imageSmoothingQuality = 'high';
    dctx.drawImage(src, cx - half, cy - half, half * 2, half * 2, 0, 0, N, N);

    return {
      png: dst.toDataURL('image/png'),
      info: key + ': panneau ' + y0 + '-' + y1 + ', ' + keep.length + '/' + comps.length +
            ' composantes, cadre ' + Math.round(half * 2) + 'px'
    };
  }, { b64, rule: job.rule, key: job.key });

  if (res.error) { console.log(job.key, 'ERREUR', res.error); continue; }
  console.log(res.info);
  out[job.key] = res.png;
  fs.writeFileSync(`mask-${job.key}.png`, Buffer.from(res.png.split(',')[1], 'base64'));
}

fs.writeFileSync('masks.json', JSON.stringify(out));
await browser.close();
