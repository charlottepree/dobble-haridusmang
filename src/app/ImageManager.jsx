import { useState } from "react";
import CropModal from "./CropModal.jsx";
import SymbolGrid from "./SymbolGrid.jsx";
import useManagedSymbols from "./useManagedSymbols.js";
import useObjectUrls from "./useObjectUrls.js";

export default function ImageManager({
  onSymbolsChange,
  onPacksChange,
  onPackCreated,

  selectedPackId,
  uploadPackId,
  pendingPackName,

  setupMode,
  EMPTY_VIEW,
  ALL_PACKS,

  onClearExisting,
  symbolCount,
}) {
  const {
    error,
    cropTarget,
    visibleSymbols,
    handleFiles,
    handleFileList,
    handleDelete,
    handleClear,
    handleOpenCrop,
    handleSaveCrop,
    handleCloseCrop,
    handleRenameSymbol,
  } = useManagedSymbols({
    selectedPackId,
    uploadPackId,
    pendingPackName,
    setupMode,
    EMPTY_VIEW,
    ALL_PACKS,
    onSymbolsChange,
    onPacksChange,
    onPackCreated,
    onClearExisting,
  });

  const { urlMap, enrichedSymbols } = useObjectUrls(visibleSymbols);

  const fileInputDisabled = !uploadPackId && !pendingPackName;
  const clearDisabled =
    setupMode === "new"
      ? symbolCount === 0
      : selectedPackId === EMPTY_VIEW;

  const [isDragActive, setIsDragActive] = useState(false);

  function onDragOver(e) {
    e.preventDefault();
    if (fileInputDisabled) return;
    setIsDragActive(true);
  }

  function onDragLeave(e) {
    e.preventDefault();
    setIsDragActive(false);
  }

  async function onDrop(e) {
    e.preventDefault();
    setIsDragActive(false);

    if (fileInputDisabled) return;

    const files = Array.from(e.dataTransfer?.files || []);
    if (files.length === 0) return;

    await handleFileList(files);
  }

  return (
    <div
      style={{
        border: "1px solid var(--border)",
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        background: "var(--panel)",
        color: "var(--text)",
      }}
    >
      <h2 style={{ marginTop: 0, marginBottom: 6 }}>Sümbolite haldus</h2>
      <p style={{ marginTop: 0, marginBottom: 14, opacity: 0.8 }}>
        Praegu lisatud pilte: <b>{symbolCount}</b>
      </p>

      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <label
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "8px 14px",
            border: "1px solid var(--border)",
            borderRadius: 10,
            background: "var(--panel-soft)",
            color: "var(--text)",
            cursor: fileInputDisabled ? "not-allowed" : "pointer",
            opacity: fileInputDisabled ? 0.6 : 1,
            fontWeight: 500,
          }}
        >
          Vali pildid
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFiles}
            disabled={fileInputDisabled}
            style={{ display: "none" }}
          />
        </label>

        <div style={{ marginLeft: "auto" }}>
          <button
            onClick={handleClear}
            disabled={clearDisabled}
            style={{
              background: clearDisabled ? undefined : "rgba(138, 77, 88, 0.18)",
              borderColor: clearDisabled ? undefined : "#8a4d58",
              color: clearDisabled ? undefined : "#ffd9df",
              fontWeight: 600,
            }}
          >
            {setupMode === "new" ? "Tühjenda paki sisu" : "Eemalda valik"}
          </button>
        </div>
      </div>

      <div
        onDragOver={onDragOver}
        onDragEnter={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        style={{
          marginTop: 12,
          padding: 18,
          borderRadius: 12,
          border: isDragActive
            ? "2px dashed #5562f6"
            : "2px dashed var(--border)",
          background: isDragActive
            ? "rgba(85, 98, 246, 0.10)"
            : "var(--panel-soft)",
          color: "var(--text)",
          textAlign: "center",
          transition: "border-color 0.15s ease, background 0.15s ease",
          opacity: fileInputDisabled ? 0.6 : 1,
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: 6 }}>
          {isDragActive ? "Vabasta failid siia" : "Lohista pildid siia"}
        </div>
        <div style={{ fontSize: 13, opacity: 0.8 }}>
          Või kasuta üleval nuppu <b>„Vali pildid“</b>. Pilte saab lisada mitmes jaos.
        </div>
      </div>

      {error && <p style={{ marginTop: 10, color: "var(--danger)" }}>{error}</p>}

      <SymbolGrid
        symbols={enrichedSymbols}
        urlMap={urlMap}
        onCrop={handleOpenCrop}
        onDelete={handleDelete}
        onRename={handleRenameSymbol}
      />

      <p style={{ marginTop: 12, fontSize: 12, opacity: 0.7 }}>
        Märkus: pildid salvestatakse selle brauseri kohalikku salvestusruumi.
      </p>

      <CropModal
        open={!!cropTarget}
        imageUrl={cropTarget?.imageUrl}
        initialCrop={cropTarget?.initialCrop}
        onCancel={handleCloseCrop}
        onSave={handleSaveCrop}
      />
    </div>
  );
}