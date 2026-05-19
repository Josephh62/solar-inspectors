import React from "react";
import { Document, Page, Text, View, Image, StyleSheet, renderToBuffer } from "@react-pdf/renderer";
import type { Analysis } from "@/lib/claude";

// ── Shared types ────────────────────────────────────────────────────────────

interface PhotoEntry {
  dataUri: string;
  originalName: string;
  description: string | null;
  category: string | null;
}

export interface Props {
  address: string;
  clientName: string;
  inspectorName: string;
  inspectionDate: string;
  analysis: Analysis;
  photos: PhotoEntry[];
}

function routePhotos(photos: PhotoEntry[]) {
  const sitePlan    = photos.find((p) => p.category && ["SITE_PLAN","BLUEPRINT"].includes(p.category.toUpperCase()));
  const aerial      = photos.find((p) => p.category?.toUpperCase() === "AERIAL");
  const inspection  = photos.filter((p) => {
    const cat = p.category?.toUpperCase();
    return !cat || !["SITE_PLAN","BLUEPRINT","AERIAL"].includes(cat);
  });
  return { sitePlan, aerial, inspection };
}

function isBlank(v: string | null | undefined) {
  return !v || v === "NONE" || v === "Not visible in provided photos" || v === "N/A";
}

// ════════════════════════════════════════════════════════════════════════════
// TEMPLATE 1 — SunGreen
// ════════════════════════════════════════════════════════════════════════════

const SG = {
  olive: "#5c6b2e", red: "#8b3028", accent: "#c0392b",
  body: "#1a1a1a", muted: "#555555", white: "#ffffff",
};

const sg = StyleSheet.create({
  page: { fontFamily: "Helvetica", fontSize: 10, color: SG.body, backgroundColor: "#ffffff" },
  accentBar: { height: 8, backgroundColor: SG.accent },
  oliveHeader: { backgroundColor: SG.olive, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 10 },
  redHeader: { backgroundColor: SG.red, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 10 },
  headerTitle: { fontSize: 16, fontFamily: "Helvetica-Bold", color: SG.white },
  headerLogo: { flexDirection: "row", alignItems: "flex-end" },
  logoSun: { fontSize: 13, fontFamily: "Helvetica-Bold", color: SG.accent },
  logoGreen: { fontSize: 13, fontFamily: "Helvetica-Bold", color: SG.olive },
  logoTag: { fontSize: 7, color: "#ccddaa", letterSpacing: 1.5, marginTop: 2 },
  coverBody: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 60, paddingVertical: 40 },
  coverBanner: { backgroundColor: SG.olive, width: "100%", paddingVertical: 28, paddingHorizontal: 20, alignItems: "center", marginBottom: 40, marginTop: 20 },
  coverBannerText: { fontSize: 20, fontFamily: "Helvetica-Bold", color: SG.white, letterSpacing: 1 },
  coverLogoSun: { fontSize: 36, fontFamily: "Helvetica-Bold", color: SG.accent },
  coverLogoGreen: { fontSize: 36, fontFamily: "Helvetica-Bold", color: SG.olive },
  coverLogoTag: { fontSize: 11, color: SG.olive, letterSpacing: 3, marginTop: 4 },
  coverName: { fontSize: 18, color: SG.body, textAlign: "center", marginBottom: 10 },
  coverAddress: { fontSize: 14, color: SG.muted, textAlign: "center" },
  content: { padding: 30, flex: 1 },
  sectionTitle: { fontSize: 12, fontFamily: "Helvetica-Bold", color: SG.body, marginBottom: 10, marginTop: 16 },
  bullet: { fontSize: 11, color: SG.body, marginRight: 6, marginTop: 1 },
  bulletRow: { flexDirection: "row", marginBottom: 16 },
  bulletContent: { flex: 1 },
  bulletLabel: { fontSize: 11, fontFamily: "Helvetica-Bold", color: SG.body, marginBottom: 6 },
  checkRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 5, paddingLeft: 12 },
  checkbox: { width: 10, height: 10, borderWidth: 1, borderColor: SG.body, marginRight: 8, marginTop: 1 },
  checkLabel: { fontSize: 10, color: SG.body, width: 120 },
  checkValue: { fontSize: 10, color: SG.body, flex: 1 },
  checkValueNone: { fontSize: 10, color: SG.muted, flex: 1 },
  resultsRow: { flexDirection: "row", marginTop: 6, paddingLeft: 12, marginBottom: 4 },
  resultsLabel: { fontSize: 10, fontFamily: "Helvetica-Bold", color: SG.body, marginRight: 6 },
  resultsValue: { fontSize: 10, color: SG.body, flex: 1 },
  elecSection: { marginBottom: 20 },
  elecTitle: { fontSize: 11, fontFamily: "Helvetica-Bold", color: SG.body, marginBottom: 10 },
  elecCheckRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 6, paddingLeft: 16 },
  elecSubRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 5, paddingLeft: 32 },
  tickMark: { fontSize: 10, color: SG.olive, marginRight: 6, fontFamily: "Helvetica-Bold" },
  elecLabel: { fontSize: 10, color: SG.body, width: 80 },
  elecValue: { fontSize: 10, color: SG.body, flex: 1 },
  elecValueNone: { fontSize: 10, color: SG.muted, flex: 1 },
  elecResult: { flexDirection: "row", marginTop: 8, paddingLeft: 16, borderTopWidth: 1, borderTopColor: "#dddddd", paddingTop: 6 },
  elecResultLabel: { fontSize: 10, fontFamily: "Helvetica-Bold", color: SG.body, marginRight: 6 },
  elecResultValue: { fontSize: 10, color: SG.body, flex: 1 },
  specsBox: { position: "absolute", bottom: 20, right: 20, width: 180 },
  specsTitle: { fontSize: 10, fontFamily: "Helvetica-Bold", color: SG.body, marginBottom: 6 },
  specItem: { fontSize: 10, color: SG.body, marginBottom: 3 },
  pageNum: { position: "absolute", bottom: 12, right: 20, fontSize: 9, color: SG.muted },
  thankPage: { flex: 1, alignItems: "center", justifyContent: "center", padding: 60 },
  thankTitle: { fontSize: 48, fontFamily: "Helvetica-Bold", color: SG.olive, marginBottom: 40 },
  thankContact: { fontSize: 11, color: SG.muted, textAlign: "center", marginBottom: 6, lineHeight: 1.6 },
  thankEmail: { fontSize: 11, color: "#0066cc", textAlign: "center", marginBottom: 6 },
  thankBullet: { fontSize: 10, color: SG.muted, marginBottom: 4, textAlign: "center" },
  divider: { width: 60, height: 2, backgroundColor: SG.olive, marginVertical: 20 },
});

