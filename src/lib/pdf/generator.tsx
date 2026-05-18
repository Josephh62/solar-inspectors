import React from "react";
import { Document, Page, Text, View, Image, StyleSheet, renderToBuffer } from "@react-pdf/renderer";
import type { Analysis } from "@/lib/claude";

// ── SunGreen brand colors ──────────────────────────────────────────────────
const C = {
  olive: "#5c6b2e",
  red: "#8b3028",
  accent: "#c0392b",
  body: "#1a1a1a",
  muted: "#555555",
  white: "#ffffff",
};

const s = StyleSheet.create({
  page: { fontFamily: "Helvetica", fontSize: 10, color: C.body, backgroundColor: "#ffffff" },

  // Accent bars
  accentBar: { height: 8, backgroundColor: C.accent },

  // Header bars
  oliveHeader: {
    backgroundColor: C.olive, flexDirection: "row", alignItems: "center",
    justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 10,
  },
  redHeader: {
    backgroundColor: C.red, flexDirection: "row", alignItems: "center",
    justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 10,
  },
  headerTitle: { fontSize: 16, fontFamily: "Helvetica-Bold", color: C.white },
  headerLogo: { flexDirection: "row", alignItems: "flex-end" },
  logoSun: { fontSize: 13, fontFamily: "Helvetica-Bold", color: C.accent },
  logoGreen: { fontSize: 13, fontFamily: "Helvetica-Bold", color: C.olive },
  logoTag: { fontSize: 7, color: "#ccddaa", letterSpacing: 1.5, marginTop: 2 },

  // Cover
  coverBody: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 60, paddingVertical: 40, backgroundColor: "#ffffff" },
  coverBanner: { backgroundColor: C.olive, width: "100%", paddingVertical: 28, paddingHorizontal: 20, alignItems: "center", marginBottom: 40, marginTop: 20 },
  coverBannerText: { fontSize: 20, fontFamily: "Helvetica-Bold", color: C.white, letterSpacing: 1 },
  coverLogoSun: { fontSize: 36, fontFamily: "Helvetica-Bold", color: C.accent },
  coverLogoGreen: { fontSize: 36, fontFamily: "Helvetica-Bold", color: C.olive },
  coverLogoTag: { fontSize: 11, color: C.olive, letterSpacing: 3, marginTop: 4 },
  coverName: { fontSize: 18, color: C.body, textAlign: "center", marginBottom: 10 },
  coverAddress: { fontSize: 14, color: C.muted, textAlign: "center" },

  // Body content area
  content: { padding: 30, flex: 1 },

  // Check rows
  sectionTitle: { fontSize: 12, fontFamily: "Helvetica-Bold", color: C.body, marginBottom: 10, marginTop: 16 },
  bullet: { fontSize: 11, color: C.body, marginRight: 6, marginTop: 1 },
  bulletRow: { flexDirection: "row", marginBottom: 16 },
  bulletContent: { flex: 1 },
  bulletLabel: { fontSize: 11, fontFamily: "Helvetica-Bold", color: C.body, marginBottom: 6 },
  checkRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 5, paddingLeft: 12 },
  checkbox: { width: 10, height: 10, borderWidth: 1, borderColor: C.body, marginRight: 8, marginTop: 1 },
  checkLabel: { fontSize: 10, color: C.body, width: 120 },
  checkValue: { fontSize: 10, color: C.body, flex: 1 },
  checkValueNone: { fontSize: 10, color: C.muted, flex: 1 },
  resultsRow: { flexDirection: "row", marginTop: 6, paddingLeft: 12, marginBottom: 4 },
  resultsLabel: { fontSize: 10, fontFamily: "Helvetica-Bold", color: C.body, marginRight: 6 },
  resultsValue: { fontSize: 10, color: C.body, flex: 1 },

  // Electrical
  elecSection: { marginBottom: 20 },
  elecTitle: { fontSize: 11, fontFamily: "Helvetica-Bold", color: C.body, marginBottom: 10 },
  elecCheckRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 6, paddingLeft: 16 },
  elecSubRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 5, paddingLeft: 32 },
  tickMark: { fontSize: 10, color: C.olive, marginRight: 6, fontFamily: "Helvetica-Bold" },
  elecLabel: { fontSize: 10, color: C.body, width: 80 },
  elecValue: { fontSize: 10, color: C.body, flex: 1 },
  elecValueNone: { fontSize: 10, color: C.muted, flex: 1 },
  elecResult: { flexDirection: "row", marginTop: 8, paddingLeft: 16, borderTopWidth: 1, borderTopColor: "#dddddd", paddingTop: 6 },
  elecResultLabel: { fontSize: 10, fontFamily: "Helvetica-Bold", color: C.body, marginRight: 6 },
  elecResultValue: { fontSize: 10, color: C.body, flex: 1 },

  // Photo pages
  photoArea: { flex: 1, marginHorizontal: 20, marginTop: 16, marginBottom: 60 },
  photo: { width: "100%", height: "100%", objectFit: "contain" },
  photoCaption: { position: "absolute", bottom: 0, left: 20, right: 20, paddingTop: 6 },
  captionLabel: { fontSize: 10, fontFamily: "Helvetica-Bold", color: C.body },
  captionText: { fontSize: 10, color: C.body, marginTop: 3 },

  // Site plan specs
  specsBox: { position: "absolute", bottom: 20, right: 20, width: 180 },
  specsTitle: { fontSize: 10, fontFamily: "Helvetica-Bold", color: C.body, marginBottom: 6 },
  specItem: { fontSize: 10, color: C.body, marginBottom: 3 },

  // Page number
  pageNum: { position: "absolute", bottom: 12, right: 20, fontSize: 9, color: C.muted },

  // Thank you
  thankPage: { flex: 1, alignItems: "center", justifyContent: "center", padding: 60 },
  thankTitle: { fontSize: 48, fontFamily: "Helvetica-Bold", color: C.olive, marginBottom: 40 },
  thankContact: { fontSize: 11, color: C.muted, textAlign: "center", marginBottom: 6, lineHeight: 1.6 },
  thankEmail: { fontSize: 11, color: "#0066cc", textAlign: "center", marginBottom: 6 },
  thankBullet: { fontSize: 10, color: C.muted, marginBottom: 4, textAlign: "center" },
  divider: { width: 60, height: 2, backgroundColor: C.olive, marginVertical: 20 },
});

