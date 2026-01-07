// models/StickyNote.ts
import { Schema, models, model, Document } from "mongoose";

export type StickyColor = "green" | "red" | "yellow" | "blue" | "black";

export interface IStickyNote extends Document {
  header: string;
  content: string;
  color: StickyColor;
  positionX: number;
  positionY: number;
  width: number;
  height: number;
  createdAt: Date;
  updatedAt: Date;
}

const StickyNoteSchema = new Schema<IStickyNote>({
  header: { type: String, default: "New Sticky" },
  content: { type: String, default: "" },
  color: {
    type: String,
    enum: ["green", "red", "yellow", "blue", "black"],
    default: "yellow"
  },
  positionX: { type: Number, default: 100 },
  positionY: { type: Number, default: 100 },
  width: { type: Number, default: 250 },
  height: { type: Number, default: 200 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update the updatedAt field on save
StickyNoteSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

export const StickyNote =
  models.StickyNote || model<IStickyNote>("StickyNote", StickyNoteSchema);
