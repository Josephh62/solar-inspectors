"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FileDown, Loader2, ChevronDown, ChevronUp, Pencil, Check, X, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AvaxLogo } from "@/components/AvaxLogo";

interface Analysis {
  project_name: string | null;
  project_address: string | null;
  inspection_date: string | null;
  confidence: string;
  visual_inspection: {
    modules: { damage: string; discoloration: string; delamination: string; soiling: string; results: string };
    mounting_system: { damage: string; corrosion: string; results: string };
    inverters: { loose_connections: string; faults: string; results: string };
    shading: { tree_growth: string; new_construction: string; results: string };
    follow_up_items: string[];
  };
  electrical_analysis: { inverter_numbers: string; amps: string; volts: string; fuses: string; inverter_result: string; string_result: string };
  system_specs: { module_count: string | null; module_watts: string | null; module_brand: string | null; inverter_count: string | null; inverter_kw: string | null; inverter_brand: string | null; inverter_voltage: string | null };
}

interface Job {
  id: string; address: string | null; clientName: string | null; status: string;
  analysis: { reviewedData: Analysis } | null;
}

// ── Editable row ─────────────────────────────────────────────────────────────

function EditableRow({
  label, value, editing, onChange,
}: {
  label: string; value: string | null; editing: boolean; onChange: (v: string) => void;
}) {
  const none = !value || value === "NONE" || value === "Not visible in provided photos";
  return (
    <div className="flex gap-4 py-3 border-b border-white/6 last:border-0 items-start group">
      <span className="text-slate-500 text-sm w-44 shrink-0 pt-0.5 font-medium">{label}</span>
      {editing ? (
        <textarea
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          rows={2}
          className="flex-1 text-sm bg-slate-800/80 border border-white/15 rounded-lg px-3 py-2 text-white
                     resize-none focus:outline-none focus:border-white/35 focus:bg-slate-800
                     transition-all duration-150 placeholder-slate-600"
          placeholder="Enter value…"
        />
      ) : (
        <span className={`text-sm flex-1 pt-0.5 leading-relaxed ${none ? "text-slate-600 italic" : "text-white"}`}>
          {none ? "—" : value}
        </span>
      )}
    </div>
  );
}

// ── Collapsible section ───────────────────────────────────────────────────────

function Section({
  title, children, defaultOpen = true,
}: {
  title: string; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-slate-900/50 border border-white/8 rounded-2xl overflow-hidden
                    transition-all duration-200 hover:border-white/12">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-5 hover:bg-white/3 transition-colors duration-150"
      >
        <h2 className="font-semibold text-base tracking-tight">{title}</h2>
        {open
          ? <ChevronUp className="w-4 h-4 text-slate-500" />
          : <ChevronDown className="w-4 h-4 text-slate-500" />}
      </button>
      {open && <div className="px-6 pb-5">{children}</div>}
    </div>
  );
}

// ── Subheading ────────────────────────────────────────────────────────────────