function SGCheckbox({ label, value }: { label: string; value: string }) {
  const none = isBlank(value);
  return (
    <View style={sg.checkRow}>
      <View style={sg.checkbox} />
      <Text style={sg.checkLabel}>{label} - </Text>
      <Text style={none ? sg.checkValueNone : sg.checkValue}>{none ? "None observed" : value}</Text>
    </View>
  );
}
function SGResults({ value }: { value: string }) {
  return (
    <View style={sg.resultsRow}>
      <Text style={sg.resultsLabel}>Results:</Text>
      <Text style={sg.resultsValue}>{value || "—"}</Text>
    </View>
  );
}
function SGLogoSmall() {
  return (
    <View style={sg.headerLogo}>
      <View>
        <View style={{ flexDirection: "row" }}>
          <Text style={sg.logoSun}>Sun</Text>
          <Text style={sg.logoGreen}>Green</Text>
          <Text style={{ fontSize: 7, color: SG.accent, marginTop: 1 }}>®</Text>
        </View>
        <Text style={sg.logoTag}>S Y S T E M S</Text>
      </View>
    </View>
  );
}
function SGOliveHeader({ title }: { title: string }) {
  return <View style={sg.oliveHeader}><Text style={sg.headerTitle}>{title}</Text><SGLogoSmall /></View>;
}
function SGRedHeader({ title }: { title: string }) {
  return <View style={sg.redHeader}><Text style={sg.headerTitle}>{title}</Text><SGLogoSmall /></View>;
}

