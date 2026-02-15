"use client";

import Link from "next/link";
import { BookmarkPlus, FolderOpen, ArrowRight, AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

type UsageSnapshot = {
  sessions: number;
  outputs: number;
};

function getToolSlug(pathname: string): string | null {
  const m = pathname.match(/^\/tools\/([^/?#]+)/);
  return m?.[1] || null;
}

function getWeekKey(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = (day + 6) % 7; // Monday start
  const monday = new Date(now);
  monday.setDate(now.getDate() - diff);
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString().slice(0, 10);
}

export default function SaveUpgradeSection() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isEmbedMode = searchParams?.get("embed") === "1";
  const [showStickyBar, setShowStickyBar] = useState(false);
  const [canSave, setCanSave] = useState(false);
  const [usage, setUsage] = useState<UsageSnapshot>({ sessions: 0, outputs: 0 });
  const [showPeakPrompt, setShowPeakPrompt] = useState(false);

  const toolSlug = getToolSlug(pathname || "");
  const weekKey = getWeekKey();
  const storageKey = toolSlug ? `vcm_tool_usage_${weekKey}_${toolSlug}` : null;
  const sessionKey = toolSlug ? `vcm_tool_session_seen_${toolSlug}` : null;

  const updateUsage = (patch: Partial<UsageSnapshot>) => {
    if (typeof window === "undefined" || !storageKey) return;
    const currentRaw = window.localStorage.getItem(storageKey);
    const current: UsageSnapshot = currentRaw ? JSON.parse(currentRaw) : { sessions: 0, outputs: 0 };
    const next = { ...current, ...patch };
    window.localStorage.setItem(storageKey, JSON.stringify(next));
    setUsage(next);
  };

  useEffect(() => {
    const onScroll = () => {
      setShowStickyBar(window.scrollY > 280 || usage.sessions >= 2 || usage.outputs >= 3);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [usage.sessions, usage.outputs]);

  useEffect(() => {
    let canceled = false;
    async function fetchCapabilities() {
      try {
        const res = await fetch("/api/user/subscription-capabilities");
        if (!res.ok) return;
        const data = await res.json();
        if (!canceled) {
          setCanSave(Boolean(data?.canSaveWorkspace || data?.canSavePresets));
        }
      } catch {
        if (!canceled) setCanSave(false);
      }
    }
    fetchCapabilities();
    return () => {
      canceled = true;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !storageKey || !sessionKey) return;
    const currentRaw = window.localStorage.getItem(storageKey);
    const current: UsageSnapshot = currentRaw ? JSON.parse(currentRaw) : { sessions: 0, outputs: 0 };
    setUsage(current);

    if (!window.sessionStorage.getItem(sessionKey)) {
      window.sessionStorage.setItem(sessionKey, "1");
      const next = { ...current, sessions: current.sessions + 1 };
      window.localStorage.setItem(storageKey, JSON.stringify(next));
      setUsage(next);
    }
  }, [storageKey, sessionKey]);

  useEffect(() => {
    if (typeof window === "undefined" || !toolSlug || !storageKey || canSave) return;
    const outputActionRegex = /(download|generate|analyze|convert|create|export|run|process|build)/i;

    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      const el = target.closest("button,a,[role='button']") as HTMLElement | null;
      if (!el) return;
      const text = (el.textContent || "").trim();
      const forcedTrack = el.getAttribute("data-track-output") === "true";
      if (!forcedTrack && !outputActionRegex.test(text)) return;

      const currentRaw = window.localStorage.getItem(storageKey);
      const current: UsageSnapshot = currentRaw ? JSON.parse(currentRaw) : { sessions: 0, outputs: 0 };
      const next = { ...current, outputs: current.outputs + 1 };
      window.localStorage.setItem(storageKey, JSON.stringify(next));
      setUsage(next);
      setShowPeakPrompt(true);
      window.setTimeout(() => setShowPeakPrompt(false), 6000);
    };

    window.addEventListener("click", onClick);
    return () => window.removeEventListener("click", onClick);
  }, [toolSlug, storageKey, canSave]);

  if (canSave || isEmbedMode) return null;

  const repeatTrigger = usage.sessions >= 2 || usage.outputs >= 3;
  const proofLine = usage.outputs >= 4
    ? `You triggered this tool ${usage.outputs} times this week. Save your setup and outputs once so you never redo work.`
    : usage.sessions >= 2
      ? `You came back ${usage.sessions} sessions this week. Save your presets and outputs so momentum compounds.`
      : "Tools are free to use. Subscribe to save your work in Workspace and store reusable tool presets.";

  return (
    <>
      {showPeakPrompt && (
        <div className="fixed top-20 inset-x-0 z-40 pointer-events-none">
          <div className="max-w-3xl mx-auto px-4">
            <div className="pointer-events-auto rounded-xl border border-emerald-300 bg-white shadow-lg px-4 py-3">
              <p className="text-sm text-gray-800">
                Nice output. Save it now or it disappears when this tab closes.
                <Link href="/pricing" className="font-semibold text-emerald-700 hover:text-emerald-800 ml-1">
                  Upgrade to save
                </Link>
              </p>
            </div>
          </div>
        </div>
      )}
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
                {proofLine}
              </p>
              <p className="text-sm text-amber-700 mt-2 inline-flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                Close tab = settings/results gone unless saved.
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
                {repeatTrigger
                  ? `You are using this repeatedly. Save outputs + presets so you never restart from scratch.`
                  : "Save your work and tool presets with one subscription."}
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
