import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { deleteJobFiles } from "@/lib/storage";
import type { IssueSeverity, IssueCategory } from "@prisma/client";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: {
      photos: { orderBy: { sortOrder: "asc" } },
      analysis: { include: { issues: true } },
      report: true,
      template: true,
    },
  });
  if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ job });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;
  const body = await req.json().catch(() => ({}));

  const {
    address, clientName, inspectorName, inspectionDate,
    notes, status, errorMessage, templateId,
    reviewedData, issues,
  } = body;

  const updateData: Record<string, unknown> = {};
  if (address !== undefined) updateData.address = address;
  if (clientName !== undefined) updateData.clientName = clientName;
  if (inspectorName !== undefined) updateData.inspectorName = inspectorName;
  if (inspectionDate !== undefined) updateData.inspectionDate = inspectionDate ? new Date(inspectionDate) : null;
  if (notes !== undefined) updateData.notes = notes;
  if (status !== undefined) updateData.status = status;
  if (errorMessage !== undefined) updateData.errorMessage = errorMessage;
  if (templateId !== undefined) updateData.templateId = templateId;

  const job = await prisma.job.update({
    where: { id: jobId },
    data: updateData,
  });

  // If reviewedData is provided, update the analysis
  if (reviewedData !== undefined && job) {
    const existing = await prisma.analysis.findUnique({ where: { jobId } });
    if (existing) {
      await prisma.analysis.update({
        where: { jobId },
        data: { reviewedData },
      });

      // Upsert issues if provided
      if (Array.isArray(issues)) {
        await prisma.issue.deleteMany({ where: { analysisId: existing.id } });
        if (issues.length > 0) {
          await prisma.issue.createMany({
            data: issues.map((issue: Record<string, unknown>) => ({
              analysisId: existing.id,
              severity: issue.severity as IssueSeverity,
              category: issue.category as IssueCategory,
              description: issue.description as string,
              photoIds: (issue.photoIds as string) ?? "",
              notes: (issue.notes as string) ?? null,
              resolved: (issue.resolved as boolean) ?? false,
            })),
          });
          await prisma.analysis.update({
            where: { id: existing.id },
            data: { issueCount: issues.length },
          });
        }
      }
    }
  }

  return NextResponse.json({ job });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;
  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await deleteJobFiles(jobId);
  await prisma.job.delete({ where: { id: jobId } });

  return NextResponse.json({ success: true });
}