function SunGreenReport({ address, clientName, inspectionDate, analysis, photos }: Props) {
  const vi = analysis.visual_inspection;
  const ea = analysis.electrical_analysis;
  const ss = analysis.system_specs;
  const { sitePlan, aerial, inspection } = routePhotos(photos);
  const followUps = Array.isArray(vi.follow_up_items) ? vi.follow_up_items : [];

  return (
    <Document title={`Solar Inspection Report — ${address}`}>
      <Page size="LETTER" style={sg.page}>
        <View style={sg.accentBar} />
        <View style={sg.coverBody}>
          <View style={{ flexDirection: "row", alignItems: "flex-end", marginBottom: 4 }}>
            <Text style={sg.coverLogoSun}>Sun</Text><Text style={sg.coverLogoGreen}>Green</Text>
            <Text style={{ fontSize: 16, color: SG.accent, marginBottom: 6 }}>®</Text>
          </View>
          <Text style={sg.coverLogoTag}>S Y S T E M S</Text>
          <View style={sg.coverBanner}><Text style={sg.coverBannerText}>WE SEE THINGS DIFFERENTLY</Text></View>
          <Text style={sg.coverName}>{clientName || address || "Solar Inspection"}</Text>
          <Text style={sg.coverAddress}>{address || ""}</Text>
        </View>
        <View style={sg.accentBar} />
      </Page>

      <Page size="LETTER" style={sg.page}>
        <SGOliveHeader title={`Visual Inspection: ${inspectionDate}`} />
        <View style={sg.content}>
          {[
            { label: "Visually inspect PV modules for:", fields: [["Damage",vi.modules.damage],["Discoloration",vi.modules.discoloration],["Delamination",vi.modules.delamination],["Soiling",vi.modules.soiling]], results: vi.modules.results },
            { label: "Visually inspect mounting system components for:", fields: [["Damage",vi.mounting_system.damage],["Corrosion",vi.mounting_system.corrosion]], results: vi.mounting_system.results },
            { label: "Inspect inverters for:", fields: [["Loose connections",vi.inverters.loose_connections],["Faults",vi.inverters.faults]], results: vi.inverters.results },
            { label: "Inspect the array site for shading due to:", fields: [["Tree growth",vi.shading.tree_growth],["New construction",vi.shading.new_construction]], results: vi.shading.results },
          ].map(({ label, fields, results }) => (
            <View key={label} style={sg.bulletRow}>
              <Text style={sg.bullet}>❖</Text>
              <View style={sg.bulletContent}>
                <Text style={sg.bulletLabel}>{label}</Text>
                {fields.map(([l, v]) => <SGCheckbox key={l} label={l} value={v} />)}
                <SGResults value={results} />
              </View>
            </View>
          ))}
        </View>
        <Text style={sg.pageNum} render={({ pageNumber }) => String(pageNumber)} fixed />
      </Page>

      <Page size="LETTER" style={sg.page}>
        <SGOliveHeader title={`Electrical Analysis: ${inspectionDate}`} />
        <View style={sg.content}>
          <View style={sg.elecSection}>
            <View style={sg.bulletRow}>
              <Text style={sg.bullet}>❖</Text>
              <View style={sg.bulletContent}>
                <Text style={sg.elecTitle}>Testing inverters for expected amperage/voltage and fuses</Text>
                <View style={sg.elecCheckRow}>
                  <View style={sg.checkbox} />
                  <Text style={[sg.elecLabel, { fontFamily: "Helvetica-Bold" }]}>Inverter #s - </Text>
                  <Text style={isBlank(ea.inverter_numbers) ? sg.elecValueNone : sg.elecValue}>{isBlank(ea.inverter_numbers) ? "Not visible" : ea.inverter_numbers}</Text>
                </View>
                {[["Amps",ea.amps],["Volts",ea.volts],["Fuses",ea.fuses]].map(([l,v]) => (
                  <View key={l} style={sg.elecSubRow}>
                    <Text style={sg.tickMark}>✓</Text>
                    <Text style={sg.elecLabel}>{l} – </Text>
                    <Text style={isBlank(v) ? sg.elecValueNone : sg.elecValue}>{isBlank(v) ? "Not visible" : v}</Text>
                  </View>
                ))}
                <View style={sg.elecResult}>
                  <Text style={sg.elecResultLabel}>Result:</Text>
                  <Text style={sg.elecResultValue}>{ea.inverter_result || "—"}</Text>
                </View>
              </View>
            </View>
          </View>
          <View style={sg.elecSection}>
            <View style={sg.bulletRow}>
              <Text style={sg.bullet}>❖</Text>
              <View style={sg.bulletContent}>
                <Text style={sg.elecTitle}>Testing string-level amperage/voltage</Text>
                <View style={sg.elecResult}>
                  <Text style={sg.elecResultLabel}>Result:</Text>
                  <Text style={sg.elecResultValue}>{isBlank(ea.string_result) ? "Not visible in provided photos" : ea.string_result}</Text>
                </View>
                {followUps.length > 0 && (
                  <View style={{ marginTop: 10 }}>
                    {followUps.map((item, i) => (
                      <View key={i} style={sg.elecSubRow}>
                        <Text style={sg.tickMark}>✓</Text>
                        <Text style={{ fontSize: 10, fontFamily: "Helvetica-Bold", color: SG.body, marginRight: 6 }}>Follow up item:</Text>
                        <Text style={[sg.elecValue, { flex: 1 }]}>{item}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>
        <Text style={sg.pageNum} render={({ pageNumber }) => String(pageNumber)} fixed />
      </Page>

      <Page size="LETTER" style={sg.page}>
        <SGOliveHeader title="Site Plan" />
        <View style={{ flex: 1, margin: 20, position: "relative" }}>
          {sitePlan
            ? <Image src={sitePlan.dataUri} style={{ width: "100%", flex: 1, objectFit: "contain" }} />
            : <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}><Text style={{ color: SG.muted, fontSize: 12 }}>[No site plan provided]</Text></View>}
          <View style={sg.specsBox}>
            <Text style={sg.specsTitle}>System consist of:</Text>
            {[["# of Modules",ss.module_count],["Module Watts",ss.module_watts],["# of Inverters",ss.inverter_count],["Inverter KW",ss.inverter_kw]].map(([l,v]) => (
              <Text key={l} style={sg.specItem}>• {l}: {v || "—"}</Text>
            ))}
          </View>
        </View>
        <Text style={sg.pageNum} render={({ pageNumber }) => String(pageNumber)} fixed />
      </Page>

      {aerial && (
        <Page size="LETTER" style={sg.page}>
          <SGRedHeader title="Aerial View" />
          <View style={{ flex: 1, margin: 20, marginBottom: 50 }}>
            <Image src={aerial.dataUri} style={{ width: "100%", flex: 1, objectFit: "contain" }} />
          </View>
          <View style={{ paddingHorizontal: 20, paddingBottom: 16 }}>
            <Text style={{ fontSize: 10, fontFamily: "Helvetica-Bold", color: SG.body }}>Description:</Text>
            <Text style={{ fontSize: 10, color: SG.body, marginTop: 3 }}>{aerial.description || ""}</Text>
          </View>
          <Text style={sg.pageNum} render={({ pageNumber }) => String(pageNumber)} fixed />
        </Page>
      )}

      {inspection.map((photo, i) => (
        <Page key={i} size="LETTER" style={sg.page}>
          <SGRedHeader title={`${inspectionDate}: Inspection Photos`} />
          <View style={{ flex: 1, margin: 20, marginBottom: 50 }}>
            <Image src={photo.dataUri} style={{ width: "100%", flex: 1, objectFit: "contain" }} />
          </View>
          <View style={{ paddingHorizontal: 20, paddingBottom: 16 }}>
            <Text style={{ fontSize: 10, fontFamily: "Helvetica-Bold", color: SG.body }}>Description:</Text>
            <Text style={{ fontSize: 10, color: SG.body, marginTop: 3 }}>{photo.description || photo.originalName}</Text>
          </View>
          <Text style={sg.pageNum} render={({ pageNumber }) => String(pageNumber)} fixed />
        </Page>
      ))}

      <Page size="LETTER" style={sg.page}>
        <View style={sg.thankPage}>
          <Text style={sg.thankTitle}>Thank You</Text>
          <View style={{ flexDirection: "row", alignItems: "flex-end", marginBottom: 4 }}>
            <Text style={[sg.coverLogoSun, { fontSize: 28 }]}>Sun</Text>
            <Text style={[sg.coverLogoGreen, { fontSize: 28 }]}>Green</Text>
            <Text style={{ fontSize: 12, color: SG.accent, marginBottom: 5 }}>®</Text>
          </View>
          <Text style={[sg.coverLogoTag, { fontSize: 9, marginBottom: 24 }]}>S Y S T E M S</Text>
          <View style={sg.divider} />
          <Text style={sg.thankContact}>12731 Ramona Blvd. Ste 208</Text>
          <Text style={sg.thankContact}>Irwindale, CA 91706</Text>
          <Text style={sg.thankContact}>626.851.0008</Text>
          <Text style={sg.thankEmail}>johnhoffman@sungreensystems.com</Text>
          <Text style={sg.thankContact}>www.sungreensystems.com</Text>
          <View style={[sg.divider, { marginTop: 24 }]} />
          <Text style={sg.thankBullet}>▪ California Energy Commission certified solar retailer / contractor / installer</Text>
          <Text style={sg.thankBullet}>▪ California Contractor License Number: B 935910</Text>
          <Text style={sg.thankBullet}>▪ Bonded and insured with $1 million coverage</Text>
        </View>
      </Page>
    </Document>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// TEMPLATE 2 — AVAX Dark
// ════════════════════════════════════════════════════════════════════════════

const AV = {
  navy: "#060c18", slate: "#94a3b8", white: "#ffffff",
  body: "#111827", muted: "#6b7280", border: "#e5e7eb",
};

const av = StyleSheet.create({
  page: { fontFamily: "Helvetica", fontSize: 10, color: AV.body, backgroundColor: "#ffffff" },
  header: { backgroundColor: AV.navy, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 24, paddingVertical: 14 },
  headerTitle: { fontSize: 14, fontFamily: "Helvetica-Bold", color: AV.white, letterSpacing: 0.5 },
  headerBrand: { fontSize: 18, fontFamily: "Helvetica-Bold", color: AV.white, letterSpacing: 2 },
  headerSub: { fontSize: 7, color: AV.slate, letterSpacing: 3, marginTop: 2, textAlign: "right" },
  coverPage: { flex: 1, backgroundColor: AV.navy },
  coverTop: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 60 },
  coverBrand: { fontSize: 52, fontFamily: "Helvetica-Bold", color: AV.white, letterSpacing: 6, marginBottom: 8 },
  coverTagline: { fontSize: 9, color: AV.slate, letterSpacing: 4, marginBottom: 60 },
  coverDivider: { width: 40, height: 1, backgroundColor: AV.slate, marginBottom: 40 },
  coverAddress: { fontSize: 16, fontFamily: "Helvetica-Bold", color: AV.white, textAlign: "center", marginBottom: 8 },
  coverClient: { fontSize: 12, color: AV.slate, textAlign: "center", marginBottom: 4 },
  coverDate: { fontSize: 10, color: AV.slate, textAlign: "center" },
  coverBottom: { backgroundColor: "#0d1426", paddingVertical: 16, paddingHorizontal: 24, flexDirection: "row", justifyContent: "space-between" },
  coverBottomText: { fontSize: 8, color: AV.slate, letterSpacing: 1 },
  content: { padding: 32, flex: 1 },
  sectionHeader: { backgroundColor: "#f8fafc", borderLeftWidth: 3, borderLeftColor: AV.navy, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 12, marginTop: 16 },
  sectionTitle: { fontSize: 11, fontFamily: "Helvetica-Bold", color: AV.navy },
  row: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: AV.border, paddingVertical: 7, paddingHorizontal: 4 },
  rowLabel: { fontSize: 10, fontFamily: "Helvetica-Bold", color: AV.body, width: 130 },
  rowValue: { fontSize: 10, color: AV.body, flex: 1 },
  rowValueMuted: { fontSize: 10, color: AV.muted, flex: 1, fontStyle: "italic" },
  resultRow: { flexDirection: "row", paddingVertical: 8, paddingHorizontal: 4, marginTop: 4 },
  resultLabel: { fontSize: 10, fontFamily: "Helvetica-Bold", color: AV.navy, width: 130 },
  resultValue: { fontSize: 10, color: AV.body, flex: 1 },
  pageNum: { position: "absolute", bottom: 14, right: 24, fontSize: 8, color: AV.muted },
  photoHeader: { backgroundColor: AV.navy, paddingHorizontal: 24, paddingVertical: 10, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  specsGrid: { position: "absolute", bottom: 20, right: 20, width: 170, backgroundColor: "#f8fafc", borderWidth: 1, borderColor: AV.border, padding: 10 },
  specsTitle: { fontSize: 9, fontFamily: "Helvetica-Bold", color: AV.navy, marginBottom: 6, letterSpacing: 1 },
  specItem: { fontSize: 9, color: AV.body, marginBottom: 4 },
  thankPage: { flex: 1, backgroundColor: AV.navy, alignItems: "center", justifyContent: "center", padding: 60 },
  thankTitle: { fontSize: 42, fontFamily: "Helvetica-Bold", color: AV.white, letterSpacing: 6, marginBottom: 16 },
  thankTagline: { fontSize: 9, color: AV.slate, letterSpacing: 4, marginBottom: 40 },
  thankDivider: { width: 40, height: 1, backgroundColor: AV.slate, marginBottom: 32 },
  thankText: { fontSize: 10, color: AV.slate, textAlign: "center", marginBottom: 6, lineHeight: 1.6 },
});

function AVHeader({ title }: { title: string }) {
  return (
    <View style={av.header}>
      <Text style={av.headerTitle}>{title}</Text>
      <View>
        <Text style={av.headerBrand}>AVAX</Text>
        <Text style={av.headerSub}>INSPECTION</Text>
      </View>
    </View>
  );
}
function AVRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={av.row}>
      <Text style={av.rowLabel}>{label}</Text>
      <Text style={isBlank(value) ? av.rowValueMuted : av.rowValue}>{isBlank(value) ? "None observed" : value}</Text>
    </View>
  );
}

function AvaxReport({ address, clientName, inspectorName, inspectionDate, analysis, photos }: Props) {
  const vi = analysis.visual_inspection;
  const ea = analysis.electrical_analysis;
  const ss = analysis.system_specs;
  const { sitePlan, aerial, inspection } = routePhotos(photos);
  const followUps = Array.isArray(vi.follow_up_items) ? vi.follow_up_items : [];

  return (
    <Document title={`Solar Inspection Report — ${address}`}>

      {/* Cover */}
      <Page size="LETTER" style={av.page}>
        <View style={av.coverPage}>
          <View style={av.coverTop}>
            <Text style={av.coverBrand}>AVAX</Text>
            <Text style={av.coverTagline}>SOLAR INSPECTION REPORT</Text>
            <View style={av.coverDivider} />
            <Text style={av.coverAddress}>{address || "Site Address"}</Text>
            {clientName ? <Text style={av.coverClient}>{clientName}</Text> : null}
            <Text style={av.coverDate}>{inspectionDate}</Text>
          </View>
          <View style={av.coverBottom}>
            <Text style={av.coverBottomText}>PREPARED BY: {inspectorName || "AVAX INSPECTOR"}</Text>
            <Text style={av.coverBottomText}>CONFIDENTIAL</Text>
          </View>
        </View>
      </Page>

      {/* Visual Inspection */}
      <Page size="LETTER" style={av.page}>
        <AVHeader title={`Visual Inspection — ${inspectionDate}`} />
        <View style={av.content}>
          {[
            { title: "PV Modules", rows: [["Damage",vi.modules.damage],["Discoloration",vi.modules.discoloration],["Delamination",vi.modules.delamination],["Soiling",vi.modules.soiling]], result: vi.modules.results },
            { title: "Mounting System", rows: [["Damage",vi.mounting_system.damage],["Corrosion",vi.mounting_system.corrosion]], result: vi.mounting_system.results },
            { title: "Inverters", rows: [["Loose Connections",vi.inverters.loose_connections],["Fault Codes",vi.inverters.faults]], result: vi.inverters.results },
            { title: "Shading", rows: [["Tree Growth",vi.shading.tree_growth],["New Construction",vi.shading.new_construction]], result: vi.shading.results },
          ].map(({ title, rows, result }) => (
            <View key={title}>
              <View style={av.sectionHeader}><Text style={av.sectionTitle}>{title}</Text></View>
              {rows.map(([l,v]) => <AVRow key={l} label={l} value={v} />)}
              <View style={av.resultRow}>
                <Text style={av.resultLabel}>Summary</Text>
                <Text style={av.resultValue}>{result || "—"}</Text>
              </View>
            </View>
          ))}
        </View>
        <Text style={av.pageNum} render={({ pageNumber }) => String(pageNumber)} fixed />
      </Page>

      {/* Electrical */}
      <Page size="LETTER" style={av.page}>
        <AVHeader title={`Electrical Analysis — ${inspectionDate}`} />
        <View style={av.content}>
          <View style={av.sectionHeader}><Text style={av.sectionTitle}>Inverter Testing</Text></View>
          {[["Inverter Numbers",ea.inverter_numbers],["Amps",ea.amps],["Volts",ea.volts],["Fuses",ea.fuses]].map(([l,v]) => <AVRow key={l} label={l} value={v} />)}
          <View style={av.resultRow}>
            <Text style={av.resultLabel}>Inverter Result</Text>
            <Text style={av.resultValue}>{ea.inverter_result || "—"}</Text>
          </View>

          <View style={av.sectionHeader}><Text style={av.sectionTitle}>String Testing</Text></View>
          <View style={av.resultRow}>
            <Text style={av.resultLabel}>String Result</Text>
            <Text style={av.resultValue}>{isBlank(ea.string_result) ? "Not visible in provided photos" : ea.string_result}</Text>
          </View>

          {followUps.length > 0 && (
            <>
              <View style={av.sectionHeader}><Text style={av.sectionTitle}>Follow-Up Items</Text></View>
              {followUps.map((item, i) => (
                <View key={i} style={av.row}>
                  <Text style={av.rowLabel}>Item {i + 1}</Text>
                  <Text style={av.rowValue}>{item}</Text>
                </View>
              ))}
            </>
          )}

          <View style={av.sectionHeader}><Text style={av.sectionTitle}>System Specifications</Text></View>
          {[["Module Count",ss.module_count],["Module Watts",ss.module_watts],["Module Brand",ss.module_brand],["Inverter Count",ss.inverter_count],["Inverter kW",ss.inverter_kw],["Inverter Brand",ss.inverter_brand],["Inverter Voltage",ss.inverter_voltage]].map(([l,v]) => (
            <View key={l} style={av.row}>
              <Text style={av.rowLabel}>{l}</Text>
              <Text style={isBlank(v) ? av.rowValueMuted : av.rowValue}>{isBlank(v) ? "—" : v}</Text>
            </View>
          ))}
        </View>
        <Text style={av.pageNum} render={({ pageNumber }) => String(pageNumber)} fixed />
      </Page>

      {/* Site Plan */}
      <Page size="LETTER" style={av.page}>
        <AVHeader title="Site Plan" />
        <View style={{ flex: 1, margin: 20, position: "relative" }}>
          {sitePlan
            ? <Image src={sitePlan.dataUri} style={{ width: "100%", flex: 1, objectFit: "contain" }} />
            : <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}><Text style={{ color: AV.muted }}>No site plan provided</Text></View>}
          <View style={av.specsGrid}>
            <Text style={av.specsTitle}>SYSTEM SPECS</Text>
            {[["Modules",ss.module_count],["Watts",ss.module_watts],["Inverters",ss.inverter_count],["kW",ss.inverter_kw]].map(([l,v]) => (
              <Text key={l} style={av.specItem}>{l}: {v || "—"}</Text>
            ))}
          </View>
        </View>
        <Text style={av.pageNum} render={({ pageNumber }) => String(pageNumber)} fixed />
      </Page>

      {aerial && (
        <Page size="LETTER" style={av.page}>
          <AVHeader title="Aerial View" />
          <View style={{ flex: 1, margin: 20, marginBottom: 50 }}>
            <Image src={aerial.dataUri} style={{ width: "100%", flex: 1, objectFit: "contain" }} />
          </View>
          <View style={{ paddingHorizontal: 20, paddingBottom: 16 }}>
            <Text style={{ fontSize: 10, fontFamily: "Helvetica-Bold", color: AV.body }}>Description:</Text>
            <Text style={{ fontSize: 10, color: AV.body, marginTop: 3 }}>{aerial.description || ""}</Text>
          </View>
          <Text style={av.pageNum} render={({ pageNumber }) => String(pageNumber)} fixed />
        </Page>
      )}

      {inspection.map((photo, i) => (
        <Page key={i} size="LETTER" style={av.page}>
          <AVHeader title="Inspection Photos" />
          <View style={{ flex: 1, margin: 20, marginBottom: 50 }}>
            <Image src={photo.dataUri} style={{ width: "100%", flex: 1, objectFit: "contain" }} />
          </View>
          <View style={{ paddingHorizontal: 20, paddingBottom: 16 }}>
            <Text style={{ fontSize: 10, fontFamily: "Helvetica-Bold", color: AV.body }}>Description:</Text>
            <Text style={{ fontSize: 10, color: AV.body, marginTop: 3 }}>{photo.description || photo.originalName}</Text>
          </View>
          <Text style={av.pageNum} render={({ pageNumber }) => String(pageNumber)} fixed />
        </Page>
      ))}

      {/* Thank you */}
      <Page size="LETTER" style={av.page}>
        <View style={av.thankPage}>
          <Text style={av.thankTitle}>AVAX</Text>
          <Text style={av.thankTagline}>SOLAR INSPECTION SERVICES</Text>
          <View style={av.thankDivider} />
          <Text style={av.thankText}>Thank you for choosing AVAX.</Text>
          <Text style={av.thankText}>This report was generated for {clientName || address}.</Text>
          <Text style={av.thankText}>Inspector: {inspectorName || "AVAX Inspector"}</Text>
          <Text style={av.thankText}>Date: {inspectionDate}</Text>
        </View>
      </Page>
    </Document>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// TEMPLATE 3 — Clean Pro (neutral, no company branding)
// ════════════════════════════════════════════════════════════════════════════

const CP = {
  blue: "#1d4ed8", lightBlue: "#dbeafe", navy: "#1e3a5f",
  body: "#111827", muted: "#6b7280", border: "#d1d5db", white: "#ffffff",
};

const cp = StyleSheet.create({
  page: { fontFamily: "Helvetica", fontSize: 10, color: CP.body, backgroundColor: "#ffffff" },
  coverPage: { flex: 1 },
  coverStripe: { height: 6, backgroundColor: CP.blue },
  coverBody: { flex: 1, paddingHorizontal: 60, paddingVertical: 50, justifyContent: "center" },
  coverLabel: { fontSize: 9, color: CP.blue, letterSpacing: 3, fontFamily: "Helvetica-Bold", marginBottom: 20 },
  coverTitle: { fontSize: 28, fontFamily: "Helvetica-Bold", color: CP.navy, marginBottom: 10, lineHeight: 1.2 },
  coverAddress: { fontSize: 14, color: CP.body, marginBottom: 6 },
  coverMeta: { fontSize: 10, color: CP.muted, marginBottom: 3 },
  coverDivider: { width: "100%", height: 1, backgroundColor: CP.border, marginVertical: 24 },
  coverInfoGrid: { flexDirection: "row", gap: 40 },
  coverInfoBlock: { flex: 1 },
  coverInfoLabel: { fontSize: 8, color: CP.muted, letterSpacing: 2, fontFamily: "Helvetica-Bold", marginBottom: 4 },
  coverInfoValue: { fontSize: 11, color: CP.body, fontFamily: "Helvetica-Bold" },
  header: { backgroundColor: CP.blue, paddingHorizontal: 24, paddingVertical: 10, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  headerTitle: { fontSize: 13, fontFamily: "Helvetica-Bold", color: CP.white },
  headerRight: { fontSize: 8, color: "#bfdbfe", letterSpacing: 1 },
  content: { padding: 32, flex: 1 },
  sectionLabel: { fontSize: 8, color: CP.blue, letterSpacing: 2, fontFamily: "Helvetica-Bold", marginTop: 20, marginBottom: 8 },
  table: { borderWidth: 1, borderColor: CP.border },
  tableRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: CP.border },
  tableLastRow: { flexDirection: "row" },
  tableCell: { fontSize: 10, color: CP.body, padding: 8, flex: 1 },
  tableCellLabel: { fontSize: 10, fontFamily: "Helvetica-Bold", color: CP.navy, padding: 8, width: 130, backgroundColor: "#f9fafb" },
  tableCellMuted: { fontSize: 10, color: CP.muted, padding: 8, flex: 1, fontStyle: "italic" },
  summaryRow: { flexDirection: "row", backgroundColor: CP.lightBlue },
  summaryCellLabel: { fontSize: 10, fontFamily: "Helvetica-Bold", color: CP.navy, padding: 8, width: 130 },
  summaryCellValue: { fontSize: 10, color: CP.navy, padding: 8, flex: 1 },
  pageNum: { position: "absolute", bottom: 14, right: 24, fontSize: 8, color: CP.muted },
  footer: { borderTopWidth: 1, borderTopColor: CP.border, paddingHorizontal: 24, paddingVertical: 8, flexDirection: "row", justifyContent: "space-between" },
  footerText: { fontSize: 8, color: CP.muted },
  specsBox: { position: "absolute", bottom: 20, right: 20, width: 160, borderWidth: 1, borderColor: CP.border, backgroundColor: CP.white },
  specsHeader: { backgroundColor: CP.blue, paddingVertical: 4, paddingHorizontal: 8 },
  specsHeaderText: { fontSize: 8, fontFamily: "Helvetica-Bold", color: CP.white, letterSpacing: 1 },
  specsBody: { padding: 8 },
  specItem: { fontSize: 9, color: CP.body, marginBottom: 4 },
  thankPage: { flex: 1, padding: 60, alignItems: "center", justifyContent: "center" },
  thankStripe: { height: 4, backgroundColor: CP.blue },
  thankTitle: { fontSize: 36, fontFamily: "Helvetica-Bold", color: CP.navy, marginBottom: 8 },
  thankSub: { fontSize: 10, color: CP.muted, letterSpacing: 2, marginBottom: 40 },
  thankDivider: { width: 60, height: 1, backgroundColor: CP.border, marginBottom: 32 },
  thankText: { fontSize: 10, color: CP.body, textAlign: "center", marginBottom: 6, lineHeight: 1.6 },
});

function CPRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  const none = isBlank(value);
  return (
    <View style={last ? cp.tableLastRow : cp.tableRow}>
      <Text style={cp.tableCellLabel}>{label}</Text>
      <Text style={none ? cp.tableCellMuted : cp.tableCell}>{none ? "None observed" : value}</Text>
    </View>
  );
}

function CleanProReport({ address, clientName, inspectorName, inspectionDate, analysis, photos }: Props) {
  const vi = analysis.visual_inspection;
  const ea = analysis.electrical_analysis;
  const ss = analysis.system_specs;
  const { sitePlan, aerial, inspection } = routePhotos(photos);
  const followUps = Array.isArray(vi.follow_up_items) ? vi.follow_up_items : [];

  const Footer = () => (
    <View style={cp.footer} fixed>
      <Text style={cp.footerText}>Solar Inspection Report — {address}</Text>
      <Text style={cp.footerText} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
    </View>
  );

  return (
    <Document title={`Solar Inspection Report — ${address}`}>

      {/* Cover */}
      <Page size="LETTER" style={cp.page}>
        <View style={cp.coverStripe} />
        <View style={cp.coverBody}>
          <Text style={cp.coverLabel}>SOLAR INSPECTION REPORT</Text>
          <Text style={cp.coverTitle}>{address || "Inspection Site"}</Text>
          <View style={cp.coverDivider} />
          <View style={cp.coverInfoGrid}>
            <View style={cp.coverInfoBlock}>
              <Text style={cp.coverInfoLabel}>CLIENT</Text>
              <Text style={cp.coverInfoValue}>{clientName || "—"}</Text>
            </View>
            <View style={cp.coverInfoBlock}>
              <Text style={cp.coverInfoLabel}>INSPECTOR</Text>
              <Text style={cp.coverInfoValue}>{inspectorName || "—"}</Text>
            </View>
            <View style={cp.coverInfoBlock}>
              <Text style={cp.coverInfoLabel}>DATE</Text>
              <Text style={cp.coverInfoValue}>{inspectionDate}</Text>
            </View>
          </View>
        </View>
        <View style={cp.coverStripe} />
      </Page>

      {/* Visual Inspection */}
      <Page size="LETTER" style={cp.page}>
        <View style={cp.header}>
          <Text style={cp.headerTitle}>Visual Inspection</Text>
          <Text style={cp.headerRight}>{inspectionDate}</Text>
        </View>
        <View style={cp.content}>
          {[
            { label: "PV MODULES", rows: [["Damage",vi.modules.damage],["Discoloration",vi.modules.discoloration],["Delamination",vi.modules.delamination],["Soiling",vi.modules.soiling]], result: vi.modules.results },
            { label: "MOUNTING SYSTEM", rows: [["Damage",vi.mounting_system.damage],["Corrosion",vi.mounting_system.corrosion]], result: vi.mounting_system.results },
            { label: "INVERTERS", rows: [["Loose Connections",vi.inverters.loose_connections],["Fault Codes",vi.inverters.faults]], result: vi.inverters.results },
            { label: "SHADING", rows: [["Tree Growth",vi.shading.tree_growth],["New Construction",vi.shading.new_construction]], result: vi.shading.results },
          ].map(({ label, rows, result }) => (
            <View key={label}>
              <Text style={cp.sectionLabel}>{label}</Text>
              <View style={cp.table}>
                {rows.map(([l,v]) => <CPRow key={l} label={l} value={v} />)}
                <View style={cp.summaryRow}>
                  <Text style={cp.summaryCellLabel}>Summary</Text>
                  <Text style={cp.summaryCellValue}>{result || "—"}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
        <Footer />
      </Page>

      {/* Electrical */}
      <Page size="LETTER" style={cp.page}>
        <View style={cp.header}>
          <Text style={cp.headerTitle}>Electrical Analysis</Text>
          <Text style={cp.headerRight}>{inspectionDate}</Text>
        </View>
        <View style={cp.content}>
          <Text style={cp.sectionLabel}>INVERTER TESTING</Text>
          <View style={cp.table}>
            {[["Inverter Numbers",ea.inverter_numbers],["Amps",ea.amps],["Volts",ea.volts],["Fuses",ea.fuses]].map(([l,v]) => <CPRow key={l} label={l} value={v} />)}
            <View style={cp.summaryRow}>
              <Text style={cp.summaryCellLabel}>Result</Text>
              <Text style={cp.summaryCellValue}>{ea.inverter_result || "—"}</Text>
            </View>
          </View>

          <Text style={cp.sectionLabel}>STRING TESTING</Text>
          <View style={cp.table}>
            <View style={cp.tableLastRow}>
              <Text style={cp.summaryCellLabel}>Result</Text>
              <Text style={cp.summaryCellValue}>{isBlank(ea.string_result) ? "Not visible in provided photos" : ea.string_result}</Text>
            </View>
          </View>

          {followUps.length > 0 && (
            <>
              <Text style={cp.sectionLabel}>FOLLOW-UP ITEMS</Text>
              <View style={cp.table}>
                {followUps.map((item, i) => (
                  <View key={i} style={i === followUps.length - 1 ? cp.tableLastRow : cp.tableRow}>
                    <Text style={cp.tableCellLabel}>Item {i + 1}</Text>
                    <Text style={cp.tableCell}>{item}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          <Text style={cp.sectionLabel}>SYSTEM SPECIFICATIONS</Text>
          <View style={cp.table}>
            {[["Module Count",ss.module_count],["Module Watts",ss.module_watts],["Module Brand",ss.module_brand],["Inverter Count",ss.inverter_count],["Inverter kW",ss.inverter_kw],["Inverter Brand",ss.inverter_brand],["Inverter Voltage",ss.inverter_voltage]].map(([l,v], i, arr) => (
              <View key={l} style={i === arr.length - 1 ? cp.tableLastRow : cp.tableRow}>
                <Text style={cp.tableCellLabel}>{l}</Text>
                <Text style={isBlank(v) ? cp.tableCellMuted : cp.tableCell}>{isBlank(v) ? "—" : v}</Text>
              </View>
            ))}
          </View>
        </View>
        <Footer />
      </Page>

      {/* Site Plan */}
      <Page size="LETTER" style={cp.page}>
        <View style={cp.header}>
          <Text style={cp.headerTitle}>Site Plan</Text>
          <Text style={cp.headerRight}>{inspectionDate}</Text>
        </View>
        <View style={{ flex: 1, margin: 20, position: "relative" }}>
          {sitePlan
            ? <Image src={sitePlan.dataUri} style={{ width: "100%", flex: 1, objectFit: "contain" }} />
            : <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}><Text style={{ color: CP.muted }}>No site plan provided</Text></View>}
          <View style={cp.specsBox}>
            <View style={cp.specsHeader}><Text style={cp.specsHeaderText}>SYSTEM SPECS</Text></View>
            <View style={cp.specsBody}>
              {[["Modules",ss.module_count],["Watts",ss.module_watts],["Inverters",ss.inverter_count],["kW",ss.inverter_kw]].map(([l,v]) => (
                <Text key={l} style={cp.specItem}>{l}: {v || "—"}</Text>
              ))}
            </View>
          </View>
        </View>
        <Footer />
      </Page>

      {aerial && (
        <Page size="LETTER" style={cp.page}>
          <View style={cp.header}><Text style={cp.headerTitle}>Aerial View</Text><Text style={cp.headerRight}>{inspectionDate}</Text></View>
          <View style={{ flex: 1, margin: 20, marginBottom: 50 }}>
            <Image src={aerial.dataUri} style={{ width: "100%", flex: 1, objectFit: "contain" }} />
          </View>
          <View style={{ paddingHorizontal: 20, paddingBottom: 16 }}>
            <Text style={{ fontSize: 10, fontFamily: "Helvetica-Bold", color: CP.body }}>Description:</Text>
            <Text style={{ fontSize: 10, color: CP.body, marginTop: 3 }}>{aerial.description || ""}</Text>
          </View>
          <Footer />
        </Page>
      )}

      {inspection.map((photo, i) => (
        <Page key={i} size="LETTER" style={cp.page}>
          <View style={cp.header}><Text style={cp.headerTitle}>Inspection Photos</Text><Text style={cp.headerRight}>{inspectionDate}</Text></View>
          <View style={{ flex: 1, margin: 20, marginBottom: 50 }}>
            <Image src={photo.dataUri} style={{ width: "100%", flex: 1, objectFit: "contain" }} />
          </View>
          <View style={{ paddingHorizontal: 20, paddingBottom: 16 }}>
            <Text style={{ fontSize: 10, fontFamily: "Helvetica-Bold", color: CP.body }}>Description:</Text>
            <Text style={{ fontSize: 10, color: CP.body, marginTop: 3 }}>{photo.description || photo.originalName}</Text>
          </View>
          <Footer />
        </Page>
      ))}

      <Page size="LETTER" style={cp.page}>
        <View style={cp.coverStripe} />
        <View style={cp.thankPage}>
          <Text style={cp.thankTitle}>Thank You</Text>
          <Text style={cp.thankSub}>SOLAR INSPECTION REPORT</Text>
          <View style={cp.thankDivider} />
          <Text style={cp.thankText}>This report was prepared for {clientName || address}.</Text>
          <Text style={cp.thankText}>Inspector: {inspectorName || "—"}</Text>
          <Text style={cp.thankText}>Inspection Date: {inspectionDate}</Text>
        </View>
        <View style={cp.coverStripe} />
      </Page>
    </Document>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// Public API
// ════════════════════════════════════════════════════════════════════════════

export type TemplateId = "sungreen" | "avax" | "cleanpro";

export async function generatePdf(opts: Props, template: TemplateId = "sungreen"): Promise<Buffer> {
  const components: Record<TemplateId, React.FC<Props>> = {
    sungreen: SunGreenReport,
    avax: AvaxReport,
    cleanpro: CleanProReport,
  };
  const Component = components[template] ?? SunGreenReport;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return Buffer.from(await renderToBuffer(React.createElement(Component as any, opts) as any));
}
