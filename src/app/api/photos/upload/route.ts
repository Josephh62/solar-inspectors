import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { processImage, isSupported } from "@/lib/image";
import type { Photo } from "@prisma/client";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const jobId = formData.get("jobId") as string | null;
    if (!jobId?.trim()) return NextResponse.json({ error: "jobId required" }, { status: 400 });

    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });

    const files = formData.getAll("photos") as File[];
    if (!files.length) return NextResponse.json({ error: "No photos" }, { status: 400 });

    const created: Photo[] = [];

    for (const file of files) {
      const filename = file.name || "photo";
      if (!isSupported(filename)) continue;

      const buf = Buffer.from(await file.arrayBuffer());

      const photo = await prisma.photo.create({
        data: {
          jobId,
          originalName: filename,
          originalPath: "",
          mimeType: file.type || "image/jpeg",
          sizeBytes: buf.length,
          sortOrder: created.length,
        },
      });

      let imageData: string | null = null;
      try {
        const processed = await processImage(buf);
        imageData = processed.toString("base64");
      } catch (err) {
        console.error(`processImage failed for ${filename}:`, err);
      }

      const updated = await prisma.photo.update({
        where: { id: photo.id },
        data: { processedPath: imageData ? "db" : null, imageData },
      });

      created.push(updated);
    }

    await prisma.job.update({ where: { id: jobId }, data: { status: "DRAFT" } });
    return NextResponse.json({ photos: created });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Upload failed" }, { status: 500 });
  }
}
