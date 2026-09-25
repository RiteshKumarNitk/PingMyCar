import { deflateSync } from "node:zlib";
import { create } from "qrcode";

/**
 * Minimal PNG encoder for QR codes — pure Node, no native canvas dependency
 * (sharp/canvas don't install cleanly everywhere and are heavy for one image).
 *
 * Output: RGBA PNG, white background + quiet zone, dark modules. Scale is
 * pixels per module, so images stay crisp at any requested size.
 *
 * The QR matrix comes from the same `qrcode` package the web dashboard and
 * sticker SVGs use — identical tokens, identical codes everywhere.
 */

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]!) & 0xff]! ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

/** Renders `text` as a QR PNG. `scale` = pixels per QR module (min 4). */
export function qrPngBuffer(text: string, scale = 12): Buffer {
  const s = Math.max(4, Math.round(scale));
  const qr = create(text, { errorCorrectionLevel: "M" });
  const size = qr.modules.size;
  const quiet = 4;
  const dim = (size + quiet * 2) * s;

  // Row-major RGBA; every row starts with a filter byte 0 (None).
  const stride = 1 + dim * 4;
  const raw = Buffer.alloc(stride * (dim + 1));
  // Background is already white (Buffer zero-init → alpha 0; set it once).
  for (let y = 0; y < dim; y++) {
    const rowStart = 1 + y * stride;
    for (let x = 0; x < dim; x++) {
      const i = rowStart + x * 4;
      raw[i] = 0xff;
      raw[i + 1] = 0xff;
      raw[i + 2] = 0xff;
      raw[i + 3] = 0xff;
    }
  }

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!qr.modules.data[r * size + c]) continue;
      for (let dy = 0; dy < s; dy++) {
        const y = (r + quiet) * s + dy;
        const rowStart = 1 + y * stride;
        for (let dx = 0; dx < s; dx++) {
          const i = rowStart + ((c + quiet) * s + dx) * 4;
          raw[i] = 0x0d; // #0d1926 — the sticker QR ink color
          raw[i + 1] = 0x19;
          raw[i + 2] = 0x26;
        }
      }
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(dim, 0);
  ihdr.writeUInt32BE(dim, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), // PNG signature
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}
