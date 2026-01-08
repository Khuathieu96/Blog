// API route for updating a daily note
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { Note } from "@/models/DailyNote";
import { NoteFolder } from "@/models/NoteFolder";
import { validateAuth } from "@/lib/auth-utils";

export async function PUT(req: NextRequest) {
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
    const { id, header, content, folderId } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Note ID is required" },
        { status: 400 }
      );
    }

    if (!header || !header.trim()) {
      return NextResponse.json(
        { error: "Header is required" },
        { status: 400 }
      );
    }

    const updateData: any = {
      header: header.trim(),
      content: content || "",
      updatedAt: new Date()
    };

    // If folderId is provided, verify it exists
    if (folderId) {
      const folder = await NoteFolder.findById(folderId);
      if (!folder) {
        return NextResponse.json(
          { error: "Folder not found" },
          { status: 404 }
        );
      }
      updateData.folder = folderId;
    }

    const note = await Note.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).populate('folder', 'name isCollapsed');

    if (!note) {
      return NextResponse.json(
        { error: "Note not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(note);
  } catch (error) {
    console.error("Error updating daily note:", error);
    return NextResponse.json(
      { error: "Failed to update daily note" },
      { status: 500 }
    );
  }
}
