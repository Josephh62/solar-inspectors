import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { analyzePhotos } from "@/lib/claude";
import { readFile } from "@/lib/storage";
import { processImage } from "@/lib/heic";

export const runtime = "nodejs";
export const maxDuration = 120; // Claude can take up to 2 min for many photos

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

  // Mark as analyzing
  await prisma.job.update({ where: { id: jobId }, data: { status: "ANALYZING", errorMessage: null } });

  try {
    // Load processed photos — skip any that can't be read (e.g. failed upload)
    const MAX_BASE64_SAFE = 3 * 1024 * 1024; // 3 MB raw → ~4 MB base64, under Claude's 5 MB limit
    const photoInputs = (await Promise.all(
      job.photos.map(async (photo) => {
        try {
          const filePath = photo.processedPath ?? photo.originalPath;
          if (!filePath) {
            console.warn(`No storage path for ${photo.originalName} — upload may have failed`);
            return null;
          }
          let buffer = await readFile(filePath);
          if (buffer.length > MAX_BASE64_SAFE) {
            buffer = await processImage(buffer, photo.originalName);
          }
          return { buffer, originalName: photo.originalName, mimeType: "image/jpeg" };
        } catch (err) {
          console.error(`Cannot read ${photo.originalName} (path=${photo.processedPath ?? photo.originalPath}):`, err);
          return null;
        }
      })
    )).filter(Boolean) as { buffer: Buffer; originalName: string }[];

    if (!photoInputs.length) throw new Error(
      `No readable photos found. ${job.photos.length} photo(s) in DB but all failed to load — check Netlify function logs for details.`
    );

    const analysis = await analyzePhotos(photoInputs);

    // Count visible issues from visual inspection
    const vi = analysis.visual_inspection;
    const issueFields = [
      vi?.modules?.damage,
      vi?.modules?.discoloration,
      vi?.modules?.delamination,
      vi?.modules?.soiling,
      vi?.mounting_system?.damage,
      vi?.mounting_system?.corrosion,
      vi?.inverters?.loose_connections,
      vi?.inverters?.faults,
    ];
    const issueCount = issueFields.filter(
      (v) => v && v !== "NONE" && v !== "Not visible in provided photos"
    ).length;

    const panelCount = analysis.system_specs?.module_count
      ? Number(analysis.system_specs.module_count)
      : null;

    // Update photo categories from analysis
    const photosData = Array.isArray(analysis.photos) ? analysis.photos : [];
    for (const pd of photosData) {
      if (pd.index < job.photos.length) {
        const photo = job.photos[pd.index];
        const cat = pd.category?.toUpperCase().replace(/ /g, "_") ?? "GENERAL";
        const validCategories = ["PANELS", "INVERTER", "MOUNTING", "METER_DISPLAY", "AERIAL", "BLUEPRINT", "SITE_PLAN", "GENERAL"];
        await prisma.photo.update({
          where: { id: photo.id },
          data: {
            category: validCategories.includes(cat) ? (cat as Parameters<typeof prisma.photo.update>[0]["data"]["category"]) : "GENERAL",
            aiDescription: pd.description ?? null,
          },
        });
      }
    }

    // Create/upsert analysis record
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

    // Update job status + auto-fill address/client from analysis if not set
    const updates: Record<string, unknown> = { status: "REVIEW" };
    if (!job.address && analysis.project_address) updates.address = analysis.project_address;
    if (!job.clientName && analysis.project_name) updates.clientName = analysis.project_name;

    await prisma.job.update({ where: { id: jobId }, data: updates });

    return NextResponse.json({ success: true, analysis });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Analysis failed";
    await prisma.job.update({
      where: { id: jobId },
      data: { status: "ERROR", errorMessage: msg },
    });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
