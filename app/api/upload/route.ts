import { NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";

export async function POST(req: Request) {
  try {
    const { base64 } = await req.json();
    if (!base64) return NextResponse.json({ error: "No base64 provided" }, { status: 400 });
    const upload = await cloudinary.uploader.upload(base64, { folder: "blog" });
    return NextResponse.json({ url: upload.secure_url });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}
