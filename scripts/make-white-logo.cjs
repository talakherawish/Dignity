#!/usr/bin/env node
//
// Rebuild src/assets/dignity-logo-white.png from src/assets/dignity-logo.png.
//
//   node scripts/make-white-logo.cjs [--preview]
//
// Why this exists: the source lockup is an OPAQUE artwork on a solid white
// plate, which is invisible on the white header but shows as a white box on
// the dark footer. A CSS filter cannot fix it -- invert(1) would turn the cyan
// wedge orange, the magenta wedge green and the Birzeit tree magenta.
//
// So each pixel is treated as one of four pure brand colours composited over
// white at some coverage a. For every candidate colour C we recover a by
// projecting the pixel onto the line white->C, rebuild the pixel, and keep
// whichever candidate explains it best. That turns the antialiasing into real
// alpha instead of leaving grey fringes, and lets the ink class be retargeted
// to white while the cyan, magenta and green classes keep their own colour.
//
// .cjs because package.json sets "type": "module". No dependencies -- the repo
// has no image library, and this needs to run from a bare checkout.
//
// Re-run this after replacing dignity-logo.png. If the brand colours change,
// update CLASSES below: run with --preview and check the reported pixel counts
// are in the same ballpark (a colour that lost its class drops to near zero).

const zlib = require("node:zlib");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.join(__dirname, "..");
const SRC = path.join(ROOT, "src/assets/dignity-logo.png");
const DEST = path.join(ROOT, "src/assets/dignity-logo-white.png");
const PREVIEW = path.join(ROOT, "dignity-logo-white-preview.png");
const PREVIEW_BG = [56, 58, 64]; // --footer-bg, oklch(0.35 0.01 270), in sRGB

const WHITE = [255, 255, 255];
const CLASSES = [
  { name: "ink", pure: [0, 0, 0], target: [255, 255, 255] }, // type, rule, disc wedge
  { name: "green", pure: [40, 144, 58], target: [40, 144, 58] }, // Birzeit tree
  { name: "magenta", pure: [187, 65, 161], target: [187, 65, 161] }, // disc wedge
  { name: "cyan", pure: [168, 232, 250], target: [168, 232, 250] }, // disc wedge
];

/* ------------------------------ tiny PNG codec ----------------------------- */
// 8-bit, non-interlaced. Reads gray/RGB/palette/alpha, always writes RGBA.

const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function paeth(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
}

function decode(file) {
  const buf = fs.readFileSync(file);
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error(`${file}: not a PNG`);
  let off = 8;
  let hdr = null;
  let palette = null;
  let transparency = null;
  const idat = [];
  while (off < buf.length) {
    const len = buf.readUInt32BE(off);
    const type = buf.toString("ascii", off + 4, off + 8);
    const body = buf.subarray(off + 8, off + 8 + len);
    if (type === "IHDR") {
      hdr = {
        width: body.readUInt32BE(0),
        height: body.readUInt32BE(4),
        bitDepth: body[8],
        colorType: body[9],
        interlace: body[12],
      };
    } else if (type === "IDAT") idat.push(body);
    else if (type === "PLTE") palette = Buffer.from(body);
    else if (type === "tRNS") transparency = Buffer.from(body);
    else if (type === "IEND") break;
    off += 12 + len;
  }
  const { width, height, bitDepth, colorType, interlace } = hdr;
  if (bitDepth !== 8) throw new Error(`${file}: bit depth ${bitDepth} unsupported`);
  if (interlace) throw new Error(`${file}: interlaced PNG unsupported`);

  const bpp = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[colorType];
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const stride = width * bpp;
  const planar = Buffer.alloc(height * stride);
  let pos = 0;
  for (let y = 0; y < height; y++) {
    const filter = raw[pos++];
    const line = raw.subarray(pos, pos + stride);
    pos += stride;
    const cur = planar.subarray(y * stride, (y + 1) * stride);
    const prev = y > 0 ? planar.subarray((y - 1) * stride, y * stride) : null;
    for (let i = 0; i < stride; i++) {
      const a = i >= bpp ? cur[i - bpp] : 0;
      const b = prev ? prev[i] : 0;
      const c = prev && i >= bpp ? prev[i - bpp] : 0;
      let v = line[i];
      if (filter === 1) v += a;
      else if (filter === 2) v += b;
      else if (filter === 3) v += (a + b) >> 1;
      else if (filter === 4) v += paeth(a, b, c);
      cur[i] = v & 0xff;
    }
  }

  const data = Buffer.alloc(width * height * 4);
  for (let p = 0; p < width * height; p++) {
    let r;
    let g;
    let b;
    let a = 255;
    if (colorType === 0) r = g = b = planar[p];
    else if (colorType === 4) {
      r = g = b = planar[p * 2];
      a = planar[p * 2 + 1];
    } else if (colorType === 2) {
      r = planar[p * 3];
      g = planar[p * 3 + 1];
      b = planar[p * 3 + 2];
    } else if (colorType === 6) {
      r = planar[p * 4];
      g = planar[p * 4 + 1];
      b = planar[p * 4 + 2];
      a = planar[p * 4 + 3];
    } else {
      const ix = planar[p];
      r = palette[ix * 3];
      g = palette[ix * 3 + 1];
      b = palette[ix * 3 + 2];
      if (transparency && ix < transparency.length) a = transparency[ix];
    }
    data[p * 4] = r;
    data[p * 4 + 1] = g;
    data[p * 4 + 2] = b;
    data[p * 4 + 3] = a;
  }
  return { width, height, data };
}

