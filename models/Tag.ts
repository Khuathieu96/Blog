// models/Tag.ts
import { Schema, models, model, Document } from "mongoose";

export interface ITag extends Document {
  name: string;
  slug: string;
  createdAt: Date;
}

const TagSchema = new Schema<ITag>({
  name: { type: String, required: true, unique: true },
  slug: { type: String, unique: true, index: true },
  createdAt: { type: Date, default: Date.now }
});

// Auto-generate slug from name before saving
TagSchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.slug = this.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }
  next();
});

export const Tag = models.Tag || model<ITag>("Tag", TagSchema);
