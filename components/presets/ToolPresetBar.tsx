"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

type NamedPreset = {
  id: string;
  name: string;
};

type ToolPresetBarProps<TPreset extends NamedPreset> = {
  title?: string;
  presetName: string;
  onPresetNameChange: (value: string) => void;
  onSave: () => void;
  saving: boolean;
  presets: TPreset[];
  onApply: (preset: TPreset) => void;
  chipHoverClassName?: string;
  canSave?: boolean;
  lockedMessage?: string;
};

export function ToolPresetBar<TPreset extends NamedPreset>({
  title = "Preset Saving (Subscriber Feature)",
  presetName,
  onPresetNameChange,
  onSave,
  saving,
  presets,
  onApply,
  chipHoverClassName = "hover:border-orange-500 hover:text-orange-700",
  canSave,
  lockedMessage = "Subscribe to unlock preset saving.",
}: ToolPresetBarProps<TPreset>) {
  const pathname = usePathname();
  const [resolvedCanSave, setResolvedCanSave] = useState<boolean>(canSave ?? false);
  const [usageHint, setUsageHint] = useState<string | null>(null);

  useEffect(() => {
    if (typeof canSave === "boolean") {
      setResolvedCanSave(canSave);
      return;
    }

    let cancelled = false;
    async function fetchCapabilities() {
      try {
        const res = await fetch("/api/user/subscription-capabilities");
        if (!res.ok) {
          if (!cancelled) setResolvedCanSave(false);
          return;
        }
        const data = await res.json();
        if (!cancelled) {
          setResolvedCanSave(Boolean(data?.canSavePresets));
        }
      } catch {
        if (!cancelled) setResolvedCanSave(false);
      }
    }

    fetchCapabilities();
    return () => {
      cancelled = true;
    };
  }, [canSave]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const m = (pathname || "").match(/^\/tools\/([^/?#]+)/);
    const slug = m?.[1];
    if (!slug) return;

    const now = new Date();
    const day = now.getDay();
    const diff = (day + 6) % 7;
    const monday = new Date(now);
    monday.setDate(now.getDate() - diff);
    monday.setHours(0, 0, 0, 0);
    const weekKey = monday.toISOString().slice(0, 10);
    const storageKey = `vcm_tool_usage_${weekKey}_${slug}`;
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as { sessions?: number; outputs?: number };
      const outputs = parsed.outputs || 0;
      const sessions = parsed.sessions || 0;
      if (outputs >= 3) {
        setUsageHint(`You already used this ${outputs} times this week. Save once, reuse forever.`);
      } else if (sessions >= 2) {
        setUsageHint(`You came back ${sessions} times this week. Save your setup and stop redoing work.`);
      }
    } catch {
      setUsageHint(null);
    }
  }, [pathname]);

  return (
    <div className="pt-3 border-t border-gray-200">
      <p className="text-xs font-semibold text-gray-500 mb-2">{title}</p>
      <div className="flex gap-2">
        <input
          type="text"
          value={presetName}
          onChange={(e) => onPresetNameChange(e.target.value)}
          placeholder="Preset name"
          disabled={!resolvedCanSave}
          className={`flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm ${
            resolvedCanSave ? "" : "bg-gray-100 text-gray-400 cursor-not-allowed"
          }`}
        />
        <button
          type="button"
          onClick={onSave}
          data-track-output="true"
          disabled={!resolvedCanSave || !presetName.trim() || saving}
          className={`px-3 py-2 rounded-lg text-sm disabled:opacity-50 ${
            resolvedCanSave ? "bg-gray-900 text-white" : "bg-gray-200 text-gray-500"
          }`}
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
      {!resolvedCanSave && (
        <p className="text-xs text-gray-500 mt-2">
          {usageHint || lockedMessage} <a href="/pricing" className="text-orange-600 hover:text-orange-700">Upgrade</a>
          <span className="block mt-1 text-[11px] text-amber-700">Close tab = presets are lost unless saved.</span>
        </p>
      )}
      {presets.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {presets.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => onApply(preset)}
              className={`px-2.5 py-1.5 text-xs rounded-full border border-gray-300 transition-colors ${chipHoverClassName}`}
            >
              {preset.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
