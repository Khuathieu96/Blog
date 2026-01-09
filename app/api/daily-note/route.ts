// API route for creating and listing daily notes
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { Note } from "@/models/DailyNote";
import { NoteFolder } from "@/models/NoteFolder";
import { validateAuth } from "@/lib/auth-utils";

// GET - List all daily notes (sorted by newest first) with folder info
export async function GET(req: NextRequest) {
  try {
    // Validate authentication
    const auth = await validateAuth(req);
    if (!auth.isValid) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

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

    const notes = await Note.find(query)
      .populate('folder', 'name isCollapsed')
      .sort({ createdAt: -1 });
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
export async function POST(req: NextRequest) {
  try {
    // Validate authentication
    const auth = await validateAuth(req);
    if (!auth.isValid) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    const body = await req.json();
    const { header, content, folderId } = body;

    if (!header || !header.trim()) {
      return NextResponse.json(
        { error: "Header is required" },
        { status: 400 }
      );
    }

    if (!folderId) {
      return NextResponse.json(
        { error: "Folder is required" },
        { status: 400 }
      );
    }

    // Verify folder exists
    const folder = await NoteFolder.findById(folderId);
    if (!folder) {
      return NextResponse.json(
        { error: "Folder not found" },
        { status: 404 }
      );
    }

    const note = await Note.create({
      header: header.trim(),
      content: content || "",
      folder: folderId,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Populate folder before returning
    await note.populate('folder', 'name isCollapsed');

    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    console.error("Error creating daily note:", error);
    return NextResponse.json(
      { error: "Failed to create daily note" },
      { status: 500 }
    );
  }
}
