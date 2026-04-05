"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Nav } from "@/components/Nav";
import { toast } from "sonner";
import { Loader2, ArrowLeft, ChevronRight, Info, Plus, X } from "lucide-react";
import Link from "next/link";
import type { ClaudeAnalysis } from "@/types/analysis";

const NV = "Not visible in provided photos";

function Field({
  label,
  value,
  onChange,
  multiline = false,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  hint?: string;
}) {
  const isNV = value === NV || !value;
  return (
    <div className="mb-4">
      <label className="block text-xs text-slate-400 mb-1 font-medium">{label}</label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className={`w-full bg-slate-800 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 resize-none transition-colors ${
            isNV ? "border-slate-700 text-slate-500 italic" : "border-slate-600 text-white"
          }`}
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full bg-slate-800 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors ${
            isNV ? "border-slate-700 text-slate-500 italic" : "border-slate-600 text-white"
          }`}
        />
      )}
      {hint && <p className="text-xs text-slate-500 mt-1">{hint}</p>}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-4">
      <h2 className="text-white font-semibold mb-4 text-base">{title}</h2>
      {children}
    </div>
  );
}

const ISSUE_CATEGORIES = [
  "CRACK", "PHYSICAL_DAMAGE", "DISCOLORATION", "SHADING",
  "HOTSPOT", "DELAMINATION", "SOILING", "MOUNTING", "ELECTRICAL", "OTHER"
];
const SEVERITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
const SEVERITY_COLORS: Record<string, string> = {
  LOW: "bg-green-900/40 text-green-400 border-green-800",
  MEDIUM: "bg-yellow-900/40 text-yellow-400 border-yellow-800",
  HIGH: "bg-orange-900/40 text-orange-400 border-orange-800",
  CRITICAL: "bg-red-900/40 text-red-400 border-red-800",
};

interface IssueRow {
  id: string;
  severity: string;
  category: string;
  description: string;
  notes: string;
}

export default function ReviewPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [analysis, setAnalysis] = useState<ClaudeAnalysis | null>(null);
  const [issues, setIssues] = useState<IssueRow[]>([]);
  const [confidence, setConfidence] = useState<string>("partial");

  useEffect(() => {
    fetch(`/api/jobs/${jobId}`)
      .then((r) => r.json())
      .then((data) => {
        const a = data.job?.analysis?.reviewedData as ClaudeAnalysis;
        if (a) {
          setAnalysis(a);
          setConfidence(a.confidence || "partial");
          // Load existing issues from DB
          if (data.job?.analysis?.issues?.length) {
            setIssues(
              data.job.analysis.issues.map((i: IssueRow & { id: string }) => ({
                id: i.id,
                severity: i.severity,
                category: i.category,
                description: i.description,
                notes: i.notes || "",
              }))
            );
          }
        }
      })
      .finally(() => setLoading(false));
  }, [jobId]);

  const setField = (path: string[], value: string) => {
    setAnalysis((prev) => {
      if (!prev) return prev;
      const updated = JSON.parse(JSON.stringify(prev)) as ClaudeAnalysis;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let obj: any = updated;
      for (let i = 0; i < path.length - 1; i++) obj = obj[path[i]];
      obj[path[path.length - 1]] = value;
      return updated;
    });
  };

  const addIssue = () => {
    setIssues((prev) => [
      ...prev,
      { id: `new-${Date.now()}`, severity: "MEDIUM", category: "OTHER", description: "", notes: "" },
    ]);
  };

  const removeIssue = (id: string) => setIssues((prev) => prev.filter((i) => i.id !== id));

  const updateIssue = (id: string, field: keyof IssueRow, value: string) => {
    setIssues((prev) => prev.map((i) => (i.id === id ? { ...i, [field]: value } : i)));
  };

  const handleSave = async () => {
    if (!analysis) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/jobs/${jobId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewedData: analysis,
          issues: issues.map((i) => ({ ...i, photoIds: "", resolved: false })),
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      toast.success("Review saved");
      router.push(`/jobs/${jobId}/report`);
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !analysis) {
    return (
      <div className="min-h-screen flex flex-col">
        <Nav />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
        </div>
      </div>
    );
  }

  const vi = analysis.visual_inspection ?? {} as ClaudeAnalysis["visual_inspection"];
  const m = vi.modules ?? {} as ClaudeAnalysis["visual_inspection"]["modules"];
  const mt = vi.mounting_system ?? {} as ClaudeAnalysis["visual_inspection"]["mounting_system"];
  const inv = vi.inverters ?? {} as ClaudeAnalysis["visual_inspection"]["inverters"];
  const sh = vi.shading ?? {} as ClaudeAnalysis["visual_inspection"]["shading"];
  const ea = analysis.electrical_analysis ?? {} as ClaudeAnalysis["electrical_analysis"];
  const sp = analysis.system_specs ?? {} as ClaudeAnalysis["system_specs"];

  return (
    <div className="min-h-screen flex flex-col">
      <Nav />

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8">
        <Link
          href={`/jobs/${jobId}`}
          className="flex items-center gap-1 text-slate-400 hover:text-slate-200 text-sm mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to job
        </Link>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Review Extracted Data</h1>
          <p className="text-slate-400 text-sm mt-1">
            Verify and edit what Claude found. Greyed-out fields were not visible in photos.
          </p>
        </div>

        {/* Confidence banner */}
        {confidence === "partial" && (
          <div className="bg-amber-900/30 border border-amber-800 rounded-xl p-3 mb-4 flex gap-2">
            <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-amber-300 text-sm">
              Some data was not visible in the photos and shows as grey. These fields contain "Not visible in provided photos" — update them manually if you have the information.
            </p>
          </div>
        )}

        {/* PV Modules */}
        <Section title="PV Modules">
          <Field label="Physical Damage" value={m.damage || NV} onChange={(v) => setField(["visual_inspection","modules","damage"], v)} />
          <Field label="Discoloration" value={m.discoloration || NV} onChange={(v) => setField(["visual_inspection","modules","discoloration"], v)} />
          <Field label="Delamination" value={m.delamination || NV} onChange={(v) => setField(["visual_inspection","modules","delamination"], v)} />
          <Field label="Soiling" value={m.soiling || NV} onChange={(v) => setField(["visual_inspection","modules","soiling"], v)} />
          <Field label="Summary" value={m.results || NV} onChange={(v) => setField(["visual_inspection","modules","results"], v)} multiline />
        </Section>

        {/* Mounting System */}
        <Section title="Mounting System">
          <Field label="Structural Damage" value={mt.damage || NV} onChange={(v) => setField(["visual_inspection","mounting_system","damage"], v)} />
          <Field label="Corrosion" value={mt.corrosion || NV} onChange={(v) => setField(["visual_inspection","mounting_system","corrosion"], v)} />
          <Field label="Summary" value={mt.results || NV} onChange={(v) => setField(["visual_inspection","mounting_system","results"], v)} multiline />
        </Section>

        {/* Inverters */}
        <Section title="Inverters">
          <Field label="Loose Connections" value={inv.loose_connections || NV} onChange={(v) => setField(["visual_inspection","inverters","loose_connections"], v)} />
          <Field label="Faults / Error Codes" value={inv.faults || NV} onChange={(v) => setField(["visual_inspection","inverters","faults"], v)} />
          <Field label="Summary" value={inv.results || NV} onChange={(v) => setField(["visual_inspection","inverters","results"], v)} multiline />
        </Section>

        {/* Shading */}
        <Section title="Shading">
          <Field label="Tree Growth" value={sh.tree_growth || NV} onChange={(v) => setField(["visual_inspection","shading","tree_growth"], v)} />
          <Field label="New Construction" value={sh.new_construction || NV} onChange={(v) => setField(["visual_inspection","shading","new_construction"], v)} />
          <Field label="Summary" value={sh.results || NV} onChange={(v) => setField(["visual_inspection","shading","results"], v)} multiline />
        </Section>

        {/* Electrical */}
        <Section title="Electrical Analysis">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Inverter Numbers" value={ea.inverter_numbers || NV} onChange={(v) => setField(["electrical_analysis","inverter_numbers"], v)} />
            <Field label="Fuses" value={ea.fuses || NV} onChange={(v) => setField(["electrical_analysis","fuses"], v)} />
            <Field label="Amperage" value={ea.amps || NV} onChange={(v) => setField(["electrical_analysis","amps"], v)} />
            <Field label="Voltage" value={ea.volts || NV} onChange={(v) => setField(["electrical_analysis","volts"], v)} />
          </div>
          <Field label="Inverter Result" value={ea.inverter_result || NV} onChange={(v) => setField(["electrical_analysis","inverter_result"], v)} multiline />
          <Field label="String Result" value={ea.string_result || NV} onChange={(v) => setField(["electrical_analysis","string_result"], v)} multiline />
        </Section>

        {/* System Specs */}
        <Section title="System Specifications">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Module Count" value={sp.module_count != null ? String(sp.module_count) : NV} onChange={(v) => setField(["system_specs","module_count"], v)} />
            <Field label="Module Watts" value={sp.module_watts != null ? String(sp.module_watts) : NV} onChange={(v) => setField(["system_specs","module_watts"], v)} />
            <Field label="Module Brand" value={sp.module_brand || NV} onChange={(v) => setField(["system_specs","module_brand"], v)} />
            <Field label="Inverter Count" value={sp.inverter_count != null ? String(sp.inverter_count) : NV} onChange={(v) => setField(["system_specs","inverter_count"], v)} />
            <Field label="Inverter kW" value={sp.inverter_kw != null ? String(sp.inverter_kw) : NV} onChange={(v) => setField(["system_specs","inverter_kw"], v)} />
            <Field label="Inverter Brand" value={sp.inverter_brand || NV} onChange={(v) => setField(["system_specs","inverter_brand"], v)} />
            <Field label="System Voltage" value={sp.inverter_voltage || NV} onChange={(v) => setField(["system_specs","inverter_voltage"], v)} />
          </div>
        </Section>

        {/* Issue Log */}
        <Section title="Issue Log">
          {issues.length === 0 ? (
            <p className="text-slate-500 text-sm mb-3">No issues logged. Add any defects found.</p>
          ) : (
            <div className="space-y-3 mb-4">
              {issues.map((issue) => (
                <div key={issue.id} className="bg-slate-800 rounded-lg p-3 border border-slate-700">
                  <div className="flex items-center gap-2 mb-3">
                    <select
                      value={issue.severity}
                      onChange={(e) => updateIssue(issue.id, "severity", e.target.value)}
                      className={`text-xs px-2 py-1 rounded-full border font-medium bg-transparent ${SEVERITY_COLORS[issue.severity] || ""}`}
                    >
                      {SEVERITIES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <select
                      value={issue.category}
                      onChange={(e) => updateIssue(issue.id, "category", e.target.value)}
                      className="flex-1 bg-slate-700 border border-slate-600 rounded-md px-2 py-1 text-xs text-white focus:outline-none"
                    >
                      {ISSUE_CATEGORIES.map((c) => <option key={c} value={c}>{c.replace(/_/g, " ")}</option>)}
                    </select>
                    <button
                      onClick={() => removeIssue(issue.id)}
                      className="text-slate-500 hover:text-red-400 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <textarea
                    value={issue.description}
                    onChange={(e) => updateIssue(issue.id, "description", e.target.value)}
                    placeholder="Describe the issue..."
                    rows={2}
                    className="w-full bg-slate-700 border border-slate-600 rounded-md px-2 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500 resize-none"
                  />
                  <input
                    value={issue.notes}
                    onChange={(e) => updateIssue(issue.id, "notes", e.target.value)}
                    placeholder="Inspector notes (optional)"
                    className="w-full mt-2 bg-slate-700 border border-slate-600 rounded-md px-2 py-1.5 text-sm text-slate-300 focus:outline-none focus:border-blue-500"
                  />
                </div>
              ))}
            </div>
          )}
          <button
            onClick={addIssue}
            className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Issue
          </button>
        </Section>

        {/* Save + Continue */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 text-white py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <ChevronRight className="w-5 h-5" />}
          {saving ? "Saving..." : "Save & Generate Report"}
        </button>
      </main>
    </div>
  );
}
