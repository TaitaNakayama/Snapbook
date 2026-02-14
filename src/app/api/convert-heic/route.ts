import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const jpeg = await sharp(buffer).jpeg({ quality: 85 }).toBuffer();

    return new NextResponse(new Uint8Array(jpeg), {
      headers: { "Content-Type": "image/jpeg" },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("HEIC conversion failed:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
