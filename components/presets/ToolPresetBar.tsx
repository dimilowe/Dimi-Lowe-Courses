"use client";

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
}: ToolPresetBarProps<TPreset>) {
  return (
    <div className="pt-3 border-t border-gray-200">
      <p className="text-xs font-semibold text-gray-500 mb-2">{title}</p>
      <div className="flex gap-2">
        <input
          type="text"
          value={presetName}
          onChange={(e) => onPresetNameChange(e.target.value)}
          placeholder="Preset name"
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
        />
        <button
          type="button"
          onClick={onSave}
          disabled={!presetName.trim() || saving}
          className="px-3 py-2 bg-gray-900 text-white rounded-lg text-sm disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
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
