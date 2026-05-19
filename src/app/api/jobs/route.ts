import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export const runtime = "nodejs";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const jobs = await prisma.job.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: { photos: { select: { id: true } }, analysis: { select: { id: true } } },
  });
  return NextResponse.json({ jobs });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const job = await prisma.job.create({
    data: {
      userId: session.user.id,
      address: body.address || null,
      clientName: body.clientName || null,
      inspectorName: body.inspectorName || null,
      inspectionDate: body.inspectionDate ? new Date(body.inspectionDate) : null,
      trade: body.trade || "solar",
    },
  });
  return NextResponse.json({ job }, { status: 201 });
}
