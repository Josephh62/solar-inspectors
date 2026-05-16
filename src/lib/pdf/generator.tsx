import React from "react";
import { Document, Page, Text, View, Image, StyleSheet, renderToBuffer } from "@react-pdf/renderer";
import type { Analysis } from "@/lib/claude";

const C = { blue: "#1e3a5f", amber: "#f59e0b", text: "#1e293b", muted: "#64748b", border: "#e2e8f0", bg: "#f8fafc" };

const s = StyleSheet.create({
  page: { padding: 40, fontFamily: "Helvetica", fontSize: 10, color: C.text },
  cover: { padding: 50, backgroundColor: C.blue, flex: 1, justifyContent: "center" },
  h1: { fontSize: 28, fontFamily: "Helvetica-Bold", color: "#fff", marginBottom: 8 },
  h2: { fontSize: 14, fontFamily: "Helvetica-Bold", color: C.blue, marginBottom: 10, paddingBottom: 4, borderBottomWidth: 2, borderBottomColor: C.amber },
  label: { fontSize: 8, color: C.muted, marginBottom: 2 },
  value: { fontSize: 10, color: C.text, marginBottom: 8 },
  coverLabel: { fontSize: 11, color: "#94a3b8", marginBottom: 4 },
  coverValue: { fontSize: 13, color: "#fff", marginBottom: 16 },
  row: { flexDirection: "row", marginBottom: 8 },
  col: { flex: 1, marginRight: 12 },
  section: { marginBottom: 24 },
  tableHead: { flexDirection: "row", backgroundColor: C.blue, padding: "6 8" },
  tableHeadCell: { color: "#fff", fontSize: 9, fontFamily: "Helvetica-Bold", flex: 1 },
  tableRow: { flexDirection: "row", padding: "5 8", borderBottomWidth: 1, borderBottomColor: C.border },
  tableRowAlt: { flexDirection: "row", padding: "5 8", borderBottomWidth: 1, borderBottomColor: C.border, backgroundColor: C.bg },
  cell: { fontSize: 9, flex: 1 },
  check: { flexDirection: "row", marginBottom: 8, paddingLeft: 8 },
  dot: { width: 6, height: 6, borderRadius: 3, marginRight: 8, marginTop: 2 },
  checkText: { flex: 1, fontSize: 9 },
  photo: { width: "100%", maxHeight: 200, objectFit: "cover", marginBottom: 4, borderRadius: 2 },
  caption: { fontSize: 8, color: C.muted, marginBottom: 12, fontStyle: "italic" },
  footer: { position: "absolute", bottom: 20, left: 40, right: 40, flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: C.border, paddingTop: 6 },
  footerText: { fontSize: 8, color: C.muted },
  pageNum: { position: "absolute", bottom: 20, right: 40, fontSize: 8, color: C.muted },
  none: { color: C.muted, fontStyle: "italic" },
});

function none(v: string) { return v === "NONE" || v === "Not visible in provided photos"; }
function dot(v: string) { return none(v) ? "#10b981" : "#ef4444"; }

function Footer({ address }: { address: string }) {
  return (
    <View style={s.footer} fixed>
      <Text style={s.footerText}>Solar Inspection Report — {address || "Unknown Address"}</Text>
      <Text style={s.footerText} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
    </View>
  );
}

function CheckRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.check}>
      <View style={[s.dot, { backgroundColor: dot(value) }]} />
      <View style={{ flex: 1 }}>
        <Text style={[s.checkText, { fontFamily: "Helvetica-Bold", marginBottom: 2 }]}>{label}</Text>
        <Text style={[s.checkText, none(value) ? s.none : {}]}>{none(value) ? "None observed" : value}</Text>
      </View>
    </View>
  );
}

function SpecRow({ label, value, alt }: { label: string; value: string | null; alt?: boolean }) {
  return (
    <View style={alt ? s.tableRowAlt : s.tableRow}>
      <Text style={[s.cell, { fontFamily: "Helvetica-Bold" }]}>{label}</Text>
      <Text style={[s.cell, !value ? s.none : {}]}>{value || "Not visible"}</Text>
    </View>
  );
}

interface Props {
  address: string; clientName: string; inspectorName: string; inspectionDate: string;
  analysis: Analysis;
  photos: Array<{ dataUri: string; originalName: string; description: string | null; category: string | null }>;
}

