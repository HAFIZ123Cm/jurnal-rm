// Draws the app icon (white "RM" on rose pink) as PNGs with no dependencies.
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const CRC = new Int32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c; });
const crc32 = buf => { let c = -1; for (const b of buf) c = CRC[(c ^ b) & 255] ^ (c >>> 8); return (c ^ -1) >>> 0; };
function chunk(type, data){
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function png(size, inside){
  const SS = 4, raw = Buffer.alloc((size * 4 + 1) * size);
  const bg = [0xd6, 0x33, 0x6c], fg = [255, 255, 255];
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    for (let x = 0; x < size; x++) {
      let hit = 0;
      for (let sy = 0; sy < SS; sy++) for (let sx = 0; sx < SS; sx++) {
        if (inside((x + (sx + .5) / SS) / size, (y + (sy + .5) / SS) / size)) hit++;
      }
      const a = hit / (SS * SS), o = y * (size * 4 + 1) + 1 + x * 4;
      for (let i = 0; i < 3; i++) raw[o + i] = Math.round(bg[i] + (fg[i] - bg[i]) * a);
      raw[o + 3] = 255;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ihdr), chunk("IDAT", zlib.deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]);
}
function segDist(px, py, ax, ay, bx, by){
  const dx = bx - ax, dy = by - ay, t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}
// "RM" in strokes, kept inside the maskable safe zone (centre 80%)
function rm(u, v){
  const T = 0.034, top = 0.36, bot = 0.64;
  const segs = [
    [0.235, top, 0.235, bot],                 // R stem
    [0.235, top, 0.33, top],                  // R top
    [0.235, 0.505, 0.33, 0.505],              // R middle
    [0.31, 0.505, 0.42, bot],                 // R leg
    [0.52, bot, 0.52, top],                   // M left
    [0.52, top, 0.635, 0.56],                 // M diagonal
    [0.635, 0.56, 0.75, top],                 // M diagonal
    [0.75, top, 0.75, bot]                    // M right
  ];
  for (const s of segs) if (segDist(u, v, s[0], s[1], s[2], s[3]) <= T) return true;
  const cx = 0.33, cy = (top + 0.505) / 2, r = (0.505 - top) / 2;
  if (u >= cx && Math.abs(Math.hypot(u - cx, v - cy) - r) <= T) return true;  // R bowl
  return false;
}
const out = path.join(__dirname, "..", "icons");
fs.mkdirSync(out, {recursive: true});
for (const [name, size] of [["apple-touch-icon.png", 180], ["icon-192.png", 192], ["icon-512.png", 512]]) {
  fs.writeFileSync(path.join(out, name), png(size, rm));
  console.log("wrote", name);
}
