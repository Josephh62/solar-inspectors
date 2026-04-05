/**
 * Storage abstraction:
 * - On Netlify: uses Netlify Blobs
 * - Local dev (npm run dev): falls back to local filesystem
 */

import path from "node:path";
import fs from "node:fs/promises";

const isNetlify = process.env.NETLIFY === "true";
const LOCAL_ROOT = path.join(process.cwd());

// ── Netlify Blobs (production) ────────────────────────────────────────────────

async function blobStore() {
  const { getStore } = await import("@netlify/blobs");
  return getStore("solar-inspector");
}

async function blobSave(key: string, buffer: Buffer) {
  const s = await blobStore();
  await s.set(key, buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer);
  return key;
}

async function blobRead(key: string): Promise<Buffer> {
  const s = await blobStore();
  const data = await s.get(key, { type: "arrayBuffer" });
  if (!data) throw new Error(`Blob not found: ${key}`);
  return Buffer.from(data);
}

async function blobDelete(key: string) {
  const s = await blobStore();
  await s.delete(key);
}

async function blobDeletePrefix(prefix: string) {
  const s = await blobStore();
  const { blobs } = await s.list({ prefix });
  await Promise.all(blobs.map((b) => s.delete(b.key)));
}

// ── Local filesystem (dev) ────────────────────────────────────────────────────

function localPath(key: string) {
  return path.join(LOCAL_ROOT, "uploads", key);
}

async function localSave(key: string, buffer: Buffer): Promise<string> {
  const filePath = localPath(key);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, buffer);
  return key;
}

async function localRead(key: string): Promise<Buffer> {
  return Buffer.from(await fs.readFile(localPath(key)));
}

async function localDelete(key: string) {
  await fs.rm(localPath(key), { force: true });
}

async function localDeletePrefix(prefix: string) {
  await fs.rm(localPath(prefix), { recursive: true, force: true });
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function ensureJobDirs(_jobId: string): Promise<void> {
  // No-op: directories are created lazily on write
}

export async function saveOriginal(
  jobId: string,
  photoId: string,
  ext: string,
  buffer: Buffer
): Promise<string> {
  const key = `jobs/${jobId}/photos/${photoId}/original${ext}`;
  return isNetlify ? blobSave(key, buffer) : localSave(key, buffer);
}

export async function saveProcessed(
  jobId: string,
  photoId: string,
  buffer: Buffer
): Promise<string> {
  const key = `jobs/${jobId}/photos/${photoId}/processed.jpg`;
  return isNetlify ? blobSave(key, buffer) : localSave(key, buffer);
}

export async function readFile(key: string): Promise<Buffer> {
  return isNetlify ? blobRead(key) : localRead(key);
}

export async function deleteJobFiles(jobId: string) {
  const prefix = `jobs/${jobId}/`;
  if (isNetlify) {
    await blobDeletePrefix(prefix);
  } else {
    await localDeletePrefix(prefix);
  }
}

export async function deletePhotoFiles(
  originalKey: string,
  processedKey: string | null
) {
  if (isNetlify) {
    await blobDelete(originalKey);
    if (processedKey) await blobDelete(processedKey);
  } else {
    await localDelete(originalKey);
    if (processedKey) await localDelete(processedKey);
  }
}

export async function savePdf(jobId: string, buffer: Buffer): Promise<string> {
  const key = `jobs/${jobId}/report.pdf`;
  return isNetlify ? blobSave(key, buffer) : localSave(key, buffer);
}