function Sub({ label }: { label: string }) {
  return (
    <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-[0.18em] mb-3 mt-5 first:mt-1">
      {label}
    </p>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ReviewPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const [job, setJob] = useState<Job | null>(null);
  const [generating, setGenerating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<Analysis | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/jobs/${jobId}`);
    if (res.ok) setJob((await res.json()).job);
  }, [jobId]);

  useEffect(() => { load(); }, [load]);

  // ── Edit helpers ──────────────────────────────────────────────────────────

  function startEdit() {
    const current = job?.analysis?.reviewedData;
    if (!current) return;
    setDraft(JSON.parse(JSON.stringify(current))); // deep clone
    setEditing(true);
  }

  function cancelEdit() {
    setDraft(null);
    setEditing(false);
  }

  async function saveEdit() {
    if (!draft) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/jobs/${jobId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewedData: draft }),
      });
      if (res.ok) {
        await load();
        setEditing(false);
        setDraft(null);
        toast.success("Changes saved");
      } else {
        toast.error("Failed to save");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setSaving(false);
    }
  }

  // Typed path helpers so TypeScript doesn't complain
  function setVi<K extends keyof Analysis["visual_inspection"]["modules"]>(
    section: "modules", field: K, val: string
  ): void;
  function setVi<K extends keyof Analysis["visual_inspection"]["mounting_system"]>(
    section: "mounting_system", field: K, val: string
  ): void;
  function setVi<K extends keyof Analysis["visual_inspection"]["inverters"]>(
    section: "inverters", field: K, val: string
  ): void;
  function setVi<K extends keyof Analysis["visual_inspection"]["shading"]>(
    section: "shading", field: K, val: string
  ): void;
  function setVi(section: string, field: string, val: string) {
    if (!draft) return;
    setDraft({
      ...draft,
      visual_inspection: {
        ...draft.visual_inspection,
        [section]: { ...(draft.visual_inspection as Record<string, unknown>)[section] as object, [field]: val },
      },
    });
  }

  function setEa(field: keyof Analysis["electrical_analysis"], val: string) {
    if (!draft) return;
    setDraft({ ...draft, electrical_analysis: { ...draft.electrical_analysis, [field]: val } });
  }

  function setSs(field: keyof Analysis["system_specs"], val: string) {
    if (!draft) return;
    setDraft({ ...draft, system_specs: { ...draft.system_specs, [field]: val } });
  }

  function setFollowUp(i: number, val: string) {
    if (!draft) return;
    const items = [...draft.visual_inspection.follow_up_items];
    items[i] = val;
    setDraft({ ...draft, visual_inspection: { ...draft.visual_inspection, follow_up_items: items } });
  }

  function addFollowUp() {
    if (!draft) return;
    setDraft({
      ...draft,
      visual_inspection: {
        ...draft.visual_inspection,
        follow_up_items: [...draft.visual_inspection.follow_up_items, ""],
      },
    });
  }

  function removeFollowUp(i: number) {
    if (!draft) return;
    const items = draft.visual_inspection.follow_up_items.filter((_, idx) => idx !== i);
    setDraft({ ...draft, visual_inspection: { ...draft.visual_inspection, follow_up_items: items } });
  }

  // ── PDF generation ────────────────────────────────────────────────────────

  async function generatePdf() {
    setGenerating(true);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 110_000);
    try {
      const res = await fetch(`/api/jobs/${jobId}/report`, { method: "POST", signal: controller.signal });
      if (!res.ok) {
        let msg = "PDF generation failed";
        try { msg = (await res.json()).error || msg; } catch { /* non-JSON */ }
        toast.error(msg);
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `avax-report-${jobId.slice(0, 8)}.pdf`;
      a.click(); URL.revokeObjectURL(url);
      toast.success("Report downloaded");
      load();
    } catch (err) {
      toast.error(
        err instanceof Error && err.name === "AbortError"
          ? "Timed out — try again"
          : "Network error"
      );
    } finally {
      clearTimeout(timeout);
      setGenerating(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  if (!job) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-slate-600" />
      </div>
    );
  }

  // When editing, display draft; otherwise display saved data
  const a = editing ? draft : job.analysis?.reviewedData;
  const vi = a?.visual_inspection;
  const ea = a?.electrical_analysis;
  const ss = a?.system_specs;

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-white/8 bg-slate-950/85 backdrop-blur-md px-6 py-3.5 flex items-center gap-3">
        <Link
          href={`/jobs/${jobId}`}
          className="flex items-center gap-1.5 text-slate-500 hover:text-white transition-all duration-200 hover:-translate-x-0.5 shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back</span>
        </Link>

        <Link href="/" className="flex items-center gap-1.5 group shrink-0 ml-1">
          <AvaxLogo className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
          <span className="font-semibold text-sm tracking-tight text-slate-400 group-hover:text-white transition-colors duration-200">AVAX</span>
        </Link>

        <span className="text-slate-800 shrink-0">/</span>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">{job.address || "Report Review"}</p>
          {job.clientName && <p className="text-xs text-slate-500 truncate">{job.clientName}</p>}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Edit / Save / Cancel */}
          {!editing ? (
            <button
              onClick={startEdit}
              className="flex items-center gap-1.5 text-slate-400 hover:text-white border border-white/12 hover:border-white/25
                         px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-white/5"
            >
              <Pencil className="w-3.5 h-3.5" />
              Edit
            </button>
          ) : (
            <>
              <button
                onClick={cancelEdit}
                className="flex items-center gap-1.5 text-slate-400 hover:text-white border border-white/12
                           px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-white/5"
              >
                <X className="w-3.5 h-3.5" />
                Cancel
              </button>
              <button
                onClick={saveEdit}
                disabled={saving}
                className="flex items-center gap-1.5 bg-white text-slate-950 disabled:bg-slate-700 disabled:text-slate-500
                           px-3 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200
                           hover:-translate-y-0.5 hover:shadow-md hover:shadow-white/15"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                {saving ? "Saving…" : "Save"}
              </button>
            </>
          )}

          {/* Download PDF */}
          <button
            onClick={generatePdf}
            disabled={generating || editing}
            title={editing ? "Save changes before generating PDF" : undefined}
            className="flex items-center gap-2 bg-white text-slate-950 disabled:bg-slate-800 disabled:text-slate-500
                       font-semibold px-4 py-1.5 rounded-lg text-sm
                       transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-white/15 active:translate-y-0"
          >
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
            {generating ? "Generating…" : "Download PDF"}
          </button>
        </div>
      </header>

      {/* ── Edit mode banner ─────────────────────────────────────────────── */}
      {editing && (
        <div className="bg-slate-900 border-b border-amber-500/20 px-6 py-2.5 flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          <p className="text-sm text-amber-300/80">Editing — changes won&apos;t affect the PDF until you save</p>
        </div>
      )}

      {/* ── Content ──────────────────────────────────────────────────────── */}
      {!a ? (
        <div className="flex items-center justify-center py-40 text-slate-600">No analysis data</div>
      ) : (
        <main className="max-w-2xl mx-auto px-6 py-8 space-y-3">

          {/* Visual Inspection */}
          <Section title="Visual Inspection">
            {vi && (
              <>
                <Sub label="Modules" />
                <EditableRow label="Damage"       value={vi.modules.damage}       editing={editing} onChange={(v) => setVi("modules", "damage", v)} />
                <EditableRow label="Discoloration" value={vi.modules.discoloration} editing={editing} onChange={(v) => setVi("modules", "discoloration", v)} />
                <EditableRow label="Delamination"  value={vi.modules.delamination}  editing={editing} onChange={(v) => setVi("modules", "delamination", v)} />
                <EditableRow label="Soiling"       value={vi.modules.soiling}       editing={editing} onChange={(v) => setVi("modules", "soiling", v)} />
                <EditableRow label="Summary"       value={vi.modules.results}       editing={editing} onChange={(v) => setVi("modules", "results", v)} />

                <Sub label="Mounting System" />
                <EditableRow label="Damage"   value={vi.mounting_system.damage}   editing={editing} onChange={(v) => setVi("mounting_system", "damage", v)} />
                <EditableRow label="Corrosion" value={vi.mounting_system.corrosion} editing={editing} onChange={(v) => setVi("mounting_system", "corrosion", v)} />
                <EditableRow label="Summary"  value={vi.mounting_system.results}  editing={editing} onChange={(v) => setVi("mounting_system", "results", v)} />

                <Sub label="Inverters" />
                <EditableRow label="Loose Connections" value={vi.inverters.loose_connections} editing={editing} onChange={(v) => setVi("inverters", "loose_connections", v)} />
                <EditableRow label="Fault Codes"       value={vi.inverters.faults}            editing={editing} onChange={(v) => setVi("inverters", "faults", v)} />
                <EditableRow label="Summary"           value={vi.inverters.results}           editing={editing} onChange={(v) => setVi("inverters", "results", v)} />

                <Sub label="Shading" />
                <EditableRow label="Tree Growth"      value={vi.shading.tree_growth}     editing={editing} onChange={(v) => setVi("shading", "tree_growth", v)} />
                <EditableRow label="New Construction" value={vi.shading.new_construction} editing={editing} onChange={(v) => setVi("shading", "new_construction", v)} />
                <EditableRow label="Summary"          value={vi.shading.results}          editing={editing} onChange={(v) => setVi("shading", "results", v)} />

                <Sub label="Follow-up Items" />
                {vi.follow_up_items.length === 0 && !editing && (
                  <p className="text-sm text-slate-600 italic py-1">None</p>
                )}
                {vi.follow_up_items.map((item, i) => (
                  <div key={i} className="flex items-start gap-2 py-1">
                    {editing ? (
                      <>
                        <textarea
                          value={item}
                          onChange={(e) => setFollowUp(i, e.target.value)}
                          rows={2}
                          className="flex-1 text-sm bg-slate-800/80 border border-white/15 rounded-lg px-3 py-2 text-white
                                     resize-none focus:outline-none focus:border-white/35 transition-all duration-150"
                        />
                        <button
                          onClick={() => removeFollowUp(i)}
                          className="mt-1.5 p-1.5 text-slate-600 hover:text-red-400 hover:bg-red-950/30 rounded-lg transition-all duration-150"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <p className="text-sm text-amber-300/90 py-0.5">• {item}</p>
                    )}
                  </div>
                ))}
                {editing && (
                  <button
                    onClick={addFollowUp}
                    className="flex items-center gap-1.5 text-slate-500 hover:text-white text-sm mt-2
                               border border-dashed border-white/12 hover:border-white/25 rounded-lg px-3 py-2
                               transition-all duration-150 w-full justify-center hover:bg-white/4"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add follow-up item
                  </button>
                )}
              </>
            )}
          </Section>

          {/* Electrical Analysis */}
          <Section title="Electrical Analysis">
            {ea && (
              <>
                <EditableRow label="Inverter Numbers" value={ea.inverter_numbers} editing={editing} onChange={(v) => setEa("inverter_numbers", v)} />
                <EditableRow label="Amps"             value={ea.amps}             editing={editing} onChange={(v) => setEa("amps", v)} />
                <EditableRow label="Volts"            value={ea.volts}            editing={editing} onChange={(v) => setEa("volts", v)} />
                <EditableRow label="Fuses"            value={ea.fuses}            editing={editing} onChange={(v) => setEa("fuses", v)} />
                <EditableRow label="Inverter Result"  value={ea.inverter_result}  editing={editing} onChange={(v) => setEa("inverter_result", v)} />
                <EditableRow label="String Result"    value={ea.string_result}    editing={editing} onChange={(v) => setEa("string_result", v)} />
              </>
            )}
          </Section>

          {/* System Specifications */}
          <Section title="System Specifications">
            {ss && (
              <>
                <EditableRow label="Module Count"    value={ss.module_count}    editing={editing} onChange={(v) => setSs("module_count", v)} />
                <EditableRow label="Module Watts"    value={ss.module_watts}    editing={editing} onChange={(v) => setSs("module_watts", v)} />
                <EditableRow label="Module Brand"    value={ss.module_brand}    editing={editing} onChange={(v) => setSs("module_brand", v)} />
                <EditableRow label="Inverter Count"  value={ss.inverter_count}  editing={editing} onChange={(v) => setSs("inverter_count", v)} />
                <EditableRow label="Inverter kW"     value={ss.inverter_kw}     editing={editing} onChange={(v) => setSs("inverter_kw", v)} />
                <EditableRow label="Inverter Brand"  value={ss.inverter_brand}  editing={editing} onChange={(v) => setSs("inverter_brand", v)} />
                <EditableRow label="Inverter Voltage" value={ss.inverter_voltage} editing={editing} onChange={(v) => setSs("inverter_voltage", v)} />
              </>
            )}
          </Section>

        </main>
      )}
    </div>
  );
}
