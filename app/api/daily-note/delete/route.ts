// API route for deleting a daily note
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { Note } from "@/models/DailyNote";
import { validateAuth } from "@/lib/auth-utils";

export async function DELETE(req: NextRequest) {
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
    const { id } = body;

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
