"use client";

import { useState } from "react";
import Link from "next/link";
import { Sparkles, Rocket, Zap, Users, ArrowRight, Check, Mail } from "lucide-react";

export default function VCMOSWaitlistPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [alreadyOnList, setAlreadyOnList] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      setIsSuccess(true);
      setAlreadyOnList(data.alreadyExists || false);
      setEmail("");
    } catch (err: any) {
      setError(err.message || "Failed to join waitlist");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
      {/* Hero Section */}
      <section className="pt-20 pb-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500/10 border border-orange-500/30 rounded-full mb-8">
            <Sparkles className="w-4 h-4 text-orange-400" />
            <span className="text-orange-400 text-sm font-medium">Invite Only</span>
          </div>

          {/* Logo/Title */}
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-4">
            VCM <span className="text-orange-500">OS</span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-300 mb-4">
            The Creator Operating System
          </p>

          <p className="text-gray-400 max-w-2xl mx-auto mb-12">
            A unified workspace for creators to build, grow, and monetize their creative business.
            Currently in private beta with select creators.
          </p>

          {/* Waitlist Form */}
          {!isSuccess ? (
            <form onSubmit={handleSubmit} className="max-w-md mx-auto mb-8">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                    className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-8 py-4 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 whitespace-nowrap"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Joining...
                    </>
                  ) : (
                    <>
                      Join Waitlist
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
              {error && (
                <p className="text-red-400 text-sm mt-3">{error}</p>
              )}
            </form>
          ) : (
            <div className="max-w-md mx-auto mb-8 p-6 bg-green-500/10 border border-green-500/30 rounded-xl">
              <div className="flex items-center justify-center gap-3 text-green-400">
                <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                  <Check className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <p className="font-semibold">
                    {alreadyOnList ? "You're already on the list!" : "You're on the list!"}
                  </p>
                  <p className="text-green-400/80 text-sm">We'll notify you when VCM OS is ready.</p>
                </div>
              </div>
            </div>
          )}

          <p className="text-gray-500 text-sm">
            Join 500+ creators waiting for early access
          </p>
        </div>
      </section>

      {/* Features Preview */}
      <section className="py-16 px-4 border-t border-white/10">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-12">
            What's Coming
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
              <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center mb-4">
                <Rocket className="w-6 h-6 text-orange-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Launch Apps</h3>
              <p className="text-gray-400">
                Everything you need to launch products, courses, and digital goods to your audience.
              </p>
            </div>

            <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
              <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-orange-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">AI-Powered</h3>
              <p className="text-gray-400">
                Built-in AI assistants for content creation, strategy, and automation.
              </p>
            </div>

            <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
              <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-orange-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Community</h3>
              <p className="text-gray-400">
                Connect with other creators, share resources, and grow together.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Meanwhile Section */}
      <section className="py-16 px-4 border-t border-white/10">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            While You Wait...
          </h2>
          <p className="text-gray-400 mb-8">
            Explore subscriptions, courses, apps, downloads, and freebies on VCM Suite
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/store"
              className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2"
            >
              Browse Products
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/store"
              className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2"
            >
              View Products
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-white/10">
        <div className="max-w-5xl mx-auto text-center">
          <Link href="/" className="text-gray-400 hover:text-white transition-colors">
            ← Back to VCM Suite
          </Link>
        </div>
      </footer>
    </div>
  );
}
