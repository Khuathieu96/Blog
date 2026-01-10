// Task API: POST create, PUT update, DELETE
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { KanbanBoard } from "@/models/KanbanBoard";
import { KanbanColumn } from "@/models/KanbanColumn";
import { KanbanTask } from "@/models/KanbanTask";
import { KanbanTaskHistory } from "@/models/KanbanTaskHistory";
import { validateAuth } from "@/lib/auth-utils";

// Helper to check board access
async function checkBoardAccess(boardId: string, userId: string) {
  const board = await KanbanBoard.findById(boardId);
  if (!board) return false;

  return board.owner.toString() === userId ||
    board.members.some((m: any) => m.toString() === userId);
}

// Helper to map column title to status (base status, may be overridden for reopened tasks)
function getStatusFromColumnTitle(title: string): string | null {
  const normalized = title.toLowerCase().trim();
  if (normalized === 'backlog') return null;
  if (normalized === 'todo' || normalized === 'to do') return 'Todo';
  if (normalized === 'in progress' || normalized === 'inprogress' || normalized === 'progress') return 'In Progress';
  if (normalized === 'done' || normalized === 'completed') return 'Done';
  // Default: return title as-is
  return title;
}

// Helper to record task history
async function recordHistory(params: {
  taskId: string;
  boardId: string;
  action: string;
  userId: string;
  userEmail?: string;
  field?: string;
  oldValue?: any;
  newValue?: any;
  fromColumnId?: string;
  toColumnId?: string;
  fromStatus?: string;
  toStatus?: string;
  metadata?: Record<string, any>;
}) {
  try {
    await KanbanTaskHistory.create({
      task: params.taskId,
      board: params.boardId,
      action: params.action,
      field: params.field,
      oldValue: params.oldValue !== undefined ? String(params.oldValue) : undefined,
      newValue: params.newValue !== undefined ? String(params.newValue) : undefined,
      fromColumn: params.fromColumnId,
      toColumn: params.toColumnId,
      fromStatus: params.fromStatus,
      toStatus: params.toStatus,
      userId: params.userId,
      userEmail: params.userEmail,
      metadata: params.metadata
    });
  } catch (error) {
    console.error('Failed to record task history:', error);
    // Don't fail the main operation if history recording fails
  }
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

  // Set initial status based on column
  const initialStatus = getStatusFromColumnTitle(column.title);

  const task = await KanbanTask.create({
    column: data.columnId,
    board: column.board,
    title: data.title,
    content: data.content || "",
    parent: data.parentId || null,
    labels: data.labels || [],
    dueDate: data.dueDate || null,
    status: initialStatus,
    order
  });

  // Record creation history
  await recordHistory({
    taskId: task._id.toString(),
    boardId: column.board.toString(),
    action: data.parentId ? 'subtask_added' : 'created',
    userId: auth.userId!,
    userEmail: auth.email,
    toColumnId: data.columnId,
    toStatus: initialStatus || 'Backlog',
    metadata: {
      title: data.title,
      columnTitle: column.title,
      parentId: data.parentId
    }
  });

  return NextResponse.json(task);
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
  const oldStatus = task.status;

  // Handle moving to different column
  if (data.columnId && data.columnId !== task.column.toString()) {
    // Verify new column belongs to same board
    const newColumn = await KanbanColumn.findById(data.columnId);
    if (!newColumn || newColumn.board.toString() !== task.board.toString()) {
      return NextResponse.json({ error: "Invalid column" }, { status: 400 });
    }

    // Determine new status from column title
    newStatus = getStatusFromColumnTitle(newColumn.title);

    // Special case: Moving from Done to To Do = "Reopened" status
    if (oldStatus === 'Done' && newStatus === 'Todo') {
      newStatus = 'Reopened';
    }

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

  // Track what changed for history
  const historyActions: Array<{
    action: string;
    field?: string;
    oldValue?: any;
    newValue?: any;
    fromColumnId?: string;
    toColumnId?: string;
    fromStatus?: string;
    toStatus?: string;
    metadata?: Record<string, any>;
  }> = [];

  // Workflow: Update status and dates based on transitions
  if (newStatus !== task.status) {
    updateData.status = newStatus;

    // Moving OUT of Done: clear endDate, mark incomplete
    if (oldStatus === 'Done' && newStatus !== 'Done') {
      updateData.endDate = null;
      updateData.isCompleted = false;
    }

    // Moving TO In Progress: set startDate if not set
    if (newStatus === 'In Progress' && !task.startDate) {
      updateData.startDate = new Date();
      // No history entry for started per requirements
    }

    // Moving TO Done: set endDate and complete
    if (newStatus === 'Done') {
      const now = new Date();
      updateData.endDate = now;
      updateData.isCompleted = true;
      // If task never started, set startDate for lead time
      if (!task.startDate) {
        updateData.startDate = now;
      }
      // If no due date, set it to completion time
      if (!task.dueDate && !data.dueDate) {
        updateData.dueDate = now;
      }
    }

    // Moving TO Backlog: clear dates for fresh start (optional: keep for history)
    if (newStatus === null) {
      // Keep startDate for history, but clear endDate
      updateData.endDate = null;
      updateData.isCompleted = false;
    }

    // Record status change
    // Only log standalone status change when column did not change
    if (!data.columnId || data.columnId === task.column.toString()) {
      if (newStatus === 'Reopened') {
        historyActions.push({
          action: 'reopened',
          fromStatus: oldStatus || 'Backlog',
          toStatus: 'Reopened'
        });
      } else {
        historyActions.push({
          action: 'status_changed',
          fromStatus: oldStatus || 'Backlog',
          toStatus: newStatus || 'Backlog'
        });
      }
    }
  }

  // Record column move (include status change if it happened together)
  const columnChanged = data.columnId && data.columnId !== task.column.toString();
  if (columnChanged) {
    const moveMetadata: Record<string, any> = {};
    if (newStatus === 'In Progress') {
      moveMetadata.dueDate = data.dueDate || task.dueDate?.toISOString();
    }

    historyActions.push({
      action: 'moved',
      fromColumnId: task.column.toString(),
      toColumnId: data.columnId,
      fromStatus: oldStatus || 'Backlog',
      toStatus: newStatus || 'Backlog',
      metadata: Object.keys(moveMetadata).length ? moveMetadata : undefined
    });
  }

  // Record field updates
  if (data.title !== undefined && data.title !== task.title) {
    historyActions.push({
      action: 'updated',
      field: 'title',
      oldValue: task.title,
      newValue: data.title
    });
  }
  if (data.content !== undefined && data.content !== task.content) {
    historyActions.push({
      action: 'updated',
      field: 'content',
      oldValue: task.content ? 'has content' : 'empty',
      newValue: data.content ? 'has content' : 'empty'
    });
  }
  // No standalone history entry for due date changes
  if (data.labels !== undefined && JSON.stringify(data.labels) !== JSON.stringify(task.labels)) {
    historyActions.push({
      action: 'updated',
      field: 'labels',
      oldValue: task.labels?.join(', '),
      newValue: data.labels?.join(', ')
    });
  }

  const updated = await KanbanTask.findByIdAndUpdate(data.id, updateData, { new: true });

  // Record all history actions
  for (const historyAction of historyActions) {
    await recordHistory({
      taskId: task._id.toString(),
      boardId: task.board.toString(),
      action: historyAction.action,
      userId: auth.userId!,
      userEmail: auth.email,
      field: historyAction.field,
      oldValue: historyAction.oldValue,
      newValue: historyAction.newValue,
      fromColumnId: historyAction.fromColumnId,
      toColumnId: historyAction.toColumnId,
      fromStatus: historyAction.fromStatus,
      toStatus: historyAction.toStatus,
      metadata: historyAction.metadata
    });
  }

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

  // Record deletion history
  await recordHistory({
    taskId: task._id.toString(),
    boardId: task.board.toString(),
    action: 'deleted',
    userId: auth.userId!,
    userEmail: auth.email,
    metadata: {
      title: task.title,
      status: task.status,
      wasCompleted: task.isCompleted
    }
  });

  await KanbanTask.findByIdAndDelete(data.id);

  return NextResponse.json({ success: true });
}
