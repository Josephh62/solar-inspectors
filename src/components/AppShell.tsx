"use client";

import Link from "next/link";
import { ArrowLeft, LogOut } from "lucide-react";
import { AvaxLogo } from "./AvaxLogo";
import { signOut, useSession } from "next-auth/react";

// ── Header shared across all app pages ───────────────────────────────────────

interface AppHeaderProps {
  backHref?: string;
  backLabel?: string;
  crumb?: string;
  subCrumb?: string;
  actions?: React.ReactNode;
}

export function AppHeader({ backHref, backLabel = "Back", crumb, subCrumb, actions }: AppHeaderProps) {
  const { data: session } = useSession();

  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-white border-b border-black/8">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center gap-3">

        {/* Back */}
        {backHref && (
          <Link
            href={backHref}
            className="flex items-center gap-1.5 text-slate-400 hover:text-[#060c18] transition-all duration-200 hover:-translate-x-0.5 shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">{backLabel}</span>
          </Link>
        )}

        {/* AVAX home link */}
        <Link href="/" className="flex items-center gap-2 group shrink-0">
          <AvaxLogo dark className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
          <span className="font-bold text-sm tracking-tight text-[#060c18] group-hover:text-slate-600 transition-colors duration-200">
            AVAX
          </span>
        </Link>

        {/* Breadcrumb */}
        {crumb && (
          <>
            <span className="text-slate-300 shrink-0">/</span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-[#060c18] truncate">{crumb}</p>
              {subCrumb && <p className="text-xs text-slate-400 truncate">{subCrumb}</p>}
            </div>
          </>
        )}

        {!crumb && <div className="flex-1" />}

        {/* Right actions */}
        <div className="flex items-center gap-2 shrink-0">
          {actions}
          {session && (
            <button
              onClick={() => signOut({ callbackUrl: "/sign-in" })}
              className="flex items-center gap-1.5 text-slate-400 hover:text-[#060c18] text-sm font-medium transition-colors duration-150 px-2 py-1 rounded-lg hover:bg-black/5"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

// ── Footer shared across all app pages ───────────────────────────────────────

export function AppFooter() {
  return (
    <footer className="border-t border-white/8 py-10 mt-auto">
      <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-600">
        <div className="flex items-center gap-2">
          <AvaxLogo className="w-4 h-4 opacity-40" />
          <span className="font-semibold">AVAX</span>
          <span className="ml-1">© {new Date().getFullYear()}</span>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/"           className="hover:text-slate-400 transition-colors duration-150">Home</Link>
          <Link href="/dashboard"  className="hover:text-slate-400 transition-colors duration-150">Dashboard</Link>
          <Link href="/jobs/new"   className="hover:text-slate-400 transition-colors duration-150">New Report</Link>
        </div>
      </div>
    </footer>
  );
}

// ── Button styles ────────────────────────────────────────────────────────────

export const darkBtn = [
  "inline-flex items-center gap-2 bg-[#060c18] text-white font-semibold px-4 py-2 rounded-lg text-sm",
  "transition-all duration-150 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/25 active:scale-[0.96] active:translate-y-0",
].join(" ");

export const outlineBtn = [
  "inline-flex items-center gap-1.5 text-slate-500 hover:text-[#060c18] font-medium px-3 py-2 rounded-lg text-sm",
  "border border-black/12 hover:border-black/25 transition-all duration-150 hover:bg-black/3 active:scale-[0.96]",
].join(" ");
