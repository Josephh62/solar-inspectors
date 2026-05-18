import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { processImage, isSupported } from "@/lib/image";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const jobId = form.get("jobId") as string | null;
    if (!jobId) return NextResponse.json({ error: "jobId required" }, { status: 400 });

    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });

    const files = form.getAll("photos") as File[];
    const created = [];

    for (const file of files) {
      if (!isSupported(file.name)) continue;

      // Raw HEIC reaching the server means canvas failed on the client.
      // Sharp crashes (SIGSEGV) on certain HEIC variants — return a clear JSON
      // error instead of letting the Lambda die and return a non-JSON 500.
      if (/\.(heic|heif)$/i.test(file.name)) {
        return NextResponse.json(
          { error: `${file.name}: couldn't convert — open in Photos → tap Share → Save to Files as JPEG, then re-upload` },
          { status: 422 }
        );
      }

      const buf = Buffer.from(await file.arrayBuffer());

      const photo: Awaited<ReturnType<typeof prisma.photo.create>> = await prisma.photo.create({
        data: {
          jobId,
          originalName: file.name,
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
        console.error(`processImage failed for ${file.name}:`, err);
      }

      const updated: Awaited<ReturnType<typeof prisma.photo.update>> = await prisma.photo.update({
        where: { id: photo.id },
        data: { processedPath: imageData ? "db" : null, imageData },
      });
      created.push(updated);
    }

    return NextResponse.json({ photos: created });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Upload failed" }, { status: 500 });
  }
}
