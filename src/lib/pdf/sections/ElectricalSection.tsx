import React from "react";
import { Page, View, Text } from "@react-pdf/renderer";
import { styles, colors } from "../styles";
import type { ClaudeAnalysis } from "@/types/analysis";

const NV = "Not visible in provided photos";

interface Props {
  analysis: ClaudeAnalysis;
  inspectionDate: string;
}

export function ElectricalSection({ analysis, inspectionDate }: Props) {
  const ea = analysis.electrical_analysis ?? {};
  const specs = analysis.system_specs ?? {};

  const rows = [
    { label: "Inverter Numbers", value: ea.inverter_numbers },
    { label: "Amperage Readings", value: ea.amps },
    { label: "Voltage Readings", value: ea.volts },
    { label: "Fuse Condition", value: ea.fuses },
  ];

  const specRows = [
    { label: "Module Count", value: specs.module_count },
    { label: "Module Wattage", value: specs.module_watts ? `${specs.module_watts}W` : null },
    { label: "Module Brand", value: specs.module_brand },
    { label: "Inverter Count", value: specs.inverter_count },
    { label: "Inverter Capacity", value: specs.inverter_kw ? `${specs.inverter_kw} kW` : null },
    { label: "Inverter Brand", value: specs.inverter_brand },
    { label: "System Voltage", value: specs.inverter_voltage },
  ];

  return (
    <Page size="LETTER" style={styles.page}>
      <Text style={styles.sectionHeader}>
        Electrical Analysis{inspectionDate ? ` — ${inspectionDate}` : ""}
      </Text>

      {/* Electrical readings table */}
      <View style={[styles.sectionBody, styles.table]}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>Measurement</Text>
          <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Reading / Finding</Text>
        </View>
        {rows.map((row, i) => (
          <View key={row.label} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
            <Text style={[styles.tableCell, { flex: 1.5, fontFamily: "Helvetica-Bold" }]}>{row.label}</Text>
            <Text style={[
              styles.tableCell,
              { flex: 2 },
              (!row.value || row.value === NV) ? styles.notVisible : {},
            ]}>
              {row.value || NV}
            </Text>
          </View>
        ))}
      </View>

      {/* Results */}
      <View style={styles.sectionBody}>
        <Text style={{ fontSize: 11, fontFamily: "Helvetica-Bold", color: colors.primary, marginBottom: 8 }}>
          Inverter Assessment
        </Text>
        <View style={{ backgroundColor: colors.bg, padding: "8 10", borderRadius: 4, marginBottom: 12 }}>
          <Text style={[{ fontSize: 9 }, (!ea.inverter_result || ea.inverter_result === NV) ? styles.notVisible : {}]}>
            {ea.inverter_result || NV}
          </Text>
        </View>
        <Text style={{ fontSize: 11, fontFamily: "Helvetica-Bold", color: colors.primary, marginBottom: 8 }}>
          String-Level Assessment
        </Text>
        <View style={{ backgroundColor: colors.bg, padding: "8 10", borderRadius: 4 }}>
          <Text style={[{ fontSize: 9 }, (!ea.string_result || ea.string_result === NV) ? styles.notVisible : {}]}>
            {ea.string_result || NV}
          </Text>
        </View>
      </View>

      {/* System Specs */}
      <Text style={styles.sectionHeader}>System Specifications</Text>
      <View style={[styles.sectionBody, styles.table]}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>Specification</Text>
          <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Value</Text>
        </View>
        {specRows.map((row, i) => (
          <View key={row.label} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
            <Text style={[styles.tableCell, { flex: 1.5, fontFamily: "Helvetica-Bold" }]}>{row.label}</Text>
            <Text style={[
              styles.tableCell,
              { flex: 2 },
              !row.value ? styles.notVisible : {},
            ]}>
              {row.value != null ? String(row.value) : NV}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Solar Inspection Report</Text>
        <Text style={styles.footerText} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
      </View>
    </Page>
  );
}
