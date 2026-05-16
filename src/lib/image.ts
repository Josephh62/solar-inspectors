import sharp from "sharp";

const MAX_PX = 1568;
const MAX_BYTES = 450_000; // keeps base64 under Turso's 1 MB HTTP limit

export function isSupported(filename: string): boolean {
  return /\.(jpe?g|png|webp|heic|heif)$/i.test(filename);
}

export async function processImage(buffer: Buffer): Promise<Buffer> {
  let out = await sharp(buffer, { failOn: "none" })
    .rotate()
    .resize({ width: MAX_PX, height: MAX_PX, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 85, progressive: true })
    .toBuffer();

  for (const q of [70, 55, 40]) {
    if (out.length <= MAX_BYTES) break;
    out = await sharp(out).jpeg({ quality: q, progressive: true }).toBuffer();
  }
  return out;
}
