import { PRESETS } from "../presets/presets.js";

export default function PresetImportButtons({
  onImportPreset,
  importingPresetKey,
}) {
  const isImporting = importingPresetKey !== null;

  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
      {PRESETS.map((preset) => {
        const isThisImporting = importingPresetKey === preset.key;

        return (
          <button
            key={preset.key}
            onClick={() => onImportPreset(preset)}
            disabled={isImporting}
          >
            {isThisImporting
              ? `Impordin: ${preset.name}...`
              : `Impordi demo: ${preset.name}`}
          </button>
        );
      })}
    </div>
  );
}