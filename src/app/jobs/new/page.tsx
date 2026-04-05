"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Nav } from "@/components/Nav";
import { PhotoUploader } from "@/components/PhotoUploader";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function NewJobPage() {
  const router = useRouter();
  const [jobId, setJobId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    address: "",
    clientName: "",
    inspectorName: "",
    inspectionDate: "",
    notes: "",
  });

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  // Create job record as soon as user starts uploading
  const ensureJob = async (): Promise<string> => {
    if (jobId) return jobId;

    setCreating(true);
    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setJobId(data.job.id);
      return data.job.id;
    } finally {
      setCreating(false);
    }
  };

  const handleAnalyze = async () => {
    if (!jobId) {
      toast.error("Add photos before analyzing");
      return;
    }

    // Update job metadata first
    await fetch(`/api/jobs/${jobId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    router.push(`/jobs/${jobId}`);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Nav />

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">New Inspection Job</h1>
          <p className="text-slate-400 text-sm mt-1">
            Upload photos — AI will extract data. Fill in what you know now; the rest can be filled after analysis.
          </p>
        </div>

        {/* Photos first — most important */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-4">
          <h2 className="text-white font-medium mb-3 flex items-center gap-2">
            📷 Photos
            <span className="text-xs text-slate-500 font-normal">(HEIC, JPEG, PNG — any format from your phone)</span>
          </h2>
          <PhotoUploaderWrapper ensureJob={ensureJob} />
        </div>

        {/* Job details (optional) */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-4">
          <h2 className="text-white font-medium mb-3">
            Job Details <span className="text-xs text-slate-500 font-normal">(optional — AI will fill from photos)</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Property Address</label>
              <input
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                placeholder="123 Main St, Los Angeles, CA"
                value={form.address}
                onChange={set("address")}
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Client Name</label>
              <input
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                placeholder="John Smith"
                value={form.clientName}
                onChange={set("clientName")}
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Inspector Name</label>
              <input
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                placeholder="Your name"
                value={form.inspectorName}
                onChange={set("inspectorName")}
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Inspection Date</label>
              <input
                type="date"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                value={form.inspectionDate}
                onChange={set("inspectionDate")}
              />
            </div>
          </div>
          <div className="mt-3">
            <label className="block text-xs text-slate-400 mb-1">Notes</label>
            <textarea
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
              rows={2}
              placeholder="Any additional notes..."
              value={form.notes}
              onChange={set("notes")}
            />
          </div>
        </div>

        {/* Continue button */}
        {jobId && (
          <button
            onClick={handleAnalyze}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
          >
            Continue to Analysis →
          </button>
        )}

        {creating && (
          <div className="flex items-center justify-center gap-2 text-slate-400 text-sm mt-4">
            <Loader2 className="w-4 h-4 animate-spin" />
            Creating job...
          </div>
        )}
      </main>
    </div>
  );
}

// Wrapper that creates the job on first upload
function PhotoUploaderWrapper({ ensureJob }: { ensureJob: () => Promise<string> }) {
  const [jobId, setJobId] = useState<string | null>(null);

  const handleUploadReady = async (): Promise<string> => {
    if (jobId) return jobId;
    const id = await ensureJob();
    setJobId(id);
    return id;
  };

  if (!jobId) {
    return <LazyPhotoUploader onJobIdReady={handleUploadReady} />;
  }

  return <PhotoUploader jobId={jobId} />;
}

function LazyPhotoUploader({ onJobIdReady }: { onJobIdReady: () => Promise<string> }) {
  const [jobId, setJobId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleInit = async () => {
    if (loading || jobId) return;
    setLoading(true);
    try {
      const id = await onJobIdReady();
      setJobId(id);
    } finally {
      setLoading(false);
    }
  };

  if (jobId) return <PhotoUploader jobId={jobId} />;

  return (
    <div
      onClick={handleInit}
      className="border-2 border-dashed border-slate-700 rounded-xl p-8 text-center cursor-pointer hover:border-slate-500 transition-colors bg-slate-900/50"
    >
      <div className="flex flex-col items-center gap-3">
        {loading ? (
          <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />
        ) : (
          <span className="text-4xl">☁️</span>
        )}
        <div>
          <p className="text-slate-300 font-medium">
            {loading ? "Setting up..." : "Tap to add photos"}
          </p>
          <p className="text-slate-500 text-sm mt-1">HEIC · JPEG · PNG · WebP</p>
        </div>
      </div>
    </div>
  );
}
