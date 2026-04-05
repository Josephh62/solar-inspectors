import React from "react";
import { Document } from "@react-pdf/renderer";
import { CoverSection } from "./sections/CoverSection";
import { VisualInspectionSection } from "./sections/VisualInspectionSection";
import { ElectricalSection } from "./sections/ElectricalSection";
import { PhotoGallerySection } from "./sections/PhotoGallerySection";
import type { ClaudeAnalysis } from "@/types/analysis";
import type { TemplateSection } from "@/types/template";

export interface PhotoEntry {
  dataUri: string;
  originalName: string;
  description?: string | null;
  category?: string | null;
}

interface Props {
  address: string;
  clientName: string;
  inspectorName: string;
  inspectionDate: string;
  analysis: ClaudeAnalysis;
  photos: PhotoEntry[];
  sections: TemplateSection[];
}

export function ReportDocument({
  address,
  clientName,
  inspectorName,
  inspectionDate,
  analysis,
  photos,
  sections,
}: Props) {
  const visibleSections = sections
    .filter((s) => s.visible)
    .sort((a, b) => a.order - b.order);

  return (
    <Document
      title={`Solar Inspection Report — ${address || "Unknown Address"}`}
      author={inspectorName || "Solar Inspector"}
      creator="Solar Inspector App"
    >
      {visibleSections.map((section) => {
        switch (section.id) {
          case "cover":
            return (
              <CoverSection
                key={section.id}
                address={address}
                clientName={clientName}
                inspectorName={inspectorName}
                inspectionDate={inspectionDate}
                analysis={analysis}
              />
            );
          case "visual_inspection":
            return (
              <VisualInspectionSection
                key={section.id}
                analysis={analysis}
                inspectionDate={inspectionDate}
              />
            );
          case "electrical_analysis":
            return (
              <ElectricalSection
                key={section.id}
                analysis={analysis}
                inspectionDate={inspectionDate}
              />
            );
          case "photo_gallery":
            return (
              <PhotoGallerySection
                key={section.id}
                photos={photos}
                analysis={analysis}
              />
            );
          default:
            return null;
        }
      })}
    </Document>
  );
}
