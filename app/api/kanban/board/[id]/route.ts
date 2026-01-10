// GET single board, PUT update, DELETE board
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { KanbanBoard } from "@/models/KanbanBoard";
import { KanbanColumn } from "@/models/KanbanColumn";
import { KanbanTask } from "@/models/KanbanTask";
import { validateAuth } from "@/lib/auth-utils";

// Helper to check board access
async function checkBoardAccess(boardId: string, userId: string) {
  const board = await KanbanBoard.findById(boardId);
  if (!board) return { board: null, hasAccess: false };

  const hasAccess =
    board.owner.toString() === userId ||
    board.members.some((m: any) => m.toString() === userId);

  return { board, hasAccess };
}

// GET /api/kanban/board/[id] - Get board with columns and tasks
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await validateAuth(req);
  if (!auth.isValid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const { id } = await params;

  // Try to find by slug first (most common), then by ID
  let board = await KanbanBoard.findOne({ slug: id }).lean();
  if (!board && /^[a-f\d]{24}$/i.test(id)) {
    board = await KanbanBoard.findById(id).lean();
  }

  if (!board) {
    return NextResponse.json({ error: "Board not found" }, { status: 404 });
  }

  // Check access
  const hasAccess =
    (board as any).owner.toString() === auth.userId ||
    (board as any).members?.some((m: any) => m.toString() === auth.userId);

  if (!hasAccess) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  // Get columns and tasks
  const columns = await KanbanColumn.find({ board: (board as any)._id })
    .sort({ order: 1 })
    .lean();

  const tasks = await KanbanTask.find({ board: (board as any)._id })
    .sort({ order: 1 })
    .lean();

  // Organize tasks by column and nest subtasks
  const tasksByColumn: Record<string, any[]> = {};
  const taskMap = new Map<string, any>();

  // First pass: create task map and initialize columns
  columns.forEach((col: any) => {
    tasksByColumn[col._id.toString()] = [];
  });

  tasks.forEach((task: any) => {
    taskMap.set(task._id.toString(), { ...task, subtasks: [] });
  });

  // Second pass: nest subtasks and organize by column
  tasks.forEach((task: any) => {
    const taskWithSubtasks = taskMap.get(task._id.toString());
    if (task.parent) {
      const parentTask = taskMap.get(task.parent.toString());
      if (parentTask) {
        parentTask.subtasks.push(taskWithSubtasks);
      }
    } else {
      // Only top-level tasks go into columns
      const colId = task.column.toString();
      if (tasksByColumn[colId]) {
        tasksByColumn[colId].push(taskWithSubtasks);
      }
    }
  });

  return NextResponse.json({
    board,
    columns: columns.map((col: any) => ({
      ...col,
      tasks: tasksByColumn[col._id.toString()] || []
    }))
  });
}

// PUT /api/kanban/board/[id] - Update board
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await validateAuth(req);
  if (!auth.isValid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const { id } = await params;
  const data = await req.json();

  const { board, hasAccess } = await checkBoardAccess(id, auth.userId!);
  if (!board) {
    return NextResponse.json({ error: "Board not found" }, { status: 404 });
  }
  if (!hasAccess) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  // Only owner can update
  if (board.owner.toString() !== auth.userId) {
    return NextResponse.json({ error: "Only owner can update board" }, { status: 403 });
  }

  const updated = await KanbanBoard.findByIdAndUpdate(
    id,
    { name: data.name, members: data.members },
    { new: true }
  );

  return NextResponse.json(updated);
}

// DELETE /api/kanban/board/[id] - Delete board
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await validateAuth(req);
  if (!auth.isValid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const { id } = await params;

  const { board, hasAccess } = await checkBoardAccess(id, auth.userId!);
  if (!board) {
    return NextResponse.json({ error: "Board not found" }, { status: 404 });
  }

  // Only owner can delete
  if (board.owner.toString() !== auth.userId) {
    return NextResponse.json({ error: "Only owner can delete board" }, { status: 403 });
  }

  // Delete all tasks and columns
  await KanbanTask.deleteMany({ board: id });
  await KanbanColumn.deleteMany({ board: id });
  await KanbanBoard.findByIdAndDelete(id);

  return NextResponse.json({ success: true });
}