function ReportDoc({ address, clientName, inspectorName, inspectionDate, analysis, photos }: Props) {
  const vi = analysis.visual_inspection;
  const ea = analysis.electrical_analysis;
  const ss = analysis.system_specs;

  return (
    <Document title={`Solar Inspection — ${address}`} author={inspectorName || "Inspector"}>

      {/* Cover */}
      <Page size="LETTER" style={{ fontFamily: "Helvetica" }}>
        <View style={s.cover}>
          <Text style={{ fontSize: 11, color: "#94a3b8", marginBottom: 16, letterSpacing: 2 }}>SOLAR INSPECTION REPORT</Text>
          <Text style={s.h1}>{address || "Solar Installation"}</Text>
          <View style={{ marginTop: 32 }}>
            <Text style={s.coverLabel}>Client</Text>
            <Text style={s.coverValue}>{clientName || "—"}</Text>
            <Text style={s.coverLabel}>Inspector</Text>
            <Text style={s.coverValue}>{inspectorName || "—"}</Text>
            <Text style={s.coverLabel}>Inspection Date</Text>
            <Text style={s.coverValue}>{inspectionDate}</Text>
            <Text style={s.coverLabel}>Confidence</Text>
            <Text style={s.coverValue}>{analysis.confidence}</Text>
          </View>
        </View>
      </Page>

      {/* Visual Inspection */}
      <Page size="LETTER" style={s.page}>
        <Text style={s.h2}>Visual Inspection</Text>

        <View style={s.section}>
          <Text style={[s.h2, { fontSize: 11, marginBottom: 8 }]}>PV Modules</Text>
          <CheckRow label="Physical Damage" value={vi.modules.damage} />
          <CheckRow label="Discoloration" value={vi.modules.discoloration} />
          <CheckRow label="Delamination" value={vi.modules.delamination} />
          <CheckRow label="Soiling" value={vi.modules.soiling} />
          <View style={{ marginTop: 4, marginBottom: 8, paddingLeft: 8 }}>
            <Text style={s.label}>Summary</Text>
            <Text style={s.value}>{vi.modules.results}</Text>
          </View>
        </View>

        <View style={s.section}>
          <Text style={[s.h2, { fontSize: 11, marginBottom: 8 }]}>Mounting System</Text>
          <CheckRow label="Physical Damage" value={vi.mounting_system.damage} />
          <CheckRow label="Corrosion" value={vi.mounting_system.corrosion} />
          <View style={{ marginTop: 4, marginBottom: 8, paddingLeft: 8 }}>
            <Text style={s.label}>Summary</Text>
            <Text style={s.value}>{vi.mounting_system.results}</Text>
          </View>
        </View>

        <View style={s.section}>
          <Text style={[s.h2, { fontSize: 11, marginBottom: 8 }]}>Inverters</Text>
          <CheckRow label="Loose Connections" value={vi.inverters.loose_connections} />
          <CheckRow label="Fault Codes" value={vi.inverters.faults} />
          <View style={{ marginTop: 4, marginBottom: 8, paddingLeft: 8 }}>
            <Text style={s.label}>Summary</Text>
            <Text style={s.value}>{vi.inverters.results}</Text>
          </View>
        </View>

        <View style={s.section}>
          <Text style={[s.h2, { fontSize: 11, marginBottom: 8 }]}>Shading</Text>
          <CheckRow label="Tree Growth" value={vi.shading.tree_growth} />
          <CheckRow label="New Construction" value={vi.shading.new_construction} />
          <View style={{ marginTop: 4, marginBottom: 8, paddingLeft: 8 }}>
            <Text style={s.label}>Summary</Text>
            <Text style={s.value}>{vi.shading.results}</Text>
          </View>
        </View>

        {vi.follow_up_items.length > 0 && (
          <View style={s.section}>
            <Text style={[s.h2, { fontSize: 11, marginBottom: 8 }]}>Follow-up Items</Text>
            {vi.follow_up_items.map((item, i) => (
              <View key={i} style={s.check}>
                <View style={[s.dot, { backgroundColor: C.amber }]} />
                <Text style={s.checkText}>{item}</Text>
              </View>
            ))}
          </View>
        )}
        <Footer address={address} />
      </Page>

      {/* Electrical Analysis */}
      <Page size="LETTER" style={s.page}>
        <Text style={s.h2}>Electrical Analysis</Text>

        <View style={s.section}>
          <View style={s.tableHead}>
            <Text style={s.tableHeadCell}>Parameter</Text>
            <Text style={s.tableHeadCell}>Reading</Text>
          </View>
          {[
            ["Inverter Numbers", ea.inverter_numbers],
            ["Amperage", ea.amps],
            ["Voltage", ea.volts],
            ["Fuses", ea.fuses],
          ].map(([label, val], i) => (
            <View key={label} style={i % 2 === 1 ? s.tableRowAlt : s.tableRow}>
              <Text style={[s.cell, { fontFamily: "Helvetica-Bold" }]}>{label}</Text>
              <Text style={[s.cell, none(val) ? s.none : {}]}>{none(val) ? "Not visible" : val}</Text>
            </View>
          ))}
        </View>

        <View style={s.section}>
          <Text style={s.label}>Inverter Assessment</Text>
          <Text style={s.value}>{ea.inverter_result}</Text>
          <Text style={s.label}>String Assessment</Text>
          <Text style={[s.value, none(ea.string_result) ? s.none : {}]}>
            {none(ea.string_result) ? "Not visible in provided photos" : ea.string_result}
          </Text>
        </View>

        <Text style={s.h2}>System Specifications</Text>
        <View style={s.section}>
          <View style={s.tableHead}>
            <Text style={s.tableHeadCell}>Specification</Text>
            <Text style={s.tableHeadCell}>Value</Text>
          </View>
          <SpecRow label="Module Count" value={ss.module_count} />
          <SpecRow label="Module Wattage" value={ss.module_watts} alt />
          <SpecRow label="Module Brand" value={ss.module_brand} />
          <SpecRow label="Inverter Count" value={ss.inverter_count} alt />
          <SpecRow label="Inverter kW" value={ss.inverter_kw} />
          <SpecRow label="Inverter Brand" value={ss.inverter_brand} alt />
          <SpecRow label="Inverter Voltage" value={ss.inverter_voltage} />
        </View>
        <Footer address={address} />
      </Page>

      {/* Photo Gallery */}
      {photos.length > 0 && (
        <Page size="LETTER" style={s.page}>
          <Text style={s.h2}>Photo Documentation</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {photos.map((p, i) => (
              <View key={i} style={{ width: "48%" }}>
                <Image src={p.dataUri} style={s.photo} />
                <Text style={s.caption}>
                  {p.category ? `[${p.category.toUpperCase()}] ` : ""}{p.description || p.originalName}
                </Text>
              </View>
            ))}
          </View>
          <Footer address={address} />
        </Page>
      )}
    </Document>
  );
}

export async function generatePdf(opts: Props): Promise<Buffer> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const el = React.createElement(ReportDoc as any, opts) as any;
  return Buffer.from(await renderToBuffer(el));
}
