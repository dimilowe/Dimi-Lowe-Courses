import { NextRequest, NextResponse } from 'next/server';
import {
  parseYouTubeVideoId,
  runAllGates,
  gate2_motive,
  gate3_contract,
  gate4_semanticDensity,
  type Motive,
  type EvaluationResult
} from '@/lib/youtubePatternCloud/gates';

interface YouTubeVideoSnippet {
  title: string;
  description: string;
  channelId: string;
}

interface YouTubeVideoStatistics {
  viewCount: string;
}

interface YouTubeVideoItem {
  id: string;
  snippet?: YouTubeVideoSnippet;
  statistics?: YouTubeVideoStatistics;
}

interface YouTubeSearchItem {
  id: { videoId: string };
}

async function fetchYouTubeData(videoId: string, apiKey: string): Promise<{
  title: string;
  description: string;
  viewCount: number;
  channelId: string;
  recentViews: number[];
} | null> {
  try {
    const videoRes = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoId}&key=${apiKey}`
    );
    
    if (!videoRes.ok) {
      console.error('YouTube API video fetch failed:', videoRes.status);
      return null;
    }
    
    const videoData = await videoRes.json();
    if (!videoData.items || videoData.items.length === 0) {
      return null;
    }
    
    const video: YouTubeVideoItem = videoData.items[0];
    const title = video.snippet?.title || '';
    const description = video.snippet?.description || '';
    const viewCount = parseInt(video.statistics?.viewCount || '0', 10);
    const channelId = video.snippet?.channelId || '';
    
    if (!channelId) {
      return { title, description, viewCount, channelId: '', recentViews: [] };
    }
    
    const searchRes = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&order=date&type=video&maxResults=20&key=${apiKey}`
    );
    
    if (!searchRes.ok) {
      console.error('YouTube API search failed:', searchRes.status);
      return { title, description, viewCount, channelId, recentViews: [] };
    }
    
    const searchData = await searchRes.json();
    const recentVideoIds = (searchData.items || [])
      .map((item: YouTubeSearchItem) => item.id.videoId)
      .filter((id: string) => id !== videoId)
      .slice(0, 20);
    
    if (recentVideoIds.length === 0) {
      return { title, description, viewCount, channelId, recentViews: [] };
    }
    
    const statsRes = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${recentVideoIds.join(',')}&key=${apiKey}`
    );
    
    if (!statsRes.ok) {
      console.error('YouTube API stats fetch failed:', statsRes.status);
      return { title, description, viewCount, channelId, recentViews: [] };
    }
    
    const statsData = await statsRes.json();
    const recentViews = (statsData.items || [])
      .map((item: YouTubeVideoItem) => parseInt(item.statistics?.viewCount || '0', 10))
      .filter((v: number) => v > 0);
    
    return { title, description, viewCount, channelId, recentViews };
  } catch (error) {
    console.error('YouTube API error:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, transcript, motive } = body as {
      url: string;
      transcript: string;
      motive: Motive;
    };
    
    if (!url || !transcript || !motive) {
      return NextResponse.json(
        { error: 'Missing required fields: url, transcript, and motive are required.' },
        { status: 400 }
      );
    }
    
    if (!['fear', 'status', 'insider'].includes(motive)) {
      return NextResponse.json(
        { error: 'Invalid motive. Must be one of: fear, status, insider.' },
        { status: 400 }
      );
    }
    
    const videoId = parseYouTubeVideoId(url);
    if (!videoId) {
      return NextResponse.json(
        { error: 'Invalid YouTube URL. Could not parse video ID.' },
        { status: 400 }
      );
    }
    
    const apiKey = process.env.YOUTUBE_API_KEY;
    
    if (!apiKey) {
      const gate2 = gate2_motive('', '', transcript, motive);
      const gate3 = gate3_contract(transcript);
      const gate4 = gate4_semanticDensity(transcript);
      
      const gates = [gate2, gate3, gate4];
      const redGate = gates.find(g => g.verdict === 'red');
      const yellowGate = gates.find(g => g.verdict === 'yellow');
      
      let result: EvaluationResult;
      
      if (redGate) {
        result = {
          verdict: 'red',
          reason: redGate.reason,
          instruction: 'Do not make this video.',
          metrics: redGate.metrics,
          gateResults: gates
        };
      } else if (yellowGate) {
        result = {
          verdict: 'yellow',
          reason: yellowGate.reason,
          instruction: 'Rewrite before production.',
          metrics: yellowGate.metrics,
          gateResults: gates
        };
      } else {
        result = {
          verdict: 'green',
          reason: 'All available gates passed. (Outlier check skipped: YouTube API not configured)',
          instruction: 'Time investment is rational.',
          gateResults: gates
        };
      }
      
      return NextResponse.json({
        ...result,
        warning: 'YouTube API key not configured. Outlier validation (Gate 1) was skipped.'
      });
    }
    
    const youtubeData = await fetchYouTubeData(videoId, apiKey);
    
    if (!youtubeData) {
      return NextResponse.json(
        { error: 'Failed to fetch video data from YouTube. The video may be private or unavailable.' },
        { status: 400 }
      );
    }
    
    if (youtubeData.recentViews.length < 5) {
      const gate2 = gate2_motive(youtubeData.title, youtubeData.description, transcript, motive);
      const gate3 = gate3_contract(transcript);
      const gate4 = gate4_semanticDensity(transcript);
      
      const gates = [gate2, gate3, gate4];
      const redGate = gates.find(g => g.verdict === 'red');
      const yellowGate = gates.find(g => g.verdict === 'yellow');
      
      let result: EvaluationResult;
      
      if (redGate) {
        result = {
          verdict: 'red',
          reason: redGate.reason,
          instruction: 'Do not make this video.',
          metrics: redGate.metrics,
          gateResults: gates
        };
      } else if (yellowGate) {
        result = {
          verdict: 'yellow',
          reason: yellowGate.reason,
          instruction: 'Rewrite before production.',
          metrics: yellowGate.metrics,
          gateResults: gates
        };
      } else {
        result = {
          verdict: 'green',
          reason: 'All available gates passed. (Outlier check skipped: insufficient channel history)',
          instruction: 'Time investment is rational.',
          gateResults: gates
        };
      }
      
      return NextResponse.json({
        ...result,
        warning: 'Channel has fewer than 5 recent videos. Outlier validation was skipped.'
      });
    }
    
    const result = runAllGates(
      youtubeData.viewCount,
      youtubeData.recentViews,
      youtubeData.title,
      youtubeData.description,
      transcript,
      motive
    );
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('YPC evaluation error:', error);
    return NextResponse.json(
      { error: 'Internal server error during evaluation.' },
      { status: 500 }
    );
  }
}
