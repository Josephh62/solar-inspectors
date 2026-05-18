import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { prisma } from "@/lib/prisma";
import { generatePdf } from "@/lib/pdf/generator";
import type { Analysis } from "@/lib/claude";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(_req: NextRequest, { params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;

  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: { photos: { orderBy: { sortOrder: "asc" } }, analysis: true },
  });
  if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });
  if (!job.analysis) return NextResponse.json({ error: "Analyze photos first" }, { status: 400 });

  await prisma.job.update({ where: { id: jobId }, data: { status: "GENERATING" } });

  try {
    const analysis = job.analysis.reviewedData as unknown as Analysis;
    const inspectionDate = job.inspectionDate
      ? new Date(job.inspectionDate).toLocaleDateString("en-US")
      : (analysis.inspection_date ?? new Date().toLocaleDateString("en-US"));

    // Re-compress photos to 800px for PDF — full 1568px is unnecessary and makes
    // @react-pdf/renderer extremely slow (minutes vs seconds)
    const photos = await Promise.all(
      job.photos
        .filter((p) => !!p.imageData)
        .map(async (p) => {
          let dataUri = `data:image/jpeg;base64,${p.imageData}`;
          try {
            const small = await sharp(Buffer.from(p.imageData!, "base64"))
              .resize({ width: 800, height: 800, fit: "inside", withoutEnlargement: true })
              .jpeg({ quality: 70 })
              .toBuffer();
            dataUri = `data:image/jpeg;base64,${small.toString("base64")}`;
          } catch { /* use original if re-compression fails */ }
          return {
            dataUri,
            originalName: p.originalName,
            description: p.aiDescription,
            category: p.category,
          };
        })
    );

    const pdf = await generatePdf({
      address: job.address || analysis.project_address || "",
      clientName: job.clientName || analysis.project_name || "",
      inspectorName: job.inspectorName || "",
      inspectionDate,
      analysis,
      photos,
    });

    const existing = await prisma.report.findUnique({ where: { jobId } });
    if (existing) {
      await prisma.report.update({ where: { jobId }, data: { pdfSizeBytes: pdf.length } });
    } else {
      await prisma.report.create({
        data: { jobId, pdfSizeBytes: pdf.length, pdfPath: "", templateSnapshot: {} },
      });
    }

    await prisma.job.update({ where: { id: jobId }, data: { status: "COMPLETE" } });

    return new NextResponse(pdf as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="solar-report-${jobId.slice(0, 8)}.pdf"`,
        "Content-Length": String(pdf.length),
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "PDF generation failed";
    await prisma.job.update({ where: { id: jobId }, data: { status: "ERROR", errorMessage: msg } });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
