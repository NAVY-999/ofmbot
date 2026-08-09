import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import fs from 'fs';

const UP = '/root/.claude/uploads/db7feb07-060c-50bf-9531-596232677000/';

// Les logos Google sont polychromes ; on ne les redessine pas, on fait glisser
// chaque pixel sur une rampe bleue selon sa teinte d'origine. La place et
// l'étendue de chaque fondu sont donc conservées telles quelles.
// OneDrive sert de référence de gamme : il est déjà bleu, on le garde intact.
const JOBS = [
  { key: 'gmail',    file: '4367de47-1000024631.jpg', remap: true },
  { key: 'maps',     file: '943cd77a-1000024633.jpg', remap: true },
  { key: 'google',   file: 'd4ff4e30-1000024629.jpg', remap: true },
  { key: 'onedrive', file: 'c4b89f50-1000024635.jpg', remap: false }
];

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const page = await browser.newPage();
await page.goto('about:blank');

const out = {};

for (const job of JOBS) {
  const b64 = fs.readFileSync(UP + job.file).toString('base64');
  const res = await page.evaluate(async ({ b64, remap, key }) => {
    const img = new Image();
    img.src = 'data:image/jpeg;base64,' + b64;
    await img.decode();

    const W = img.naturalWidth, H = img.naturalHeight;
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, 0, 0);
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
    let best = [0, 0], run = -1;
    for (let y = 0; y <= H; y++) {
      if (y < H && rowOk[y]) { if (run < 0) run = y; }
      else if (run >= 0) { if (y - run > best[1] - best[0]) best = [run, y]; run = -1; }
    }
    const [y0, y1] = best, ch = y1 - y0;

    // la marque : tout ce qui n'est pas le blanc du fond
    const alpha = new Float32Array(W * ch);
    for (let y = 0; y < ch; y++) for (let x = 0; x < W; x++) {
      const i = ((y + y0) * W + x) * 4;
      alpha[y * W + x] = 1 - smooth(Math.min(px[i], px[i+1], px[i+2]), 200, 246);
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

    // teinte de chaque pixel, déroulée pour que le magenta précède le rouge
    const hueOf = (r, g, b) => {
      const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
      if (!d) return null;
      let h;
      if (mx === r) h = ((g - b) / d) % 6;
      else if (mx === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h *= 60; if (h < 0) h += 360;
      return h > 300 ? h - 360 : h;
    };

    // plage de teintes par centiles : les extrêmes se font piéger par les pixels
    // d'anticrénelage, qui inventent des magentas à la frontière rouge/bleu
    let hMin = 0, hMax = 240;
    if (remap) {
      const hist = new Int32Array(420); let tot = 0;
      for (let p = 0; p < W * ch; p++) {
        if (alpha[p] < 0.95 || !(lab[p] >= 0 && keepIds.has(lab[p]))) continue;
        const i = ((((p / W) | 0) + y0) * W + (p % W)) * 4;
        const mx = Math.max(px[i], px[i+1], px[i+2]), mn = Math.min(px[i], px[i+1], px[i+2]);
        if ((mx - mn) / (mx || 1) < 0.30) continue;
        const h = hueOf(px[i], px[i+1], px[i+2]);
        if (h === null) continue;
        hist[Math.round(h) + 60]++; tot++;
      }
      let acc = 0;
      for (let i = 0; i < 420; i++) {
        acc += hist[i];
        if (acc >= tot * 0.02) { hMin = i - 60; break; }
      }
      acc = 0;
      for (let i = 419; i >= 0; i--) {
        acc += hist[i];
        if (acc >= tot * 0.02) { hMax = i - 60; break; }
      }
    }

    // rampe bleue, relevée sur OneDrive
    const RAMP = [[10,61,145],[17,96,217],[30,143,245],[43,192,255],[99,228,255]];
    const ramp = t => {
      const u = Math.max(0, Math.min(1, t)) * (RAMP.length - 1);
      const i = Math.min(RAMP.length - 2, Math.floor(u)), f = u - i;
      return [0,1,2].map(k => RAMP[i][k] + (RAMP[i+1][k] - RAMP[i][k]) * f);
    };

    const src = document.createElement('canvas');
    src.width = W; src.height = ch;
    const sctx = src.getContext('2d');
    const idata = sctx.createImageData(W, ch);
    for (let p = 0; p < W * ch; p++) {
      const on = lab[p] >= 0 && keepIds.has(lab[p]);
      const a = on || alpha[p] < 0.5 ? alpha[p] : 0;
      const i = ((((p / W) | 0) + y0) * W + (p % W)) * 4;
      let r = px[i], g = px[i+1], b = px[i+2];
      if (remap && a > 0.02) {
        const h = hueOf(r, g, b);
        const t = h === null ? 0.5 : (h - hMin) / Math.max(1, hMax - hMin);
        const [rr, gg, bb] = ramp(t);
        // on reporte l'ombrage d'origine, sinon la marque s'aplatit
        const L = (Math.max(r, g, b) + Math.min(r, g, b)) / 510;
        const k = Math.max(0.62, Math.min(1.24, 0.80 + (L - 0.52) * 0.95));
        r = rr * k; g = gg * k; b = bb * k;
      }
      idata.data[p*4] = clamp(r); idata.data[p*4+1] = clamp(g);
      idata.data[p*4+2] = clamp(b); idata.data[p*4+3] = clamp(a * 255);
    }
    sctx.putImageData(idata, 0, 0);

    const cx = (bx0 + bx1) / 2, cy = (by0 + by1) / 2;
    const half = Math.max(bx1 - bx0, by1 - by0) / 2 * 1.05;
    const N = 600, dst = document.createElement('canvas');
    dst.width = dst.height = N;
    const d = dst.getContext('2d');
    d.imageSmoothingQuality = 'high';
    d.drawImage(src, cx - half, cy - half, half*2, half*2, 0, 0, N, N);

    return {
      png: dst.toDataURL('image/png'),
      info: key + ' : panneau ' + y0 + '-' + y1 + ', ' + keepIds.size + '/' + comps.length +
            ' composantes' + (remap ? ', teintes ' + Math.round(hMin) + '..' + Math.round(hMax) : '')
    };
  }, { b64, remap: job.remap, key: job.key });

  console.log(res.info);
  out[job.key] = res.png;
  fs.writeFileSync(`bleu-${job.key}.png`, Buffer.from(res.png.split(',')[1], 'base64'));
}

fs.writeFileSync('masks4.json', JSON.stringify(out));
await browser.close();
