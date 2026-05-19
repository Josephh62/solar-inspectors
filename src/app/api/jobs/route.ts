import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  const jobs = await prisma.job.findMany({
    orderBy: { createdAt: "desc" },
    include: { photos: { select: { id: true } }, analysis: { select: { id: true } } },
  });
  return NextResponse.json({ jobs });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const job = await prisma.job.create({
    data: {
      address: body.address || null,
      clientName: body.clientName || null,
      inspectorName: body.inspectorName || null,
      inspectionDate: body.inspectionDate ? new Date(body.inspectionDate) : null,
      trade: body.trade || "solar",
    },
  });
  return NextResponse.json({ job }, { status: 201 });
}
