"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { FileDown, Loader2, ChevronDown, ChevronUp, Check, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppHeader, AppFooter, darkBtn } from "@/components/AppShell";

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

// ── Tap-to-edit row ────────────────────────────────────────────────────────────

function EditableRow({ label, value, onChange }: {
  label: string; value: string | null; onChange: (v: string) => void;
}) {
  const [active, setActive] = useState(false);
  const none = !value || value === "NONE" || value === "Not visible in provided photos";

  return (
    <div className="flex gap-4 py-3 border-b border-white/6 last:border-0 items-start">
      <span className="text-slate-500 text-sm w-44 shrink-0 pt-1 font-medium">{label}</span>

      {active ? (
        <textarea
          autoFocus
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          onBlur={() => setActive(false)}
          rows={3}
          className="flex-1 text-sm bg-white/6 border border-white/25 rounded-xl px-3 py-2.5 text-white
                     resize-none focus:outline-none focus:border-white/40 focus:bg-white/8
                     transition-all duration-150 placeholder-slate-600"
          placeholder="Type here…"
        />
      ) : (
        <span
          onClick={() => setActive(true)}
          className={`flex-1 text-sm leading-relaxed cursor-text rounded-lg px-2 py-1 -mx-2 -my-1
                     hover:bg-white/5 active:bg-white/8 transition-colors duration-100
                     ${none ? "text-slate-600 italic" : "text-white"}`}
        >
          {none ? "Tap to add…" : value}
        </span>
      )}
    </div>
  );
}

// ── Collapsible section ────────────────────────────────────────────────────────

