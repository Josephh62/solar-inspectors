import sharp from "sharp";

const MAX_PX = 1568;
const MAX_BYTES = 450_000; // keeps base64 under Turso's 1 MB HTTP limit

export function isSupported(filename: string): boolean {
  return /\.(jpe?g|png|webp|heic|heif)$/i.test(filename);
}

async function compress(buf: Buffer): Promise<Buffer> {
  for (const q of [70, 55, 40]) {
    if (buf.length <= MAX_BYTES) break;
    buf = await sharp(buf).jpeg({ quality: q, progressive: true }).toBuffer();
  }
  return buf;
}

export async function processImage(buffer: Buffer): Promise<Buffer> {
  // Primary: sharp handles JPEG/PNG/WebP and sometimes HEIC (when libheif has HEVC)
  try {
    const out = await sharp(buffer, { failOn: "none" })
      .rotate()
      .resize({ width: MAX_PX, height: MAX_PX, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 85, progressive: true })
      .toBuffer();
    return compress(out);
  } catch {
    // Fallback: heic-decode WASM for HEVC-encoded HEIC that sharp can't handle
  }

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const decode = require("heic-decode") as (opts: { buffer: Buffer }) => Promise<{
    width: number; height: number; data: Uint8ClampedArray;
  }>;

  const { width, height, data } = await decode({ buffer });
  const scale = Math.min(MAX_PX / width, MAX_PX / height, 1);
  const w = Math.round(width * scale);
  const h = Math.round(height * scale);

  const out = await sharp(Buffer.from(data.buffer), { raw: { width, height, channels: 4 } })
    .resize(w, h)
    .jpeg({ quality: 85, progressive: true })
    .toBuffer();

  return compress(out);
}
