"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, XCircle } from "lucide-react";
import { AvaxLogo } from "@/components/AvaxLogo";

function Eyebrow({ children, light = false }: { children: React.ReactNode; light?: boolean }) {
  return (
    <p className={`text-[11px] font-semibold uppercase tracking-[0.22em] mb-6 ${light ? "text-slate-400" : "text-slate-400"}`}>
      {children}
    </p>
  );
}

function Divider() {
  return <div className="border-t border-white/8 my-24" />;
}

export default function Home() {
  return (
    <div className="min-h-screen">

      {/* ══════════════════════════════════════════════════════════════
          WHITE SECTION — nav + hero (matches iOS status bar)
      ══════════════════════════════════════════════════════════════ */}
      <div className="bg-white text-[#060c18]">

        {/* ── Nav ─────────────────────────────────────────────────── */}
        <nav className="fixed top-0 inset-x-0 z-50 bg-white border-b border-black/6">
          <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5 group">
              {/* Dark version of the logo for white bg */}
              <svg viewBox="0 0 100 88" fill="none" className="w-6 h-6 transition-transform duration-300 group-hover:scale-110">
                <defs>
                  <linearGradient id="nl" x1="50" y1="0" x2="18" y2="88" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#1e293b" />
                    <stop offset="60%" stopColor="#475569" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#64748b" stopOpacity="0.1" />
                  </linearGradient>
                  <linearGradient id="nr" x1="50" y1="0" x2="82" y2="88" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#0f172a" />
                    <stop offset="100%" stopColor="#334155" stopOpacity="0.9" />
                  </linearGradient>
                </defs>
                <path d="M50 2 L2 87 L24 87 L50 30 Z" fill="url(#nl)" />
                <path d="M50 2 L98 87 L76 87 L50 30 Z" fill="url(#nr)" />
              </svg>
              <span className="font-bold text-base tracking-tight text-[#060c18]">AVAX</span>
            </Link>

            <div className="hidden sm:flex items-center gap-8 text-sm text-slate-500">
              <a href="#problem" className="hover:text-[#060c18] transition-colors duration-150">The Problem</a>
              <a href="#how"     className="hover:text-[#060c18] transition-colors duration-150">How It Works</a>
              <a href="#why"     className="hover:text-[#060c18] transition-colors duration-150">Why AVAX</a>
            </div>

            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 bg-[#060c18] text-white font-semibold px-4 py-2 rounded-lg text-sm
                         transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20 active:translate-y-0"
            >
              Open Dashboard <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </nav>

        {/* ── Hero ─────────────────────────────────────────────────── */}
        <section className="max-w-6xl mx-auto px-6 pt-40 pb-24">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] mb-6 text-slate-400">
            Construction Reporting
          </p>

          <h1 className="text-6xl sm:text-7xl lg:text-8xl font-black leading-[0.95] tracking-[-0.03em] mb-8 max-w-4xl text-[#060c18]">
            Build reports that<br />
            <span className="text-slate-400">move jobs forward.</span>
          </h1>

          <p className="text-slate-500 text-xl sm:text-2xl max-w-2xl leading-relaxed mb-12 font-light">
            Upload site photos. AVAX delivers a complete, professional
            inspection report — analyzed, formatted, and ready to
            share in minutes.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 items-start">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2.5 bg-[#060c18] text-white font-bold px-8 py-4 rounded-xl text-lg
                         transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/30 active:translate-y-0"
            >
              Start your first report <ArrowRight className="w-5 h-5" />
            </Link>
            <a
              href="#how"
              className="inline-flex items-center gap-2 text-slate-500 hover:text-[#060c18] font-medium px-8 py-4 rounded-xl text-lg
                         border border-black/12 hover:border-black/25 transition-all duration-200 hover:bg-black/3"
            >
              See how it works
            </a>
          </div>
        </section>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          DARK SECTION — everything below the hero
      ══════════════════════════════════════════════════════════════ */}
      <div className="bg-[#060c18] text-white">
        <div className="max-w-6xl mx-auto px-6">

          {/* Stats row — first thing in the dark section */}
          <div className="flex flex-wrap gap-x-12 gap-y-6 pt-16 pb-4 border-b border-white/8">
            {[
              { stat: "< 2 min",   label: "Average report time" },
              { stat: "100%",      label: "Photo-based analysis" },
              { stat: "PDF ready", label: "Shareable instantly" },
            ].map(({ stat, label }) => (
              <div key={label}>
                <p className="text-3xl font-black tracking-tight">{stat}</p>
                <p className="text-slate-500 text-sm mt-1">{label}</p>
              </div>
            ))}
          </div>

          {/* ── The Problem ─────────────────────────────────────────── */}
          <section id="problem" className="py-24">
            <Eyebrow>The Challenge</Eyebrow>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
              <div>
                <h2 className="text-5xl sm:text-6xl font-black leading-[1.0] tracking-[-0.02em] mb-6">
                  Reporting slows<br />construction down.
                </h2>
                <p className="text-slate-400 text-lg leading-relaxed">
                  Every job needs documentation. But writing reports by hand
                  is slow, error-prone, and pulls inspectors away from
                  the work that matters.
                </p>
              </div>
              <div className="space-y-10 lg:pt-2">
                {[
                  { title: "Reports take hours to write.", body: "Hours spent at a desk writing up what was already documented with a camera. That time belongs on the job site." },
                  { title: "Details get missed.",          body: "Without structured analysis, issues fall through the cracks — and become costly surprises later." },
                  { title: "Clients want clarity.",        body: "Vague handwritten notes don't build trust or close jobs. Professional, branded reports do." },
                ].map(({ title, body }) => (
                  <div key={title} className="group">
                    <p className="font-semibold text-lg mb-2 group-hover:text-white transition-colors duration-150">{title}</p>
                    <p className="text-slate-500 leading-relaxed">{body}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <Divider />

          {/* ── How It Works ────────────────────────────────────────── */}
          <section id="how" className="pb-24">
            <Eyebrow>How AVAX Works</Eyebrow>
            <h2 className="text-5xl sm:text-6xl font-black leading-[1.0] tracking-[-0.02em] mb-16 max-w-2xl">
              From photos to<br />report in minutes.
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-1">
              {[
                { step: "01", title: "Upload your photos",  body: "Drop HEIC, JPEG, or PNG photos straight from your iPhone or any job site camera. No conversion needed." },
                { step: "02", title: "AVAX analyzes",       body: "Every photo is examined for damage, defects, materials, and compliance details. Automatically categorized and described." },
                { step: "03", title: "Download your report", body: "A professional branded PDF — ready to send to clients, contractors, or file for compliance. In under two minutes." },
              ].map(({ step, title, body }) => (
                <div key={step} className="group bg-white/3 hover:bg-white/6 border border-white/8 hover:border-white/16 rounded-2xl p-8 transition-all duration-200 hover:-translate-y-1">
                  <p className="text-slate-700 text-5xl font-black mb-6 tracking-tight">{step}</p>
                  <p className="font-semibold text-lg mb-3">{title}</p>
                  <p className="text-slate-500 leading-relaxed text-sm">{body}</p>
                </div>
              ))}
            </div>
          </section>

          <Divider />

          {/* ── Why AVAX ────────────────────────────────────────────── */}
          <section id="why" className="pb-24">
            <Eyebrow>Why AVAX</Eyebrow>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
              <div>
                <h2 className="text-5xl sm:text-6xl font-black leading-[1.0] tracking-[-0.02em] mb-6">
                  More time on-site.<br />
                  <span className="text-slate-500">Less time at a desk.</span>
                </h2>
                <p className="text-slate-400 text-lg leading-relaxed mb-8">
                  AVAX is built for the pace of construction. Upload photos
                  at the end of the day. Reports are ready before morning.
                </p>
                <Link href="/dashboard" className="inline-flex items-center gap-2 bg-white text-[#060c18] font-bold px-6 py-3 rounded-xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-white/20">
                  Open Dashboard <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="bg-white/3 border border-white/8 rounded-2xl overflow-hidden">
                <div className="grid grid-cols-3 text-xs font-semibold text-slate-500 uppercase tracking-widest px-6 py-4 border-b border-white/8">
                  <span></span>
                  <span className="text-center text-white">AVAX</span>
                  <span className="text-center">Traditional</span>
                </div>
                {[
                  { label: "Time to report",  avax: "< 2 minutes", trad: "2–4 hours" },
                  { label: "Photo analysis",  avax: "Automatic",   trad: "Manual" },
                  { label: "PDF output",      avax: "Branded PDF",  trad: "Word / paper" },
                  { label: "Detail capture",  avax: "AI-analyzed",  trad: "Memory / notes" },
                  { label: "Client-ready",    avax: "Instant",      trad: "After editing" },
                  { label: "Mobile friendly", avax: "Yes",          trad: "Rarely" },
                ].map(({ label, avax, trad }) => (
                  <div key={label} className="grid grid-cols-3 px-6 py-3.5 border-b border-white/6 last:border-0 hover:bg-white/4 transition-colors duration-150">
                    <span className="text-slate-400 text-sm">{label}</span>
                    <span className="text-center text-sm font-semibold text-white flex items-center justify-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />{avax}
                    </span>
                    <span className="text-center text-sm text-slate-600 flex items-center justify-center gap-1.5">
                      <XCircle className="w-3.5 h-3.5 text-slate-700 shrink-0" />{trad}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <Divider />

          {/* ── Built For ───────────────────────────────────────────── */}
          <section className="pb-24">
            <Eyebrow>Built For</Eyebrow>
            <h2 className="text-5xl sm:text-6xl font-black leading-[1.0] tracking-[-0.02em] mb-12 max-w-xl">
              Built for people<br />who build things.
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1">
              {[
                { who: "General Contractors", what: "Document subcontractor work and site conditions at every stage." },
                { who: "Site Inspectors",     what: "Turn a site walkthrough into a polished deliverable the same day." },
                { who: "Project Managers",    what: "Keep clients informed with clear, professional progress reports." },
                { who: "Roofing Companies",   what: "Capture damage, materials, and recommendations photo by photo." },
                { who: "Solar Installers",    what: "Inspect panel arrays and electrical systems with structured output." },
                { who: "Insurance Adjusters", what: "Generate thorough photo-backed documentation for every claim." },
              ].map(({ who, what }) => (
                <div key={who} className="group bg-white/3 hover:bg-white/6 border border-white/8 hover:border-white/16 rounded-2xl p-7 transition-all duration-200 hover:-translate-y-0.5">
                  <p className="font-semibold mb-2 group-hover:text-white transition-colors duration-150">{who}</p>
                  <p className="text-slate-500 text-sm leading-relaxed">{what}</p>
                </div>
              ))}
            </div>
          </section>

          <Divider />

          {/* ── Footer CTA ──────────────────────────────────────────── */}
          <section className="pb-32 text-center">
            <Eyebrow>Get Started</Eyebrow>
            <h2 className="text-6xl sm:text-7xl lg:text-8xl font-black leading-[0.95] tracking-[-0.03em] mb-6">
              Your job sites deserve<br />
              <span className="text-slate-500">better documentation.</span>
            </h2>
            <p className="text-slate-400 text-xl max-w-xl mx-auto mb-12 font-light leading-relaxed">
              Start building professional reports today. No setup.
              No learning curve. Just upload and go.
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-3 bg-white text-[#060c18] font-black px-10 py-5 rounded-2xl text-xl
                         transition-all duration-200 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-white/25 active:translate-y-0"
            >
              Open Dashboard <ArrowRight className="w-6 h-6" />
            </Link>
          </section>

        </div>

        {/* ── Footer ────────────────────────────────────────────────── */}
        <footer className="border-t border-white/8 py-10">
          <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-600">
            <div className="flex items-center gap-2">
              <AvaxLogo className="w-5 h-5 opacity-40" />
              <span className="font-semibold">AVAX</span>
              <span className="ml-2">© {new Date().getFullYear()}</span>
            </div>
            <div className="flex items-center gap-6">
              <Link href="/dashboard" className="hover:text-slate-400 transition-colors duration-150">Dashboard</Link>
              <Link href="/jobs/new"  className="hover:text-slate-400 transition-colors duration-150">New Report</Link>
            </div>
          </div>
        </footer>
      </div>

    </div>
  );
}
