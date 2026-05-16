/**
 * Storage: local filesystem only (used in dev).
 * In production, processed images are stored as base64 in Turso (Photo.imageData).
 */

import path from "node:path";
import fs from "node:fs/promises";

const IS_PROD = (process.env.DATABASE_URL ?? "").startsWith("libsql://");
const LOCAL_ROOT = path.join(process.cwd(), "uploads");

function localPath(key: string) {
  return path.join(LOCAL_ROOT, key);
}

async function localSave(key: string, buffer: Buffer): Promise<void> {
  const p = localPath(key);
  await fs.mkdir(path.dirname(p), { recursive: true });
  await fs.writeFile(p, buffer);
}

async function localRead(key: string): Promise<Buffer> {
  return fs.readFile(localPath(key));
}

async function localDelete(key: string): Promise<void> {
  await fs.rm(localPath(key), { force: true });
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function saveOriginal(
  jobId: string,
  photoId: string,
  ext: string,
  buffer: Buffer
): Promise<string> {
  const key = `jobs/${jobId}/photos/${photoId}/original${ext}`;
  if (!IS_PROD) await localSave(key, buffer);
  return key;
}

export async function readFile(key: string): Promise<Buffer> {
  if (IS_PROD) throw new Error("readFile not used in production — read imageData from DB");
  return localRead(key);
}

export async function deletePhotoFiles(
  originalKey: string,
  processedKey: string | null
): Promise<void> {
  if (IS_PROD) return; // DB cascade handles deletion
  if (originalKey) await localDelete(originalKey).catch(() => {});
  if (processedKey && processedKey !== "db") await localDelete(processedKey).catch(() => {});
}

export async function deleteJobFiles(jobId: string): Promise<void> {
  if (IS_PROD) return;
  await fs.rm(path.join(LOCAL_ROOT, `jobs/${jobId}`), { recursive: true, force: true });
}

export async function savePdf(jobId: string, buffer: Buffer): Promise<string> {
  const key = `jobs/${jobId}/report.pdf`;
  if (!IS_PROD) await localSave(key, buffer);
  return key;
}

export async function readPdf(key: string): Promise<Buffer> {
  if (IS_PROD) throw new Error("readPdf not used in production");
  return localRead(key);
}
