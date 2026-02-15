"use client";

import { useState } from "react";
import type { MemoryWithPhotos } from "@/lib/types/database";

function extractSpotifyTrackId(url: string): string | null {
  const match = url.match(/\/track\/([a-zA-Z0-9]+)/);
  return match ? match[1] : null;
}

export function VinylRecord({ memory }: { memory: MemoryWithPhotos }) {
  const [spinning, setSpinning] = useState(false);
  const trackId = memory.song_url
    ? extractSpotifyTrackId(memory.song_url)
    : null;

  return (
    <div className="flex flex-col items-center">
      {/* The vinyl record */}
      <button
        onClick={() => setSpinning(!spinning)}
        className="relative w-48 h-48 sm:w-56 sm:h-56 cursor-pointer group"
        aria-label={spinning ? "Pause record" : "Play record"}
      >
        {/* Outer record disc */}
        <div
          className={`absolute inset-0 rounded-full vinyl-disc ${
            spinning ? "vinyl-spin" : "vinyl-paused"
          }`}
        >
          {/* Album art in center */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-[40%] h-[40%] rounded-full overflow-hidden border-2 border-black/30 z-10">
              {memory.song_album_art_url ? (
                <img
                  src={memory.song_album_art_url}
                  alt={memory.song_title || "Album art"}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-brown-warm/30 flex items-center justify-center">
                  <span className="text-2xl">&#9835;</span>
                </div>
              )}
            </div>
          </div>

          {/* Center hole */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-parchment z-20" />
        </div>

        {/* Play/pause overlay on hover */}
        <div className="absolute inset-0 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/10 z-30">
          <span className="text-white text-3xl drop-shadow-lg">
            {spinning ? "\u23F8" : "\u25B6"}
          </span>
        </div>
      </button>

      {/* Song info */}
      <div className="mt-4 text-center">
        {memory.song_title && (
          <p className="font-handwritten text-xl text-brown-deep">
            {memory.song_title}
          </p>
        )}
        {memory.song_artist && (
          <p className="text-sm text-brown-deep/60">{memory.song_artist}</p>
        )}
        {memory.note && (
          <p className="font-handwritten text-lg text-brown-deep/70 mt-1 italic">
            {memory.note}
          </p>
        )}
      </div>

      {/* Spotify embed player or fallback link */}
      {trackId ? (
        <div className="mt-4 w-full max-w-[300px] rounded-xl overflow-hidden">
          <iframe
            src={`https://open.spotify.com/embed/track/${trackId}?utm_source=oembed&theme=0`}
            width="100%"
            height="80"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            title={`Spotify: ${memory.song_title || "Song"}`}
            className="rounded-xl border-0"
          />
        </div>
      ) : (
        memory.song_url && (
          <a
            href={memory.song_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 text-sm text-brown-warm hover:underline"
          >
            Listen &rarr;
          </a>
        )
      )}
    </div>
  );
}
