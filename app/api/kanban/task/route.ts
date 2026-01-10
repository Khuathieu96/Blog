// Task API: POST create, PUT update, DELETE
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

// POST /api/kanban/task - Create task
export async function POST(req: NextRequest) {
  const auth = await validateAuth(req);
  if (!auth.isValid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const data = await req.json();

  if (!data?.columnId || !data?.title) {
    return NextResponse.json({ error: "columnId and title required" }, { status: 400 });
  }

  const column = await KanbanColumn.findById(data.columnId);
  if (!column) {
    return NextResponse.json({ error: "Column not found" }, { status: 404 });
  }

  const hasAccess = await checkBoardAccess(column.board.toString(), auth.userId!);
  if (!hasAccess) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  // Get max order for this column (or parent's subtasks)
  const query = data.parentId
    ? { parent: data.parentId }
    : { column: data.columnId, parent: null };

  const maxOrderTask = await KanbanTask.findOne(query)
    .sort({ order: -1 })
    .select('order');
  const order = maxOrderTask ? maxOrderTask.order + 1 : 0;

  const task = await KanbanTask.create({
    column: data.columnId,
    board: column.board,
    title: data.title,
    content: data.content || "",
    parent: data.parentId || null,
    labels: data.labels || [],
    dueDate: data.dueDate || null,
    order
  });

  return NextResponse.json(task);
}

// Helper to map column title to status
function getStatusFromColumnTitle(title: string): string | null {
  const normalized = title.toLowerCase().trim();
  if (normalized === 'backlog') return null;
  if (normalized === 'todo' || normalized === 'to do') return 'Todo';
  if (normalized === 'in progress' || normalized === 'inprogress' || normalized === 'progress') return 'In Progress';
  if (normalized === 'done' || normalized === 'completed') return 'Done';
  // Default: return title as-is
  return title;
}

// PUT /api/kanban/task - Update task
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

  const task = await KanbanTask.findById(data.id);
  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  const hasAccess = await checkBoardAccess(task.board.toString(), auth.userId!);
  if (!hasAccess) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  let newStatus = task.status;

  // Handle moving to different column
  if (data.columnId && data.columnId !== task.column.toString()) {
    // Verify new column belongs to same board
    const newColumn = await KanbanColumn.findById(data.columnId);
    if (!newColumn || newColumn.board.toString() !== task.board.toString()) {
      return NextResponse.json({ error: "Invalid column" }, { status: 400 });
    }

    // Determine new status from column title
    newStatus = getStatusFromColumnTitle(newColumn.title);

    // Check if moving to "In Progress" without dueDate
    if (newStatus === 'In Progress' && !task.dueDate && !data.dueDate) {
      return NextResponse.json({
        error: "DueDate required",
        requireDueDate: true,
        message: "Please set a due date before starting work on this task"
      }, { status: 400 });
    }

    // Get max order in new column
    const maxOrderTask = await KanbanTask.findOne({
      column: data.columnId,
      parent: task.parent
    }).sort({ order: -1 }).select('order');

    data.order = maxOrderTask ? maxOrderTask.order + 1 : 0;

    // Update orders in old column
    await KanbanTask.updateMany(
      { column: task.column, parent: task.parent, order: { $gt: task.order } },
      { $inc: { order: -1 } }
    );
  }
  // Handle reordering within same column
  else if (data.order !== undefined && data.order !== task.order) {
    const oldOrder = task.order;
    const newOrder = data.order;

    if (newOrder > oldOrder) {
      await KanbanTask.updateMany(
        { column: task.column, parent: task.parent, order: { $gt: oldOrder, $lte: newOrder } },
        { $inc: { order: -1 } }
      );
    } else {
      await KanbanTask.updateMany(
        { column: task.column, parent: task.parent, order: { $gte: newOrder, $lt: oldOrder } },
        { $inc: { order: 1 } }
      );
    }
  }

  const updateData: any = {};
  if (data.title !== undefined) updateData.title = data.title;
  if (data.content !== undefined) updateData.content = data.content;
  if (data.columnId !== undefined) updateData.column = data.columnId;
  if (data.order !== undefined) updateData.order = data.order;
  if (data.labels !== undefined) updateData.labels = data.labels;
  if (data.dueDate !== undefined) updateData.dueDate = data.dueDate;
  if (data.isCompleted !== undefined) updateData.isCompleted = data.isCompleted;

  // Workflow: Update status if column changed
  if (newStatus !== task.status) {
    updateData.status = newStatus;

    // Auto-set startDate when moving to "In Progress"
    if (newStatus === 'In Progress' && !task.startDate) {
      updateData.startDate = new Date();
    }

    // Auto-set endDate when moving to "Done"
    if (newStatus === 'Done' && !task.endDate) {
      updateData.endDate = new Date();
      updateData.isCompleted = true;
    }
  }

  const updated = await KanbanTask.findByIdAndUpdate(data.id, updateData, { new: true });

  return NextResponse.json(updated);
}

// DELETE /api/kanban/task - Delete task
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

  const task = await KanbanTask.findById(data.id);
  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  const hasAccess = await checkBoardAccess(task.board.toString(), auth.userId!);
  if (!hasAccess) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  // Delete all subtasks recursively
  async function deleteSubtasks(parentId: string) {
    const subtasks = await KanbanTask.find({ parent: parentId });
    for (const subtask of subtasks) {
      await deleteSubtasks(subtask._id.toString());
      await KanbanTask.findByIdAndDelete(subtask._id);
    }
  }
  await deleteSubtasks(data.id);

  // Update order of remaining tasks
  await KanbanTask.updateMany(
    { column: task.column, parent: task.parent, order: { $gt: task.order } },
    { $inc: { order: -1 } }
  );

  await KanbanTask.findByIdAndDelete(data.id);

  return NextResponse.json({ success: true });
}
