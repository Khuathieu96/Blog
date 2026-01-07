// API route for deleting a sticky note
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { StickyNote } from "@/models/StickyNote";

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
        { error: "Sticky ID is required" },
        { status: 400 }
      );
    }

    const sticky = await StickyNote.findByIdAndDelete(id);

    if (!sticky) {
      return NextResponse.json(
        { error: "Sticky not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: "Sticky deleted" });
  } catch (error) {
    console.error("Error deleting sticky note:", error);
    return NextResponse.json(
      { error: "Failed to delete sticky note" },
      { status: 500 }
    );
  }
}
