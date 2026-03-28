import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getReplitStorageClient } from '@/lib/objectStorage/replitClient';
import { stripHtmlForTTS, generateContentHash } from '@/lib/textToSpeech';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface BlogPost {
  id: number;
  title: string;
  content: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;
    
    // Get voice parameter from query string (default to 'nova')
    const { searchParams } = new URL(request.url);
    const requestedVoice = searchParams.get('voice') || 'nova';
    
    // Validate voice is one of the allowed OpenAI voices
    const allowedVoices = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'];
    const voice = allowedVoices.includes(requestedVoice) ? requestedVoice : 'nova';
    
    // Fetch blog post
    const result = await query(
      'SELECT id, title, content FROM blog_posts WHERE id = $1',
      [postId]
    );
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Blog post not found' }, { status: 404 });
    }
    
    const post: BlogPost = result.rows[0];
    
    // Generate cache key based on title + content hash + voice
    const contentHash = generateContentHash(post.title, post.content, voice);
    const cacheKey = `blog-audio-${postId}-${contentHash}.mp3`;
    
    // Check if audio already exists in object storage
    try {
      const existingFile = await getReplitStorageClient().downloadAsBytes(cacheKey);
      if (existingFile.ok) {
        console.log(`Cache hit for blog post ${postId}`);
        return NextResponse.json({ 
          audioUrl: `/api/files/${cacheKey}`,
          cached: true 
        });
      }
    } catch (storageError) {
      // Distinguish between cache miss and storage errors
      console.log(`Cache miss for blog post ${postId}, generating new audio`);
      // Continue to generate audio
    }
    
    // Strip HTML and prepare text for TTS
    const textContent = stripHtmlForTTS(post.content);
    
    // Add title at the beginning
    let fullText = `${post.title}.\n\n${textContent}`;
    
    // OpenAI TTS has a 4096 character limit - truncate if needed
    const MAX_CHARS = 4000; // Leave some buffer
    if (fullText.length > MAX_CHARS) {
      const originalLength = fullText.length;
      
      // Find the last complete sentence within the limit
      const truncated = fullText.substring(0, MAX_CHARS);
      const lastPeriod = truncated.lastIndexOf('.');
      const lastQuestion = truncated.lastIndexOf('?');
      const lastExclamation = truncated.lastIndexOf('!');
      
      const lastSentenceEnd = Math.max(lastPeriod, lastQuestion, lastExclamation);
      
      if (lastSentenceEnd > 0) {
        fullText = truncated.substring(0, lastSentenceEnd + 1);
      } else {
        fullText = truncated + '...';
      }
      
      console.log(`Truncated blog post ${postId} from ${originalLength} to ${fullText.length} characters`);
    }
    
    // Generate audio using OpenAI TTS
    const mp3Response = await openai.audio.speech.create({
      model: 'tts-1',
      voice: voice,
      input: fullText,
      speed: 1.0,
    });
    
    console.log(`Generated new TTS audio for blog post ${postId}`);
    
    // Convert response to buffer
    const arrayBuffer = await mp3Response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Save to Replit Object Storage
    const uploadResult = await getReplitStorageClient().uploadFromBytes(cacheKey, buffer);
    
    if (!uploadResult.ok) {
      console.error('Storage upload error:', uploadResult.error);
      return NextResponse.json(
        { error: 'Failed to store audio file' },
        { status: 500 }
      );
    }
    
    // Return proxy URL
    return NextResponse.json({ 
      audioUrl: `/api/files/${cacheKey}`,
      cached: false 
    });
    
  } catch (error) {
    console.error('TTS generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate audio' },
      { status: 500 }
    );
  }
}
