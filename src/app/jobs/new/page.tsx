"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";

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
    <div className="min-h-screen bg-slate-950">
      <header className="border-b border-slate-800 px-6 py-4 flex items-center gap-4">
        <Link href="/" className="text-slate-400 hover:text-white transition-colors"><ArrowLeft className="w-5 h-5" /></Link>
        <h1 className="font-semibold">New Inspection</h1>
      </header>

      <main className="max-w-lg mx-auto px-6 py-8">
        <form onSubmit={submit} className="space-y-4">
          {[
            { name: "address", label: "Address", placeholder: "123 Main St, City, State" },
            { name: "clientName", label: "Client Name", placeholder: "John Smith" },
            { name: "inspectorName", label: "Inspector Name", placeholder: "Your name" },
          ].map(({ name, label, placeholder }) => (
            <div key={name}>
              <label className="block text-sm text-slate-400 mb-1">{label}</label>
              <input
                type="text"
                placeholder={placeholder}
                value={form[name as keyof typeof form]}
                onChange={(e) => setForm({ ...form, [name]: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>
          ))}
          <div>
            <label className="block text-sm text-slate-400 mb-1">Inspection Date</label>
            <input
              type="date"
              value={form.inspectionDate}
              onChange={(e) => setForm({ ...form, inspectionDate: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-amber-500"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-amber-500 hover:bg-amber-400 disabled:bg-slate-700 text-black disabled:text-slate-500 font-medium py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating…</> : "Create Inspection"}
          </button>
        </form>
      </main>
    </div>
  );
}
