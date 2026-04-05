import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ templateId: string }> }
) {
  const { templateId } = await params;
  const template = await prisma.template.findUnique({ where: { id: templateId } });
  if (!template) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ template });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ templateId: string }> }
) {
  const { templateId } = await params;
  const body = await req.json().catch(() => ({}));
  const { name, sections, isDefault } = body;

  const data: Record<string, unknown> = {};
  if (name !== undefined) data.name = name;
  if (sections !== undefined) data.sections = sections;
  if (isDefault !== undefined) data.isDefault = isDefault;

  const template = await prisma.template.update({ where: { id: templateId }, data });
  return NextResponse.json({ template });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ templateId: string }> }
) {
  const { templateId } = await params;
  await prisma.template.delete({ where: { id: templateId } });
  return NextResponse.json({ success: true });
}
