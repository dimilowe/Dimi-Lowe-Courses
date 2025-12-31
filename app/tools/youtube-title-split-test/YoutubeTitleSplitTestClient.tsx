"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  Youtube, 
  RotateCcw, 
  BarChart3, 
  Trophy,
  Play,
  Pause,
  CheckCircle,
  Plus,
  Video,
  Clock,
  TrendingUp,
  AlertCircle,
  LogOut,
  ExternalLink
} from "lucide-react";
import MonetizationBar from "@/components/MonetizationBar";
import PostResultUpsell from "@/components/PostResultUpsell";

interface YouTubeUser {
  id: number;
  email: string;
  channel_id: string;
  channel_title: string;
}

interface TitleTest {
  id: number;
  video_id: string;
  video_title_original: string;
  video_thumbnail: string;
  status: "running" | "stopped" | "completed";
  rotate_every_minutes: number;
  created_at: string;
  variants: TitleVariant[];
}

interface TitleVariant {
  id: number;
  variant_index: number;
  title: string;
  is_current: boolean;
  impressions: number;
  views: number;
  clicks: number;
}

interface YouTubeVideo {
  id: string;
  title: string;
  thumbnail: string;
  publishedAt: string;
}

type ViewState = "landing" | "dashboard" | "create-test" | "select-video" | "test-detail";

