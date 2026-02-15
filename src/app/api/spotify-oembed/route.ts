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

    return NextResponse.json({
      title: data.title,
      thumbnail_url: data.thumbnail_url,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch Spotify metadata" },
      { status: 500 }
    );
  }
}
