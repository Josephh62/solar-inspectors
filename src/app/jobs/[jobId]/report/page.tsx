"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Nav } from "@/components/Nav";
import { toast } from "sonner";
import { Loader2, Download, ArrowLeft, FileText, RefreshCw, CheckCircle } from "lucide-react";
import Link from "next/link";

interface Job {
  id: string;
  status: string;
  address: string | null;
  clientName: string | null;
  inspectorName: string | null;
  inspectionDate: string | null;
  report: { id: string; pdfSizeBytes: number | null; createdAt: string } | null;
}

export default function ReportPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetch(`/api/jobs/${jobId}`)
      .then((r) => r.json())
      .then((data) => setJob(data.job))
      .finally(() => setLoading(false));
  }, [jobId]);

  const generateReport = async () => {
    setGenerating(true);
    try {
      const res = await fetch(`/api/jobs/${jobId}/report`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Generation failed");
        return;
      }

      // Stream the PDF as a download
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `solar-inspection-${jobId.slice(0, 8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("Report downloaded!");
      // Refresh job data
      fetch(`/api/jobs/${jobId}`)
        .then((r) => r.json())
        .then((data) => setJob(data.job));
    } catch {
      toast.error("Failed to generate report");
    } finally {
      setGenerating(false);
    }
  };

  const downloadExisting = async () => {
    const a = document.createElement("a");
    a.href = `/api/jobs/${jobId}/report`;
    a.download = `solar-inspection-${jobId.slice(0, 8)}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Nav />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen flex flex-col">
        <Nav />
        <div className="flex-1 flex items-center justify-center text-slate-400">Job not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Nav />

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8">
        <Link
          href={`/jobs/${jobId}/review`}
          className="flex items-center gap-1 text-slate-400 hover:text-slate-200 text-sm mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to review
        </Link>

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Inspection Report</h1>
          <p className="text-slate-400 text-sm mt-1">
            {job.address || job.clientName || `Job ${job.id.slice(0, 8)}`}
          </p>
        </div>

        {/* Report summary card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 bg-blue-900/40 rounded-xl flex items-center justify-center">
              <FileText className="w-7 h-7 text-blue-400" />
            </div>
            <div>
              <h2 className="text-white font-semibold">Solar Inspection Report</h2>
              <p className="text-slate-400 text-sm">PDF format · All data from photos</p>
            </div>
          </div>

          {/* Job details summary */}
          <dl className="space-y-2 mb-6">
            {job.address && (
              <div className="flex gap-2">
                <dt className="text-slate-500 text-sm w-32 shrink-0">Address</dt>
                <dd className="text-white text-sm">{job.address}</dd>
              </div>
            )}
            {job.clientName && (
              <div className="flex gap-2">
                <dt className="text-slate-500 text-sm w-32 shrink-0">Client</dt>
                <dd className="text-white text-sm">{job.clientName}</dd>
              </div>
            )}
            {job.inspectorName && (
              <div className="flex gap-2">
                <dt className="text-slate-500 text-sm w-32 shrink-0">Inspector</dt>
                <dd className="text-white text-sm">{job.inspectorName}</dd>
              </div>
            )}
            {job.inspectionDate && (
              <div className="flex gap-2">
                <dt className="text-slate-500 text-sm w-32 shrink-0">Date</dt>
                <dd className="text-white text-sm">
                  {new Date(job.inspectionDate).toLocaleDateString("en-US", {
                    month: "long", day: "numeric", year: "numeric"
                  })}
                </dd>
              </div>
            )}
          </dl>

          {job.report && (
            <div className="flex items-center gap-2 text-green-400 text-sm mb-4 bg-green-900/20 rounded-lg px-3 py-2">
              <CheckCircle className="w-4 h-4 shrink-0" />
              Report generated · {job.report.pdfSizeBytes
                ? `${(job.report.pdfSizeBytes / 1024).toFixed(0)} KB`
                : ""}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={generateReport}
              disabled={generating}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 text-white py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
            >
              {generating ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : job.report ? (
                <RefreshCw className="w-5 h-5" />
              ) : (
                <Download className="w-5 h-5" />
              )}
              {generating
                ? "Generating..."
                : job.report
                ? "Regenerate & Download"
                : "Generate & Download PDF"}
            </button>

            {job.report && (
              <button
                onClick={downloadExisting}
                className="sm:w-auto bg-slate-800 hover:bg-slate-700 text-white py-3 px-5 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Download className="w-5 h-5" />
                Re-download
              </button>
            )}
          </div>
        </div>

        {/* Next steps */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <h3 className="text-slate-300 font-medium text-sm mb-3">What&apos;s in the report</h3>
          <ul className="space-y-1.5 text-sm text-slate-400">
            <li className="flex gap-2"><span className="text-amber-400">·</span> Cover page with job details and system summary</li>
            <li className="flex gap-2"><span className="text-amber-400">·</span> Visual inspection — modules, mounting, inverters, shading</li>
            <li className="flex gap-2"><span className="text-amber-400">·</span> Electrical analysis — voltage, amperage, fuse readings</li>
            <li className="flex gap-2"><span className="text-amber-400">·</span> System specifications — panel count, brand, wattage</li>
            <li className="flex gap-2"><span className="text-amber-400">·</span> Photo gallery with AI-generated descriptions</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
