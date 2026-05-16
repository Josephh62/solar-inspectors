import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { deletePhotoFiles, readFile } from "@/lib/storage";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ photoId: string }> }
) {
  const { photoId } = await params;
  const photo = await prisma.photo.findUnique({ where: { id: photoId } });
  if (!photo) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Production: imageData stored in DB as base64
  if (photo.imageData) {
    const buf = Buffer.from(photo.imageData, "base64");
    return new NextResponse(buf as unknown as BodyInit, {
      headers: { "Content-Type": "image/jpeg", "Cache-Control": "public, max-age=86400" },
    });
  }

  // Local dev: read from filesystem
  const key = photo.processedPath && photo.processedPath !== "db"
    ? photo.processedPath
    : photo.originalPath;
  if (!key) return NextResponse.json({ error: "File not found" }, { status: 404 });

  try {
    const buffer = await readFile(key);
    return new NextResponse(buffer as unknown as BodyInit, {
      headers: { "Content-Type": "image/jpeg", "Cache-Control": "public, max-age=86400" },
    });
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ photoId: string }> }
) {
  const { photoId } = await params;
  const photo = await prisma.photo.findUnique({ where: { id: photoId } });
  if (!photo) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await deletePhotoFiles(photo.originalPath, photo.processedPath);
  await prisma.photo.delete({ where: { id: photoId } });

  return NextResponse.json({ success: true });
}
