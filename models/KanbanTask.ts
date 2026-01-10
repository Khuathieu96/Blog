// models/KanbanTask.ts
import { Schema, models, model, Document, Types } from "mongoose";

export interface IKanbanTask extends Document {
  column: Types.ObjectId;
  board: Types.ObjectId; // Denormalized for easier queries
  title: string;
  content?: string; // Markdown content
  order: number;
  parent?: Types.ObjectId; // Self-reference for subtasks
  labels?: string[];
  status?: string; // Workflow status: null/"Todo"/"In Progress"/"Done"
  startDate?: Date; // When task moved to In Progress
  dueDate?: Date; // Estimate/deadline
  endDate?: Date; // When task moved to Done
  isCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const KanbanTaskSchema = new Schema<IKanbanTask>({
  column: { type: Schema.Types.ObjectId, ref: "KanbanColumn", required: true },
  board: { type: Schema.Types.ObjectId, ref: "KanbanBoard", required: true },
  title: { type: String, required: true },
  content: { type: String, default: "" },
  order: { type: Number, default: 0 },
  parent: { type: Schema.Types.ObjectId, ref: "KanbanTask", default: null },
  labels: [{ type: String }],
  status: { type: String, default: null }, // null, "Todo", "In Progress", "Done"
  startDate: { type: Date },
  dueDate: { type: Date },
  endDate: { type: Date },
  isCompleted: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

KanbanTaskSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

// Indexes for efficient queries
KanbanTaskSchema.index({ column: 1, order: 1 });
KanbanTaskSchema.index({ board: 1 });
KanbanTaskSchema.index({ parent: 1 });

export const KanbanTask =
  models.KanbanTask || model<IKanbanTask>("KanbanTask", KanbanTaskSchema);
