import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { processImage, isSupported, getExtension } from "@/lib/heic";
import { ensureJobDirs, saveOriginal, saveProcessed } from "@/lib/storage";
import type { Photo } from "@prisma/client";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const jobId = formData.get("jobId") as string | null;
    if (!jobId?.trim()) {
      return NextResponse.json({ error: "jobId is required" }, { status: 400 });
    }

    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const photoFiles = formData.getAll("photos") as File[];
    if (!photoFiles.length) {
      return NextResponse.json({ error: "No photos provided" }, { status: 400 });
    }

    await ensureJobDirs(jobId);

    const created: Photo[] = [];

    for (const file of photoFiles) {
      const filename = file.name ?? "photo";
      const mimeType = file.type || "image/jpeg";

      if (!isSupported(filename, mimeType)) continue;

      const originalBuffer = Buffer.from(await file.arrayBuffer());

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
  }
}
