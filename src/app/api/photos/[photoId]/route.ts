import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { deletePhotoFiles, readFile } from "@/lib/storage";
import path from "node:path";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ photoId: string }> }
) {
  const { photoId } = await params;
  const photo = await prisma.photo.findUnique({ where: { id: photoId } });
  if (!photo) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const key = photo.processedPath ?? photo.originalPath;

  try {
    const buffer = await readFile(key);
    const ext = path.extname(key).toLowerCase();
    const contentType = ext === ".png" ? "image/png" : "image/jpeg";

    return new NextResponse(buffer as unknown as BodyInit, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400",
      },
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
