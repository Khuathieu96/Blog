// Column API: POST create, PUT update, DELETE
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { KanbanBoard } from "@/models/KanbanBoard";
import { KanbanColumn } from "@/models/KanbanColumn";
import { KanbanTask } from "@/models/KanbanTask";
import { validateAuth } from "@/lib/auth-utils";

// Helper to check board access
async function checkBoardAccess(boardId: string, userId: string) {
  const board = await KanbanBoard.findById(boardId);
  if (!board) return false;

  return board.owner.toString() === userId ||
    board.members.some((m: any) => m.toString() === userId);
}

// POST /api/kanban/column - Create column
export async function POST(req: NextRequest) {
  const auth = await validateAuth(req);
  if (!auth.isValid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const data = await req.json();

  if (!data?.boardId || !data?.title) {
    return NextResponse.json({ error: "boardId and title required" }, { status: 400 });
  }

  const hasAccess = await checkBoardAccess(data.boardId, auth.userId!);
  if (!hasAccess) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  // Get max order for this board
  const maxOrderCol = await KanbanColumn.findOne({ board: data.boardId })
    .sort({ order: -1 })
    .select('order');
  const order = maxOrderCol ? maxOrderCol.order + 1 : 0;

  const column = await KanbanColumn.create({
    board: data.boardId,
    title: data.title,
    color: data.color || "#e2e8f0",
    order
  });

  return NextResponse.json(column);
}

// PUT /api/kanban/column - Update column (title, order, color)
export async function PUT(req: NextRequest) {
  const auth = await validateAuth(req);
  if (!auth.isValid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const data = await req.json();

  if (!data?.id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  const column = await KanbanColumn.findById(data.id);
  if (!column) {
    return NextResponse.json({ error: "Column not found" }, { status: 404 });
  }

  const hasAccess = await checkBoardAccess(column.board.toString(), auth.userId!);
  if (!hasAccess) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  // Handle reordering
  if (data.order !== undefined && data.order !== column.order) {
    const oldOrder = column.order;
    const newOrder = data.order;

    if (newOrder > oldOrder) {
      // Moving down: decrease order of columns in between
      await KanbanColumn.updateMany(
        { board: column.board, order: { $gt: oldOrder, $lte: newOrder } },
        { $inc: { order: -1 } }
      );
    } else {
      // Moving up: increase order of columns in between
      await KanbanColumn.updateMany(
        { board: column.board, order: { $gte: newOrder, $lt: oldOrder } },
        { $inc: { order: 1 } }
      );
    }
  }

  const updated = await KanbanColumn.findByIdAndUpdate(
    data.id,
    {
      title: data.title ?? column.title,
      color: data.color ?? column.color,
      order: data.order ?? column.order
    },
    { new: true }
  );

  return NextResponse.json(updated);
}

// DELETE /api/kanban/column - Delete column
export async function DELETE(req: NextRequest) {
  const auth = await validateAuth(req);
  if (!auth.isValid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const data = await req.json();

  if (!data?.id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  const column = await KanbanColumn.findById(data.id);
  if (!column) {
    return NextResponse.json({ error: "Column not found" }, { status: 404 });
  }

  const hasAccess = await checkBoardAccess(column.board.toString(), auth.userId!);
  if (!hasAccess) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  // Delete all tasks in this column
  await KanbanTask.deleteMany({ column: data.id });

  // Update order of remaining columns
  await KanbanColumn.updateMany(
    { board: column.board, order: { $gt: column.order } },
    { $inc: { order: -1 } }
  );

  await KanbanColumn.findByIdAndDelete(data.id);

  return NextResponse.json({ success: true });
}
