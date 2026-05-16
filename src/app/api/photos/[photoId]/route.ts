import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ photoId: string }> }) {
  const { photoId } = await params;
  const photo = await prisma.photo.findUnique({ where: { id: photoId } });
  if (!photo?.imageData) return new NextResponse(null, { status: 404 });
  const buf = Buffer.from(photo.imageData, "base64");
  return new NextResponse(buf as unknown as BodyInit, {
    headers: { "Content-Type": "image/jpeg", "Cache-Control": "public, max-age=86400" },
  });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ photoId: string }> }) {
  const { photoId } = await params;
  await prisma.photo.delete({ where: { id: photoId } });
  return NextResponse.json({ success: true });
}
