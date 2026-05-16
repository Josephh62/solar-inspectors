import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { analyzePhotos } from "@/lib/claude";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;

  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: { photos: { orderBy: { sortOrder: "asc" } } },
  });

  if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });
  if (!job.photos.length) return NextResponse.json({ error: "No photos to analyze" }, { status: 400 });

  await prisma.job.update({ where: { id: jobId }, data: { status: "ANALYZING", errorMessage: null } });

  try {
    // Build photo inputs from imageData stored in DB — no file I/O needed
    const photoInputs = job.photos
      .filter((p) => !!p.imageData)
      .map((p) => ({
        buffer: Buffer.from(p.imageData!, "base64"),
        originalName: p.originalName,
        mimeType: "image/jpeg" as const,
      }));

    if (!photoInputs.length) {
      throw new Error(
        `No processed photos found (${job.photos.length} photo(s) in DB, none with imageData). ` +
        "Delete this job, re-upload your photos, and try again."
      );
    }

    const analysis = await analyzePhotos(photoInputs);

    const vi = analysis.visual_inspection;
    const issueFields = [
      vi?.modules?.damage, vi?.modules?.discoloration,
      vi?.modules?.delamination, vi?.modules?.soiling,
      vi?.mounting_system?.damage, vi?.mounting_system?.corrosion,
      vi?.inverters?.loose_connections, vi?.inverters?.faults,
    ];
    const issueCount = issueFields.filter(
      (v) => v && v !== "NONE" && v !== "Not visible in provided photos"
    ).length;

    const panelCount = analysis.system_specs?.module_count
      ? Number(analysis.system_specs.module_count)
      : null;

    const photosData = Array.isArray(analysis.photos) ? analysis.photos : [];
    for (const pd of photosData) {
      if (pd.index < job.photos.length) {
        const photo = job.photos[pd.index];
        const cat = pd.category?.toUpperCase().replace(/ /g, "_") ?? "GENERAL";
        const validCategories = ["PANELS", "INVERTER", "MOUNTING", "METER_DISPLAY", "AERIAL", "BLUEPRINT", "SITE_PLAN", "GENERAL"];
        await prisma.photo.update({
          where: { id: photo.id },
          data: {
            category: validCategories.includes(cat)
              ? (cat as Parameters<typeof prisma.photo.update>[0]["data"]["category"])
              : "GENERAL",
            aiDescription: pd.description ?? null,
          },
        });
      }
    }

    const existing = await prisma.analysis.findUnique({ where: { jobId } });
    if (existing) {
      await prisma.analysis.update({
        where: { jobId },
        data: {
          rawExtraction: analysis as object,
          reviewedData: analysis as object,
          panelCount: isNaN(panelCount as number) ? null : panelCount,
          issueCount,
        },
      });
    } else {
      await prisma.analysis.create({
        data: {
          jobId,
          rawExtraction: analysis as object,
          reviewedData: analysis as object,
          panelCount: isNaN(panelCount as number) ? null : panelCount,
          issueCount,
        },
      });
    }

    const updates: Record<string, unknown> = { status: "REVIEW" };
    if (!job.address && analysis.project_address) updates.address = analysis.project_address;
    if (!job.clientName && analysis.project_name) updates.clientName = analysis.project_name;
    await prisma.job.update({ where: { id: jobId }, data: updates });

    return NextResponse.json({ success: true, analysis });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Analysis failed";
    await prisma.job.update({ where: { id: jobId }, data: { status: "ERROR", errorMessage: msg } });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
