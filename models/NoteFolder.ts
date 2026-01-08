// models/NoteFolder.ts
import { Schema, models, model, Document } from "mongoose";

export interface INoteFolder extends Document {
  name: string;
  isCollapsed: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const NoteFolderSchema = new Schema<INoteFolder>({
  name: { type: String, required: true, unique: true },
  isCollapsed: { type: Boolean, default: false },
  order: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update the updatedAt field on save
NoteFolderSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

export const NoteFolder =
  models.NoteFolder || model<INoteFolder>("NoteFolder", NoteFolderSchema);
