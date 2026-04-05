import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Nav } from "@/components/Nav";
import { DeleteJobButton } from "@/components/DeleteJobButton";
import { Plus, ChevronRight, ImageIcon, CheckCircle, Clock, AlertCircle } from "lucide-react";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  DRAFT: { label: "Draft", color: "text-slate-400 bg-slate-800", icon: Clock },
  UPLOADING: { label: "Uploading", color: "text-blue-400 bg-blue-900/40", icon: Clock },
  ANALYZING: { label: "Analyzing", color: "text-amber-400 bg-amber-900/40", icon: Clock },
  REVIEW: { label: "Needs Review", color: "text-yellow-400 bg-yellow-900/40", icon: AlertCircle },
  GENERATING: { label: "Generating PDF", color: "text-purple-400 bg-purple-900/40", icon: Clock },
  COMPLETE: { label: "Complete", color: "text-green-400 bg-green-900/40", icon: CheckCircle },
  ERROR: { label: "Error", color: "text-red-400 bg-red-900/40", icon: AlertCircle },
};

export default async function DashboardPage() {
  const jobs = await prisma.job.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { photos: true } },
      report: { select: { id: true } },
    },
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Nav />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Inspection Jobs</h1>
            <p className="text-slate-400 text-sm mt-1">
              {jobs.length} job{jobs.length !== 1 ? "s" : ""} total
            </p>
          </div>
          <Link
            href="/jobs/new"
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Job
          </Link>
        </div>

        {jobs.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <ImageIcon className="w-8 h-8 text-slate-500" />
            </div>
            <h2 className="text-slate-300 font-medium mb-2">No jobs yet</h2>
            <p className="text-slate-500 text-sm mb-6">
              Upload photos to generate your first inspection report
            </p>
            <Link
              href="/jobs/new"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              Start New Job
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {jobs.map((job) => {
              const cfg = STATUS_CONFIG[job.status] ?? STATUS_CONFIG.DRAFT;
              const StatusIcon = cfg.icon;
              const href =
                job.status === "REVIEW"
                  ? `/jobs/${job.id}/review`
                  : job.status === "COMPLETE"
                  ? `/jobs/${job.id}/report`
                  : `/jobs/${job.id}`;

              return (
                <div key={job.id} className="flex items-center gap-1">
                <Link
                  href={href}
                  className="flex-1 flex items-center gap-4 p-4 bg-slate-900 border border-slate-800 rounded-xl hover:border-slate-600 transition-colors group"
                >
                  <div className="w-12 h-12 bg-slate-800 rounded-lg flex items-center justify-center shrink-0">
                    <span className="text-lg font-bold text-slate-400">
                      {job._count.photos}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">
                      {job.address || job.clientName || `Job ${job.id.slice(0, 8)}`}
                    </p>
                    <p className="text-slate-400 text-sm truncate">
                      {job.clientName && job.address ? `${job.clientName} · ` : ""}
                      {new Date(job.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <span
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium shrink-0 ${cfg.color}`}
                  >
                    <StatusIcon className="w-3 h-3" />
                    {cfg.label}
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors shrink-0" />
                </Link>
                <DeleteJobButton jobId={job.id} />
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
