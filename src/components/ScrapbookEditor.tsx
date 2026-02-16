"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Scrapbook, MemoryWithPhotos } from "@/lib/types/database";
import { MemoryCard } from "@/components/MemoryCard";
import { SongMemoryCard } from "@/components/SongMemoryCard";

export function ScrapbookEditor({
  scrapbook: initialScrapbook,
  initialMemories,
  userId,
}: {
  scrapbook: Scrapbook;
  initialMemories: MemoryWithPhotos[];
  userId: string;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [scrapbook, setScrapbook] = useState(initialScrapbook);
  const [memories, setMemories] = useState(initialMemories);
  const [saving, setSaving] = useState(false);
  const [nameA, setNameA] = useState(scrapbook.name_a);
  const [nameB, setNameB] = useState(scrapbook.name_b);

  const handleUpdateTitle = async () => {
    if (!nameA.trim() || !nameB.trim()) return;
    setSaving(true);
    const title = `${nameA.trim()} + ${nameB.trim()}`;
    const { data } = await supabase
      .from("scrapbooks")
      .update({ title, name_a: nameA.trim(), name_b: nameB.trim() } as never)
      .eq("id", scrapbook.id)
      .select()
      .single()
      .returns<Scrapbook>();
    if (data) setScrapbook(data);
    setSaving(false);
  };

  const handleAddMemory = async (position: "top" | "bottom") => {
    const sortOrder =
      position === "top"
        ? Math.min(0, ...memories.map((m) => m.sort_order)) - 1
        : Math.max(0, ...memories.map((m) => m.sort_order)) + 1;

    const { data } = await supabase
      .from("memories")
      .insert({
        scrapbook_id: scrapbook.id,
        note: "",
        sort_order: sortOrder,
      } as never)
      .select("*, memory_photos(*)")
      .single()
      .returns<MemoryWithPhotos>();

    if (data) {
      setMemories(
        position === "top" ? [data, ...memories] : [...memories, data]
      );
    }
  };

  const handleAddSongMemory = async (position: "top" | "bottom") => {
    const sortOrder =
      position === "top"
        ? Math.min(0, ...memories.map((m) => m.sort_order)) - 1
        : Math.max(0, ...memories.map((m) => m.sort_order)) + 1;

    const { data } = await supabase
      .from("memories")
      .insert({
        scrapbook_id: scrapbook.id,
        type: "song",
        note: "",
        sort_order: sortOrder,
      } as never)
      .select("*, memory_photos(*)")
      .single()
      .returns<MemoryWithPhotos>();

    if (data) {
      setMemories(
        position === "top" ? [data, ...memories] : [...memories, data]
      );
    }
  };

  const handleUpdateMemory = (updated: MemoryWithPhotos) => {
    setMemories(memories.map((m) => (m.id === updated.id ? updated : m)));
  };

  const handleDeleteMemory = async (memoryId: string) => {
    // Delete photos from storage first
    const memory = memories.find((m) => m.id === memoryId);
    if (memory?.memory_photos.length) {
      const paths = memory.memory_photos.map((p) => p.storage_path);
      await supabase.storage.from("snapbook-photos").remove(paths);
    }

    const { error } = await supabase
      .from("memories")
      .delete()
      .eq("id", memoryId);

    if (!error) {
      setMemories(memories.filter((m) => m.id !== memoryId));
    }
  };

  const handleMoveMemory = async (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= memories.length) return;

    // Swap in array
    const newMemories = [...memories];
    [newMemories[index], newMemories[targetIndex]] = [
      newMemories[targetIndex],
      newMemories[index],
    ];

    // Assign sort_order 1..N to lock in the new arrangement
    const ordered = newMemories.map((m, i) => ({
      ...m,
      sort_order: i + 1,
    }));

    setMemories(ordered);

    // Persist all sort_orders to DB
    await Promise.all(
      ordered.map((m) =>
        supabase
          .from("memories")
          .update({ sort_order: m.sort_order } as never)
          .eq("id", m.id)
      )
    );
  };

  return (
    <div className="scrapbook-bg min-h-screen">
      {/* Header */}
      <header className="bg-white/60 backdrop-blur-sm border-b border-parchment-dark/20 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => router.push("/dashboard")}
            className="text-sm text-brown-deep/60 hover:text-brown-deep transition-colors cursor-pointer"
          >
            &larr; Dashboard
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => router.push(`/scrapbook/${scrapbook.id}`)}
              className="text-sm bg-brown-deep hover:bg-brown-deep/90 text-white rounded-md px-4 py-1.5 transition-colors cursor-pointer"
            >
              Preview
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Title editor */}
        <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 mb-8 shadow-sm border border-parchment-dark/20">
          <h2 className="font-display text-xl font-semibold text-brown-deep mb-4">
            Snapbook Details
          </h2>
          <div className="flex gap-3 items-end flex-wrap">
            <div className="flex-1 min-w-[140px]">
              <label className="block text-sm font-medium text-brown-deep/70 mb-1">
                Name A
              </label>
              <input
                value={nameA}
                onChange={(e) => setNameA(e.target.value)}
                className="w-full rounded-md border border-parchment-dark/30 px-3 py-2 text-brown-deep bg-white focus:outline-none focus:ring-2 focus:ring-brown-warm/30"
              />
            </div>
            <span className="font-handwritten text-2xl text-brown-warm pb-1">
              +
            </span>
            <div className="flex-1 min-w-[140px]">
              <label className="block text-sm font-medium text-brown-deep/70 mb-1">
                Name B
              </label>
              <input
                value={nameB}
                onChange={(e) => setNameB(e.target.value)}
                className="w-full rounded-md border border-parchment-dark/30 px-3 py-2 text-brown-deep bg-white focus:outline-none focus:ring-2 focus:ring-brown-warm/30"
              />
            </div>
            <button
              onClick={handleUpdateTitle}
              disabled={saving}
              className="bg-brown-warm hover:bg-brown-warm/90 text-white rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 cursor-pointer"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>

        {/* Memories */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-xl font-semibold text-brown-deep">
            Memories
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => handleAddMemory("top")}
              className="bg-brown-warm hover:bg-brown-warm/90 text-white rounded-md px-4 py-2 text-sm font-medium transition-colors cursor-pointer"
            >
              + Add Memory
            </button>
            <button
              onClick={() => handleAddSongMemory("top")}
              className="bg-brown-deep hover:bg-brown-deep/90 text-white rounded-md px-4 py-2 text-sm font-medium transition-colors cursor-pointer"
            >
              + Add Song
            </button>
          </div>
        </div>

        {memories.length === 0 ? (
          <div className="text-center py-12">
            <p className="font-handwritten text-2xl text-brown-deep/40">
              No memories yet — add your first one!
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {memories.map((memory, index) => (
              <div key={memory.id} className="relative">
                {/* Reorder buttons */}
                <div className="absolute -left-10 top-1/2 -translate-y-1/2 flex flex-col gap-1 max-sm:hidden">
                  <button
                    onClick={() => handleMoveMemory(index, "up")}
                    disabled={index === 0}
                    className="w-7 h-7 flex items-center justify-center rounded-full bg-white/80 border border-parchment-dark/20 text-brown-deep/50 hover:text-brown-deep hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer text-xs"
                    title="Move up"
                  >
                    &#9650;
                  </button>
                  <button
                    onClick={() => handleMoveMemory(index, "down")}
                    disabled={index === memories.length - 1}
                    className="w-7 h-7 flex items-center justify-center rounded-full bg-white/80 border border-parchment-dark/20 text-brown-deep/50 hover:text-brown-deep hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer text-xs"
                    title="Move down"
                  >
                    &#9660;
                  </button>
                </div>

                {/* Mobile reorder buttons (inside card) */}
                <div className="sm:hidden flex gap-2 mb-2 justify-end">
                  <button
                    onClick={() => handleMoveMemory(index, "up")}
                    disabled={index === 0}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-white/80 border border-parchment-dark/20 text-brown-deep/50 hover:text-brown-deep disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer text-xs"
                  >
                    &#9650;
                  </button>
                  <button
                    onClick={() => handleMoveMemory(index, "down")}
                    disabled={index === memories.length - 1}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-white/80 border border-parchment-dark/20 text-brown-deep/50 hover:text-brown-deep disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer text-xs"
                  >
                    &#9660;
                  </button>
                </div>

                {memory.type === "song" ? (
                  <SongMemoryCard
                    memory={memory}
                    onUpdate={handleUpdateMemory}
                    onDelete={() => handleDeleteMemory(memory.id)}
                  />
                ) : (
                  <MemoryCard
                    memory={memory}
                    scrapbookId={scrapbook.id}
                    userId={userId}
                    onUpdate={handleUpdateMemory}
                    onDelete={() => handleDeleteMemory(memory.id)}
                  />
                )}
              </div>
            ))}

            {/* Bottom add buttons */}
            <div className="flex justify-center gap-3 pt-4">
              <button
                onClick={() => handleAddMemory("bottom")}
                className="bg-brown-warm hover:bg-brown-warm/90 text-white rounded-md px-5 py-2.5 text-sm font-medium transition-colors cursor-pointer"
              >
                + Add Memory
              </button>
              <button
                onClick={() => handleAddSongMemory("bottom")}
                className="bg-brown-deep hover:bg-brown-deep/90 text-white rounded-md px-5 py-2.5 text-sm font-medium transition-colors cursor-pointer"
              >
                + Add Song
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
