import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { notifyFeedbackSubmission } from '@/lib/feedback-notifications';

export async function POST(req: NextRequest) {
  try {
    const { feedback_type, subject, message, email, priority, author_name, author_bio } = await req.json();

    if (!feedback_type || !subject || !message) {
      return NextResponse.json(
        { error: 'Feedback type, subject, and message are required' },
        { status: 400 }
      );
    }

    if (feedback_type === 'article' && (!author_name || !email)) {
      return NextResponse.json(
        { error: 'Author name and email are required for article submissions' },
        { status: 400 }
      );
    }

    const result = await query(
      `INSERT INTO feedback (feedback_type, subject, message, email, priority, author_name, author_bio)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, created_at`,
      [
        feedback_type, 
        subject, 
        message, 
        email || null, 
        priority || 'medium',
        author_name || null,
        author_bio || null
      ]
    );

    const inserted = result.rows[0];
    await notifyFeedbackSubmission({
      feedbackType: feedback_type,
      subject,
      message,
      email: email || null,
      priority: priority || 'medium',
      authorName: author_name || null,
      authorBio: author_bio || null,
      createdAt: inserted?.created_at ?? null,
    });

    return NextResponse.json({ success: true, id: inserted?.id ?? null }, { status: 201 });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    return NextResponse.json(
      { error: 'Failed to submit feedback' },
      { status: 500 }
    );
  }
}