function Section({ title, children, defaultOpen = true }: {
  title: string; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white/3 border border-white/8 rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-5 hover:bg-white/3 transition-colors duration-150"
      >
        <h2 className="font-semibold text-base tracking-tight text-left">{title}</h2>
        {open ? <ChevronUp className="w-4 h-4 text-slate-500 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />}
      </button>
      {open && <div className="px-6 pb-5">{children}</div>}
    </div>
  );
}

function Sub({ label }: { label: string }) {
  return (
    <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-[0.18em] mb-2 mt-5 first:mt-1">
      {label}
    </p>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function ReviewPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const [job, setJob]         = useState<Job | null>(null);
  const [draft, setDraft]     = useState<Analysis | null>(null);
  const [saving, setSaving]   = useState(false);
  const [generating, setGenerating] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/jobs/${jobId}`);
    if (res.ok) setJob((await res.json()).job);
  }, [jobId]);

  useEffect(() => { load(); }, [load]);

  // Initialise draft whenever the saved job loads / reloads
  useEffect(() => {
    if (job?.analysis?.reviewedData) {
      setDraft(JSON.parse(JSON.stringify(job.analysis.reviewedData)));
    }
  }, [job]);

  const isDirty = draft !== null &&
    JSON.stringify(draft) !== JSON.stringify(job?.analysis?.reviewedData);

  // ── Save ──────────────────────────────────────────────────────────────────

  async function save(): Promise<boolean> {
    if (!draft) return true;
    setSaving(true);
    try {
      const res = await fetch(`/api/jobs/${jobId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewedData: draft }),
      });
      if (res.ok) { await load(); toast.success("Saved"); return true; }
      toast.error("Failed to save"); return false;
    } catch { toast.error("Network error"); return false; }
    finally { setSaving(false); }
  }

  // ── PDF ───────────────────────────────────────────────────────────────────

  async function generatePdf() {
    // Auto-save unsaved changes before generating
    if (isDirty) {
      const ok = await save();
      if (!ok) return;
    }
    setGenerating(true);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 110_000);
    try {
      const res = await fetch(`/api/jobs/${jobId}/report`, { method: "POST", signal: controller.signal });
      if (!res.ok) {
        let msg = "PDF generation failed";
        try { msg = (await res.json()).error || msg; } catch { /**/ }
        toast.error(msg); return;
      }
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href = url; a.download = `avax-report-${jobId.slice(0, 8)}.pdf`;
      a.click(); URL.revokeObjectURL(url);
      toast.success("Report downloaded");
      load();
    } catch (err) {
      toast.error(err instanceof Error && err.name === "AbortError" ? "Timed out — try again" : "Network error");
    } finally { clearTimeout(timeout); setGenerating(false); }
  }

  // ── Draft setters ─────────────────────────────────────────────────────────

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
    setDraft({ ...draft, visual_inspection: { ...draft.visual_inspection, follow_up_items: [...draft.visual_inspection.follow_up_items, ""] } });
  }
  function removeFollowUp(i: number) {
    if (!draft) return;
    setDraft({ ...draft, visual_inspection: { ...draft.visual_inspection, follow_up_items: draft.visual_inspection.follow_up_items.filter((_, idx) => idx !== i) } });
  }

  // ── Render ────────────────────────────────────────────────────────────────

  if (!job || !draft) return (
    <div className="min-h-screen bg-[#060c18] flex items-center justify-center">
      <Loader2 className="w-6 h-6 animate-spin text-slate-600" />
    </div>
  );

  const vi = draft.visual_inspection;
  const ea = draft.electrical_analysis;
  const ss = draft.system_specs;

  return (
    <div className="min-h-screen bg-[#060c18] text-white flex flex-col">

      <AppHeader
        backHref={`/jobs/${jobId}`}
        crumb={job.address || "Report Review"}
        subCrumb={job.clientName ?? undefined}
        actions={
          <button
            onClick={generatePdf}
            disabled={generating || saving}
            className={darkBtn}
          >
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
            {generating ? "Generating…" : isDirty ? "Save & Download PDF" : "Download PDF"}
          </button>
        }
      />

      <div className="pt-14 flex-1 flex flex-col">
        {!draft ? (
          <div className="flex items-center justify-center py-40 text-slate-600">No analysis data</div>
        ) : (
          <main className="max-w-2xl mx-auto w-full px-6 py-8 space-y-3 flex-1 pb-28">

            {/* Visual Inspection */}
            <Section title="Visual Inspection">
              <Sub label="Modules" />
              <EditableRow label="Damage"        value={vi.modules.damage}        onChange={(v) => setVi("modules","damage",v)} />
              <EditableRow label="Discoloration"  value={vi.modules.discoloration}  onChange={(v) => setVi("modules","discoloration",v)} />
              <EditableRow label="Delamination"   value={vi.modules.delamination}   onChange={(v) => setVi("modules","delamination",v)} />
              <EditableRow label="Soiling"        value={vi.modules.soiling}        onChange={(v) => setVi("modules","soiling",v)} />
              <EditableRow label="Summary"        value={vi.modules.results}        onChange={(v) => setVi("modules","results",v)} />

              <Sub label="Mounting System" />
              <EditableRow label="Damage"    value={vi.mounting_system.damage}   onChange={(v) => setVi("mounting_system","damage",v)} />
              <EditableRow label="Corrosion" value={vi.mounting_system.corrosion} onChange={(v) => setVi("mounting_system","corrosion",v)} />
              <EditableRow label="Summary"   value={vi.mounting_system.results}  onChange={(v) => setVi("mounting_system","results",v)} />

              <Sub label="Inverters" />
              <EditableRow label="Loose Connections" value={vi.inverters.loose_connections} onChange={(v) => setVi("inverters","loose_connections",v)} />
              <EditableRow label="Fault Codes"       value={vi.inverters.faults}            onChange={(v) => setVi("inverters","faults",v)} />
              <EditableRow label="Summary"           value={vi.inverters.results}           onChange={(v) => setVi("inverters","results",v)} />

              <Sub label="Shading" />
              <EditableRow label="Tree Growth"      value={vi.shading.tree_growth}     onChange={(v) => setVi("shading","tree_growth",v)} />
              <EditableRow label="New Construction" value={vi.shading.new_construction} onChange={(v) => setVi("shading","new_construction",v)} />
              <EditableRow label="Summary"          value={vi.shading.results}          onChange={(v) => setVi("shading","results",v)} />

              <Sub label="Follow-up Items" />
              {vi.follow_up_items.length === 0 && (
                <p className="text-sm text-slate-600 italic py-1">None — tap to add below</p>
              )}
              {vi.follow_up_items.map((item, i) => (
                <div key={i} className="flex items-start gap-2 py-1">
                  <textarea
                    value={item}
                    onChange={(e) => setFollowUp(i, e.target.value)}
                    rows={2}
                    className="flex-1 text-sm bg-white/6 border border-white/15 rounded-xl px-3 py-2 text-white
                               resize-none focus:outline-none focus:border-white/35 transition-all duration-150"
                    placeholder="Follow-up item…"
                  />
                  <button onClick={() => removeFollowUp(i)} className="mt-1 p-2 text-slate-600 hover:text-white hover:bg-white/8 rounded-lg transition-all duration-150">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              <button
                onClick={addFollowUp}
                className="flex items-center gap-1.5 text-slate-500 hover:text-white text-sm mt-2
                           border border-dashed border-white/12 hover:border-white/25 rounded-xl px-3 py-2
                           transition-all duration-150 w-full justify-center hover:bg-white/4"
              >
                <Plus className="w-3.5 h-3.5" /> Add follow-up item
              </button>
            </Section>

            {/* Electrical Analysis */}
            <Section title="Electrical Analysis">
              <EditableRow label="Inverter Numbers" value={ea.inverter_numbers} onChange={(v) => setEa("inverter_numbers",v)} />
              <EditableRow label="Amps"             value={ea.amps}             onChange={(v) => setEa("amps",v)} />
              <EditableRow label="Volts"            value={ea.volts}            onChange={(v) => setEa("volts",v)} />
              <EditableRow label="Fuses"            value={ea.fuses}            onChange={(v) => setEa("fuses",v)} />
              <EditableRow label="Inverter Result"  value={ea.inverter_result}  onChange={(v) => setEa("inverter_result",v)} />
              <EditableRow label="String Result"    value={ea.string_result}    onChange={(v) => setEa("string_result",v)} />
            </Section>

            {/* System Specifications */}
            <Section title="System Specifications">
              <EditableRow label="Module Count"     value={ss.module_count}    onChange={(v) => setSs("module_count",v)} />
              <EditableRow label="Module Watts"     value={ss.module_watts}    onChange={(v) => setSs("module_watts",v)} />
              <EditableRow label="Module Brand"     value={ss.module_brand}    onChange={(v) => setSs("module_brand",v)} />
              <EditableRow label="Inverter Count"   value={ss.inverter_count}  onChange={(v) => setSs("inverter_count",v)} />
              <EditableRow label="Inverter kW"      value={ss.inverter_kw}     onChange={(v) => setSs("inverter_kw",v)} />
              <EditableRow label="Inverter Brand"   value={ss.inverter_brand}  onChange={(v) => setSs("inverter_brand",v)} />
              <EditableRow label="Inverter Voltage" value={ss.inverter_voltage} onChange={(v) => setSs("inverter_voltage",v)} />
            </Section>

          </main>
        )}

        <AppFooter />
      </div>

      {/* ── Floating save bar — appears when there are unsaved changes ── */}
      <div
        className={`fixed bottom-0 inset-x-0 z-50 transition-all duration-300 ease-out
                    ${isDirty ? "translate-y-0 opacity-100" : "translate-y-full opacity-0 pointer-events-none"}`}
      >
        <div className="bg-white border-t border-black/8 px-6 py-4 flex items-center gap-3 max-w-2xl mx-auto rounded-t-2xl shadow-2xl">
          <p className="text-[#060c18] text-sm font-medium flex-1">You have unsaved changes</p>
          <button
            onClick={save}
            disabled={saving}
            className="flex items-center gap-2 bg-[#060c18] text-white font-semibold px-5 py-2.5 rounded-xl text-sm
                       transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0
                       disabled:opacity-60"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>

    </div>
  );
}
