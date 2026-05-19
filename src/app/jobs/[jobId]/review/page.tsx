"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FileDown, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { AvaxLogo } from "@/components/AvaxLogo";

interface Analysis {
  project_name: string | null; project_address: string | null; inspection_date: string | null; confidence: string;
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

function Row({ label, value }: { label: string; value: string | null }) {
  const none = !value || value === "NONE" || value === "Not visible in provided photos";
  return (
    <div className="flex gap-4 py-2.5 border-b border-slate-800 last:border-0">
      <span className="text-slate-400 text-sm w-40 shrink-0">{label}</span>
      <span className={`text-sm flex-1 ${none ? "text-slate-600 italic" : "text-white"}`}>{none ? "None" : value}</span>
    </div>
  );
}

function Section({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-slate-900/60 border border-white/8 rounded-xl overflow-hidden transition-all duration-200 hover:border-white/14">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-800/50 transition-colors">
        <h2 className="font-semibold">{title}</h2>
        {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>
      {open && <div className="px-5 pb-4">{children}</div>}
    </div>
  );
}

export default function ReviewPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const [job, setJob] = useState<Job | null>(null);
  const [generating, setGenerating] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/jobs/${jobId}`);
    if (res.ok) setJob((await res.json()).job);
  }, [jobId]);

  useEffect(() => { load(); }, [load]);

  async function generatePdf() {
    setGenerating(true);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 110_000);
    try {
      const res = await fetch(`/api/jobs/${jobId}/report`, { method: "POST", signal: controller.signal });
      if (!res.ok) {
        let msg = "PDF generation failed";
        try { msg = (await res.json()).error || msg; } catch { /* non-JSON error body */ }
        toast.error(msg);
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `solar-report-${jobId.slice(0, 8)}.pdf`;
      a.click(); URL.revokeObjectURL(url);
      toast.success("Report downloaded!");
      load();
    } catch (err) {
      const msg = err instanceof Error && err.name === "AbortError"
        ? "Report generation timed out — try again"
        : "Network error generating report";
      toast.error(msg);
    } finally {
      clearTimeout(timeout);
      setGenerating(false);
    }
  }

  if (!job) return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-slate-500" /></div>;
  const a = job.analysis?.reviewedData;
  const vi = a?.visual_inspection;
  const ea = a?.electrical_analysis;
  const ss = a?.system_specs;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="sticky top-0 z-40 border-b border-white/8 bg-slate-950/80 backdrop-blur-md px-6 py-4 flex items-center gap-4">
        <Link
          href={`/jobs/${jobId}`}
          className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-all duration-200 hover:-translate-x-0.5 shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back</span>
        </Link>

        <Link href="/" className="flex items-center gap-1.5 group shrink-0">
          <AvaxLogo className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
          <span className="font-semibold text-sm tracking-tight text-slate-400 group-hover:text-white transition-colors duration-200">AVAX</span>
        </Link>

        <span className="text-slate-700 shrink-0">/</span>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">{job.address || "Report Review"}</p>
          {job.clientName && <p className="text-xs text-slate-500 truncate">{job.clientName}</p>}
        </div>

        <button
          onClick={generatePdf}
          disabled={generating}
          className="flex items-center gap-2 bg-white text-slate-950 disabled:bg-slate-800 disabled:text-slate-500
                     font-semibold px-4 py-2 rounded-lg text-sm shrink-0
                     transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-white/15 active:translate-y-0"
        >
          {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
          {generating ? "Generating…" : "Download PDF"}
        </button>
      </header>

      {!a ? (
        <div className="flex items-center justify-center py-32 text-slate-500">No analysis data</div>
      ) : (
        <main className="max-w-2xl mx-auto px-6 py-8 space-y-4">
          <Section title="Visual Inspection">
            {vi && <>
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-2 mt-1">Modules</p>
              <Row label="Damage" value={vi.modules.damage} />
              <Row label="Discoloration" value={vi.modules.discoloration} />
              <Row label="Delamination" value={vi.modules.delamination} />
              <Row label="Soiling" value={vi.modules.soiling} />
              <Row label="Summary" value={vi.modules.results} />
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-2 mt-4">Mounting</p>
              <Row label="Damage" value={vi.mounting_system.damage} />
              <Row label="Corrosion" value={vi.mounting_system.corrosion} />
              <Row label="Summary" value={vi.mounting_system.results} />
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-2 mt-4">Inverters</p>
              <Row label="Loose Connections" value={vi.inverters.loose_connections} />
              <Row label="Fault Codes" value={vi.inverters.faults} />
              <Row label="Summary" value={vi.inverters.results} />
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-2 mt-4">Shading</p>
              <Row label="Tree Growth" value={vi.shading.tree_growth} />
              <Row label="New Construction" value={vi.shading.new_construction} />
              <Row label="Summary" value={vi.shading.results} />
              {vi.follow_up_items.length > 0 && <>
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-2 mt-4">Follow-up Items</p>
                {vi.follow_up_items.map((item, i) => <div key={i} className="text-sm text-amber-300 py-1">• {item}</div>)}
              </>}
            </>}
          </Section>

          <Section title="Electrical Analysis">
            {ea && <>
              <Row label="Inverter Numbers" value={ea.inverter_numbers} />
              <Row label="Amps" value={ea.amps} />
              <Row label="Volts" value={ea.volts} />
              <Row label="Fuses" value={ea.fuses} />
              <Row label="Inverter Result" value={ea.inverter_result} />
              <Row label="String Result" value={ea.string_result} />
            </>}
          </Section>

          <Section title="System Specifications">
            {ss && <>
              <Row label="Module Count" value={ss.module_count} />
              <Row label="Module Watts" value={ss.module_watts} />
              <Row label="Module Brand" value={ss.module_brand} />
              <Row label="Inverter Count" value={ss.inverter_count} />
              <Row label="Inverter kW" value={ss.inverter_kw} />
              <Row label="Inverter Brand" value={ss.inverter_brand} />
              <Row label="Inverter Voltage" value={ss.inverter_voltage} />
            </>}
          </Section>
        </main>
      )}
    </div>
  );
}
