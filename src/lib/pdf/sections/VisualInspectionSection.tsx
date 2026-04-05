import React from "react";
import { Page, View, Text } from "@react-pdf/renderer";
import { styles, colors } from "../styles";
import type { ClaudeAnalysis } from "@/types/analysis";

const NV = "Not visible in provided photos";

function statusColor(val: string | undefined) {
  if (!val || val === NV) return colors.textLight;
  if (val.toUpperCase() === "NONE") return colors.good;
  return colors.warn;
}

function CheckRow({ label, value }: { label: string; value: string | undefined }) {
  const v = value || NV;
  const color = statusColor(v);
  const isNone = v.toUpperCase() === "NONE";
  const isNV = v === NV;

  return (
    <View style={styles.checkRow}>
      <View style={[styles.checkDot, { backgroundColor: color }]} />
      <View style={{ flex: 1, flexShrink: 1 }}>
        <Text style={{ fontSize: 8, color: colors.textLight, marginBottom: 1 }}>{label}</Text>
        <Text style={[styles.checkText, isNV ? styles.notVisible : {}]}>
          {isNone ? "None observed" : v}
        </Text>
      </View>
    </View>
  );
}

interface Props {
  analysis: ClaudeAnalysis;
  inspectionDate: string;
}

export function VisualInspectionSection({ analysis, inspectionDate }: Props) {
  const vi = analysis.visual_inspection;
  const m = vi?.modules ?? {};
  const mt = vi?.mounting_system ?? {};
  const inv = vi?.inverters ?? {};
  const sh = vi?.shading ?? {};
  const fu = vi?.follow_up_items ?? [];

  return (
    <Page size="LETTER" style={styles.page}>
      <Text style={styles.sectionHeader}>
        Visual Inspection{inspectionDate ? ` — ${inspectionDate}` : ""}
      </Text>

      {/* PV Modules */}
      <View style={styles.sectionBody}>
        <Text style={{ fontSize: 11, fontFamily: "Helvetica-Bold", color: colors.primary, marginBottom: 8 }}>
          PV Modules
        </Text>
        <CheckRow label="Physical Damage" value={m.damage} />
        <CheckRow label="Discoloration" value={m.discoloration} />
        <CheckRow label="Delamination" value={m.delamination} />
        <CheckRow label="Soiling / Dirt" value={m.soiling} />
        {m.results ? (
          <View style={{ backgroundColor: colors.bg, padding: "8 10", borderRadius: 4, marginTop: 6 }}>
            <Text style={{ fontSize: 8, color: colors.textLight, marginBottom: 2 }}>SUMMARY</Text>
            <Text style={{ fontSize: 9 }}>{m.results}</Text>
          </View>
        ) : null}
      </View>

      {/* Mounting System */}
      <View style={styles.sectionBody}>
        <Text style={{ fontSize: 11, fontFamily: "Helvetica-Bold", color: colors.primary, marginBottom: 8 }}>
          Mounting System
        </Text>
        <CheckRow label="Structural Damage" value={mt.damage} />
        <CheckRow label="Corrosion" value={mt.corrosion} />
        {mt.results ? (
          <View style={{ backgroundColor: colors.bg, padding: "8 10", borderRadius: 4, marginTop: 6 }}>
            <Text style={{ fontSize: 8, color: colors.textLight, marginBottom: 2 }}>SUMMARY</Text>
            <Text style={{ fontSize: 9 }}>{mt.results}</Text>
          </View>
        ) : null}
      </View>

      {/* Inverters */}
      <View style={styles.sectionBody}>
        <Text style={{ fontSize: 11, fontFamily: "Helvetica-Bold", color: colors.primary, marginBottom: 8 }}>
          Inverters
        </Text>
        <CheckRow label="Loose Connections" value={inv.loose_connections} />
        <CheckRow label="Fault Codes / Error Lights" value={inv.faults} />
        {inv.results ? (
          <View style={{ backgroundColor: colors.bg, padding: "8 10", borderRadius: 4, marginTop: 6 }}>
            <Text style={{ fontSize: 8, color: colors.textLight, marginBottom: 2 }}>SUMMARY</Text>
            <Text style={{ fontSize: 9 }}>{inv.results}</Text>
          </View>
        ) : null}
      </View>

      {/* Shading */}
      <View style={styles.sectionBody}>
        <Text style={{ fontSize: 11, fontFamily: "Helvetica-Bold", color: colors.primary, marginBottom: 8 }}>
          Shading Assessment
        </Text>
        <CheckRow label="Tree Growth / Obstruction" value={sh.tree_growth} />
        <CheckRow label="New Construction" value={sh.new_construction} />
        {sh.results ? (
          <View style={{ backgroundColor: colors.bg, padding: "8 10", borderRadius: 4, marginTop: 6 }}>
            <Text style={{ fontSize: 8, color: colors.textLight, marginBottom: 2 }}>SUMMARY</Text>
            <Text style={{ fontSize: 9 }}>{sh.results}</Text>
          </View>
        ) : null}
      </View>

      {/* Follow-up Items */}
      {fu.length > 0 ? (
        <View style={{ backgroundColor: "#fef3c7", borderRadius: 6, padding: "10 12", marginTop: 4 }}>
          <Text style={{ fontSize: 9, fontFamily: "Helvetica-Bold", color: "#92400e", marginBottom: 6 }}>
            FOLLOW-UP ITEMS REQUIRED
          </Text>
          {fu.map((item, i) => (
            <View key={i} style={{ flexDirection: "row", marginBottom: 4 }}>
              <Text style={{ fontSize: 9, color: "#92400e", marginRight: 6 }}>•</Text>
              <Text style={{ fontSize: 9, color: "#92400e", flex: 1 }}>{item}</Text>
            </View>
          ))}
        </View>
      ) : null}

      <View style={styles.footer}>
        <Text style={styles.footerText}>Solar Inspection Report</Text>
        <Text style={styles.footerText} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
      </View>
    </Page>
  );
}
