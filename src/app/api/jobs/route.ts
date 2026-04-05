import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  const jobs = await prisma.job.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { photos: true } },
      report: { select: { id: true } },
    },
  });
  return NextResponse.json({ jobs });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { address, clientName, inspectorName, inspectionDate, notes, templateId } = body;

  const job = await prisma.job.create({
    data: {
      address: address || null,
      clientName: clientName || null,
      inspectorName: inspectorName || null,
      inspectionDate: inspectionDate ? new Date(inspectionDate) : null,
      notes: notes || null,
      templateId: templateId || null,
      status: "DRAFT",
    },
  });

  return NextResponse.json({ job }, { status: 201 });
}
