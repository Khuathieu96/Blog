import { Schema, models, model } from "mongoose";

const ArticleSchema = new Schema({
  header: { type: String, required: true },
  slug: { type: String, unique: true, index: true },
  tags: { type: [String], default: [] },
  content: { type: String, default: "" },
  images: { type: [String], default: [] },
  createdAt: { type: Date, default: Date.now }
});

export const Article = (models.Article) ? models.Article : model("Article", ArticleSchema);