function chunk(type, body) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(body.length);
  const typed = Buffer.concat([Buffer.from(type, "ascii"), body]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typed));
  return Buffer.concat([len, typed, crc]);
}

function encode(file, { width, height, data }) {
  const bpp = 4;
  const stride = width * bpp;
  const rows = [];
  for (let y = 0; y < height; y++) {
    const cur = data.subarray(y * stride, (y + 1) * stride);
    const prev = y > 0 ? data.subarray((y - 1) * stride, y * stride) : Buffer.alloc(stride);
    let best = null;
    let bestScore = Infinity;
    for (let filter = 0; filter < 5; filter++) {
      const line = Buffer.alloc(stride);
      let score = 0;
      for (let i = 0; i < stride; i++) {
        const a = i >= bpp ? cur[i - bpp] : 0;
        const b = prev[i];
        const c = i >= bpp ? prev[i - bpp] : 0;
        let v;
        if (filter === 0) v = cur[i];
        else if (filter === 1) v = cur[i] - a;
        else if (filter === 2) v = cur[i] - b;
        else if (filter === 3) v = cur[i] - ((a + b) >> 1);
        else v = cur[i] - paeth(a, b, c);
        v &= 0xff;
        line[i] = v;
        // Standard minimum-sum-of-absolute-differences filter heuristic.
        score += v < 128 ? v : 256 - v;
      }
      if (score < bestScore) {
        bestScore = score;
        best = Buffer.concat([Buffer.from([filter]), line]);
      }
    }
    rows.push(best);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // colour type: RGBA
  fs.writeFileSync(
    file,
    Buffer.concat([
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      chunk("IHDR", ihdr),
      chunk("IDAT", zlib.deflateSync(Buffer.concat(rows), { level: 9 })),
      chunk("IEND", Buffer.alloc(0)),
    ]),
  );
}

/* --------------------------------- recolour -------------------------------- */

const src = decode(SRC);
const { width, height } = src;
const out = Buffer.alloc(width * height * 4);
const counts = Object.fromEntries(CLASSES.map((c) => [c.name, 0]));

for (let p = 0; p < width * height; p++) {
  const observed = [src.data[p * 4], src.data[p * 4 + 1], src.data[p * 4 + 2]];
  let best = null;
  let bestErr = Infinity;
  let bestAlpha = 0;
  for (const cls of CLASSES) {
    // Project observed onto the segment white -> pure, giving the coverage
    // that best explains this pixel under that class.
    const d = [0, 1, 2].map((c) => WHITE[c] - cls.pure[c]);
    const v = [0, 1, 2].map((c) => WHITE[c] - observed[c]);
    const dd = d[0] * d[0] + d[1] * d[1] + d[2] * d[2];
    const alpha = Math.min(1, Math.max(0, (v[0] * d[0] + v[1] * d[1] + v[2] * d[2]) / dd));
    let err = 0;
    for (let c = 0; c < 3; c++) {
      err += (alpha * cls.pure[c] + (1 - alpha) * WHITE[c] - observed[c]) ** 2;
    }
    if (err < bestErr) {
      bestErr = err;
      best = cls;
      bestAlpha = alpha;
    }
  }
  if (bestAlpha > 0.02) counts[best.name]++;
  out[p * 4] = best.target[0];
  out[p * 4 + 1] = best.target[1];
  out[p * 4 + 2] = best.target[2];
  out[p * 4 + 3] = Math.round(bestAlpha * 255);
}

encode(DEST, { width, height, data: out });
console.log(`wrote ${path.relative(ROOT, DEST)} (${width}x${height})`);
console.log("pixels per class:", counts);

if (process.argv.includes("--preview")) {
  const prev = Buffer.alloc(width * height * 4);
  for (let p = 0; p < width * height; p++) {
    const a = out[p * 4 + 3] / 255;
    for (let c = 0; c < 3; c++) {
      prev[p * 4 + c] = Math.round(a * out[p * 4 + c] + (1 - a) * PREVIEW_BG[c]);
    }
    prev[p * 4 + 3] = 255;
  }
  encode(PREVIEW, { width, height, data: prev });
  console.log(`wrote ${path.relative(ROOT, PREVIEW)} (flattened onto the footer background)`);
  console.log("this preview is a scratch file -- do not commit it");
}