// ── Components ─────────────────────────────────────────────────────────────

function LogoSmall() {
  return (
    <View style={s.headerLogo}>
      <View>
        <View style={{ flexDirection: "row" }}>
          <Text style={s.logoSun}>Sun</Text>
          <Text style={s.logoGreen}>Green</Text>
          <Text style={{ fontSize: 7, color: C.accent, marginTop: 1 }}>®</Text>
        </View>
        <Text style={s.logoTag}>S Y S T E M S</Text>
      </View>
    </View>
  );
}

function OliveHeader({ title }: { title: string }) {
  return (
    <View style={s.oliveHeader}>
      <Text style={s.headerTitle}>{title}</Text>
      <LogoSmall />
    </View>
  );
}

function RedHeader({ title }: { title: string }) {
  return (
    <View style={s.redHeader}>
      <Text style={s.headerTitle}>{title}</Text>
      <LogoSmall />
    </View>
  );
}

function Checkbox({ label, value }: { label: string; value: string }) {
  const isNone = !value || value === "NONE" || value === "Not visible in provided photos";
  return (
    <View style={s.checkRow}>
      <View style={s.checkbox} />
      <Text style={s.checkLabel}>{label} - </Text>
      <Text style={isNone ? s.checkValueNone : s.checkValue}>
        {isNone ? "None observed" : value}
      </Text>
    </View>
  );
}

function Results({ value }: { value: string }) {
  return (
    <View style={s.resultsRow}>
      <Text style={s.resultsLabel}>Results:</Text>
      <Text style={s.resultsValue}>{value || "—"}</Text>
    </View>
  );
}

