"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Nav } from "@/components/Nav";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Eye, EyeOff, ChevronUp, ChevronDown, Save } from "lucide-react";
import Link from "next/link";
import type { TemplateSection } from "@/types/template";

export default function TemplateEditorPage() {
  const { templateId } = useParams<{ templateId: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [sections, setSections] = useState<TemplateSection[]>([]);

  useEffect(() => {
    fetch(`/api/templates/${templateId}`)
      .then((r) => r.json())
      .then((d) => {
        setName(d.template.name);
        setSections((d.template.sections as TemplateSection[]).sort((a, b) => a.order - b.order));
      })
      .finally(() => setLoading(false));
  }, [templateId]);

  const toggleVisible = (id: string) => {
    setSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, visible: !s.visible } : s))
    );
  };

  const moveUp = (idx: number) => {
    if (idx === 0) return;
    setSections((prev) => {
      const next = [...prev];
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      return next.map((s, i) => ({ ...s, order: i }));
    });
  };

  const moveDown = (idx: number) => {
    setSections((prev) => {
      if (idx >= prev.length - 1) return prev;
      const next = [...prev];
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      return next.map((s, i) => ({ ...s, order: i }));
    });
  };

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/templates/${templateId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, sections }),
      });
      if (!res.ok) throw new Error("Save failed");
      toast.success("Template saved");
      router.push("/templates");
    } catch {
      toast.error("Failed to save template");
    } finally {
      setSaving(false);
    }
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

  return (
    <div className="min-h-screen flex flex-col">
      <Nav />
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8">
        <Link
          href="/templates"
          className="flex items-center gap-1 text-slate-400 hover:text-slate-200 text-sm mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to templates
        </Link>

        <div className="mb-6">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="text-2xl font-bold text-white bg-transparent border-b border-slate-700 focus:border-blue-500 focus:outline-none w-full pb-1"
            placeholder="Template name"
          />
          <p className="text-slate-400 text-sm mt-2">
            Toggle sections on/off and reorder them. The cover page always appears first.
          </p>
        </div>

        <div className="space-y-2 mb-6">
          {sections.map((section, idx) => (
            <div
              key={section.id}
              className={`flex items-center gap-3 p-4 rounded-xl border transition-colors ${
                section.visible
                  ? "bg-slate-900 border-slate-700"
                  : "bg-slate-900/40 border-slate-800 opacity-60"
              }`}
            >
              {/* Reorder */}
              <div className="flex flex-col gap-0.5">
                <button
                  onClick={() => moveUp(idx)}
                  disabled={idx === 0}
                  className="text-slate-600 hover:text-slate-400 disabled:opacity-20 transition-colors"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
                <button
                  onClick={() => moveDown(idx)}
                  disabled={idx === sections.length - 1}
                  className="text-slate-600 hover:text-slate-400 disabled:opacity-20 transition-colors"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>

              {/* Info */}
              <div className="flex-1">
                <p className="text-white font-medium text-sm">{section.title}</p>
                <p className="text-slate-500 text-xs">
                  {section.fields.length > 0
                    ? `${section.fields.length} fields`
                    : section.id === "photo_gallery"
                    ? "All inspection photos"
                    : "No fields"}
                </p>
              </div>

              {/* Toggle */}
              <button
                onClick={() => toggleVisible(section.id)}
                className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${
                  section.visible ? "text-green-400" : "text-slate-500"
                }`}
              >
                {section.visible ? (
                  <>
                    <Eye className="w-4 h-4" /> Visible
                  </>
                ) : (
                  <>
                    <EyeOff className="w-4 h-4" /> Hidden
                  </>
                )}
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={save}
          disabled={saving}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 text-white py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          {saving ? "Saving..." : "Save Template"}
        </button>
      </main>
    </div>
  );
}