export default function YoutubeTitleSplitTestClient() {
  const [user, setUser] = useState<YouTubeUser | null>(null);
  const [tests, setTests] = useState<TitleTest[]>([]);
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<YouTubeVideo | null>(null);
  const [currentTest, setCurrentTest] = useState<TitleTest | null>(null);
  const [viewState, setViewState] = useState<ViewState>("landing");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  
  const [rotateMinutes, setRotateMinutes] = useState(120);
  const [variants, setVariants] = useState<string[]>(["", ""]);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const res = await fetch("/api/youtube/auth/status");
      const data = await res.json();
      
      if (data.authenticated && data.user) {
        setUser(data.user);
        setViewState("dashboard");
        fetchTests();
      } else {
        setViewState("landing");
      }
    } catch (err) {
      console.error("Auth check failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTests = async () => {
    try {
      const res = await fetch("/api/youtube/tests");
      const data = await res.json();
      if (data.tests) {
        setTests(data.tests);
      }
    } catch (err) {
      console.error("Failed to fetch tests:", err);
    }
  };

  const fetchVideos = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/youtube/videos");
      const data = await res.json();
      if (data.videos) {
        setVideos(data.videos);
      } else if (data.error) {
        setError(data.error);
      }
    } catch (err) {
      setError("Failed to fetch videos");
    } finally {
      setLoading(false);
    }
  };

  const handleConnectYouTube = () => {
    setIsConnecting(true);
    window.location.href = "/api/youtube/auth/google";
  };

  const handleLogout = async () => {
    await fetch("/api/youtube/auth/logout", { method: "POST" });
    setUser(null);
    setTests([]);
    setViewState("landing");
  };

  const handleStartNewTest = () => {
    setViewState("select-video");
    fetchVideos();
  };

  const handleSelectVideo = (video: YouTubeVideo) => {
    setSelectedVideo(video);
    setVariants([video.title, ""]);
    setViewState("create-test");
  };

  const handleAddVariant = () => {
    if (variants.length < 5) {
      setVariants([...variants, ""]);
    }
  };

  const handleRemoveVariant = (index: number) => {
    if (variants.length > 2) {
      setVariants(variants.filter((_, i) => i !== index));
    }
  };

  const handleVariantChange = (index: number, value: string) => {
    const newVariants = [...variants];
    newVariants[index] = value;
    setVariants(newVariants);
  };

  const handleCreateTest = async () => {
    if (!selectedVideo) return;
    
    const validVariants = variants.filter(v => v.trim());
    if (validVariants.length < 2) {
      setError("Please enter at least 2 title variants");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/youtube/tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          video_id: selectedVideo.id,
          video_title_original: selectedVideo.title,
          video_thumbnail: selectedVideo.thumbnail,
          rotate_every_minutes: rotateMinutes,
          variants: validVariants,
        }),
      });

      const data = await res.json();
      
      if (data.error) {
        setError(data.error);
      } else if (data.test) {
        setTests([data.test, ...tests]);
        setCurrentTest(data.test);
        setViewState("test-detail");
        setSelectedVideo(null);
        setVariants(["", ""]);
      }
    } catch (err) {
      setError("Failed to create test");
    } finally {
      setLoading(false);
    }
  };

  const handleViewTest = async (testId: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/youtube/tests/${testId}`);
      const data = await res.json();
      if (data.test) {
        setCurrentTest(data.test);
        setViewState("test-detail");
      }
    } catch (err) {
      setError("Failed to load test");
    } finally {
      setLoading(false);
    }
  };

  const handleStopTest = async () => {
    if (!currentTest) return;
    
    try {
      const res = await fetch(`/api/youtube/tests/${currentTest.id}/stop`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.test) {
        setCurrentTest(data.test);
        fetchTests();
      }
    } catch (err) {
      setError("Failed to stop test");
    }
  };

  const handleSetWinner = async (variantId: number) => {
    if (!currentTest) return;
    
    try {
      const res = await fetch(`/api/youtube/tests/${currentTest.id}/set-winner`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ winner_variant_id: variantId }),
      });
      const data = await res.json();
      if (data.test) {
        setCurrentTest(data.test);
        fetchTests();
      }
    } catch (err) {
      setError("Failed to set winner");
    }
  };

  const calculateCTR = (variant: TitleVariant) => {
    if (variant.impressions === 0) return 0;
    return ((variant.clicks || variant.views) / variant.impressions * 100).toFixed(1);
  };

  const getBestVariant = (test: TitleTest) => {
    if (!test.variants || test.variants.length === 0) return null;
    return test.variants.reduce((best, current) => {
      const bestCTR = best.impressions > 0 ? (best.clicks || best.views) / best.impressions : 0;
      const currentCTR = current.impressions > 0 ? (current.clicks || current.views) / current.impressions : 0;
      return currentCTR > bestCTR ? current : best;
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "running":
        return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full flex items-center gap-1"><Play className="w-3 h-3" />Running</span>;
      case "stopped":
        return <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-700 rounded-full flex items-center gap-1"><Pause className="w-3 h-3" />Stopped</span>;
      case "completed":
        return <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full flex items-center gap-1"><CheckCircle className="w-3 h-3" />Completed</span>;
      default:
        return null;
    }
  };

  if (loading && viewState === "landing") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <MonetizationBar />
      
      <div className="max-w-5xl mx-auto px-4 py-8">
        <Link
          href="/tools"
          className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-700 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Tools
        </Link>

        {viewState === "landing" && (
          <>
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-full text-sm font-medium mb-4">
                <Youtube className="w-4 h-4" />
                Free YouTube Tool
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                YouTube Title Split-Test Tool
              </h1>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
                Auto A/B test your YouTube titles. Connect your channel, rotate titles every few hours, and let the data pick the winner by <strong>CTR</strong>.
              </p>
              
              <button
                onClick={handleConnectYouTube}
                disabled={isConnecting}
                className="inline-flex items-center gap-3 px-8 py-4 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors disabled:opacity-50 text-lg"
              >
                {isConnecting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Youtube className="w-6 h-6" />
                    Connect with YouTube
                  </>
                )}
              </button>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-12">
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-4">
                  <RotateCcw className="w-6 h-6 text-orange-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Auto-Rotate Titles</h3>
                <p className="text-sm text-gray-600">
                  Set 2-5 title variants and rotate them automatically every 2-4 hours while you sleep.
                </p>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                  <BarChart3 className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Track Performance</h3>
                <p className="text-sm text-gray-600">
                  Monitor impressions, views, and CTR for each title variant in real-time.
                </p>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                  <Trophy className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Pick the Winner</h3>
                <p className="text-sm text-gray-600">
                  See which title gets the best CTR and set it as your final title with one click.
                </p>
              </div>
            </div>

            <PostResultUpsell />

            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 md:p-8 space-y-8 mt-8">
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">How YouTube Title Split Testing Works</h2>
                <p className="text-gray-600 leading-relaxed">
                  Your video title is one of the most important factors in getting clicks on YouTube. But how do you know which title will perform best? With A/B testing! This tool automatically rotates through multiple title variants on your video, tracks the performance of each one, and helps you identify the winner based on real click-through rate data.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">How to Use This Tool</h2>
                <ol className="space-y-3">
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center text-sm font-medium">1</span>
                    <div>
                      <p className="font-medium text-gray-900">Connect Your YouTube Channel</p>
                      <p className="text-sm text-gray-600">Sign in with Google to give us access to update your video titles.</p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center text-sm font-medium">2</span>
                    <div>
                      <p className="font-medium text-gray-900">Select a Video to Test</p>
                      <p className="text-sm text-gray-600">Choose from your recent uploads or any video on your channel.</p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center text-sm font-medium">3</span>
                    <div>
                      <p className="font-medium text-gray-900">Enter 2-5 Title Variants</p>
                      <p className="text-sm text-gray-600">Write different versions of your title to test against each other.</p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center text-sm font-medium">4</span>
                    <div>
                      <p className="font-medium text-gray-900">Let It Run & Track Results</p>
                      <p className="text-sm text-gray-600">The tool rotates titles automatically and tracks performance metrics.</p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center text-sm font-medium">5</span>
                    <div>
                      <p className="font-medium text-gray-900">Set the Winner as Final</p>
                      <p className="text-sm text-gray-600">Once you have enough data, pick the best title and make it permanent.</p>
                    </div>
                  </li>
                </ol>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Why Title Testing Matters</h2>
                <ul className="space-y-2">
                  {[
                    "Titles directly impact your click-through rate (CTR)",
                    "Higher CTR signals to YouTube that your video is valuable",
                    "Better CTR means more views from the same number of impressions",
                    "Small improvements in CTR compound over time",
                    "Data-driven decisions beat guesswork every time",
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-gray-600">
                      <TrendingUp className="w-4 h-4 text-green-500 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </section>

              <section className="border-t border-gray-200 pt-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <h3 className="font-semibold text-gray-900 mb-2">Is this tool free?</h3>
                    <p className="text-sm text-gray-600">
                      Yes! This tool is completely free for YouTube creators. You just need to connect your YouTube channel.
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <h3 className="font-semibold text-gray-900 mb-2">How often does it rotate titles?</h3>
                    <p className="text-sm text-gray-600">
                      You can set the rotation interval from 30 minutes to 24 hours. We recommend 2-4 hours for best results.
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <h3 className="font-semibold text-gray-900 mb-2">Will this affect my video's performance?</h3>
                    <p className="text-sm text-gray-600">
                      Title changes are normal on YouTube. Many top creators regularly update their titles. The goal is to find the best performing title for your content.
                    </p>
                  </div>
                </div>
              </section>
            </div>
          </>
        )}

        {viewState === "dashboard" && user && (
          <>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Your Title Tests</h1>
                <p className="text-gray-600">Connected as: {user.email}</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleStartNewTest}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  New Test
                </button>
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            </div>

            {tests.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center">
                <Video className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No tests yet</h3>
                <p className="text-gray-600 mb-6">Create your first title split-test to start optimizing your videos.</p>
                <button
                  onClick={handleStartNewTest}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Create First Test
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {tests.map((test) => {
                  const bestVariant = getBestVariant(test);
                  return (
                    <div
                      key={test.id}
                      className="bg-white rounded-xl shadow-lg border border-gray-100 p-4 hover:border-gray-200 transition-colors cursor-pointer"
                      onClick={() => handleViewTest(test.id)}
                    >
                      <div className="flex items-start gap-4">
                        {test.video_thumbnail && (
                          <img
                            src={test.video_thumbnail}
                            alt=""
                            className="w-32 h-18 object-cover rounded-lg flex-shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {getStatusBadge(test.status)}
                          </div>
                          <h3 className="font-semibold text-gray-900 truncate">{test.video_title_original}</h3>
                          <p className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                            <Clock className="w-3 h-3" />
                            Rotates every {test.rotate_every_minutes} minutes
                            <span className="text-gray-300">•</span>
                            {test.variants?.length || 0} variants
                          </p>
                          {bestVariant && bestVariant.impressions > 0 && (
                            <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
                              <Trophy className="w-3 h-3" />
                              Best: "{bestVariant.title.substring(0, 40)}..." ({calculateCTR(bestVariant)}% CTR)
                            </p>
                          )}
                        </div>
                        <ExternalLink className="w-5 h-5 text-gray-400" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {viewState === "select-video" && (
          <>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Select a Video</h1>
                <p className="text-gray-600">Choose which video to test titles on</p>
              </div>
              <button
                onClick={() => setViewState("dashboard")}
                className="text-gray-600 hover:text-gray-900"
              >
                Cancel
              </button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                <p className="text-red-700">{error}</p>
              </div>
            ) : videos.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center">
                <Video className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No videos found</h3>
                <p className="text-gray-600">Upload some videos to your YouTube channel first.</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {videos.map((video) => (
                  <div
                    key={video.id}
                    className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden hover:border-red-300 transition-colors cursor-pointer"
                    onClick={() => handleSelectVideo(video)}
                  >
                    <img
                      src={video.thumbnail}
                      alt=""
                      className="w-full aspect-video object-cover"
                    />
                    <div className="p-4">
                      <h3 className="font-medium text-gray-900 line-clamp-2 mb-1">{video.title}</h3>
                      <p className="text-xs text-gray-500">
                        {new Date(video.publishedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {viewState === "create-test" && selectedVideo && (
          <>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Create Title Test</h1>
                <p className="text-gray-600">Set up your split-test for "{selectedVideo.title}"</p>
              </div>
              <button
                onClick={() => setViewState("select-video")}
                className="text-gray-600 hover:text-gray-900"
              >
                Back
              </button>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-start gap-4 mb-6 pb-6 border-b border-gray-100">
                <img
                  src={selectedVideo.thumbnail}
                  alt=""
                  className="w-40 aspect-video object-cover rounded-lg"
                />
                <div>
                  <p className="text-sm text-gray-500 mb-1">Testing video:</p>
                  <h3 className="font-semibold text-gray-900">{selectedVideo.title}</h3>
                </div>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rotation Interval
                  </label>
                  <select
                    value={rotateMinutes}
                    onChange={(e) => setRotateMinutes(Number(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  >
                    <option value={30}>Every 30 minutes</option>
                    <option value={60}>Every 1 hour</option>
                    <option value={120}>Every 2 hours</option>
                    <option value={180}>Every 3 hours</option>
                    <option value={240}>Every 4 hours</option>
                    <option value={360}>Every 6 hours</option>
                    <option value={720}>Every 12 hours</option>
                    <option value={1440}>Every 24 hours</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Title Variants (2-5)
                    </label>
                    {variants.length < 5 && (
                      <button
                        onClick={handleAddVariant}
                        className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
                      >
                        <Plus className="w-4 h-4" />
                        Add Variant
                      </button>
                    )}
                  </div>
                  <div className="space-y-3">
                    {variants.map((variant, index) => (
                      <div key={index} className="flex gap-2">
                        <div className="flex-shrink-0 w-8 h-10 flex items-center justify-center bg-gray-100 rounded-lg text-sm font-medium text-gray-600">
                          {index + 1}
                        </div>
                        <input
                          type="text"
                          value={variant}
                          onChange={(e) => handleVariantChange(index, e.target.value)}
                          placeholder={`Title variant ${index + 1}`}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                          maxLength={100}
                        />
                        {variants.length > 2 && (
                          <button
                            onClick={() => handleRemoveVariant(index)}
                            className="px-3 py-2 text-gray-400 hover:text-red-600 transition-colors"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    onClick={handleCreateTest}
                    disabled={loading}
                    className="w-full px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Creating Test...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4" />
                        Start Split-Test
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {viewState === "test-detail" && currentTest && (
          <>
            <div className="flex items-center justify-between mb-8">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  {getStatusBadge(currentTest.status)}
                </div>
                <h1 className="text-2xl font-bold text-gray-900">Test Results</h1>
              </div>
              <button
                onClick={() => {
                  setViewState("dashboard");
                  setCurrentTest(null);
                }}
                className="text-gray-600 hover:text-gray-900"
              >
                Back to Dashboard
              </button>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
              <div className="flex items-start gap-4 mb-6 pb-6 border-b border-gray-100">
                {currentTest.video_thumbnail && (
                  <img
                    src={currentTest.video_thumbnail}
                    alt=""
                    className="w-40 aspect-video object-cover rounded-lg"
                  />
                )}
                <div className="flex-1">
                  <p className="text-sm text-gray-500 mb-1">Original title:</p>
                  <h3 className="font-semibold text-gray-900 mb-2">{currentTest.video_title_original}</h3>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      Rotates every {currentTest.rotate_every_minutes} min
                    </span>
                    <a
                      href={`https://youtube.com/watch?v=${currentTest.video_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-red-600 hover:text-red-700 flex items-center gap-1"
                    >
                      <ExternalLink className="w-4 h-4" />
                      View on YouTube
                    </a>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-sm text-gray-500 border-b border-gray-100">
                      <th className="pb-3 font-medium">#</th>
                      <th className="pb-3 font-medium">Title</th>
                      <th className="pb-3 font-medium text-right">Impressions</th>
                      <th className="pb-3 font-medium text-right">Views</th>
                      <th className="pb-3 font-medium text-right">CTR %</th>
                      <th className="pb-3 font-medium text-center">Status</th>
                      {currentTest.status !== "running" && (
                        <th className="pb-3 font-medium text-center">Action</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {currentTest.variants?.map((variant) => (
                      <tr key={variant.id} className="border-b border-gray-50">
                        <td className="py-3 text-gray-600">{variant.variant_index + 1}</td>
                        <td className="py-3 font-medium text-gray-900 max-w-xs truncate" title={variant.title}>
                          {variant.title}
                        </td>
                        <td className="py-3 text-right text-gray-600">{variant.impressions.toLocaleString()}</td>
                        <td className="py-3 text-right text-gray-600">{variant.views.toLocaleString()}</td>
                        <td className="py-3 text-right font-medium text-gray-900">{calculateCTR(variant)}%</td>
                        <td className="py-3 text-center">
                          {variant.is_current && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                              <span className="w-2 h-2 bg-green-500 rounded-full" />
                              Active
                            </span>
                          )}
                        </td>
                        {currentTest.status !== "running" && (
                          <td className="py-3 text-center">
                            <button
                              onClick={() => handleSetWinner(variant.id)}
                              className="text-sm text-red-600 hover:text-red-700 font-medium"
                            >
                              Set as Final
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {currentTest.status === "running" && (
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <button
                    onClick={handleStopTest}
                    className="px-6 py-2 border border-yellow-500 text-yellow-700 rounded-lg font-medium hover:bg-yellow-50 transition-colors flex items-center gap-2"
                  >
                    <Pause className="w-4 h-4" />
                    Stop Test & Pick Winner
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        <footer className="text-center text-sm text-gray-500 mt-8 pb-8">
          This tool uses the YouTube Data API. Your data is handled securely.
        </footer>
      </div>
    </div>
  );
}
