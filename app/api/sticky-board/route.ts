// API route for creating and listing sticky notes
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { StickyNote, StickyColor } from "@/models/StickyNote";

// GET - List all sticky notes
export async function GET() {
  try {
    await connectDB();
    const stickies = await StickyNote.find().sort({ createdAt: -1 });
    return NextResponse.json(stickies);
  } catch (error) {
    console.error("Error fetching sticky notes:", error);
    return NextResponse.json(
      { error: "Failed to fetch sticky notes" },
      { status: 500 }
    );
  }
}

// POST - Create a new sticky note
export async function POST(req: Request) {
  try {
    await connectDB();

    const body = await req.json();
    const { header, content, color, positionX, positionY } = body;

    const sticky = await StickyNote.create({
      header: header || "New Sticky",
      content: content || "",
      color: (color as StickyColor) || "yellow",
      positionX: positionX ?? 100 + Math.random() * 200,
      positionY: positionY ?? 100 + Math.random() * 200,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    return NextResponse.json(sticky, { status: 201 });
  } catch (error) {
    console.error("Error creating sticky note:", error);
    return NextResponse.json(
      { error: "Failed to create sticky note" },
      { status: 500 }
    );
  }
}
