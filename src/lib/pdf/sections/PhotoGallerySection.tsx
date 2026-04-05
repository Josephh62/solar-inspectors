import React from "react";
import { Page, View, Text, Image } from "@react-pdf/renderer";
import { styles, colors } from "../styles";
import type { ClaudeAnalysis } from "@/types/analysis";

interface PhotoEntry {
  dataUri: string;
  originalName: string;
  description?: string | null;
  category?: string | null;
}

interface Props {
  photos: PhotoEntry[];
  analysis: ClaudeAnalysis;
}

export function PhotoGallerySection({ photos, analysis }: Props) {
  if (!photos.length) return null;

  const photoMeta = analysis.photos ?? [];

  // Split into pairs for 2-column layout
  const pairs: [PhotoEntry, PhotoEntry | null][] = [];
  for (let i = 0; i < photos.length; i += 2) {
    pairs.push([photos[i], photos[i + 1] ?? null]);
  }

  return (
    <Page size="LETTER" style={styles.page}>
      <Text style={styles.sectionHeader}>Inspection Photo Gallery</Text>
      <Text style={{ fontSize: 8, color: colors.textLight, marginBottom: 16 }}>
        {photos.length} photo{photos.length !== 1 ? "s" : ""} — all descriptions extracted from photo content only
      </Text>

      {pairs.map((pair, pairIdx) => (
        <View key={pairIdx} style={{ flexDirection: "row", gap: 12, marginBottom: 16 }}>
          {pair.map((photo, photoIdx) => {
            if (!photo) return <View key={photoIdx} style={{ flex: 1 }} />;
            const globalIdx = pairIdx * 2 + photoIdx;
            const meta = photoMeta[globalIdx];
            const description = photo.description || meta?.description || photo.originalName;
            const category = photo.category || meta?.category;

            return (
              <View key={photoIdx} style={{ flex: 1 }}>
                <Image src={photo.dataUri} style={styles.photo} />
                {category ? (
                  <Text style={{ fontSize: 7, color: colors.accent, fontFamily: "Helvetica-Bold", marginBottom: 2 }}>
                    {category.replace(/_/g, " ")}
                  </Text>
                ) : null}
                <Text style={styles.photoCaption}>{description}</Text>
              </View>
            );
          })}
        </View>
      ))}

      <View style={styles.footer}>
        <Text style={styles.footerText}>Solar Inspection Report</Text>
        <Text style={styles.footerText} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
      </View>
    </Page>
  );
}
