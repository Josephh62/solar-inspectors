"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { Plus, Trash2, ChevronRight, Loader2, FileText } from "lucide-react";
import { toast } from "sonner";
import { AppHeader, AppFooter, darkBtn } from "@/components/AppShell";

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
  DRAFT:      { label: "Draft",      classes: "bg-white/8 text-slate-400 border border-white/12" },
  ANALYZING:  { label: "Analyzing",  classes: "bg-blue-950 text-blue-300 border border-blue-800" },
  REVIEW:     { label: "Review",     classes: "bg-amber-950 text-amber-300 border border-amber-800" },
  GENERATING: { label: "Generating", classes: "bg-purple-950 text-purple-300 border border-purple-800" },
  COMPLETE:   { label: "Complete",   classes: "bg-emerald-950 text-emerald-300 border border-emerald-800" },
  ERROR:      { label: "Error",      classes: "bg-red-950 text-red-400 border border-red-800" },
};

// ── Swipeable card ────────────────────────────────────────────────────────────

const REVEAL = 80;       // px revealed for delete button
const SNAP   = 36;       // px drag required to snap open

function SwipeableCard({
  onDelete,
  children,
}: {
  onDelete: () => void;
  children: React.ReactNode;
}) {
  const [offset, setOffset]   = useState(0);
  const [open, setOpen]       = useState(false);
  const startX    = useRef(0);
  const isDragging = useRef(false);

  function clamp(v: number) { return Math.max(0, Math.min(v, REVEAL)); }

  function baseX() { return open ? REVEAL : 0; }

  // ── touch ──────────────────────────────────────────────────────────
  function handleTouchStart(e: React.TouchEvent) {
    startX.current  = e.touches[0].clientX + baseX();
    isDragging.current = true;
  }
  function handleTouchMove(e: React.TouchEvent) {
    if (!isDragging.current) return;
    setOffset(clamp(startX.current - e.touches[0].clientX));
  }
  function handleTouchEnd() {
    isDragging.current = false;
    commit();
  }

  // ── mouse ──────────────────────────────────────────────────────────
  function handleMouseDown(e: React.MouseEvent) {
    startX.current  = e.clientX + baseX();
    isDragging.current = true;
  }
  function handleMouseMove(e: React.MouseEvent) {
    if (!isDragging.current) return;
    setOffset(clamp(startX.current - e.clientX));
  }
  function handleMouseUp()    { isDragging.current = false; commit(); }
  function handleMouseLeave() { if (isDragging.current) { isDragging.current = false; commit(); } }

  function commit() {
    const snap = offset > SNAP;
    setOpen(snap);
    setOffset(snap ? REVEAL : 0);
  }

  function close() { setOpen(false); setOffset(0); }

  const sliding = !isDragging.current;

  return (
    <div
      className="relative rounded-2xl bg-white/10 select-none"
      onMouseLeave={handleMouseLeave}
    >
      {/* Delete icon — parent provides the background color, filling corners too */}
      <div
        className="absolute right-0 inset-y-0 w-20
                   flex flex-col items-center justify-center gap-1
                   cursor-pointer"
        onClick={onDelete}
      >
        <Trash2 className="w-4 h-4 text-white" />
        <span className="text-white text-[10px] font-semibold tracking-wide">Delete</span>
      </div>

      {/* Card content — slides left over the parent background */}
      <div
        className="relative z-[1] bg-[#060c18] rounded-2xl"
        style={{
          transform: `translateX(-${offset}px)`,
          transition: sliding ? "transform 0.28s cubic-bezier(0.25,0.46,0.45,0.94)" : "none",
          willChange: "transform",
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onClick={() => { if (open) close(); }}
      >
        {children}
      </div>
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const [jobs, setJobs]       = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  async function loadJobs() {
    const res = await fetch("/api/jobs");
    if (res.ok) setJobs((await res.json()).jobs);
    setLoading(false);
  }

  useEffect(() => { loadJobs(); }, []);

  async function deleteJob(id: string) {
    setDeleting(id);
    // let the height-collapse animation play first
    await new Promise((r) => setTimeout(r, 260));
    await fetch(`/api/jobs/${id}`, { method: "DELETE" });
    setJobs((j) => j.filter((x) => x.id !== id));
    setDeleting(null);
    toast.success("Report deleted");
  }

  const hasJobs = !loading && jobs.length > 0;

  return (
    <div className="min-h-screen bg-[#060c18] text-white flex flex-col">

      <AppHeader
        actions={
          <Link href="/jobs/new" className={darkBtn}>
            <Plus className="w-4 h-4" /> New Report
          </Link>
        }
      />

      <div className="pt-14 flex-1 flex flex-col">

        {loading && (
          <div className="flex justify-center items-center py-40">
            <Loader2 className="w-6 h-6 animate-spin text-slate-600" />
          </div>
        )}

        {/* ── Empty state ── */}
        {!loading && !hasJobs && (
          <main className="max-w-5xl mx-auto px-6 pt-20 pb-16 flex-1">
            <p className="text-[11px] font-semibold tracking-[0.22em] text-slate-500 uppercase mb-6">
              Construction Reporting
            </p>
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black leading-[1.0] tracking-[-0.03em] mb-8">
              Reports that get{" "}
              <span className="text-slate-500">the job done.</span>
            </h1>
            <p className="text-slate-400 text-lg sm:text-xl max-w-xl leading-relaxed mb-10">
              Upload job site photos. AVAX analyzes every detail and delivers a
              professional inspection report — ready to share in minutes.
            </p>
            <Link
              href="/jobs/new"
              className="inline-flex items-center gap-2 bg-white text-[#060c18] font-bold px-7 py-3.5 rounded-xl text-base
                         transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-white/20 active:translate-y-0"
            >
              <Plus className="w-5 h-5" /> Create your first report
            </Link>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 mt-20 pt-12 border-t border-white/8">
              {[
                { title: "Upload any photos",  body: "HEIC, JPEG, PNG — straight from your iPhone or any job site camera." },
                { title: "Instant analysis",   body: "Every photo examined for damage, defects, and compliance details." },
                { title: "Professional PDF",   body: "Branded reports ready to send to clients and contractors immediately." },
              ].map(({ title, body }) => (
                <div key={title} className="group bg-white/3 hover:bg-white/5 border border-white/8 rounded-2xl p-7 transition-all duration-200 hover:-translate-y-0.5">
                  <p className="font-semibold mb-2">{title}</p>
                  <p className="text-slate-500 text-sm leading-relaxed">{body}</p>
                </div>
              ))}
            </div>
          </main>
        )}

        {/* ── Reports list ── */}
        {hasJobs && (
          <main className="max-w-3xl mx-auto w-full px-6 py-10 flex-1">
            <div className="flex items-end justify-between mb-8">
              <div>
                <h1 className="text-2xl font-black tracking-tight">Reports</h1>
                <p className="text-slate-500 text-sm mt-1">{jobs.length} report{jobs.length !== 1 ? "s" : ""}</p>
              </div>
              <Link href="/jobs/new" className="inline-flex items-center gap-1.5 text-slate-500 hover:text-white text-sm font-medium transition-colors duration-150">
                <Plus className="w-4 h-4" /> New
              </Link>
            </div>

            <div className="space-y-2">
              {jobs.map((job) => {
                const s = STATUS_LABEL[job.status] ?? STATUS_LABEL.DRAFT;
                const isDeleting = deleting === job.id;

                return (
                  <div
                    key={job.id}
                    style={{
                      maxHeight: isDeleting ? 0 : 120,
                      opacity:   isDeleting ? 0 : 1,
                      marginBottom: isDeleting ? 0 : undefined,
                    }}
                    className="transition-all duration-[250ms] ease-in-out overflow-hidden"
                  >
                    <SwipeableCard onDelete={() => deleteJob(job.id)}>
                      <div className="flex items-center gap-4 bg-white/3 border border-white/8 rounded-2xl px-5 py-4
                                      transition-colors duration-200 hover:bg-white/5 hover:border-white/14">
                        <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-white/6 border border-white/10 flex items-center justify-center">
                          <FileText className="w-4 h-4 text-slate-400" />
                        </div>

                        <Link href={`/jobs/${job.id}`} className="flex-1 min-w-0">
                          <div className="flex items-center gap-2.5 mb-0.5">
                            <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${s.classes}`}>
                              {s.label}
                            </span>
                            <span className="text-xs text-slate-600">{job.photos.length} photo{job.photos.length !== 1 ? "s" : ""}</span>
                          </div>
                          <p className="font-semibold truncate">{job.address || "No address"}</p>
                          <p className="text-sm text-slate-500 truncate">{job.clientName || "No client"}</p>
                        </Link>

                        <Link href={`/jobs/${job.id}`} className="p-2 rounded-lg text-slate-600 hover:text-white hover:bg-white/8 transition-all duration-150 shrink-0">
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </SwipeableCard>
                  </div>
                );
              })}
            </div>

            <p className="text-center text-xs text-slate-800 mt-6">Swipe left to delete</p>
          </main>
        )}

        <AppFooter />
      </div>
    </div>
  );
}
