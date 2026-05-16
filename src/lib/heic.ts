import sharp from "sharp";

const MAX_PX = 1568;
const MAX_BYTES = 3 * 1024 * 1024;

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
  return supportedExts.includes(ext) || supportedMimes.some((m) => mimeType.startsWith(m));
}

/**
 * Converts any supported image (JPEG, PNG, WebP, HEIC, HEIF) to a
 * compressed JPEG using sharp/libvips. HEIC/HEIF are supported natively
 * by libvips on both Linux (Netlify) and macOS.
 */
export async function processImage(buffer: Buffer): Promise<Buffer> {
  let processed = await sharp(buffer, { failOn: "none" })
    .rotate()
    .resize({ width: MAX_PX, height: MAX_PX, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 85, progressive: true })
    .toBuffer();

  if (processed.length > MAX_BYTES) {
    for (const quality of [75, 60, 45]) {
      processed = await sharp(processed).jpeg({ quality, progressive: true }).toBuffer();
      if (processed.length <= MAX_BYTES) break;
    }
  }

  return processed;
}
