"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Photo {
  id: string;
  originalName: string;
  processedPath: string | null;
  imageData: string | null;
}

function convertHeicToJpeg(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      try {
        const { naturalWidth: w, naturalHeight: h } = img;
        if (!w || !h) throw new Error(`${file.name}: decoded with zero dimensions`);
        const MAX = 1568;
        const scale = Math.min(MAX / w, MAX / h, 1);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(w * scale);
        canvas.height = Math.round(h * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Canvas unavailable");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          (blob) => blob
            ? resolve(new File([blob], file.name.replace(/\.(heic|heif)$/i, ".jpg"), { type: "image/jpeg" }))
            : reject(new Error(`${file.name}: canvas export failed`)),
          "image/jpeg", 0.85
        );
      } catch (e) { reject(e); }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`${file.name}: browser can't decode this file — open in Photos → Share → Save as JPEG`));
    };
    img.src = url;
  });
}

async function prepare(file: File): Promise<File> {
  if (!/\.(heic|heif)$/i.test(file.name)) return file;

  // Stage 1: canvas via OS HEIC codec (fast, works for most HEIC on macOS)
  try { return await convertHeicToJpeg(file); } catch { /* try next */ }

  // Stage 2: heic2any WASM (handles HEVC variant that the OS codec misses)
  try {
    const { default: heic2any } = await import("heic2any");
    const blob = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.8 }) as Blob;
    const out = Array.isArray(blob) ? blob[0] : blob;
    return new File([out], file.name.replace(/\.(heic|heif)$/i, ".jpg"), { type: "image/jpeg" });
  } catch { /* fall through */ }

  // Both converters failed — ask user to export manually
  throw new Error(
    `${file.name}: couldn't convert HEIC — open in Photos → Share → Save to Files as JPEG, then re-upload.`
  );
}

async function uploadOne(jobId: string, file: File): Promise<Photo[]> {
  const form = new FormData();
  form.append("jobId", jobId);
  form.append("photos", file, file.name);
  const res = await fetch("/api/photos/upload", { method: "POST", body: form });
  const ct = res.headers.get("content-type") ?? "";
  if (!ct.includes("application/json")) throw new Error(`Server error (${res.status})`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Upload failed");
  return data.photos as Photo[];
}

interface Props {
  jobId: string;
  initialPhotos?: Photo[];
  onChange?: (photos: Photo[]) => void;
}

export function PhotoUploader({ jobId, initialPhotos = [], onChange }: Props) {
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState("");

  function update(next: Photo[]) { setPhotos(next); onChange?.(next); }

  const onDrop = useCallback(async (files: File[]) => {
    if (!files.length) return;
    setUploading(true);
    let current = [...photos];
    let ok = 0;
    const errs: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const isHeic = /\.(heic|heif)$/i.test(file.name);
      setProgress(isHeic
        ? `Converting HEIC ${i + 1} of ${files.length}… (may take a moment)`
        : `Processing ${i + 1} of ${files.length}…`);
      let ready: File;
      try { ready = await prepare(file); }
      catch (e) { errs.push(e instanceof Error ? e.message : `${file.name}: failed`); continue; }

      setProgress(`Uploading ${i + 1} of ${files.length}…`);
      try {
        const uploaded = await uploadOne(jobId, ready);
        current = [...current, ...uploaded];
        update(current);
        ok++;
      } catch (e) { errs.push(`${file.name}: ${e instanceof Error ? e.message : "failed"}`); }
    }

    setProgress(""); setUploading(false);
    if (ok > 0) toast.success(`${ok} photo${ok !== 1 ? "s" : ""} uploaded`);
    if (errs.length > 0) toast.error(errs.join("\n"));
  }, [jobId, photos]);

  async function remove(id: string) {
    await fetch(`/api/photos/${id}`, { method: "DELETE" });
    update(photos.filter((p) => p.id !== id));
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif", ".HEIC", ".HEIF"] },
    disabled: uploading,
  });

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors
          ${isDragActive ? "border-amber-500 bg-amber-500/10" : "border-slate-700 hover:border-slate-500 bg-slate-900/50"}
          ${uploading ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-3">
          {uploading ? <Loader2 className="w-10 h-10 text-amber-400 animate-spin" /> : <Upload className="w-10 h-10 text-slate-500" />}
          <div>
            <p className="text-slate-300 font-medium">{uploading ? progress || "Uploading…" : "Drop photos here"}</p>
            <p className="text-slate-500 text-sm mt-1">HEIC · JPEG · PNG · WebP</p>
          </div>
        </div>
      </div>

      {photos.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
          {photos.map((p) => (
            <div key={p.id} className="relative group aspect-square">
              <div className="w-full h-full rounded-lg overflow-hidden bg-slate-800 border border-slate-700">
                {p.processedPath
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={`/api/photos/${p.id}`} alt={p.originalName} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center"><ImageIcon className="w-6 h-6 text-slate-600" /></div>}
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-black/70 px-1 py-0.5 rounded-b-lg">
                <p className="text-[9px] text-slate-300 truncate">{p.originalName}</p>
              </div>
              <button onClick={() => remove(p.id)} className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <X className="w-3 h-3 text-white" />
              </button>
            </div>
          ))}
        </div>
      )}
      {photos.length > 0 && <p className="text-xs text-slate-500">{photos.length} photo{photos.length !== 1 ? "s" : ""}</p>}
    </div>
  );
}
