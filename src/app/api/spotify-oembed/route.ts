import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const SPOTIFY_TRACK_REGEX =
  /^https:\/\/open\.spotify\.com\/track\/[a-zA-Z0-9]+/;

export async function GET(req: NextRequest) {
  const spotifyUrl = req.nextUrl.searchParams.get("url");

  if (!spotifyUrl || !SPOTIFY_TRACK_REGEX.test(spotifyUrl)) {
    return NextResponse.json(
      { error: "Invalid Spotify track URL" },
      { status: 400 }
    );
  }

  try {
    // Fetch oEmbed for title + album art
    const oembedRes = await fetch(
      `https://open.spotify.com/oembed?url=${encodeURIComponent(spotifyUrl)}`
    );

    if (!oembedRes.ok) {
      return NextResponse.json(
        { error: "Failed to fetch track info from Spotify" },
        { status: 502 }
      );
    }

    const data = await oembedRes.json();

    // Fetch the track page to extract artist from meta description
    // Format: "Artist Name · Album · Song · Year"
    let artist: string | null = null;
    try {
      const pageRes = await fetch(spotifyUrl, {
        headers: { "User-Agent": "Mozilla/5.0" },
      });
      if (pageRes.ok) {
        const html = await pageRes.text();
        const match = html.match(
          /<meta property="og:description" content="([^"]+)"/
        );
        if (match) {
          // First segment before " · " is the artist name
          artist = match[1].split(" \u00B7 ")[0] || null;
        }
      }
    } catch {
      // Artist extraction is best-effort; continue without it
    }

    return NextResponse.json({
      title: data.title,
      artist,
      thumbnail_url: data.thumbnail_url,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch Spotify metadata" },
      { status: 500 }
    );
  }
}
