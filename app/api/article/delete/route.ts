import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { Article } from "@/models/Article";

export async function DELETE(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: "Article ID required" }, { status: 400 });
    }

    const deletedArticle = await Article.findByIdAndDelete(id);

    if (!deletedArticle) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Article deleted successfully" });
  } catch (error) {
    console.error("Delete article error:", error);
    return NextResponse.json({ error: "Failed to delete article" }, { status: 500 });
  }
}
