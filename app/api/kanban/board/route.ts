// GET all boards, POST create board
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { KanbanBoard } from "@/models/KanbanBoard";
import { KanbanColumn } from "@/models/KanbanColumn";
import { validateAuth } from "@/lib/auth-utils";
import { customAlphabet } from "nanoid";

const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 6);

// GET /api/kanban/board - List all boards for current user
export async function GET(req: NextRequest) {
  const auth = await validateAuth(req);
  if (!auth.isValid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();

  // Get boards where user is owner or member
  const boards = await KanbanBoard.find({
    $or: [
      { owner: auth.userId },
      { members: auth.userId }
    ]
  }).sort({ updatedAt: -1 }).lean();

  return NextResponse.json(boards);
}

// POST /api/kanban/board - Create new board
export async function POST(req: NextRequest) {
  const auth = await validateAuth(req);
  if (!auth.isValid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const data = await req.json();

  if (!data?.name) {
    return NextResponse.json({ error: "name required" }, { status: 400 });
  }

  const slugBase = data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const slug = `${slugBase}-${nanoid()}`;

  const board = await KanbanBoard.create({
    name: data.name,
    slug,
    owner: auth.userId,
    members: []
  });

  // Create default columns
  const defaultColumns = [
    { title: "To Do", order: 0, color: "#e2e8f0" },
    { title: "In Progress", order: 1, color: "#fef3c7" },
    { title: "Done", order: 2, color: "#d1fae5" }
  ];

  await KanbanColumn.insertMany(
    defaultColumns.map(col => ({ ...col, board: board._id }))
  );

  return NextResponse.json(board);
}
