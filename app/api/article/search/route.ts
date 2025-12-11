import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { Article } from "@/models/Article";

export async function GET(req: Request) {
  await connectDB();
  const url = new URL(req.url);
  const q = url.searchParams.get("q") || "";
  const limit = Number(url.searchParams.get("limit") || "10");

  const result = await Article.find({
    $or: [
      { header: { $regex: q, $options: "i" } },
      { tags: { $regex: q, $options: "i" } },
      { content: { $regex: q, $options: "i" } }
    ]
  }).limit(limit).lean();

  return NextResponse.json(result);
}
