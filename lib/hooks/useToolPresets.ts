"use client";

import { useCallback, useEffect, useState } from "react";

export type ToolPresetRecord<TPresetJson> = {
  id: string;
  name: string;
  preset_json: TPresetJson;
};

type UseToolPresetsOptions = {
  toolId: string;
  originCloudId: string;
};

export function useToolPresets<TPresetJson>({
  toolId,
  originCloudId,
}: UseToolPresetsOptions) {
  const [presets, setPresets] = useState<ToolPresetRecord<TPresetJson>[]>([]);
  const [savingPreset, setSavingPreset] = useState(false);

  useEffect(() => {
    async function fetchPresets() {
      try {
        const res = await fetch(`/api/presets?tool_id=${encodeURIComponent(toolId)}`);
        if (!res.ok) return;
        const data = await res.json();
        setPresets((data.presets || []) as ToolPresetRecord<TPresetJson>[]);
      } catch {
        // Presets are optional if user is not logged in/subscribed.
      }
    }

    fetchPresets();
  }, [toolId]);

  const savePreset = useCallback(
    async (name: string, presetJson: TPresetJson): Promise<boolean> => {
      const trimmedName = name.trim();
      if (!trimmedName || savingPreset) return false;

      setSavingPreset(true);
      try {
        const response = await fetch("/api/presets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tool_id: toolId,
            name: trimmedName,
            origin_cloud_id: originCloudId,
            preset_json: presetJson,
          }),
        });

        const data = await response.json();
        if (!response.ok) {
          if (response.status === 401) {
            alert("Please sign in to save presets.");
          } else if (response.status === 403 || data.code === "SUBSCRIPTION_REQUIRED") {
            alert("Preset saving is part of the $11/mo global subscription. Visit Pricing to unlock it.");
          } else {
            alert("Failed to save preset.");
          }
          return false;
        }

        setPresets((prev) => [data as ToolPresetRecord<TPresetJson>, ...prev.filter((p) => p.id !== data.id)]);
        return true;
      } catch (err) {
        console.error("Failed to save preset:", err);
        alert("Failed to save preset.");
        return false;
      } finally {
        setSavingPreset(false);
      }
    },
    [originCloudId, savingPreset, toolId]
  );

  return {
    presets,
    savingPreset,
    savePreset,
  };
}
