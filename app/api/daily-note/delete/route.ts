// API route for deleting a daily note
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { Note } from "@/models/DailyNote";

const ADMIN_PASSWORD = "090696";

export async function DELETE(req: Request) {
  try {
    await connectDB();
    
    const body = await req.json();
    const { id, password } = body;
    
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
    
    const note = await Note.findByIdAndDelete(id);
    
    if (!note) {
      return NextResponse.json(
        { error: "Note not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, message: "Note deleted" });
  } catch (error) {
    console.error("Error deleting daily note:", error);
    return NextResponse.json(
      { error: "Failed to delete daily note" },
      { status: 500 }
    );
  }
}
