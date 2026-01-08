// models/DailyNote.ts
import { Schema, models, model, Document, Types } from "mongoose";

export interface INote extends Document {
  header: string;
  content: string;
  folder: Types.ObjectId | string;
  createdAt: Date;
  updatedAt: Date;
}

const NoteSchema = new Schema<INote>({
  header: { type: String, required: true },
  content: { type: String, default: "" },
  folder: { type: Schema.Types.ObjectId, ref: "NoteFolder", required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update the updatedAt field on save
NoteSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

export const Note = models.Note || model<INote>("Note", NoteSchema);
