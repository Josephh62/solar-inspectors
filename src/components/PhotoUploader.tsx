"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Photo {
  id: string;
  originalName: string;
  processedPath: string | null;
  mimeType: string;
}

interface Props {
  jobId: string;
  onPhotosChange?: (photos: Photo[]) => void;
  existingPhotos?: Photo[];
}

async function resizeJpeg(blob: Blob, name: string): Promise<File> {
  const url = URL.createObjectURL(blob);
  const img = new Image();
  await new Promise<void>((resolve) => { img.onload = () => resolve(); img.src = url; });
  URL.revokeObjectURL(url);
  const MAX = 1568;
  let w = img.naturalWidth, h = img.naturalHeight;
  if (w > MAX || h > MAX) {
    const s = Math.min(MAX / w, MAX / h);
    w = Math.round(w * s); h = Math.round(h * s);
  }
  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
  const out = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.82));
  return new File([out ?? blob], name, { type: "image/jpeg" });
}

async function prepareFile(file: File): Promise<File> {
  if (!/\.(heic|heif)$/i.test(file.name)) return file;
  try {
    const heic2any = (await import("heic2any")).default;
    const result = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.75 });
    const blob = Array.isArray(result) ? result[0] : result;
    const name = file.name.replace(/\.(heic|heif)$/i, ".jpg");
    // Keep under Netlify's 6MB request limit
    if (blob.size > 4 * 1024 * 1024) return resizeJpeg(blob, name);
    return new File([blob], name, { type: "image/jpeg" });
  } catch {
    return file;
  }
}

async function uploadOne(jobId: string, file: File): Promise<Photo[]> {
  const formData = new FormData();
  formData.append("jobId", jobId);
  formData.append("photos", file, file.name);

  const res = await fetch("/api/photos/upload", { method: "POST", body: formData });

  // Handle non-JSON responses (Netlify error pages, timeouts, etc.)
  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    throw new Error(`Server error (${res.status})`);
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Upload failed (${res.status})`);
  return data.photos as Photo[];
}

export function PhotoUploader({ jobId, onPhotosChange, existingPhotos = [] }: Props) {
  const [photos, setPhotos] = useState<Photo[]>(existingPhotos);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState("");

  const updatePhotos = (updated: Photo[]) => {
    setPhotos(updated);
    onPhotosChange?.(updated);
  };

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (!acceptedFiles.length) return;
      setUploading(true);

      let current = [...photos];
      let successCount = 0;
      const errors: string[] = [];

      for (let i = 0; i < acceptedFiles.length; i++) {
        const file = acceptedFiles[i];
        setProgress(`Processing ${i + 1} of ${acceptedFiles.length}…`);
        try {
          const prepared = await prepareFile(file);
          setProgress(`Uploading ${i + 1} of ${acceptedFiles.length}…`);
          const uploaded = await uploadOne(jobId, prepared);
          current = [...current, ...uploaded];
          updatePhotos(current);
          successCount++;
        } catch (err) {
          errors.push(`${file.name}: ${err instanceof Error ? err.message : "failed"}`);
        }
      }

      setProgress("");
      setUploading(false);

      if (successCount > 0) {
        toast.success(`${successCount} photo${successCount !== 1 ? "s" : ""} uploaded`);
      }
      if (errors.length > 0) {
        toast.error(errors.join("\n"));
      }
    },
    [jobId, photos]
  );

  const removePhoto = async (photoId: string) => {
    try {
      await fetch(`/api/photos/${photoId}`, { method: "DELETE" });
      const updated = photos.filter((p) => p.id !== photoId);
      updatePhotos(updated);
    } catch {
      toast.error("Failed to remove photo");
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif", ".HEIC", ".HEIF"],
    },
    disabled: uploading,
  });

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
          isDragActive
            ? "border-blue-500 bg-blue-500/10"
            : "border-slate-700 hover:border-slate-500 bg-slate-900/50"
        } ${uploading ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-3">
          {uploading ? (
            <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />
          ) : (
            <Upload className="w-10 h-10 text-slate-500" />
          )}
          <div>
            <p className="text-slate-300 font-medium">
              {uploading ? progress || "Uploading & processing…" : isDragActive ? "Drop photos here" : "Drop photos here"}
            </p>
            <p className="text-slate-500 text-sm mt-1">
              HEIC · JPEG · PNG · WebP — tap to browse
            </p>
          </div>
        </div>
      </div>

      {/* Thumbnail grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
          {photos.map((photo) => (
            <div key={photo.id} className="relative group aspect-square">
              <div className="w-full h-full rounded-lg overflow-hidden bg-slate-800 border border-slate-700">
                {photo.processedPath ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`/api/photos/${photo.id}`}
                    alt={photo.originalName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="w-6 h-6 text-slate-500" />
                  </div>
                )}
              </div>
              {/* Label */}
              <div className="absolute bottom-0 left-0 right-0 bg-black/70 px-1 py-0.5 rounded-b-lg">
                <p className="text-[9px] text-slate-300 truncate">{photo.originalName}</p>
              </div>
              {/* Remove button */}
              <button
                onClick={() => removePhoto(photo.id)}
                className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3 text-white" />
              </button>
            </div>
          ))}
        </div>
      )}

      {photos.length > 0 && (
        <p className="text-xs text-slate-500">{photos.length} photo{photos.length !== 1 ? "s" : ""} added</p>
      )}
    </div>
  );
}
