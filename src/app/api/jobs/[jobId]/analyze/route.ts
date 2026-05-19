import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { analyzePhotos } from "@/lib/claude";
import { auth } from "@/auth";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(_req: NextRequest, { params }: { params: Promise<{ jobId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { jobId } = await params;

  const job = await prisma.job.findFirst({
    where: { id: jobId, userId: session.user.id },
    include: { photos: { orderBy: { sortOrder: "asc" } } },
  });
  if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });

  const readable = job.photos.filter((p) => !!p.imageData);
  if (!readable.length) return NextResponse.json({ error: "No photos uploaded yet — upload photos first" }, { status: 400 });

  await prisma.job.update({ where: { id: jobId }, data: { status: "ANALYZING", errorMessage: null } });

  try {
    const inputs = readable.map((p) => ({
      buffer: Buffer.from(p.imageData!, "base64"),
      originalName: p.originalName,
    }));

    const analysis = await analyzePhotos(inputs);

    const vi = analysis.visual_inspection;
    const issueCount = [
      vi.modules.damage, vi.modules.discoloration, vi.modules.delamination, vi.modules.soiling,
      vi.mounting_system.damage, vi.mounting_system.corrosion,
      vi.inverters.loose_connections, vi.inverters.faults,
    ].filter((v) => v && v !== "NONE" && v !== "Not visible in provided photos").length;

    const panelCount = analysis.system_specs.module_count ? Number(analysis.system_specs.module_count) : null;

    // Update photo categories
    const photosArr = Array.isArray(analysis.photos) ? analysis.photos : [];
    for (const pd of photosArr) {
      if (pd.index < readable.length) {
        const cat = pd.category?.toUpperCase().replace(/ /g, "_") ?? "GENERAL";
        const valid = ["PANELS","INVERTER","MOUNTING","METER_DISPLAY","AERIAL","BLUEPRINT","SITE_PLAN","GENERAL"];
        await prisma.photo.update({
          where: { id: readable[pd.index].id },
          data: {
            category: valid.includes(cat) ? (cat as Parameters<typeof prisma.photo.update>[0]["data"]["category"]) : "GENERAL",
            aiDescription: pd.description ?? null,
          },
        });
      }
    }

    const analysisData = {
      rawExtraction: analysis as object,
      reviewedData: analysis as object,
      panelCount: Number.isNaN(panelCount) ? null : panelCount,
      issueCount,
    };
    const existing = await prisma.analysis.findUnique({ where: { jobId } });
    if (existing) await prisma.analysis.update({ where: { jobId }, data: analysisData });
    else await prisma.analysis.create({ data: { jobId, ...analysisData } });

    const updates: Record<string, unknown> = { status: "REVIEW" };
    if (!job.address && analysis.project_address) updates.address = analysis.project_address;
    if (!job.clientName && analysis.project_name) updates.clientName = analysis.project_name;
    await prisma.job.update({ where: { id: jobId }, data: updates });

    return NextResponse.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Analysis failed";
    await prisma.job.update({ where: { id: jobId }, data: { status: "ERROR", errorMessage: msg } });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
