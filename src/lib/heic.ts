import sharp from "sharp";
import { execFile } from "child_process";
import { promisify } from "util";
import { writeFile, readFile, unlink } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";

const execFileAsync = promisify(execFile);
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

/** Use macOS sips to convert HEIC buffer → JPEG buffer */
async function heicToJpegViaSips(buffer: Buffer): Promise<Buffer> {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const inPath = join(tmpdir(), `${id}.heic`);
  const outPath = join(tmpdir(), `${id}.jpg`);
  await writeFile(inPath, buffer);
  try {
    await execFileAsync("sips", ["-s", "format", "jpeg", inPath, "--out", outPath]);
    return await readFile(outPath);
  } finally {
    await unlink(inPath).catch(() => {});
    await unlink(outPath).catch(() => {});
  }
}

export async function processImage(buffer: Buffer, filename: string): Promise<Buffer> {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  const heicByMagic = isHeic(buffer);
  const heicByExt = ext === "heic" || ext === "heif";

  let input = buffer;
  if (heicByMagic || heicByExt) {
    input = await heicToJpegViaSips(buffer);
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
