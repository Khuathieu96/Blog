import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { Article } from "@/models/Article";
import { Tag } from "@/models/Tag";

const ADMIN_PASSWORD = "090696";

export async function PUT(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { id, password, header, content, tags } = body;

    if (!id) {
      return NextResponse.json({ error: "Article ID required" }, { status: 400 });
    }

    if (password !== ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    if (!header) {
      return NextResponse.json({ error: "Header required" }, { status: 400 });
    }

    // Process tags - create new ones if they don't exist
    const processedTags: string[] = [];
    if (tags && Array.isArray(tags)) {
      for (const tagName of tags) {
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

    const updatedArticle = await Article.findByIdAndUpdate(
      id,
      { header, content, tags: processedTags },
      { new: true }
    );

    if (!updatedArticle) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, article: updatedArticle });
  } catch (error) {
    console.error("Update article error:", error);
    return NextResponse.json({ error: "Failed to update article" }, { status: 500 });
  }
}
