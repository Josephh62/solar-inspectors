import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export const runtime = "nodejs";

async function ownsJob(jobId: string, userId: string) {
  const job = await prisma.job.findFirst({ where: { id: jobId, userId } });
  return !!job;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ jobId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { jobId } = await params;
  const job = await prisma.job.findFirst({
    where: { id: jobId, userId: session.user.id },
    include: { photos: { orderBy: { sortOrder: "asc" } }, analysis: true, report: true },
  });
  if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ job });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ jobId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { jobId } = await params;
  if (!await ownsJob(jobId, session.user.id)) return NextResponse.json({ error: "Not found" }, { status: 404 });

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
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { jobId } = await params;
  if (!await ownsJob(jobId, session.user.id)) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.job.delete({ where: { id: jobId } });
  return NextResponse.json({ success: true });
}
