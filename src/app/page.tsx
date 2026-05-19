"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Trash2, ChevronRight, Loader2, FileText } from "lucide-react";
import { toast } from "sonner";
import { AvaxLogo } from "@/components/AvaxLogo";

interface Job {
  id: string;
  address: string | null;
  clientName: string | null;
  status: string;
  createdAt: string;
  photos: { id: string }[];
  analysis: { id: string } | null;
}

const STATUS_LABEL: Record<string, { label: string; classes: string }> = {
  DRAFT:      { label: "Draft",      classes: "bg-slate-800 text-slate-400 border border-slate-700" },
  ANALYZING:  { label: "Analyzing",  classes: "bg-blue-950 text-blue-300 border border-blue-800" },
  REVIEW:     { label: "Review",     classes: "bg-amber-950 text-amber-300 border border-amber-800" },
  GENERATING: { label: "Generating", classes: "bg-purple-950 text-purple-300 border border-purple-800" },
  COMPLETE:   { label: "Complete",   classes: "bg-emerald-950 text-emerald-300 border border-emerald-800" },
  ERROR:      { label: "Error",      classes: "bg-red-950 text-red-400 border border-red-800" },
};

export default function Dashboard() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadJobs() {
    const res = await fetch("/api/jobs");
    if (res.ok) setJobs((await res.json()).jobs);
    setLoading(false);
  }

  useEffect(() => { loadJobs(); }, []);

  async function deleteJob(id: string) {
    if (!confirm("Delete this report and all its photos?")) return;
    await fetch(`/api/jobs/${id}`, { method: "DELETE" });
    setJobs((j) => j.filter((x) => x.id !== id));
    toast.success("Report deleted");
  }

  const hasJobs = !loading && jobs.length > 0;

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* ── Header ── */}
      <header className="sticky top-0 z-40 border-b border-white/8 bg-slate-950/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5 group cursor-default select-none">
          <AvaxLogo className="w-7 h-7 transition-transform duration-300 group-hover:scale-110" />
          <span className="font-semibold text-lg tracking-tight">AVAX</span>
        </div>
        <Link
          href="/jobs/new"
          className="flex items-center gap-2 bg-white text-slate-950 font-semibold px-4 py-2 rounded-lg text-sm
                     transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-white/15 active:translate-y-0"
        >
          <Plus className="w-4 h-4" /> New Report
        </Link>
      </header>

      {/* ── Loading ── */}
      {loading && (
        <div className="flex justify-center items-center py-40">
          <Loader2 className="w-6 h-6 animate-spin text-slate-500" />
        </div>
      )}

      {/* ── Empty state hero ── */}
      {!loading && !hasJobs && (
        <main className="max-w-4xl mx-auto px-6 pt-24 pb-16">
          <p className="text-xs font-semibold tracking-[0.2em] text-slate-500 uppercase mb-8">
            Construction Reporting
          </p>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.05] tracking-tight mb-8">
            Reports that get<br />
            <span className="text-slate-400">the job done.</span>
          </h1>
          <p className="text-slate-400 text-lg sm:text-xl max-w-xl leading-relaxed mb-12">
            Upload job site photos. AVAX analyzes every detail and delivers a
            professional inspection report — ready to share in minutes.
          </p>
          <Link
            href="/jobs/new"
            className="inline-flex items-center gap-2 bg-white text-slate-950 font-semibold px-7 py-3.5 rounded-lg text-base
                       transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-white/20 active:translate-y-0"
          >
            <Plus className="w-5 h-5" /> Create your first report
          </Link>

          {/* Feature grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mt-24 pt-12 border-t border-white/8">
            {[
              {
                title: "Upload any photos",
                body: "HEIC, JPEG, PNG — straight from your iPhone or any job site camera.",
              },
              {
                title: "Instant analysis",
                body: "Every photo examined for damage, defects, and compliance details.",
              },
              {
                title: "Professional PDF",
                body: "Branded reports ready to send to clients and contractors immediately.",
              },
            ].map(({ title, body }) => (
              <div
                key={title}
                className="group transition-all duration-200 hover:translate-y-[-2px]"
              >
                <p className="font-semibold mb-2 group-hover:text-white transition-colors duration-200">{title}</p>
                <p className="text-slate-500 text-sm leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </main>
      )}

      {/* ── Reports list ── */}
      {hasJobs && (
        <main className="max-w-3xl mx-auto px-6 py-10">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
              <p className="text-slate-500 text-sm mt-1">{jobs.length} report{jobs.length !== 1 ? "s" : ""}</p>
            </div>
          </div>

          <div className="space-y-2">
            {jobs.map((job) => {
              const s = STATUS_LABEL[job.status] ?? STATUS_LABEL.DRAFT;
              return (
                <div
                  key={job.id}
                  className="group flex items-center gap-4 bg-slate-900/60 border border-white/8 rounded-xl px-5 py-4
                             transition-all duration-200 hover:-translate-y-0.5 hover:border-white/20 hover:shadow-xl hover:shadow-black/40 hover:bg-slate-900"
                >
                  <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-slate-800 border border-white/8 flex items-center justify-center
                                  transition-all duration-200 group-hover:border-white/20">
                    <FileText className="w-4 h-4 text-slate-400" />
                  </div>

                  <Link href={`/jobs/${job.id}`} className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 mb-0.5">
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${s.classes}`}>
                        {s.label}
                      </span>
                      <span className="text-xs text-slate-600">{job.photos.length} photo{job.photos.length !== 1 ? "s" : ""}</span>
                    </div>
                    <p className="font-medium truncate text-white">{job.address || "No address"}</p>
                    <p className="text-sm text-slate-500 truncate">{job.clientName || "No client"}</p>
                  </Link>

                  <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button
                      onClick={() => deleteJob(job.id)}
                      className="p-2 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-950/40 transition-all duration-150 hover:scale-110"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <Link
                      href={`/jobs/${job.id}`}
                      className="p-2 rounded-lg text-slate-600 hover:text-white hover:bg-slate-800 transition-all duration-150"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      )}
    </div>
  );
}
