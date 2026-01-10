// GET task history
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { KanbanBoard } from "@/models/KanbanBoard";
import { KanbanTask } from "@/models/KanbanTask";
import { KanbanTaskHistory } from "@/models/KanbanTaskHistory";
import { KanbanColumn } from "@/models/KanbanColumn";
import { validateAuth } from "@/lib/auth-utils";

// Format a value as a short, user-facing date string
function formatDateValue(value: any) {
  try {
    const date = new Date(value);
    if (isNaN(date.getTime())) return String(value);
    return date.toLocaleDateString();
  } catch (err) {
    return String(value);
  }
}

// Build a description array for a history entry
function buildDescription(entry: any): string[] {
  const description: string[] = [];

  switch (entry.action) {
    case 'moved': {
      if (entry.fromColumnTitle || entry.toColumnTitle) {
        description.push(
          `Moved: ${entry.fromColumnTitle || 'Unknown'} → ${entry.toColumnTitle || 'Unknown'}`
        );
      }
      if (entry.fromStatus || entry.toStatus) {
        description.push(
          `Change state: ${entry.fromStatus || 'Backlog'} → ${entry.toStatus || 'Backlog'}`
        );
      }
      if (entry.fromStatus === 'In Progress' && entry.toStatus === 'Done') {
        description.push('Marked as Done');
      }
      if (entry.toStatus === 'In Progress' && entry.metadata?.dueDate) {
        description.push(
          `Set due date to ${formatDateValue(entry.metadata.dueDate)}`
        );
      }
      break;
    }
    case 'status_changed': {
      description.push(
        `Change state: ${entry.fromStatus || 'Backlog'} → ${entry.toStatus || 'Backlog'}`
      );
      break;
    }
    case 'reopened': {
      description.push(
        `Reopened: ${entry.fromStatus || 'Backlog'} → ${entry.toStatus || 'Reopened'}`
      );
      break;
    }
    case 'updated': {
      if (entry.field === 'title') {
        description.push(
          `Title updated${entry.newValue ? ` to "${entry.newValue}"` : ''}`
        );
      } else if (entry.field === 'content') {
        description.push('Description updated');
      } else if (entry.field === 'labels') {
        description.push(`Labels updated to ${entry.newValue || 'none'}`);
      } else {
        description.push(`${entry.field || 'Field'} updated`);
      }
      break;
    }
    case 'created': {
      // For creation we intentionally keep description empty (header is enough)
      break;
    }
    case 'subtask_added': {
      description.push('Subtask added');
      break;
    }
    case 'deleted': {
      description.push('Task deleted');
      if (entry.metadata?.title) {
        description.push(`Title was "${entry.metadata.title}"`);
      }
      if (entry.metadata?.status) {
        description.push(`Last status: ${entry.metadata.status}`);
      }
      break;
    }
    default: {
      if (entry.field && entry.newValue) {
        description.push(`${entry.field}: ${entry.newValue}`);
      }
    }
  }

  return description;
}

// Helper to check board access
async function checkBoardAccess(boardId: string, userId: string) {
  const board = await KanbanBoard.findById(boardId);
  if (!board) return false;

  return board.owner.toString() === userId ||
    board.members.some((m: any) => m.toString() === userId);
}

// GET /api/kanban/task-history?taskId=xxx or ?boardId=xxx
export async function GET(req: NextRequest) {
  const auth = await validateAuth(req);
  if (!auth.isValid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();

  const { searchParams } = new URL(req.url);
  const taskId = searchParams.get('taskId');
  const boardId = searchParams.get('boardId');
  const limit = parseInt(searchParams.get('limit') || '50');

  if (!taskId && !boardId) {
    return NextResponse.json({ error: "taskId or boardId required" }, { status: 400 });
  }

  // Get history for a specific task
  if (taskId) {
    const task = await KanbanTask.findById(taskId);
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const hasAccess = await checkBoardAccess(task.board.toString(), auth.userId!);
    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const history = (await KanbanTaskHistory.find({ task: taskId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean())
      .filter((h: any) => h.action !== 'due_date_set');

    // Enrich with column names
    const columnIds = [...new Set(history.flatMap(h => [h.fromColumn, h.toColumn].filter(Boolean)))];
    const columns = await KanbanColumn.find({ _id: { $in: columnIds } }).lean();
    const columnMap = new Map(columns.map((c: any) => [c._id.toString(), c.title]));

    const enrichedHistory = history.map((h: any) => ({
      ...h,
      fromColumnTitle: h.fromColumn ? columnMap.get(h.fromColumn.toString()) : null,
      toColumnTitle: h.toColumn ? columnMap.get(h.toColumn.toString()) : null
    }));

    const withDescriptions = enrichedHistory.map((entry: any) => ({
      ...entry,
      description: buildDescription(entry)
    }));

    return NextResponse.json(withDescriptions);
  }

  // Get history for entire board
  if (boardId) {
    const hasAccess = await checkBoardAccess(boardId, auth.userId!);
    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const history = (await KanbanTaskHistory.find({ board: boardId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean())
      .filter((h: any) => h.action !== 'due_date_set');

    // Enrich with task titles and column names
    const taskIds = [...new Set(history.map(h => h.task))];
    const columnIds = [...new Set(history.flatMap(h => [h.fromColumn, h.toColumn].filter(Boolean)))];

    const [tasks, columns] = await Promise.all([
      KanbanTask.find({ _id: { $in: taskIds } }).select('title').lean(),
      KanbanColumn.find({ _id: { $in: columnIds } }).lean()
    ]);

    const taskMap = new Map(tasks.map((t: any) => [t._id.toString(), t.title]));
    const columnMap = new Map(columns.map((c: any) => [c._id.toString(), c.title]));

    const enrichedHistory = history.map((h: any) => ({
      ...h,
      taskTitle: taskMap.get(h.task.toString()) || h.metadata?.title || 'Deleted Task',
      fromColumnTitle: h.fromColumn ? columnMap.get(h.fromColumn.toString()) : null,
      toColumnTitle: h.toColumn ? columnMap.get(h.toColumn.toString()) : null
    }));

    const withDescriptions = enrichedHistory.map((entry: any) => ({
      ...entry,
      description: buildDescription(entry)
    }));

    return NextResponse.json(withDescriptions);
  }

  return NextResponse.json([]);
}
