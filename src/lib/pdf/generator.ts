import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { ReportDocument } from "./ReportDocument";
import type { ClaudeAnalysis } from "@/types/analysis";
import type { TemplateSection } from "@/types/template";
import { DEFAULT_TEMPLATE_SECTIONS } from "@/types/template";
import { readFile } from "@/lib/storage";

interface PhotoRecord {
  processedPath: string | null;
  originalPath: string;
  originalName: string;
  aiDescription: string | null;
  category: string | null;
}

interface GeneratePdfOptions {
  address: string;
  clientName: string;
  inspectorName: string;
  inspectionDate: string;
  analysis: ClaudeAnalysis;
  photos: PhotoRecord[];
  sections?: TemplateSection[];
}

export async function generatePdf(opts: GeneratePdfOptions): Promise<Buffer> {
  const {
    address,
    clientName,
    inspectorName,
    inspectionDate,
    analysis,
    photos,
    sections = DEFAULT_TEMPLATE_SECTIONS,
  } = opts;

  // Load photos as base64 data URIs
  const photoEntries = await Promise.all(
    photos.map(async (photo) => {
      const filePath = photo.processedPath ?? photo.originalPath;
      try {
        const buffer = await readFile(filePath);
        const dataUri = `data:image/jpeg;base64,${buffer.toString("base64")}`;
        return {
          dataUri,
          originalName: photo.originalName,
          description: photo.aiDescription,
          category: photo.category,
        };
      } catch {
        return null;
      }
    })
  );

  const validPhotos = photoEntries.filter(Boolean) as NonNullable<typeof photoEntries[number]>[];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const element = React.createElement(ReportDocument as any, {
    address,
    clientName,
    inspectorName,
    inspectionDate,
    analysis,
    photos: validPhotos,
    sections,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await renderToBuffer(element as any);
  return Buffer.from(buffer);
}
