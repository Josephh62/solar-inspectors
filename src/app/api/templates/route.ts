import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DEFAULT_TEMPLATE_SECTIONS } from "@/types/template";

export const runtime = "nodejs";

export async function GET() {
  const templates = await prisma.template.findMany({ orderBy: { createdAt: "asc" } });
  return NextResponse.json({ templates });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { name, sections } = body;

  const template = await prisma.template.create({
    data: {
      name: name || "New Template",
      sections: sections ?? (DEFAULT_TEMPLATE_SECTIONS as unknown as object),
      isDefault: false,
    },
  });

  return NextResponse.json({ template }, { status: 201 });
}
