"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Zap, Loader2, AlertCircle, ChevronRight } from "lucide-react";
import { PhotoUploader } from "@/components/PhotoUploader";
import { toast } from "sonner";

interface Job {
  id: string; status: string; address: string | null; clientName: string | null;
  inspectorName: string | null; errorMessage: string | null;
  photos: { id: string; originalName: string; processedPath: string | null; imageData: string | null }[];
  analysis: object | null;
}

export default function JobPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const router = useRouter();
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

  useEffect(() => {
    if (job?.status === "REVIEW") router.push(`/jobs/${jobId}/review`);
  }, [job?.status, jobId, router]);

  async function analyze() {
    setAnalyzing(true);
    const res = await fetch(`/api/jobs/${jobId}/analyze`, { method: "POST" });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      toast.error(d.error || "Analysis failed");
      setAnalyzing(false);
      return;
    }
    // Refresh job — status is now REVIEW, which triggers the redirect useEffect
    load();
  }

  if (!job) return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-slate-500" /></div>;

  const isAnalyzing = job.status === "ANALYZING" || analyzing;

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Full-width progress bar — visible on mobile and desktop while analyzing */}
      {isAnalyzing && (
        <div className="fixed top-0 inset-x-0 z-50 h-1 overflow-hidden bg-slate-900">
          <div className="h-full w-full bg-gradient-to-r from-amber-600 via-amber-300 to-amber-600 animate-pulse" />
        </div>
      )}

      <header className={`border-b border-slate-800 px-6 py-4 flex items-center gap-4 ${isAnalyzing ? "mt-1" : ""}`}>
        <Link href="/" className="text-slate-400 hover:text-white"><ArrowLeft className="w-5 h-5" /></Link>
        <div className="flex-1 min-w-0">
          <h1 className="font-semibold truncate">{job.address || "Untitled Inspection"}</h1>
          {job.clientName && <p className="text-sm text-slate-400">{job.clientName}</p>}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8 space-y-6">
        {isAnalyzing && (
          <div className="bg-slate-900 border border-amber-800/40 rounded-xl p-5 flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
            <p className="font-medium text-amber-300">Analyzing photos with AI…</p>
            <p className="text-sm text-slate-400 text-center">This usually takes 30–60 seconds. Don&apos;t close this page.</p>
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden mt-1">
              <div className="h-full rounded-full bg-gradient-to-r from-amber-600 to-amber-400 animate-pulse" style={{ width: "70%" }} />
            </div>
          </div>
        )}
        {job.status === "ERROR" && job.errorMessage && (
          <div className="bg-red-950 border border-red-800 rounded-xl p-4 flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-red-300">Error</p>
              <p className="text-sm text-red-400 mt-1">{job.errorMessage}</p>
            </div>
          </div>
        )}

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h2 className="font-medium mb-4">Photos</h2>
          <PhotoUploader jobId={jobId} initialPhotos={job.photos} onChange={load as () => void} />
        </div>

        {job.analysis && (
          <Link href={`/jobs/${jobId}/review`} className="block bg-slate-900 border border-amber-800/40 rounded-xl p-4 flex items-center gap-3 hover:border-amber-700 transition-colors">
            <div className="flex-1">
              <p className="font-medium text-amber-300">Analysis complete</p>
              <p className="text-sm text-slate-400 mt-0.5">View report and generate PDF</p>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-500" />
          </Link>
        )}

        <button
          onClick={analyze}
          disabled={isAnalyzing || !job.photos.some((p) => p.imageData)}
          className="w-full bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-500 text-black font-medium py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          {isAnalyzing
            ? <><Loader2 className="w-5 h-5 animate-spin" /> Analyzing with AI…</>
            : <><Zap className="w-5 h-5" /> Analyze Photos</>}
        </button>
        {job.photos.length === 0 && (
          <p className="text-center text-sm text-slate-500">Upload photos to get started</p>
        )}
        {job.photos.length > 0 && !job.photos.some((p) => p.imageData) && (
          <p className="text-center text-sm text-slate-500">
            Photos didn&apos;t process — delete them (✕) and re-upload
          </p>
        )}
      </main>
    </div>
  );
}
