import { connectDB } from "@/lib/mongoose";
import { Article } from "@/models/Article";
import HomePageClient from './HomePageClient';

// Force dynamic rendering - fetch data on each request
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function Home() {
  await connectDB();
  const articles = await Article.find().sort({ createdAt: -1 }).limit(20).lean();

  return <HomePageClient articles={JSON.parse(JSON.stringify(articles))} />;
}
