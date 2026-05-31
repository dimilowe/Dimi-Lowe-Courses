import { notFound } from "next/navigation";
import Link from "next/link";
import { Metadata } from "next";
import { query } from "@/lib/db";
import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { 
  ArrowLeft, 
  MessageCircleQuestion, 
  Clock, 
  Eye, 
  User,
  CheckCircle2
} from "lucide-react";
import { VoteButton } from "./VoteButton";
import { RelatedQuestions } from "./RelatedQuestions";
import { AdminAnswerForm } from "./AdminAnswerForm";

interface SessionData {
  userId?: number;
  email?: string;
}

const sessionOptions = {
  password: process.env.SESSION_SECRET || "complex_password_at_least_32_characters_long",
  cookieName: "vcm_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
  },
};

async function isAdmin(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
    return session.email === "dimitrioslowe@gmail.com";
  } catch {
    return false;
  }
}

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
  updated_at: string;
}

async function getQuestion(slug: string): Promise<Question | null> {
  try {
    const result = await query(
      `SELECT id, slug, title, context, answer, author_name, upvote_count, view_count, created_at, updated_at
       FROM questions WHERE slug = $1`,
      [slug]
    );
    return (result.rows[0] as unknown as Question) || null;
  } catch {
    return null;
  }
}

async function incrementViewCount(id: number) {
  try {
    await query(
      `UPDATE questions SET view_count = view_count + 1, updated_at = NOW() WHERE id = $1`,
      [id]
    );
  } catch {}
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const question = await getQuestion(slug);

  if (!question) {
    return { title: "Question Not Found - VCM Answers" };
  }

  const description = question.context 
    ? question.context.slice(0, 155) + (question.context.length > 155 ? "..." : "")
    : `Get the answer to: ${question.title}`;

  const baseUrl = process.env.SITE_URL || "https://vcmsuite.com";

  return {
    title: `${question.title} - VCM Answers`,
    description,
    openGraph: {
      title: question.title,
      description,
      type: "article",
      url: `${baseUrl}/answers/${question.slug}`,
    },
    alternates: {
      canonical: `${baseUrl}/answers/${question.slug}`,
    },
  };
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function QuestionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [question, userIsAdmin] = await Promise.all([
    getQuestion(slug),
    isAdmin()
  ]);

  if (!question) {
    notFound();
  }

  await incrementViewCount(question.id);

  const baseUrl = process.env.SITE_URL || "https://vcmsuite.com";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "QAPage",
    mainEntity: {
      "@type": "Question",
      name: question.title,
      text: question.context || question.title,
      dateCreated: question.created_at,
      author: {
        "@type": "Person",
        name: question.author_name,
      },
      answerCount: question.answer ? 1 : 0,
      upvoteCount: question.upvote_count,
      ...(question.answer && {
        acceptedAnswer: {
          "@type": "Answer",
          text: question.answer,
          dateCreated: question.updated_at,
          upvoteCount: question.upvote_count,
          author: {
            "@type": "Person",
            name: "VCM",
          },
        },
      }),
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 py-12">
          {/* Back Link */}
          <Link 
            href="/answers" 
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Answers
          </Link>

          {/* Question Card */}
          <article className="bg-white border border-gray-200 rounded-xl p-6 md:p-8 mb-8">
            {/* Question Header */}
            <div className="flex items-start gap-4 mb-6">
              <VoteButton questionId={question.id} initialCount={question.upvote_count} />
              
              <div className="flex-1">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                  {question.title}
                </h1>
                
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    {question.author_name}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {formatDate(question.created_at)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    {question.view_count + 1} views
                  </span>
                </div>
              </div>
            </div>

            {/* Question Context */}
            {question.context && (
              <div className="border-t border-gray-100 pt-6 mb-6">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Details
                </h2>
                <div className="prose prose-stone max-w-none">
                  <p className="text-gray-700 whitespace-pre-wrap">{question.context}</p>
                </div>
              </div>
            )}

            {/* Answer Section */}
            <div className="border-t border-gray-100 pt-6">
              <div className="flex items-center gap-2 mb-4">
                {question.answer ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                ) : (
                  <MessageCircleQuestion className="w-5 h-5 text-orange-500" />
                )}
                <h2 className="text-lg font-bold text-gray-900">
                  {question.answer ? "Answer" : "Awaiting Answer"}
                </h2>
              </div>
              
              {question.answer ? (
                <div 
                  className="prose prose-stone max-w-none bg-green-50 border border-green-100 rounded-lg p-5"
                  dangerouslySetInnerHTML={{ __html: question.answer }}
                />
              ) : (
                <div className="bg-orange-50 border border-orange-100 rounded-lg p-5 text-center">
                  <p className="text-gray-600">
                    This question hasn't been answered yet. Check back soon!
                  </p>
                </div>
              )}

              {/* Admin Answer Form */}
              {userIsAdmin && (
                <AdminAnswerForm questionId={question.id} existingAnswer={question.answer} />
              )}
            </div>
          </article>

          {/* Related Questions */}
          <RelatedQuestions currentSlug={question.slug} title={question.title} />
        </div>
      </div>
    </>
  );
}
