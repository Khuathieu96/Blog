// models/Article.ts
import { Schema, models, model, Document } from "mongoose";
export interface IArticle extends Document {
  header: string;
  slug: string;
  tags: string[];
  content: string;
  images: string[];
  createdAt: Date;
}

const ArticleSchema = new Schema<IArticle>({
  header: { type: String, required: true },
  slug: { type: String, unique: true, index: true },
  tags: { type: [String], default: [] },
  content: { type: String, default: "" },
  images: { type: [String], default: [] },
  createdAt: { type: Date, default: Date.now }
});

export const Article =
  models.Article || model<IArticle>("Article", ArticleSchema);