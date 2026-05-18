import { NextRequest, NextResponse } from "next/server";
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

    const photos = job.photos
      .filter((p) => !!p.imageData)
      .map((p) => ({
        dataUri: `data:image/jpeg;base64,${p.imageData}`,
        originalName: p.originalName,
        description: p.aiDescription,
        category: p.category,
      }));

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
      await prisma.report.create({ data: { jobId, pdfSizeBytes: pdf.length } });
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
