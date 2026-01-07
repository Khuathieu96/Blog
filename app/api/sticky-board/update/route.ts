// API route for updating a sticky note
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { StickyNote } from "@/models/StickyNote";

const ADMIN_PASSWORD = "090696";

export async function PUT(req: Request) {
  try {
    await connectDB();

    const body = await req.json();
    const { id, header, content, color, positionX, positionY, width, height, password } = body;

    // Password required only for content/header changes
    if ((header !== undefined || content !== undefined) && password !== ADMIN_PASSWORD) {
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

    const updateData: Record<string, unknown> = {
      updatedAt: new Date()
    };

    // Only include fields that are provided
    if (header !== undefined) updateData.header = header;
    if (content !== undefined) updateData.content = content;
    if (color !== undefined) updateData.color = color;
    if (positionX !== undefined) updateData.positionX = positionX;
    if (positionY !== undefined) updateData.positionY = positionY;
    if (width !== undefined) updateData.width = width;
    if (height !== undefined) updateData.height = height;

    const sticky = await StickyNote.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    if (!sticky) {
      return NextResponse.json(
        { error: "Sticky not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(sticky);
  } catch (error) {
    console.error("Error updating sticky note:", error);
    return NextResponse.json(
      { error: "Failed to update sticky note" },
      { status: 500 }
    );
  }
}
