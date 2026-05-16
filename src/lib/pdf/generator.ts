import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { ReportDocument } from "./ReportDocument";
import type { ClaudeAnalysis } from "@/types/analysis";
import type { TemplateSection } from "@/types/template";
import { DEFAULT_TEMPLATE_SECTIONS } from "@/types/template";

interface PhotoRecord {
  imageData: string | null;
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
  const { address, clientName, inspectorName, inspectionDate, analysis, photos, sections = DEFAULT_TEMPLATE_SECTIONS } = opts;

  const photoEntries = photos
    .filter((p) => !!p.imageData)
    .map((p) => ({
      dataUri: `data:image/jpeg;base64,${p.imageData}`,
      originalName: p.originalName,
      description: p.aiDescription,
      category: p.category,
    }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const element = React.createElement(ReportDocument as any, {
    address, clientName, inspectorName, inspectionDate,
    analysis, photos: photoEntries, sections,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return Buffer.from(await renderToBuffer(element as any));
}
