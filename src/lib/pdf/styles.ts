import { StyleSheet } from "@react-pdf/renderer";

export const colors = {
  primary: "#1e3a5f",
  accent: "#f59e0b",
  text: "#1e293b",
  textLight: "#64748b",
  border: "#e2e8f0",
  bg: "#f8fafc",
  good: "#10b981",
  warn: "#f59e0b",
  danger: "#ef4444",
  critical: "#7f1d1d",
};

export const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: colors.text,
    backgroundColor: "#ffffff",
  },
  coverPage: {
    padding: 0,
    fontFamily: "Helvetica",
    backgroundColor: colors.primary,
  },
  coverInner: {
    padding: 50,
    flex: 1,
    justifyContent: "center",
  },
  sectionHeader: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: colors.primary,
    marginBottom: 12,
    paddingBottom: 6,
    borderBottomWidth: 2,
    borderBottomColor: colors.accent,
  },
  label: {
    fontSize: 8,
    color: colors.textLight,
    marginBottom: 2,
  },
  value: {
    fontSize: 10,
    color: colors.text,
    marginBottom: 10,
  },
  row: {
    flexDirection: "row",
    marginBottom: 8,
  },
  col: {
    flex: 1,
    marginRight: 10,
  },
  table: {
    marginBottom: 16,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: colors.primary,
    padding: "6 8",
  },
  tableHeaderCell: {
    color: "#ffffff",
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    flex: 1,
  },
  tableRow: {
    flexDirection: "row",
    padding: "5 8",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tableRowAlt: {
    flexDirection: "row",
    padding: "5 8",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.bg,
  },
  tableCell: {
    fontSize: 9,
    flex: 1,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
  },
  photo: {
    width: "100%",
    maxHeight: 220,
    objectFit: "cover",
    marginBottom: 8,
    borderRadius: 4,
  },
  photoCaption: {
    fontSize: 8,
    color: colors.textLight,
    marginBottom: 16,
    fontStyle: "italic",
  },
  pageNumber: {
    position: "absolute",
    bottom: 20,
    right: 40,
    fontSize: 8,
    color: colors.textLight,
  },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 8,
  },
  footerText: {
    fontSize: 8,
    color: colors.textLight,
  },
  notVisible: {
    color: colors.textLight,
    fontStyle: "italic",
  },
  checkRow: {
    flexDirection: "row",
    marginBottom: 10,
    paddingLeft: 8,
  },
  checkDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 8,
    marginTop: 2,
  },
  checkText: {
    flex: 1,
    fontSize: 9,
  },
  sectionBody: {
    marginBottom: 28,
  },
});
