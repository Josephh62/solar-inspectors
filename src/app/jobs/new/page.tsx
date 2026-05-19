"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { AvaxLogo } from "@/components/AvaxLogo";

export default function NewJobPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ address: "", clientName: "", inspectorName: "", inspectionDate: "" });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      const { job } = await res.json();
      router.push(`/jobs/${job.id}`);
    } else {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="sticky top-0 z-40 border-b border-white/8 bg-slate-950/80 backdrop-blur-md px-6 py-4 flex items-center gap-4">
        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-all duration-200 hover:-translate-x-0.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back</span>
        </Link>

        <Link href="/" className="flex items-center gap-2 ml-2 group">
          <AvaxLogo className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
          <span className="font-semibold text-sm tracking-tight text-slate-300 group-hover:text-white transition-colors duration-200">AVAX</span>
        </Link>

        <span className="text-slate-700 mx-1">/</span>
        <h1 className="font-semibold text-sm text-slate-300">New Report</h1>
      </header>

      <main className="max-w-lg mx-auto px-6 py-12">
        <h2 className="text-2xl font-bold tracking-tight mb-2">New Report</h2>
        <p className="text-slate-500 text-sm mb-8">Fill in the job details to get started.</p>

        <form onSubmit={submit} className="space-y-5">
          {[
            { name: "address", label: "Site Address", placeholder: "123 Main St, City, State" },
            { name: "clientName", label: "Client Name", placeholder: "John Smith" },
            { name: "inspectorName", label: "Inspector Name", placeholder: "Your name" },
          ].map(({ name, label, placeholder }) => (
            <div key={name}>
              <label className="block text-sm font-medium text-slate-400 mb-1.5">{label}</label>
              <input
                type="text"
                placeholder={placeholder}
                value={form[name as keyof typeof form]}
                onChange={(e) => setForm({ ...form, [name]: e.target.value })}
                className="w-full bg-slate-900 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-slate-600
                           focus:outline-none focus:border-white/30 focus:bg-slate-800/60 transition-all duration-200"
              />
            </div>
          ))}
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1.5">Inspection Date</label>
            <input
              type="date"
              value={form.inspectionDate}
              onChange={(e) => setForm({ ...form, inspectionDate: e.target.value })}
              className="w-full bg-slate-900 border border-white/10 rounded-lg px-4 py-3 text-white
                         focus:outline-none focus:border-white/30 focus:bg-slate-800/60 transition-all duration-200"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-white text-slate-950 disabled:bg-slate-800 disabled:text-slate-500 font-semibold py-3 rounded-xl
                       transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-white/15 active:translate-y-0
                       flex items-center justify-center gap-2 mt-2"
          >
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating…</> : "Create Report →"}
          </button>
        </form>
      </main>
    </div>
  );
}
