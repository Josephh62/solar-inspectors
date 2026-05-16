"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sun, Plus, Trash2, ChevronRight, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Job {
  id: string;
  address: string | null;
  clientName: string | null;
  status: string;
  createdAt: string;
  photos: { id: string }[];
  analysis: { id: string } | null;
}

const STATUS_COLOR: Record<string, string> = {
  DRAFT: "bg-slate-700 text-slate-300",
  ANALYZING: "bg-blue-800 text-blue-200",
  REVIEW: "bg-amber-800 text-amber-200",
  GENERATING: "bg-purple-800 text-purple-200",
  COMPLETE: "bg-green-800 text-green-200",
  ERROR: "bg-red-800 text-red-200",
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
    if (!confirm("Delete this job and all its photos?")) return;
    await fetch(`/api/jobs/${id}`, { method: "DELETE" });
    setJobs((j) => j.filter((x) => x.id !== id));
    toast.success("Job deleted");
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <header className="border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sun className="w-6 h-6 text-amber-400" />
          <span className="font-semibold text-lg">Solar Inspector</span>
        </div>
        <Link
          href="/jobs/new"
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-medium px-4 py-2 rounded-lg text-sm transition-colors"
        >
          <Plus className="w-4 h-4" /> New Inspection
        </Link>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold mb-6">Inspections</h1>

        {loading && <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-slate-500" /></div>}

        {!loading && jobs.length === 0 && (
          <div className="text-center py-16 text-slate-500">
            <Sun className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="mb-4">No inspections yet</p>
            <Link href="/jobs/new" className="text-amber-400 hover:text-amber-300 text-sm">Create your first →</Link>
          </div>
        )}

        <div className="space-y-3">
          {jobs.map((job) => (
            <div key={job.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-4">
              <Link href={`/jobs/${job.id}`} className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[job.status] ?? "bg-slate-700 text-slate-300"}`}>
                    {job.status}
                  </span>
                  <span className="text-xs text-slate-500">{job.photos.length} photo{job.photos.length !== 1 ? "s" : ""}</span>
                </div>
                <p className="font-medium truncate">{job.address || "No address set"}</p>
                <p className="text-sm text-slate-400 truncate">{job.clientName || "No client"}</p>
              </Link>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => deleteJob(job.id)} className="p-2 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-red-400 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
                <Link href={`/jobs/${job.id}`} className="p-2 hover:bg-slate-800 rounded-lg text-slate-500 transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
