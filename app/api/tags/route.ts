import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { Tag } from "@/models/Tag";

// GET /api/tags - Get all tags
export async function GET(req: Request) {
  try {
    await connectDB();
    const tags = await Tag.find().sort({ name: 1 }).lean();
    return NextResponse.json(tags);
  } catch (error) {
    console.error('Error fetching tags:', error);
    return NextResponse.json({ error: 'Failed to fetch tags' }, { status: 500 });
  }
}

// POST /api/tags - Create a new tag
export async function POST(req: Request) {
  try {
    await connectDB();
    const { name } = await req.json();
    
    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Tag name is required' }, { status: 400 });
    }

    const trimmedName = name.trim();
    
    // Check if tag already exists (case-insensitive)
    const existing = await Tag.findOne({ 
      name: { $regex: new RegExp(`^${trimmedName}$`, 'i') } 
    });
    
    if (existing) {
      return NextResponse.json(existing);
    }

    // Create new tag
    const tag = await Tag.create({ name: trimmedName });
    return NextResponse.json(tag);
  } catch (error) {
    console.error('Error creating tag:', error);
    return NextResponse.json({ error: 'Failed to create tag' }, { status: 500 });
  }
}
