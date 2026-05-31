import Link from "next/link";
import { query } from "@/lib/db";
import { Metadata } from "next";
import { 
  Search,
  MessageCircleQuestion,
  TrendingUp,
  Clock,
  ThumbsUp,
  Eye,
  Plus,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnswersSearch } from "./AnswersSearch";

export const metadata: Metadata = {
  title: "VCM Answers - Get Expert Answers to Your Creative Business Questions",
  description: "Ask questions about creative business, marketing, monetization, and more. Get expert answers from the VCM community.",
  openGraph: {
    title: "VCM Answers - Expert Q&A for Creators",
    description: "Ask questions about creative business, marketing, monetization, and more.",
  }
};

interface Question {
  id: number;
  slug: string;
  title: string;
  context: string | null;
  answer: string | null;
  author_name: string;
  upvote_count: number;
  view_count: number;
  created_at: string;
}

async function getNewestQuestions(): Promise<Question[]> {
  try {
    const result = await query(
      `SELECT id, slug, title, context, answer, author_name, upvote_count, view_count, created_at
       FROM questions
       ORDER BY created_at DESC
       LIMIT 10`
    );
    return result.rows as unknown as Question[];
  } catch {
    return [];
  }
}

async function getTrendingQuestions(): Promise<Question[]> {
  try {
    const result = await query(
      `SELECT id, slug, title, context, answer, author_name, upvote_count, view_count, created_at
       FROM questions
       ORDER BY upvote_count DESC, view_count DESC
       LIMIT 10`
    );
    return result.rows as unknown as Question[];
  } catch {
    return [];
  }
}

function timeAgo(date: string): string {
  const now = new Date();
  const past = new Date(date);
  const diffMs = now.getTime() - past.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 30) return `${diffDays}d ago`;
  return past.toLocaleDateString();
}

function QuestionCard({ question }: { question: Question }) {
  const preview = question.context 
    ? question.context.slice(0, 150) + (question.context.length > 150 ? "..." : "")
    : null;

  return (
    <Link
      href={`/answers/${question.slug}`}
      className="block bg-white border border-gray-200 rounded-xl p-5 hover:border-orange-400 hover:shadow-md transition-all group"
    >
      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-orange-600 transition-colors mb-2 line-clamp-2">
        {question.title}
      </h3>
      {preview && (
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{preview}</p>
      )}
      <div className="flex items-center gap-4 text-sm text-gray-500">
        <span className="flex items-center gap-1">
          <ThumbsUp className="w-4 h-4" />
          {question.upvote_count}
        </span>
        <span className="flex items-center gap-1">
          <Eye className="w-4 h-4" />
          {question.view_count}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="w-4 h-4" />
          {timeAgo(question.created_at)}
        </span>
        {question.answer && (
          <span className="text-green-600 font-medium">Answered</span>
        )}
      </div>
    </Link>
  );
}

async function searchQuestions(searchTerm: string): Promise<Question[]> {
  try {
    const result = await query(
      `SELECT id, slug, title, context, answer, author_name, upvote_count, view_count, created_at
       FROM questions
       WHERE title ILIKE $1 OR context ILIKE $1
       ORDER BY upvote_count DESC, created_at DESC
       LIMIT 20`,
      [`%${searchTerm}%`]
    );
    return result.rows as unknown as Question[];
  } catch {
    return [];
  }
}

export default async function AnswersPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ q?: string }> 
}) {
  const params = await searchParams;
  const searchQuery = params.q || "";

  const [newest, trending, searchResults] = await Promise.all([
    getNewestQuestions(),
    getTrendingQuestions(),
    searchQuery ? searchQuestions(searchQuery) : Promise.resolve([])
  ]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 px-4 py-1.5 rounded-full text-sm font-medium mb-4">
            <MessageCircleQuestion className="w-4 h-4" />
            Community Q&A
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            VCM Answers
          </h1>
          <p className="text-gray-600 text-lg max-w-xl mx-auto">
            Get expert answers to your questions about creative business, marketing, monetization, and more.
          </p>
        </div>

        {/* Search */}
        <AnswersSearch />

        {/* Ask Question CTA */}
        <div className="flex justify-center mb-10">
          <Link href="/answers/new">
            <Button className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-5 text-base font-semibold rounded-full flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Ask a Question
            </Button>
          </Link>
        </div>

        {/* Search Results */}
        {searchQuery && (
          <div className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Search className="w-5 h-5 text-gray-600" />
                <h2 className="text-xl font-bold text-gray-900">
                  Results for "{searchQuery}"
                </h2>
              </div>
              <Link href="/answers" className="text-orange-600 hover:text-orange-700 text-sm font-medium">
                Clear search
              </Link>
            </div>
            <div className="space-y-4">
              {searchResults.length > 0 ? (
                searchResults.map((q) => <QuestionCard key={q.id} question={q} />)
              ) : (
                <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
                  <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No questions found matching "{searchQuery}"</p>
                  <Link href="/answers/new" className="text-orange-600 hover:text-orange-700 font-medium mt-2 inline-flex items-center gap-1">
                    Ask this question <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Content Grid - Only show when not searching */}
        {!searchQuery && (
          <div className="grid md:grid-cols-2 gap-8">
            {/* Newest Questions */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-gray-600" />
                <h2 className="text-xl font-bold text-gray-900">Newest Questions</h2>
              </div>
              <div className="space-y-4">
                {newest.length > 0 ? (
                  newest.map((q) => <QuestionCard key={q.id} question={q} />)
                ) : (
                  <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
                    <MessageCircleQuestion className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No questions yet. Be the first to ask!</p>
                    <Link href="/answers/new" className="text-orange-600 hover:text-orange-700 font-medium mt-2 inline-flex items-center gap-1">
                      Ask a Question <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Trending Questions */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-gray-600" />
                <h2 className="text-xl font-bold text-gray-900">Trending Questions</h2>
              </div>
              <div className="space-y-4">
                {trending.length > 0 ? (
                  trending.map((q) => <QuestionCard key={q.id} question={q} />)
                ) : (
                  <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
                    <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">Questions with the most engagement will appear here.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
