// API route for updating a daily note
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { Note } from "@/models/DailyNote";

const ADMIN_PASSWORD = "090696";

export async function PUT(req: Request) {
  try {
    await connectDB();

    const body = await req.json();
    const { id, header, content, password } = body;

    if (password !== ADMIN_PASSWORD) {
      return NextResponse.json(
        { error: "Invalid password" },
        { status: 401 }
      );
    }

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
