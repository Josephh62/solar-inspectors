import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: { photos: { orderBy: { sortOrder: "asc" } }, analysis: true, report: true },
  });
  if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ job });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  const body = await req.json().catch(() => ({}));
  const data: Record<string, unknown> = {};
  if (body.address !== undefined) data.address = body.address;
  if (body.clientName !== undefined) data.clientName = body.clientName;
  if (body.inspectorName !== undefined) data.inspectorName = body.inspectorName;
  if (body.inspectionDate !== undefined) data.inspectionDate = body.inspectionDate ? new Date(body.inspectionDate) : null;
  if (body.notes !== undefined) data.notes = body.notes;

  if (body.reviewedData !== undefined) {
    await prisma.analysis.updateMany({ where: { jobId }, data: { reviewedData: body.reviewedData } });
  }

  const job = await prisma.job.update({ where: { id: jobId }, data });
  return NextResponse.json({ job });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  await prisma.job.delete({ where: { id: jobId } });
  return NextResponse.json({ success: true });
}
