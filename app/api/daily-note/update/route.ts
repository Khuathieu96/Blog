// API route for updating a daily note
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { Note } from "@/models/DailyNote";
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
    const { id, header, content } = body;

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

    const note = await Note.findByIdAndUpdate(
      id,
      {
        header: header.trim(),
        content: content || "",
        updatedAt: new Date()
      },
      { new: true }
    );

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
