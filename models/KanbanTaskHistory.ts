// models/KanbanTaskHistory.ts
import { Schema, models, model, Document, Types } from "mongoose";

export interface IKanbanTaskHistory extends Document {
  task: Types.ObjectId;
  board: Types.ObjectId;
  action: string; // 'created' | 'moved' | 'updated' | 'status_changed' | 'completed' | 'reopened' | 'deleted'
  field?: string; // Which field was changed (for updates)
  oldValue?: string; // Previous value (stringified)
  newValue?: string; // New value (stringified)
  fromColumn?: Types.ObjectId;
  toColumn?: Types.ObjectId;
  fromStatus?: string;
  toStatus?: string;
  userId: Types.ObjectId;
  userEmail?: string;
  metadata?: Record<string, any>; // Additional context
  createdAt: Date;
}

const KanbanTaskHistorySchema = new Schema<IKanbanTaskHistory>({
  task: { type: Schema.Types.ObjectId, ref: "KanbanTask", required: true },
  board: { type: Schema.Types.ObjectId, ref: "KanbanBoard", required: true },
  action: {
    type: String,
    required: true,
    enum: ['created', 'moved', 'updated', 'status_changed', 'completed', 'reopened', 'deleted', 'due_date_set', 'started', 'subtask_added']
  },
  field: { type: String },
  oldValue: { type: String },
  newValue: { type: String },
  fromColumn: { type: Schema.Types.ObjectId, ref: "KanbanColumn" },
  toColumn: { type: Schema.Types.ObjectId, ref: "KanbanColumn" },
  fromStatus: { type: String },
  toStatus: { type: String },
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  userEmail: { type: String },
  metadata: { type: Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now }
});

// Indexes for efficient queries
KanbanTaskHistorySchema.index({ task: 1, createdAt: -1 });
KanbanTaskHistorySchema.index({ board: 1, createdAt: -1 });
KanbanTaskHistorySchema.index({ userId: 1 });
KanbanTaskHistorySchema.index({ action: 1 });

export const KanbanTaskHistory =
  models.KanbanTaskHistory || model<IKanbanTaskHistory>("KanbanTaskHistory", KanbanTaskHistorySchema);
