"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { MemoryWithPhotos, MemoryPhoto } from "@/lib/types/database";

function isHeic(file: File): boolean {
  const type = file.type.toLowerCase();
  if (type === "image/heic" || type === "image/heif") return true;
  const ext = file.name.split(".").pop()?.toLowerCase();
  return ext === "heic" || ext === "heif";
}

export function MemoryCard({
  memory,
  scrapbookId,
  userId,
  onUpdate,
  onDelete,
}: {
  memory: MemoryWithPhotos;
  scrapbookId: string;
  userId: string;
  onUpdate: (memory: MemoryWithPhotos) => void;
  onDelete: () => void;
}) {
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [note, setNote] = useState(memory.note);
  const [date, setDate] = useState(memory.date ?? "");
  const [songTitle, setSongTitle] = useState(memory.song_title ?? "");
  const [songArtist, setSongArtist] = useState(memory.song_artist ?? "");
  const [songUrl, setSongUrl] = useState(memory.song_url ?? "");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [converting, setConverting] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const { data } = await supabase
      .from("memories")
      .update({
        note,
        date: date || null,
        song_title: songTitle || null,
        song_artist: songArtist || null,
        song_url: songUrl || null,
      } as never)
      .eq("id", memory.id)
      .select("*, memory_photos(*)")
      .single()
      .returns<MemoryWithPhotos>();

    if (data) onUpdate(data);
    setSaving(false);
  };

  const handleUploadFiles = async (files: FileList | File[]) => {
    setUploading(true);
    setUploadError(null);
    const newPhotos: MemoryPhoto[] = [];

    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/") && !isHeic(file)) continue;

      let uploadBlob: Blob = file;
      let ext = file.name.split(".").pop() || "jpg";

      if (isHeic(file)) {
        try {
          setConverting(true);
          const heic2any = (await import("heic2any")).default;
          const converted = await heic2any({
            blob: file,
            toType: "image/jpeg",
            quality: 0.85,
          });
          uploadBlob = Array.isArray(converted) ? converted[0] : converted;
          ext = "jpg";
        } catch (err) {
          const msg = err instanceof Error ? err.message : JSON.stringify(err);
          console.error("HEIC conversion error:", msg, "| file.type:", file.type, "| file.name:", file.name, "| file.size:", file.size);
          setUploadError(`Failed to convert HEIC: ${msg}`);
          continue;
        } finally {
          setConverting(false);
        }
      }

      const fileName = `${crypto.randomUUID()}.${ext}`;
      const storagePath = `${userId}/${scrapbookId}/${memory.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("snapbook-photos")
        .upload(storagePath, uploadBlob);

      if (uploadError) {
        console.error("Upload error:", uploadError);
        continue;
      }

      const { data: photoRecord } = await supabase
        .from("memory_photos")
        .insert({
          memory_id: memory.id,
          storage_path: storagePath,
        } as never)
        .select()
        .single()
        .returns<MemoryPhoto>();

      if (photoRecord) newPhotos.push(photoRecord);
    }

    if (newPhotos.length > 0) {
      onUpdate({
        ...memory,
        memory_photos: [...memory.memory_photos, ...newPhotos],
      });
    }
    setUploading(false);
  };

  const handleDeletePhoto = async (photo: MemoryPhoto) => {
    await supabase.storage.from("snapbook-photos").remove([photo.storage_path]);
    await supabase.from("memory_photos").delete().eq("id", photo.id);
    onUpdate({
      ...memory,
      memory_photos: memory.memory_photos.filter((p) => p.id !== photo.id),
    });
  };

  const getPublicUrl = (path: string) => {
    const { data } = supabase.storage
      .from("snapbook-photos")
      .getPublicUrl(path);
    return data.publicUrl;
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      handleUploadFiles(e.dataTransfer.files);
    }
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 shadow-sm border border-parchment-dark/20">
      <div className="flex items-start justify-between mb-4">
        <h3 className="font-handwritten text-xl text-brown-deep">Memory</h3>
        <button
          onClick={onDelete}
          className="text-sm text-red-400 hover:text-red-600 transition-colors cursor-pointer"
        >
          Delete
        </button>
      </div>

      <div className="space-y-4">
        {/* Date */}
        <div>
          <label className="block text-sm font-medium text-brown-deep/70 mb-1">
            Date
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-md border border-parchment-dark/30 px-3 py-2 text-brown-deep bg-white focus:outline-none focus:ring-2 focus:ring-brown-warm/30"
          />
        </div>

        {/* Note */}
        <div>
          <label className="block text-sm font-medium text-brown-deep/70 mb-1">
            Note
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="What happened? What do you remember?"
            className="w-full rounded-md border border-parchment-dark/30 px-3 py-2 text-brown-deep bg-white focus:outline-none focus:ring-2 focus:ring-brown-warm/30 resize-none"
          />
        </div>

        {/* Song */}
        <details className="group">
          <summary className="text-sm font-medium text-brown-deep/70 cursor-pointer hover:text-brown-deep transition-colors">
            Song (optional)
          </summary>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              value={songTitle}
              onChange={(e) => setSongTitle(e.target.value)}
              placeholder="Song title"
              className="rounded-md border border-parchment-dark/30 px-3 py-2 text-sm text-brown-deep bg-white focus:outline-none focus:ring-2 focus:ring-brown-warm/30"
            />
            <input
              value={songArtist}
              onChange={(e) => setSongArtist(e.target.value)}
              placeholder="Artist"
              className="rounded-md border border-parchment-dark/30 px-3 py-2 text-sm text-brown-deep bg-white focus:outline-none focus:ring-2 focus:ring-brown-warm/30"
            />
            <input
              value={songUrl}
              onChange={(e) => setSongUrl(e.target.value)}
              placeholder="Link (Spotify, YouTube, etc.)"
              className="rounded-md border border-parchment-dark/30 px-3 py-2 text-sm text-brown-deep bg-white focus:outline-none focus:ring-2 focus:ring-brown-warm/30"
            />
          </div>
        </details>

        {/* Photos */}
        <div>
          <label className="block text-sm font-medium text-brown-deep/70 mb-2">
            Photos
          </label>

          {/* Existing photos */}
          {memory.memory_photos.length > 0 && (
            <div className="flex flex-wrap gap-3 mb-3">
              {memory.memory_photos.map((photo) => (
                <div key={photo.id} className="relative group">
                  <img
                    src={getPublicUrl(photo.storage_path)}
                    alt={photo.caption || "Memory photo"}
                    className="w-24 h-24 object-cover rounded-md border border-parchment-dark/20"
                  />
                  <button
                    onClick={() => handleDeletePhoto(photo)}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Upload area */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
              dragOver
                ? "border-brown-warm bg-brown-warm/5"
                : "border-parchment-dark/30 hover:border-brown-warm/50"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.heic,.heif"
              multiple
              onChange={(e) => {
                if (e.target.files) handleUploadFiles(e.target.files);
                e.target.value = "";
              }}
              className="hidden"
            />
            {converting ? (
              <p className="text-sm text-brown-deep/60">Converting HEIC photo...</p>
            ) : uploading ? (
              <p className="text-sm text-brown-deep/60">Uploading...</p>
            ) : (
              <p className="text-sm text-brown-deep/50">
                Drop photos here or click to upload
              </p>
            )}
          </div>
          {uploadError && (
            <p className="text-sm text-red-500 mt-2">{uploadError}</p>
          )}
        </div>

        {/* Save button */}
        <div className="flex justify-end pt-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-brown-deep hover:bg-brown-deep/90 text-white rounded-md px-5 py-2 text-sm font-medium transition-colors disabled:opacity-50 cursor-pointer"
          >
            {saving ? "Saving..." : "Save Memory"}
          </button>
        </div>
      </div>
    </div>
  );
}