// ── Photo type ──────────────────────────────────────────────────────────────

interface PhotoEntry {
  dataUri: string;
  originalName: string;
  description: string | null;
  category: string | null;
}

// ── Main props ──────────────────────────────────────────────────────────────

interface Props {
  address: string;
  clientName: string;
  inspectorName: string;
  inspectionDate: string;
  analysis: Analysis;
  photos: PhotoEntry[];
}

// ── PDF Document ────────────────────────────────────────────────────────────

function SunGreenReport({ address, clientName, inspectionDate, analysis, photos }: Props) {
  const vi = analysis.visual_inspection;
  const ea = analysis.electrical_analysis;
  const ss = analysis.system_specs;

  // Route photos by category
  const sitePlanPhoto = photos.find((p) => p.category && ["SITE_PLAN", "BLUEPRINT"].includes(p.category.toUpperCase()));
  const aerialPhoto = photos.find((p) => p.category?.toUpperCase() === "AERIAL");
  const inspectionPhotos = photos.filter((p) => {
    const cat = p.category?.toUpperCase();
    return !cat || !["SITE_PLAN", "BLUEPRINT", "AERIAL"].includes(cat);
  });

  const followUps = Array.isArray(vi.follow_up_items) ? vi.follow_up_items : [];

  return (
    <Document title={`Solar Inspection Report — ${address}`}>

      {/* ── Cover Page ── */}
      <Page size="LETTER" style={s.page}>
        <View style={s.accentBar} />
        <View style={s.coverBody}>
          <View style={{ flexDirection: "row", alignItems: "flex-end", marginBottom: 4 }}>
            <Text style={s.coverLogoSun}>Sun</Text>
            <Text style={s.coverLogoGreen}>Green</Text>
            <Text style={{ fontSize: 16, color: C.accent, marginBottom: 6 }}>®</Text>
          </View>
          <Text style={s.coverLogoTag}>S Y S T E M S</Text>

          <View style={s.coverBanner}>
            <Text style={s.coverBannerText}>WE SEE THINGS DIFFERENTLY</Text>
          </View>

          <Text style={s.coverName}>{clientName || address || "Solar Inspection"}</Text>
          <Text style={s.coverAddress}>{address || ""}</Text>
        </View>
        <View style={s.accentBar} />
      </Page>

      {/* ── Visual Inspection ── */}
      <Page size="LETTER" style={s.page}>
        <OliveHeader title={`Visual Inspection: ${inspectionDate}`} />
        <View style={s.content}>

          {/* PV Modules */}
          <View style={s.bulletRow}>
            <Text style={s.bullet}>❖</Text>
            <View style={s.bulletContent}>
              <Text style={s.bulletLabel}>Visually inspect PV modules for:</Text>
              <Checkbox label="Damage" value={vi.modules.damage} />
              <Checkbox label="Discoloration" value={vi.modules.discoloration} />
              <Checkbox label="Delamination" value={vi.modules.delamination} />
              <Checkbox label="Soiling" value={vi.modules.soiling} />
              <Results value={vi.modules.results} />
            </View>
          </View>

          {/* Mounting System */}
          <View style={s.bulletRow}>
            <Text style={s.bullet}>❖</Text>
            <View style={s.bulletContent}>
              <Text style={s.bulletLabel}>Visually inspect mounting system components for:</Text>
              <Checkbox label="Damage" value={vi.mounting_system.damage} />
              <Checkbox label="Corrosion" value={vi.mounting_system.corrosion} />
              <Results value={vi.mounting_system.results} />
            </View>
          </View>

          {/* Inverters */}
          <View style={s.bulletRow}>
            <Text style={s.bullet}>❖</Text>
            <View style={s.bulletContent}>
              <Text style={s.bulletLabel}>Inspect inverters for:</Text>
              <Checkbox label="Loose connections" value={vi.inverters.loose_connections} />
              <Checkbox label="Faults" value={vi.inverters.faults} />
              <Results value={vi.inverters.results} />
            </View>
          </View>

          {/* Shading */}
          <View style={s.bulletRow}>
            <Text style={s.bullet}>❖</Text>
            <View style={s.bulletContent}>
              <Text style={s.bulletLabel}>Inspect the array site for shading due to:</Text>
              <Checkbox label="Tree growth" value={vi.shading.tree_growth} />
              <Checkbox label="New construction" value={vi.shading.new_construction} />
              <Results value={vi.shading.results} />
            </View>
          </View>

        </View>
        <Text style={s.pageNum} render={({ pageNumber }) => String(pageNumber)} fixed />
      </Page>

      {/* ── Electrical Analysis ── */}
      <Page size="LETTER" style={s.page}>
        <OliveHeader title={`Electrical Analysis: ${inspectionDate}`} />
        <View style={s.content}>

          {/* Inverter testing */}
          <View style={s.elecSection}>
            <View style={s.bulletRow}>
              <Text style={s.bullet}>❖</Text>
              <View style={s.bulletContent}>
                <Text style={s.elecTitle}>Testing inverters for expected amperage/voltage and fuses</Text>
                <View style={s.elecCheckRow}>
                  <View style={s.checkbox} />
                  <Text style={[s.elecLabel, { fontFamily: "Helvetica-Bold" }]}>Inverter #s - </Text>
                  <Text style={ea.inverter_numbers && ea.inverter_numbers !== "Not visible in provided photos" ? s.elecValue : s.elecValueNone}>
                    {ea.inverter_numbers && ea.inverter_numbers !== "Not visible in provided photos" ? ea.inverter_numbers : "Not visible"}
                  </Text>
                </View>
                {[
                  { label: "Amps", val: ea.amps },
                  { label: "Volts", val: ea.volts },
                  { label: "Fuses", val: ea.fuses },
                ].map(({ label, val }) => (
                  <View key={label} style={s.elecSubRow}>
                    <Text style={s.tickMark}>✓</Text>
                    <Text style={s.elecLabel}>{label} – </Text>
                    <Text style={val && val !== "Not visible in provided photos" ? s.elecValue : s.elecValueNone}>
                      {val && val !== "Not visible in provided photos" ? val : "Not visible"}
                    </Text>
                  </View>
                ))}
                <View style={s.elecResult}>
                  <Text style={s.elecResultLabel}>Result:</Text>
                  <Text style={s.elecResultValue}>{ea.inverter_result || "—"}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* String testing */}
          <View style={s.elecSection}>
            <View style={s.bulletRow}>
              <Text style={s.bullet}>❖</Text>
              <View style={s.bulletContent}>
                <Text style={s.elecTitle}>Testing string-level amperage/voltage</Text>
                <View style={s.elecResult}>
                  <Text style={s.elecResultLabel}>Result:</Text>
                  <Text style={s.elecResultValue}>
                    {ea.string_result && ea.string_result !== "Not visible in provided photos"
                      ? ea.string_result : "Not visible in provided photos"}
                  </Text>
                </View>
                {followUps.length > 0 && (
                  <View style={{ marginTop: 10 }}>
                    {followUps.map((item, i) => (
                      <View key={i} style={s.elecSubRow}>
                        <Text style={s.tickMark}>✓</Text>
                        <Text style={{ fontSize: 10, fontFamily: "Helvetica-Bold", color: C.body, marginRight: 6 }}>
                          Follow up item:
                        </Text>
                        <Text style={[s.elecValue, { flex: 1 }]}>{item}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </View>
          </View>

        </View>
        <Text style={s.pageNum} render={({ pageNumber }) => String(pageNumber)} fixed />
      </Page>

      {/* ── Site Plan ── */}
      <Page size="LETTER" style={s.page}>
        <OliveHeader title="Site Plan" />
        <View style={{ flex: 1, margin: 20, position: "relative" }}>
          {sitePlanPhoto ? (
            <Image src={sitePlanPhoto.dataUri} style={{ width: "100%", flex: 1, objectFit: "contain" }} />
          ) : (
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
              <Text style={{ color: C.muted, fontSize: 12 }}>[No site plan photo provided]</Text>
            </View>
          )}
          {/* System specs overlay */}
          <View style={s.specsBox}>
            <Text style={s.specsTitle}>System consist of:</Text>
            {[
              ["# of Modules", ss.module_count],
              ["Module Watts", ss.module_watts],
              ["# of Inverters", ss.inverter_count],
              ["Inverter KW", ss.inverter_kw],
            ].map(([label, val]) => (
              <Text key={label} style={s.specItem}>
                • {label}: {val || "—"}
              </Text>
            ))}
          </View>
        </View>
        <Text style={s.pageNum} render={({ pageNumber }) => String(pageNumber)} fixed />
      </Page>

      {/* ── Aerial View ── */}
      {aerialPhoto && (
        <Page size="LETTER" style={s.page}>
          <RedHeader title="Aerial View" />
          <View style={{ flex: 1, margin: 20, marginBottom: 50 }}>
            <Image src={aerialPhoto.dataUri} style={{ width: "100%", flex: 1, objectFit: "contain" }} />
          </View>
          <View style={{ paddingHorizontal: 20, paddingBottom: 16 }}>
            <Text style={s.captionLabel}>Description:</Text>
            <Text style={s.captionText}>{aerialPhoto.description || ""}</Text>
          </View>
          <Text style={s.pageNum} render={({ pageNumber }) => String(pageNumber)} fixed />
        </Page>
      )}

      {/* ── Inspection Photo Pages ── */}
      {inspectionPhotos.map((photo, i) => (
        <Page key={i} size="LETTER" style={s.page}>
          <RedHeader title={`${inspectionDate}: Inspection Photos`} />
          <View style={{ flex: 1, margin: 20, marginBottom: 50 }}>
            <Image src={photo.dataUri} style={{ width: "100%", flex: 1, objectFit: "contain" }} />
          </View>
          <View style={{ paddingHorizontal: 20, paddingBottom: 16 }}>
            <Text style={s.captionLabel}>Description:</Text>
            <Text style={s.captionText}>{photo.description || photo.originalName}</Text>
          </View>
          <Text style={s.pageNum} render={({ pageNumber }) => String(pageNumber)} fixed />
        </Page>
      ))}

      {/* ── Thank You ── */}
      <Page size="LETTER" style={s.page}>
        <View style={s.thankPage}>
          <Text style={s.thankTitle}>Thank You</Text>

          <View style={{ flexDirection: "row", alignItems: "flex-end", marginBottom: 4 }}>
            <Text style={[s.coverLogoSun, { fontSize: 28 }]}>Sun</Text>
            <Text style={[s.coverLogoGreen, { fontSize: 28 }]}>Green</Text>
            <Text style={{ fontSize: 12, color: C.accent, marginBottom: 5 }}>®</Text>
          </View>
          <Text style={[s.coverLogoTag, { fontSize: 9, marginBottom: 24 }]}>S Y S T E M S</Text>

          <View style={s.divider} />

          <Text style={s.thankContact}>12731 Ramona Blvd. Ste 208</Text>
          <Text style={s.thankContact}>Irwindale, CA 91706</Text>
          <Text style={s.thankContact}>626.851.0008</Text>
          <Text style={s.thankEmail}>johnhoffman@sungreensystems.com</Text>
          <Text style={s.thankContact}>www.sungreensystems.com</Text>

          <View style={[s.divider, { marginTop: 24 }]} />

          <Text style={s.thankBullet}>▪ California Energy Commission certified solar retailer / contractor / installer</Text>
          <Text style={s.thankBullet}>▪ California Contractor License Number: B 935910</Text>
          <Text style={s.thankBullet}>▪ Bonded and insured with $1 million coverage</Text>
        </View>
      </Page>

    </Document>
  );
}

// ── Public API ──────────────────────────────────────────────────────────────

export async function generatePdf(opts: Props): Promise<Buffer> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const el = React.createElement(SunGreenReport as any, opts) as any;
  return Buffer.from(await renderToBuffer(el));
}
