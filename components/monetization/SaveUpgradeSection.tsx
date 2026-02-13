"use client";

import Link from "next/link";
import { BookmarkPlus, FolderOpen, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";

export default function SaveUpgradeSection() {
  const [showStickyBar, setShowStickyBar] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setShowStickyBar(window.scrollY > 280);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <section className="max-w-4xl mx-auto px-4 mt-4 mb-8">
        <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-6 md:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                Upgrade to Save
              </p>
              <h2 className="text-2xl font-bold text-gray-900 mt-1">
                Keep your best outputs and presets
              </h2>
              <p className="text-gray-600 mt-2">
                Tools are free to use. Subscribe to save your work in Workspace and store reusable tool presets.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-3 mt-6">
            <Link
              href="/pricing"
              className="group rounded-xl border border-emerald-300 bg-white p-4 hover:bg-emerald-50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FolderOpen className="w-5 h-5 text-emerald-700" />
                  <span className="font-semibold text-gray-900">Save to Workspace</span>
                </div>
                <ArrowRight className="w-4 h-4 text-emerald-700 group-hover:translate-x-0.5 transition-transform" />
              </div>
              <p className="text-sm text-gray-600 mt-2">Store tool outputs and come back to them anytime.</p>
            </Link>

            <Link
              href="/pricing"
              className="group rounded-xl border border-emerald-300 bg-white p-4 hover:bg-emerald-50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <BookmarkPlus className="w-5 h-5 text-emerald-700" />
                  <span className="font-semibold text-gray-900">Save Tool Presets</span>
                </div>
                <ArrowRight className="w-4 h-4 text-emerald-700 group-hover:translate-x-0.5 transition-transform" />
              </div>
              <p className="text-sm text-gray-600 mt-2">Reuse your favorite settings across sessions.</p>
            </Link>
          </div>
        </div>
      </section>

      {showStickyBar && (
        <div className="fixed bottom-24 inset-x-0 z-40 pointer-events-none">
          <div className="max-w-4xl mx-auto px-4">
            <div className="pointer-events-auto rounded-xl border border-emerald-300 bg-white/95 backdrop-blur shadow-lg px-4 py-3 flex items-center justify-between gap-3">
              <p className="text-sm text-gray-800">
                Save your work and tool presets with one subscription.
              </p>
              <Link
                href="/pricing"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors whitespace-nowrap"
              >
                Upgrade to Save
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
