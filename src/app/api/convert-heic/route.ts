import { NextRequest, NextResponse } from "next/server";

// Force Node.js runtime — heic-convert uses WASM which requires Node, not Edge.
export const runtime = "nodejs";

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error: `File too large (${Math.round(file.size / 1024 / 1024)}MB). Maximum is 20MB.`,
        },
        { status: 413 }
      );
    }

    const inputBuffer = new Uint8Array(await file.arrayBuffer());

    // heic-convert bundles its own libheif WASM with HEVC decoder support,
    // unlike sharp on Vercel which is compiled without HEVC.
    const convert = (await import("heic-convert")).default;
    const jpegBuffer = await convert({
      buffer: inputBuffer,
      format: "JPEG",
      quality: 0.85,
    });

    return new NextResponse(Buffer.from(jpegBuffer), {
      headers: { "Content-Type": "image/jpeg" },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("HEIC conversion failed:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
