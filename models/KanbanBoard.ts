// models/KanbanBoard.ts
import { Schema, models, model, Document, Types } from "mongoose";

export interface IKanbanBoard extends Document {
  name: string;
  slug: string;
  owner: Types.ObjectId;
  members: Types.ObjectId[]; // Users who can access this board
  createdAt: Date;
  updatedAt: Date;
}

const KanbanBoardSchema = new Schema<IKanbanBoard>({
  name: { type: String, required: true },
  slug: { type: String, unique: true, index: true },
  owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
  members: [{ type: Schema.Types.ObjectId, ref: "User" }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

KanbanBoardSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

export const KanbanBoard =
  models.KanbanBoard || model<IKanbanBoard>("KanbanBoard", KanbanBoardSchema);
