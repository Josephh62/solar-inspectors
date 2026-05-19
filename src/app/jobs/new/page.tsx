"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { AppHeader, AppFooter, darkBtn } from "@/components/AppShell";

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
    <div className="min-h-screen bg-[#060c18] text-white flex flex-col">
      <AppHeader backHref="/dashboard" crumb="New Report" />

      <div className="pt-14 flex-1 flex flex-col">
        <main className="max-w-lg mx-auto w-full px-6 py-12 flex-1">
          <h2 className="text-2xl font-black tracking-tight mb-1">New Report</h2>
          <p className="text-slate-500 text-sm mb-8">Fill in the job details to get started.</p>

          <form onSubmit={submit} className="space-y-5">
            {[
              { name: "address",       label: "Site Address",    placeholder: "123 Main St, City, State" },
              { name: "clientName",    label: "Client Name",     placeholder: "John Smith" },
              { name: "inspectorName", label: "Inspector Name",  placeholder: "Your name" },
            ].map(({ name, label, placeholder }) => (
              <div key={name}>
                <label className="block text-sm font-medium text-slate-400 mb-1.5">{label}</label>
                <input
                  type="text"
                  placeholder={placeholder}
                  value={form[name as keyof typeof form]}
                  onChange={(e) => setForm({ ...form, [name]: e.target.value })}
                  className="w-full bg-white/4 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600
                             focus:outline-none focus:border-white/30 focus:bg-white/6 transition-all duration-200"
                />
              </div>
            ))}

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1.5">Inspection Date</label>
              <input
                type="date"
                value={form.inspectionDate}
                onChange={(e) => setForm({ ...form, inspectionDate: e.target.value })}
                className="w-full bg-white/4 border border-white/10 rounded-xl px-4 py-3 text-white
                           focus:outline-none focus:border-white/30 focus:bg-white/6 transition-all duration-200"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-white text-[#060c18] disabled:bg-white/20 disabled:text-slate-500 font-bold py-3.5 rounded-xl mt-2
                         transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-white/15 active:translate-y-0
                         flex items-center justify-center gap-2"
            >
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating…</> : "Create Report →"}
            </button>
          </form>
        </main>

        <AppFooter />
      </div>
    </div>
  );
}
