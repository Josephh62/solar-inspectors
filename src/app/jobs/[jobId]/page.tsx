"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Nav } from "@/components/Nav";
import { PhotoUploader } from "@/components/PhotoUploader";
import { toast } from "sonner";
import { Loader2, Zap, AlertCircle, ChevronRight, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface Job {
  id: string;
  status: string;
  address: string | null;
  clientName: string | null;
  errorMessage: string | null;
  photos: Array<{ id: string; originalName: string; processedPath: string | null; mimeType: string }>;
  analysis: object | null;
}

export default function JobDetailPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const router = useRouter();
  const [job, setJob] = useState<Job | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const loadJob = useCallback(async () => {
    const res = await fetch(`/api/jobs/${jobId}`);
    if (!res.ok) return;
    const data = await res.json();
    setJob(data.job);
  }, [jobId]);

  useEffect(() => {
    loadJob();
  }, [loadJob]);

  // Poll while analyzing
  useEffect(() => {
    if (job?.status !== "ANALYZING") return;
    const interval = setInterval(loadJob, 3000);
    return () => clearInterval(interval);
  }, [job?.status, loadJob]);

  // Redirect when analysis complete
  useEffect(() => {
    if (job?.status === "REVIEW") {
      router.push(`/jobs/${jobId}/review`);
    }
  }, [job?.status, jobId, router]);

  const handleAnalyze = async () => {
    if (!job?.photos.length) {
      toast.error("Add at least one photo first");
      return;
    }
    setAnalyzing(true);
    try {
      const res = await fetch(`/api/jobs/${jobId}/analyze`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Analysis failed");
        setAnalyzing(false);
        return;
      }
      // Poll will redirect automatically
      loadJob();
    } catch {
      toast.error("Analysis request failed");
      setAnalyzing(false);
    }
  };

  if (!job) {
    return (
      <div className="min-h-screen flex flex-col">
        <Nav />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
        </div>
      </div>
    );
  }

  const isAnalyzing = job.status === "ANALYZING" || analyzing;

  return (
    <div className="min-h-screen flex flex-col">
      <Nav />

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8">
        <Link href="/" className="flex items-center gap-1 text-slate-400 hover:text-slate-200 text-sm mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to jobs
        </Link>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">
            {job.address || job.clientName || `Job ${job.id.slice(0, 8)}`}
          </h1>
          {job.clientName && job.address && (
            <p className="text-slate-400 text-sm mt-1">{job.clientName}</p>
          )}
        </div>

        {/* Error state */}
        {job.status === "ERROR" && job.errorMessage && (
          <div className="bg-red-900/30 border border-red-800 rounded-xl p-4 mb-4 flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-red-300 font-medium text-sm">Analysis failed</p>
              <p className="text-red-400 text-xs mt-1">{job.errorMessage}</p>
            </div>
          </div>
        )}

        {/* Analyzing banner */}
        {isAnalyzing && (
          <div className="bg-amber-900/30 border border-amber-800 rounded-xl p-4 mb-4 flex items-center gap-3">
            <Loader2 className="w-5 h-5 text-amber-400 animate-spin shrink-0" />
            <div>
              <p className="text-amber-300 font-medium text-sm">Analyzing with Claude AI...</p>
              <p className="text-amber-400/70 text-xs mt-1">
                Reading voltages, counting panels, checking for issues. This takes 10–30 seconds.
              </p>
            </div>
          </div>
        )}

        {/* Photos */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-4">
          <h2 className="text-white font-medium mb-3">
            Photos ({job.photos.length})
          </h2>
          <PhotoUploader jobId={jobId} existingPhotos={job.photos} onPhotosChange={loadJob as () => void} />
        </div>

        {/* Actions */}
        {!isAnalyzing && job.status !== "REVIEW" && (
          <button
            onClick={handleAnalyze}
            disabled={!job.photos.length}
            className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-slate-700 disabled:text-slate-500 text-white py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
          >
            <Zap className="w-5 h-5" />
            Analyze Photos with AI
          </button>
        )}

        {job.analysis && job.status === "REVIEW" && (
          <Link
            href={`/jobs/${jobId}/review`}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
          >
            Review Extracted Data
            <ChevronRight className="w-5 h-5" />
          </Link>
        )}
      </main>
    </div>
  );
}
