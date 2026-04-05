import { NextRequest, NextResponse } from "next/server";
import { Readable } from "stream";
import formidable from "formidable";
import { readFile as fsReadFile, unlink } from "fs/promises";
import { prisma } from "@/lib/prisma";
import { processImage, isSupported, getExtension } from "@/lib/heic";
import { ensureJobDirs, saveOriginal, saveProcessed } from "@/lib/storage";
import type { Photo } from "@prisma/client";

export const runtime = "nodejs";
export const maxDuration = 60;

async function parseMultipart(req: NextRequest) {
  const body = req.body;
  if (!body) throw new Error("No request body");

  // Convert Web ReadableStream → Node.js Readable so formidable can parse it
  const nodeStream = Readable.fromWeb(body as Parameters<typeof Readable.fromWeb>[0]);
  const headers: Record<string, string> = {};
  req.headers.forEach((v, k) => { headers[k] = v; });
  Object.assign(nodeStream, { headers });

  const form = formidable({
    maxFileSize: 100 * 1024 * 1024,   // 100 MB per file
    maxTotalFileSize: 500 * 1024 * 1024, // 500 MB total
    keepExtensions: true,
  });

  const [fields, files] = await form.parse(nodeStream as any);
  return { fields, files };
}

export async function POST(req: NextRequest) {
  const tempPaths: string[] = [];

  try {
    const { fields, files } = await parseMultipart(req);

    const jobId = Array.isArray(fields.jobId) ? fields.jobId[0] : fields.jobId;
    if (!jobId) {
      return NextResponse.json({ error: "jobId is required" }, { status: 400 });
    }

    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const photoFiles = Array.isArray(files.photos) ? files.photos : (files.photos ? [files.photos] : []);
    if (!photoFiles.length) {
      return NextResponse.json({ error: "No photos provided" }, { status: 400 });
    }

    await ensureJobDirs(jobId);

    const created: Photo[] = [];

    for (const file of photoFiles) {
      const filename = file.originalFilename ?? file.newFilename ?? "photo";
      const mimeType = file.mimetype ?? "image/jpeg";

      if (!isSupported(filename, mimeType)) continue;

      // Track temp file for cleanup
      if (file.filepath) tempPaths.push(file.filepath);

      const originalBuffer = await fsReadFile(file.filepath);

      const photo = await prisma.photo.create({
        data: {
          jobId,
          originalName: filename,
          originalPath: "",
          mimeType,
          sizeBytes: originalBuffer.length,
          sortOrder: created.length,
        },
      });

      const ext = getExtension(filename, mimeType);
      const originalPath = await saveOriginal(jobId, photo.id, ext, originalBuffer);

      let processedPath: string | null = null;
      try {
        const processedBuffer = await processImage(originalBuffer, filename);
        processedPath = await saveProcessed(jobId, photo.id, processedBuffer);
      } catch (err) {
        console.error(`Failed to process ${filename}:`, err);
      }

      const updated = await prisma.photo.update({
        where: { id: photo.id },
        data: { originalPath, processedPath },
      });

      created.push(updated);
    }

    await prisma.job.update({
      where: { id: jobId },
      data: { status: "DRAFT" },
    });

    return NextResponse.json({ photos: created });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Upload failed" },
      { status: 500 }
    );
  } finally {
    // Clean up formidable temp files
    await Promise.allSettled(tempPaths.map((p) => unlink(p)));
  }
}
