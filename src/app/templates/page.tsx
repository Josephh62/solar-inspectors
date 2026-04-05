"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Nav } from "@/components/Nav";
import { Plus, FileText, ChevronRight, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Template {
  id: string;
  name: string;
  isDefault: boolean;
  createdAt: string;
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    fetch("/api/templates")
      .then((r) => r.json())
      .then((d) => setTemplates(d.templates))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const create = async () => {
    const res = await fetch("/api/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "New Template" }),
    });
    const data = await res.json();
    if (res.ok) {
      window.location.href = `/templates/${data.template.id}`;
    } else {
      toast.error("Failed to create template");
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this template?")) return;
    await fetch(`/api/templates/${id}`, { method: "DELETE" });
    setTemplates((prev) => prev.filter((t) => t.id !== id));
    toast.success("Template deleted");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Nav />
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Report Templates</h1>
            <p className="text-slate-400 text-sm mt-1">Customize what sections appear in your PDFs</p>
          </div>
          <button
            onClick={create}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Template
          </button>
        </div>

        {loading ? (
          <div className="text-slate-400 text-sm text-center py-10">Loading...</div>
        ) : templates.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-slate-500" />
            </div>
            <h2 className="text-slate-300 font-medium mb-2">No custom templates</h2>
            <p className="text-slate-500 text-sm mb-6">
              The default template is used for all jobs. Create a custom one to reorder or hide sections.
            </p>
            <button
              onClick={create}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Template
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {templates.map((t) => (
              <div
                key={t.id}
                className="flex items-center gap-4 p-4 bg-slate-900 border border-slate-800 rounded-xl group"
              >
                <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 text-slate-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium">
                    {t.name}
                    {t.isDefault && (
                      <span className="ml-2 text-xs bg-amber-900/40 text-amber-400 px-2 py-0.5 rounded-full">
                        Default
                      </span>
                    )}
                  </p>
                  <p className="text-slate-500 text-xs mt-0.5">
                    {new Date(t.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => remove(t.id)}
                    className="p-2 text-slate-600 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <Link
                    href={`/templates/${t.id}`}
                    className="p-2 text-slate-600 hover:text-slate-300 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
