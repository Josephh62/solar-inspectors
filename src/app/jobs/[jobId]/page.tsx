"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Zap, Loader2, AlertCircle, ChevronRight } from "lucide-react";
import { PhotoUploader } from "@/components/PhotoUploader";
import { AppHeader, AppFooter } from "@/components/AppShell";
import { toast } from "sonner";
import { haptic } from "@/lib/haptic";

interface Job {
  id: string; status: string; address: string | null; clientName: string | null;
  inspectorName: string | null; errorMessage: string | null;
  photos: { id: string; originalName: string; processedPath: string | null; imageData: string | null }[];
  analysis: object | null;
}

export default function JobPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const [job, setJob] = useState<Job | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/jobs/${jobId}`);
    if (res.ok) setJob((await res.json()).job);
  }, [jobId]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (job?.status !== "ANALYZING") return;
    const t = setInterval(load, 3000);
    return () => clearInterval(t);
  }, [job?.status, load]);

  async function analyze() {
    haptic("medium");
    setAnalyzing(true);
    const res = await fetch(`/api/jobs/${jobId}/analyze`, { method: "POST" });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      toast.error(d.error || "Analysis failed");
      setAnalyzing(false);
      return;
    }
    load();
  }

  if (!job) return (
    <div className="min-h-screen bg-[#060c18] flex items-center justify-center">
      <Loader2 className="w-6 h-6 animate-spin text-slate-600" />
    </div>
  );

  const isAnalyzing = job.status === "ANALYZING" || analyzing;

  return (
    <div className="min-h-screen bg-[#060c18] text-white flex flex-col">
      {/* Analyzing progress bar — above the fixed header */}
      {isAnalyzing && (
        <div className="fixed top-0 inset-x-0 z-[60] h-0.5 overflow-hidden">
          <div className="h-full w-full bg-gradient-to-r from-slate-400 via-slate-200 to-slate-400 animate-pulse" />
        </div>
      )}

      <AppHeader
        backHref="/dashboard"
        crumb={job.address || "Untitled Report"}
        subCrumb={job.clientName ?? undefined}
      />

      <div className="pt-14 flex-1 flex flex-col">
        <main className="max-w-2xl mx-auto w-full px-6 py-8 space-y-4 flex-1">

          {/* Analyzing card */}
          {isAnalyzing && (
            <div className="bg-white/3 border border-white/10 rounded-2xl p-6 flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-white/60 animate-spin" />
              <p className="font-semibold text-white">Analyzing photos…</p>
              <p className="text-sm text-slate-400 text-center">This usually takes 30–60 seconds. Don&apos;t close this page.</p>
              <div className="w-full bg-white/8 rounded-full h-1.5 overflow-hidden mt-1">
                <div className="h-full rounded-full bg-white/40 animate-pulse" style={{ width: "70%" }} />
              </div>
            </div>
          )}

          {/* Error */}
          {job.status === "ERROR" && job.errorMessage && (
            <div className="bg-red-950/50 border border-red-800/60 rounded-2xl p-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-300">Error</p>
                <p className="text-sm text-red-400 mt-0.5">{job.errorMessage}</p>
              </div>
            </div>
          )}

          {/* Photos */}
          <div className="bg-white/3 border border-white/8 rounded-2xl p-5">
            <h2 className="font-semibold mb-4 text-sm uppercase tracking-widest text-slate-500">Photos</h2>
            <PhotoUploader jobId={jobId} initialPhotos={job.photos} onChange={load as () => void} />
          </div>

          {/* Analysis complete link */}
          {job.analysis && (
            <Link
              href={`/jobs/${jobId}/review`}
              className="flex items-center gap-3 bg-white/4 border border-white/12 hover:border-white/22 rounded-2xl p-4
                         transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/6"
            >
              <div className="flex-1">
                <p className="font-semibold text-sm">Analysis complete</p>
                <p className="text-sm text-slate-500 mt-0.5">View and edit report, then generate PDF</p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500" />
            </Link>
          )}

          {/* Analyze button */}
          <button
            onClick={analyze}
            disabled={isAnalyzing || !job.photos.some((p) => p.imageData)}
            className="w-full bg-white text-[#060c18] disabled:bg-white/10 disabled:text-slate-600 font-bold py-3.5 rounded-xl
                       transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-white/15 active:translate-y-0
                       flex items-center justify-center gap-2"
          >
            {isAnalyzing
              ? <><Loader2 className="w-5 h-5 animate-spin" /> Analyzing…</>
              : <><Zap className="w-4 h-4" /> Analyze Photos</>}
          </button>

          {job.photos.length === 0 && (
            <p className="text-center text-sm text-slate-600">Upload photos to get started</p>
          )}
          {job.photos.length > 0 && !job.photos.some((p) => p.imageData) && (
            <p className="text-center text-sm text-slate-600">
              Photos didn&apos;t process — delete them (✕) and re-upload
            </p>
          )}
        </main>

        <AppFooter />
      </div>
    </div>
  );
}
