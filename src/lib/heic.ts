import sharp from "sharp";
import convert from "heic-convert";

const MAX_PX = 1568;
const MAX_BYTES = 3 * 1024 * 1024;

/** Detect HEIC/HEIF by magic bytes (ftyp box at offset 4) */
function isHeic(buffer: Buffer): boolean {
  if (buffer.length < 12) return false;
  const ftyp = buffer.subarray(4, 8).toString("ascii");
  if (ftyp !== "ftyp") return false;
  const brand = buffer.subarray(8, 12).toString("ascii").toLowerCase();
  return brand.startsWith("heic") || brand.startsWith("heif") || brand.startsWith("mif1") || brand.startsWith("msf1");
}

export function getExtension(filename: string, mimeType: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  if (ext) return `.${ext}`;
  if (mimeType.includes("jpeg") || mimeType.includes("jpg")) return ".jpg";
  if (mimeType.includes("png")) return ".png";
  if (mimeType.includes("heic") || mimeType.includes("heif")) return ".heic";
  return ".jpg";
}

export function isSupported(filename: string, mimeType: string): boolean {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  const supportedExts = ["jpg", "jpeg", "png", "webp", "heic", "heif"];
  const supportedMimes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/heic", "image/heif"];
  return supportedExts.includes(ext) || supportedMimes.some(m => mimeType.startsWith(m));
}

/** Convert HEIC buffer → JPEG buffer (cross-platform) */
async function heicToJpeg(buffer: Buffer): Promise<Buffer> {
  const output = await convert({ buffer, format: "JPEG", quality: 0.92 });
  return Buffer.from(output);
}

export async function processImage(buffer: Buffer, filename: string): Promise<Buffer> {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  const heicByMagic = isHeic(buffer);
  const heicByExt = ext === "heic" || ext === "heif";

  let input = buffer;
  if (heicByMagic || heicByExt) {
    input = await heicToJpeg(buffer);
  }

  let pipeline = sharp(input, { failOn: "none" })
    .rotate()
    .resize({ width: MAX_PX, height: MAX_PX, fit: "inside", withoutEnlargement: true });

  let processed = await pipeline.jpeg({ quality: 85, progressive: true }).toBuffer();

  if (processed.length > MAX_BYTES) {
    for (const quality of [75, 60, 45]) {
      processed = await sharp(processed).jpeg({ quality, progressive: true }).toBuffer();
      if (processed.length <= MAX_BYTES) break;
    }
  }

  return processed;
}
