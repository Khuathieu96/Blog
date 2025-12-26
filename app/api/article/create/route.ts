import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { Article } from "@/models/Article";
import { Tag } from "@/models/Tag";
import { customAlphabet } from "nanoid";

export async function POST(req: Request) {
  await connectDB();
  const data = await req.json();
  if (!data?.header) return NextResponse.json({ error: "header required" }, { status: 400 });
  
  // Process tags - create new ones if they don't exist
  const processedTags: string[] = [];
  if (data.tags && Array.isArray(data.tags)) {
    for (const tagName of data.tags) {
      const trimmed = tagName.trim();
      if (!trimmed) continue;
      
      // Check if tag exists (case-insensitive)
      let existingTag = await Tag.findOne({ 
        name: { $regex: new RegExp(`^${trimmed}$`, 'i') } 
      });
      
      // Create tag if it doesn't exist
      if (!existingTag) {
        try {
          existingTag = await Tag.create({ name: trimmed });
          console.log(`Created new tag: ${trimmed}`);
        } catch (error) {
          console.error(`Failed to create tag ${trimmed}:`, error);
          // If creation fails (e.g., race condition), try to find it again
          existingTag = await Tag.findOne({ 
            name: { $regex: new RegExp(`^${trimmed}$`, 'i') } 
          });
        }
      }
      
      if (existingTag) {
        processedTags.push(existingTag.name);
      }
    }
  }
  
  const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 6);
  const slugBase = data.header.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g,"");
  const slug = `${slugBase}-${nanoid()}`;
  const doc = await Article.create({ ...data, tags: processedTags, slug });
  return NextResponse.json(doc);
}
