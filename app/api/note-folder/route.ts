// API route for folder operations
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { NoteFolder } from "@/models/NoteFolder";
import { validateAuth } from "@/lib/auth-utils";

// GET - List all folders
export async function GET(req: NextRequest) {
  try {
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
        name: { $regex: search, $options: "i" }
      };
    }

    const folders = await NoteFolder.find(query).sort({ order: 1, name: 1 });
    return NextResponse.json(folders);
  } catch (error) {
    console.error("Error fetching folders:", error);
    return NextResponse.json(
      { error: "Failed to fetch folders" },
      { status: 500 }
    );
  }
}

// POST - Create a new folder
export async function POST(req: NextRequest) {
  try {
    const auth = await validateAuth(req);
    if (!auth.isValid) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    await connectDB();

    const body = await req.json();
    const { name } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Folder name is required" },
        { status: 400 }
      );
    }

    // Check if folder already exists
    const existing = await NoteFolder.findOne({ name: name.trim() });
    if (existing) {
      return NextResponse.json(
        { error: "Folder with this name already exists" },
        { status: 400 }
      );
    }

    const folder = await NoteFolder.create({
      name: name.trim(),
      isCollapsed: false,
      order: 0
    });

    return NextResponse.json(folder, { status: 201 });
  } catch (error) {
    console.error("Error creating folder:", error);
    return NextResponse.json(
      { error: "Failed to create folder" },
      { status: 500 }
    );
  }
}

// PUT - Update folder (name or collapsed state)
export async function PUT(req: NextRequest) {
  try {
    const auth = await validateAuth(req);
    if (!auth.isValid) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    await connectDB();

    const body = await req.json();
    const { id, name, isCollapsed } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Folder ID is required" },
        { status: 400 }
      );
    }

    const updateData: any = { updatedAt: new Date() };
    
    if (name !== undefined) {
      if (!name.trim()) {
        return NextResponse.json(
          { error: "Folder name cannot be empty" },
          { status: 400 }
        );
      }
      
      // Check if another folder has this name
      const existing = await NoteFolder.findOne({ 
        name: name.trim(),
        _id: { $ne: id }
      });
      if (existing) {
        return NextResponse.json(
          { error: "Folder with this name already exists" },
          { status: 400 }
        );
      }
      
      updateData.name = name.trim();
    }
    
    if (isCollapsed !== undefined) {
      updateData.isCollapsed = isCollapsed;
    }

    const folder = await NoteFolder.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    if (!folder) {
      return NextResponse.json(
        { error: "Folder not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(folder);
  } catch (error) {
    console.error("Error updating folder:", error);
    return NextResponse.json(
      { error: "Failed to update folder" },
      { status: 500 }
    );
  }
}
