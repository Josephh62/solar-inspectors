import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generatePdf } from "@/lib/pdf/generator";
import { savePdf, readFile } from "@/lib/storage";
import type { ClaudeAnalysis } from "@/types/analysis";
import type { TemplateSection } from "@/types/template";
import { DEFAULT_TEMPLATE_SECTIONS } from "@/types/template";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;

  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: {
      photos: { orderBy: { sortOrder: "asc" } },
      analysis: true,
      template: true,
    },
  });

  if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });
  if (!job.analysis) return NextResponse.json({ error: "No analysis found — analyze photos first" }, { status: 400 });

  await prisma.job.update({ where: { id: jobId }, data: { status: "GENERATING" } });

  try {
    const analysis = job.analysis.reviewedData as unknown as ClaudeAnalysis;
    const sections: TemplateSection[] = job.template
      ? (job.template.sections as unknown as TemplateSection[])
      : DEFAULT_TEMPLATE_SECTIONS;

    const address = job.address || analysis.project_address || "";
    const clientName = job.clientName || analysis.project_name || "";
    const inspectorName = job.inspectorName || "";
    const inspectionDate = job.inspectionDate
      ? job.inspectionDate.toLocaleDateString("en-US")
      : (analysis.inspection_date || new Date().toLocaleDateString("en-US"));

    const pdfBuffer = await generatePdf({
      address,
      clientName,
      inspectorName,
      inspectionDate,
      analysis,
      photos: job.photos,
      sections,
    });

    const pdfPath = await savePdf(jobId, pdfBuffer);

    // Upsert report record
    const existing = await prisma.report.findUnique({ where: { jobId } });
    if (existing) {
      await prisma.report.update({
        where: { jobId },
        data: { pdfPath, pdfSizeBytes: pdfBuffer.length, templateSnapshot: sections as unknown as object },
      });
    } else {
      await prisma.report.create({
        data: {
          jobId,
          pdfPath,
          pdfSizeBytes: pdfBuffer.length,
          templateSnapshot: sections as unknown as object,
        },
      });
    }

    await prisma.job.update({ where: { id: jobId }, data: { status: "COMPLETE" } });

    // Stream PDF back directly
    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="solar-inspection-${jobId.slice(0, 8)}.pdf"`,
        "Content-Length": String(pdfBuffer.length),
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "PDF generation failed";
    await prisma.job.update({ where: { id: jobId }, data: { status: "ERROR", errorMessage: msg } });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;

  const report = await prisma.report.findUnique({ where: { jobId } });
  if (!report) return NextResponse.json({ error: "No report found" }, { status: 404 });

  try {
    const buffer = await readFile(report.pdfPath);
    return new NextResponse(buffer as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="solar-inspection-${jobId.slice(0, 8)}.pdf"`,
        "Content-Length": String(buffer.length),
      },
    });
  } catch {
    return NextResponse.json({ error: "PDF file not found" }, { status: 404 });
  }
}
