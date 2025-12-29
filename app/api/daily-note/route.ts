// API route for creating and listing daily notes
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { Note } from "@/models/DailyNote";

// GET - List all daily notes (sorted by newest first)
export async function GET(req: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";

    let query = {};
    if (search.trim()) {
      query = {
        $or: [
          { header: { $regex: search, $options: "i" } },
          { content: { $regex: search, $options: "i" } }
        ]
      };
    }

    const notes = await Note.find(query).sort({ createdAt: -1 });
    return NextResponse.json(notes);
  } catch (error) {
    console.error("Error fetching daily notes:", error);
    return NextResponse.json(
      { error: "Failed to fetch daily notes" },
      { status: 500 }
    );
  }
}

// POST - Create a new daily note
export async function POST(req: Request) {
  try {
    await connectDB();

    const body = await req.json();
    const { header, content } = body;

    if (!header || !header.trim()) {
      return NextResponse.json(
        { error: "Header is required" },
        { status: 400 }
      );
    }

    const note = await Note.create({
      header: header.trim(),
      content: content || "",
      createdAt: new Date(),
      updatedAt: new Date()
    });

    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    console.error("Error creating daily note:", error);
    return NextResponse.json(
      { error: "Failed to create daily note" },
      { status: 500 }
    );
  }
}
