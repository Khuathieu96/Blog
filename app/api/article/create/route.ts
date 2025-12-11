import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { Article } from "@/models/Article";
import { customAlphabet } from "nanoid";

export async function POST(req: Request) {
  await connectDB();
  const data = await req.json();
  if (!data?.header) return NextResponse.json({ error: "header required" }, { status: 400 });
  const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 6);
  const slugBase = data.header.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g,"");
  const slug = `${slugBase}-${nanoid()}`;
  const doc = await Article.create({ ...data, slug });
  return NextResponse.json(doc);
}
