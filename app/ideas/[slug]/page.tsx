import { notFound } from 'next/navigation';
import { query } from '@/lib/db';
import { cookies } from 'next/headers';
import IdeaDetailClient from './IdeaDetailClient';

interface Idea {
  id: number;
  slug: string;
  title: string;
  one_liner: string;
  problem: string;
  who_it_serves: string;
  solution: string;
  monetization: string | null;
  why_now: string | null;
  tags: string | null;
  upvote_count: number;
  comment_count: number;
  created_at: string;
}

interface Comment {
  id: number;
  author_name: string;
  body: string;
  created_at: string;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  const result = await query(
    'SELECT title, one_liner, problem, tags FROM ideas WHERE slug = $1',
    [slug]
  );

  if (result.rows.length === 0) {
    return {
      title: 'Idea Not Found — VCM Ideas Hub',
    };
  }

  const idea = result.rows[0] as { title: string; one_liner: string; problem: string; tags: string | null; slug: string };
  const description = `${idea.one_liner} ${idea.problem}`.slice(0, 155);
  const keywords = idea.tags 
    ? `${idea.tags}, startup ideas, business ideas, app ideas`
    : 'startup ideas, business ideas, app ideas, side project ideas';

  const baseUrl = process.env.SITE_URL || 
    (process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS}` : 'http://localhost:5000');

  return {
    title: `${idea.title} — VCM Ideas Hub`,
    description,
    keywords,
    alternates: {
      canonical: `${baseUrl}/ideas/${slug}`,
    },
    openGraph: {
      title: `${idea.title} — VCM Ideas Hub`,
      description,
      type: 'article',
      url: `${baseUrl}/ideas/${slug}`,
    },
    twitter: {
      card: 'summary',
      title: `${idea.title} — VCM Ideas Hub`,
      description,
    },
  };
}

export default async function IdeaDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  const ideaResult = await query(
    'SELECT * FROM ideas WHERE slug = $1',
    [slug]
  );

  if (ideaResult.rows.length === 0) {
    notFound();
  }

  const idea: Idea = ideaResult.rows[0] as unknown as Idea;

  const commentsResult = await query(
    'SELECT id, author_name, body, created_at FROM idea_comments WHERE idea_id = $1 ORDER BY created_at DESC',
    [idea.id]
  );

  const comments: Comment[] = commentsResult.rows as unknown as Comment[];

  const cookieStore = await cookies();
  const sessionId = cookieStore.get('vcm_session')?.value;
  
  let hasVoted = false;
  if (sessionId) {
    const voteResult = await query(
      'SELECT 1 FROM idea_votes WHERE idea_id = $1 AND session_id = $2',
      [idea.id, sessionId]
    );
    hasVoted = voteResult.rows.length > 0;
  }

  return <IdeaDetailClient idea={idea} comments={comments} initialHasVoted={hasVoted} />;
}
