"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Scrapbook, MemoryWithPhotos } from "@/lib/types/database";
import { VinylRecord } from "@/components/VinylRecord";

// Deterministic rotation based on index for visual variety
const rotations = [
  "-rotate-2",
  "rotate-1",
  "-rotate-1",
  "rotate-2",
  "rotate-0",
  "-rotate-3",
  "rotate-3",
];

export function ScrapbookView({
  scrapbook,
  memories,
  isSharedView = false,
}: {
  scrapbook: Scrapbook;
  memories: MemoryWithPhotos[];
  isSharedView?: boolean;
}) {
  const router = useRouter();
  const supabase = createClient();

  const getPublicUrl = (path: string) => {
    const { data } = supabase.storage
      .from("snapbook-photos")
      .getPublicUrl(path);
    return data.publicUrl;
  };

  return (
    <div className="scrapbook-bg min-h-screen">
      {/* Nav */}
      {!isSharedView && (
        <nav className="fixed top-4 left-4 z-50">
          <button
            onClick={() => router.push(`/scrapbook/${scrapbook.id}/edit`)}
            className="bg-white/80 backdrop-blur-sm text-brown-deep text-sm px-4 py-2 rounded-full shadow-md hover:bg-white transition-colors cursor-pointer"
          >
            &larr; Edit
          </button>
        </nav>
      )}

      {/* Title page */}
      <section className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
        <div className="relative">
          {/* Decorative tape */}
          <div className="tape -top-3 left-1/2 -translate-x-1/2 rotate-1 rounded-sm" />
          <div className="bg-white/90 rounded px-12 py-10 shadow-lg">
            <h1 className="font-display text-5xl sm:text-6xl font-bold text-brown-deep mb-4 italic">
              {scrapbook.name_a}
            </h1>
            <p className="font-handwritten text-4xl text-brown-warm mb-4">
              &amp;
            </p>
            <h1 className="font-display text-5xl sm:text-6xl font-bold text-brown-deep italic">
              {scrapbook.name_b}
            </h1>
          </div>
        </div>
        <p className="font-handwritten text-xl text-brown-deep/50 mt-8">
          scroll down to see our memories
        </p>
        <div className="mt-4 animate-bounce text-brown-deep/30 text-2xl">
          &darr;
        </div>
      </section>

      {/* Memories */}
      <section className="max-w-3xl mx-auto px-4 pb-24">
        {memories.map((memory, idx) => (
          <div key={memory.id} className="mb-20">
            {/* Date header */}
            {memory.date && (
              <p className="font-handwritten text-2xl text-brown-warm mb-4 text-center">
                {new Date(memory.date + "T00:00:00").toLocaleDateString(
                  "en-US",
                  {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  }
                )}
              </p>
            )}

            {memory.type === "song" ? (
              /* Song memory: vinyl record */
              <VinylRecord memory={memory} />
            ) : (
              <>
                {/* Photos as polaroids */}
                {memory.memory_photos.length > 0 && (
                  <div className="flex flex-wrap justify-center gap-6 mb-6">
                    {memory.memory_photos.map((photo, photoIdx) => (
                      <div
                        key={photo.id}
                        className={`polaroid ${rotations[(idx + photoIdx) % rotations.length]} hover:rotate-0 transition-transform duration-300`}
                        style={{ maxWidth: memory.memory_photos.length === 1 ? "380px" : "280px" }}
                      >
                        {/* Tape decoration on top */}
                        <div className="tape -top-3 left-1/2 -translate-x-1/2 -rotate-1 rounded-sm" />
                        <img
                          src={getPublicUrl(photo.storage_path)}
                          alt={photo.caption || "Memory"}
                          className="w-full aspect-[4/3] object-cover"
                        />
                        {photo.caption && (
                          <p className="font-handwritten text-center text-brown-deep/70 text-lg mt-2">
                            {photo.caption}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Note */}
                {memory.note && (
                  <div className="max-w-lg mx-auto text-center">
                    <p className="font-handwritten text-xl sm:text-2xl text-brown-deep leading-relaxed">
                      {memory.note}
                    </p>
                  </div>
                )}
              </>
            )}

            {/* Divider */}
            {idx < memories.length - 1 && (
              <div className="flex justify-center mt-12">
                <div className="w-16 h-px bg-brown-deep/15" />
                <div className="mx-3 font-handwritten text-brown-deep/20">
                  &hearts;
                </div>
                <div className="w-16 h-px bg-brown-deep/15" />
              </div>
            )}
          </div>
        ))}

        {memories.length === 0 && (
          <div className="text-center py-20">
            <p className="font-handwritten text-3xl text-brown-deep/30">
              No memories yet...
            </p>
            {!isSharedView && (
              <button
                onClick={() => router.push(`/scrapbook/${scrapbook.id}/edit`)}
                className="mt-4 text-brown-warm hover:underline cursor-pointer"
              >
                Add your first memory
              </button>
            )}
          </div>
        )}

        {/* Footer */}
        {memories.length > 0 && (
          <div className="text-center pt-8 pb-12">
            <p className="font-handwritten text-2xl text-brown-deep/40">
              ...and many more to come
            </p>
          </div>
        )}

        {/* CTA for shared view */}
        {isSharedView && (
          <div className="text-center pb-16">
            <a
              href="/"
              className="inline-block bg-brown-warm hover:bg-brown-warm/90 text-white font-medium rounded-full px-8 py-3 text-sm shadow-md transition-colors"
            >
              Make your own!
            </a>
          </div>
        )}
      </section>
    </div>
  );
}
