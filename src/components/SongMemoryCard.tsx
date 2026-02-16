"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { MemoryWithPhotos } from "@/lib/types/database";

const SPOTIFY_TRACK_REGEX =
  /^https:\/\/open\.spotify\.com\/track\/[a-zA-Z0-9]+/;

export function SongMemoryCard({
  memory,
  onUpdate,
  onDelete,
}: {
  memory: MemoryWithPhotos;
  onUpdate: (memory: MemoryWithPhotos) => void;
  onDelete: () => void;
}) {
  const supabase = createClient();
  const [songUrl, setSongUrl] = useState(memory.song_url ?? "");
  const [title, setTitle] = useState(memory.song_title ?? "");
  const [artist, setArtist] = useState(memory.song_artist ?? "");
  const [albumArt, setAlbumArt] = useState(memory.song_album_art_url ?? "");
  const [caption, setCaption] = useState(memory.note ?? "");
  const [fetching, setFetching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSpotify = SPOTIFY_TRACK_REGEX.test(songUrl.trim());

  const handleFetchMetadata = async () => {
    if (!songUrl.trim() || !isSpotify) return;
    setFetching(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/spotify-oembed?url=${encodeURIComponent(songUrl.trim())}`
      );
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || "Failed to fetch");
      }
      const data = await res.json();
      setTitle(data.title);
      if (data.artist) setArtist(data.artist);
      setAlbumArt(data.thumbnail_url);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch track info"
      );
    } finally {
      setFetching(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    const { data } = await supabase
      .from("memories")
      .update({
        song_url: songUrl || null,
        song_title: title || null,
        song_artist: artist || null,
        song_album_art_url: albumArt || null,
        note: caption,
      } as never)
      .eq("id", memory.id)
      .select("*, memory_photos(*)")
      .single()
      .returns<MemoryWithPhotos>();

    if (data) onUpdate(data);
    setSaving(false);
  };

  const hasMeta = !!(title || albumArt);

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 shadow-sm border border-parchment-dark/20">
      <div className="flex items-start justify-between mb-4">
        <h3 className="font-handwritten text-xl text-brown-deep flex items-center gap-2">
          <svg
            className="w-5 h-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="3" fill="currentColor" />
          </svg>
          Song
        </h3>
        <button
          onClick={onDelete}
          className="text-sm text-red-400 hover:text-red-600 transition-colors cursor-pointer"
        >
          Delete
        </button>
      </div>

      <div className="space-y-4">
        {/* URL input */}
        <div>
          <label className="block text-sm font-medium text-brown-deep/70 mb-1">
            Song Link
          </label>
          <div className="flex gap-2">
            <input
              value={songUrl}
              onChange={(e) => setSongUrl(e.target.value)}
              placeholder="https://open.spotify.com/track/..."
              className="flex-1 rounded-md border border-parchment-dark/30 px-3 py-2 text-sm text-brown-deep bg-white focus:outline-none focus:ring-2 focus:ring-brown-warm/30"
            />
            {isSpotify && (
              <button
                onClick={handleFetchMetadata}
                disabled={fetching}
                className="bg-brown-warm hover:bg-brown-warm/90 text-white rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 cursor-pointer whitespace-nowrap"
              >
                {fetching ? "Fetching..." : "Fetch"}
              </button>
            )}
          </div>
          {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
        </div>

        {/* Preview after fetch */}
        {hasMeta && albumArt && (
          <div className="flex items-center gap-4 bg-parchment/30 rounded-lg p-4">
            <img
              src={albumArt}
              alt={title}
              className="w-16 h-16 rounded-full object-cover border-2 border-brown-deep/20"
            />
            <div className="flex-1">
              <p className="font-medium text-brown-deep">{title}</p>
              {artist && (
                <p className="text-sm text-brown-deep/60">{artist}</p>
              )}
            </div>
          </div>
        )}

        {/* Title & Artist */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-brown-deep/70 mb-1">
              Title
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Song title"
              className="w-full rounded-md border border-parchment-dark/30 px-3 py-2 text-sm text-brown-deep bg-white focus:outline-none focus:ring-2 focus:ring-brown-warm/30"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-brown-deep/70 mb-1">
              Artist
            </label>
            <input
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              placeholder="Artist name"
              className="w-full rounded-md border border-parchment-dark/30 px-3 py-2 text-sm text-brown-deep bg-white focus:outline-none focus:ring-2 focus:ring-brown-warm/30"
            />
          </div>
        </div>

        {/* Caption */}
        <div>
          <label className="block text-sm font-medium text-brown-deep/70 mb-1">
            Caption (optional)
          </label>
          <input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Our song..."
            className="w-full rounded-md border border-parchment-dark/30 px-3 py-2 text-sm text-brown-deep bg-white focus:outline-none focus:ring-2 focus:ring-brown-warm/30"
          />
        </div>

        {/* Save */}
        <div className="flex justify-end pt-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-brown-deep hover:bg-brown-deep/90 text-white rounded-md px-5 py-2 text-sm font-medium transition-colors disabled:opacity-50 cursor-pointer"
          >
            {saving ? "Saving..." : "Save Song"}
          </button>
        </div>
      </div>
    </div>
  );
}
