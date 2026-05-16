import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { processImage, isSupported, getExtension } from "@/lib/heic";
import { saveOriginal } from "@/lib/storage";
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
    if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });

    const photoFiles = formData.getAll("photos") as File[];
    if (!photoFiles.length) {
      return NextResponse.json({ error: "No photos provided" }, { status: 400 });
    }

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

      // Save original locally in dev (no-op in production)
      const ext = getExtension(filename, mimeType);
      await saveOriginal(jobId, photo.id, ext, originalBuffer).catch((err) =>
        console.error(`saveOriginal failed for ${filename}:`, err)
      );

      // Process image → compressed JPEG, stored as base64 in DB
      let imageData: string | null = null;
      try {
        const processedBuffer = await processImage(originalBuffer);
        imageData = processedBuffer.toString("base64");
      } catch (err) {
        console.error(`processImage failed for ${filename}:`, err);
      }

      const updated = await prisma.photo.update({
        where: { id: photo.id },
        data: {
          originalPath: "",
          processedPath: imageData ? "db" : null,
          imageData,
        },
      });

      created.push(updated);
    }

    await prisma.job.update({ where: { id: jobId }, data: { status: "DRAFT" } });
    return NextResponse.json({ photos: created });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Upload failed" },
      { status: 500 }
    );
  }
}
