"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sun, Plus, LayoutDashboard, FileText } from "lucide-react";

export function Nav() {
  const pathname = usePathname();

  const links = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/jobs/new", label: "New Job", icon: Plus },
    { href: "/templates", label: "Templates", icon: FileText },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800 bg-[#0f172a]/95 backdrop-blur">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="w-7 h-7 rounded-lg bg-amber-500 flex items-center justify-center">
            <Sun className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-white hidden sm:block">Solar Inspector</span>
        </Link>

        {/* Nav links */}
        <nav className="flex items-center gap-1 flex-1">
          {links.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== "/" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors ${
                  active
                    ? "bg-slate-800 text-white"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:block">{label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
