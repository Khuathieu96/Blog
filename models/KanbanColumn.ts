// models/KanbanColumn.ts
import { Schema, models, model, Document, Types } from "mongoose";

export interface IKanbanColumn extends Document {
  board: Types.ObjectId;
  title: string;
  order: number;
  color?: string;
  createdAt: Date;
  updatedAt: Date;
}

const KanbanColumnSchema = new Schema<IKanbanColumn>({
  board: { type: Schema.Types.ObjectId, ref: "KanbanBoard", required: true },
  title: { type: String, required: true },
  order: { type: Number, default: 0 },
  color: { type: String, default: "#e2e8f0" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

KanbanColumnSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

// Index for efficient queries
KanbanColumnSchema.index({ board: 1, order: 1 });

export const KanbanColumn =
  models.KanbanColumn || model<IKanbanColumn>("KanbanColumn", KanbanColumnSchema);
