import { memo, useEffect, useRef, useState } from "react";
import SymbolImage from "./SymbolImage.jsx";

const SymbolCard = memo(function SymbolCard({
  symbol,
  imageUrl,
  isEditing,
  isBusy,
  draftLabel,
  localError,
  inputRef,
  setDraftLabel,
  startRename,
  saveRename,
  cancelRename,
  onCrop,
  onDelete,
}) {
  return (
    <div
      style={{
        width: 160,
        border: "1px solid var(--border)",
        borderRadius: 12,
        padding: 10,
        boxSizing: "border-box",
        background: "var(--panel-soft)",
        color: "var(--text)",
      }}
    >
      <div
        style={{
          width: 110,
          height: 110,
          margin: "0 auto",
          overflow: "hidden",
          borderRadius: "50%",
          background: "transparent",
        }}
      >
        {imageUrl ? (
          <SymbolImage
            url={imageUrl}
            alt={symbol.label}
            cropData={symbol.crop}
            size={110}
            radius={55}
          />
        ) : (
          <div
            style={{
              height: 110,
              display: "grid",
              placeItems: "center",
              fontSize: 12,
              opacity: 0.7,
              color: "#555",
            }}
          >
            laen…
          </div>
        )}
      </div>

      {isEditing ? (
        <div style={{ marginTop: 8 }}>
          <input
            ref={inputRef}
            value={draftLabel}
            onChange={(e) => setDraftLabel(e.target.value)}
            style={{
              width: "100%",
              padding: 6,
              fontSize: 12,
            }}
            disabled={isBusy}
          />

          <div style={{ display: "grid", gap: 6, marginTop: 8 }}>
            <button
              onClick={() => saveRename(symbol)}
              disabled={!draftLabel.trim() || isBusy}
              style={{ width: "100%" }}
            >
              Salvesta
            </button>
            <button
              onClick={cancelRename}
              disabled={isBusy}
              style={{ width: "100%" }}
            >
              Loobu
            </button>
          </div>

          {localError && (
            <div style={{ marginTop: 6, fontSize: 11, color: "var(--danger)" }}>
              {localError}
            </div>
          )}
        </div>
      ) : (
        <>
          <div
            style={{
              marginTop: 8,
              fontSize: 12,
              wordBreak: "break-word",
              minHeight: 32,
            }}
          >
            {symbol.label}
          </div>

          <button
            onClick={() => startRename(symbol)}
            style={{ marginTop: 8, width: "100%" }}
          >
            Muuda nime
          </button>

          <button
            onClick={() => onCrop(symbol)}
            style={{ marginTop: 8, width: "100%" }}
            disabled={!imageUrl || isBusy}
          >
            Kärbi
          </button>

          <button
            onClick={() => onDelete(symbol.id)}
            style={{ marginTop: 8, width: "100%" }}
            disabled={isBusy}
          >
            Kustuta
          </button>
        </>
      )}
    </div>
  );
});

export default function SymbolGrid({
  symbols,
  urlMap,
  onCrop,
  onDelete,
  onRename,
}) {
  const [editingId, setEditingId] = useState(null);
  const [draftLabel, setDraftLabel] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [localError, setLocalError] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    if (editingId && !symbols.some((s) => s.id === editingId)) {
      setEditingId(null);
      setDraftLabel("");
      setBusyId(null);
      setLocalError("");
    }
  }, [symbols, editingId]);

  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingId]);

  function startRename(symbol) {
    setEditingId(symbol.id);
    setDraftLabel(symbol.label ?? "");
    setLocalError("");
  }

  function cancelRename() {
    setEditingId(null);
    setDraftLabel("");
    setBusyId(null);
    setLocalError("");
  }

  async function saveRename(symbol) {
    const clean = draftLabel.trim();
    if (!clean) {
      setLocalError("Sümboli nimi ei tohi olla tühi.");
      return;
    }

    if (clean === (symbol.label ?? "").trim()) {
      cancelRename();
      return;
    }

    setBusyId(symbol.id);
    setLocalError("");

    try {
      await onRename(symbol.id, clean);
      setEditingId(null);
      setDraftLabel("");
    } catch (e) {
      setLocalError(String(e?.message ?? e));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 12 }}>
      {symbols.map((s) => {
        const isEditing = editingId === s.id;
        const isBusy = busyId === s.id;

        return (
          <SymbolCard
            key={s.id}
            symbol={s}
            imageUrl={urlMap[s.imageId]}
            isEditing={isEditing}
            isBusy={isBusy}
            draftLabel={isEditing ? draftLabel : ""}
            localError={isEditing ? localError : ""}
            inputRef={isEditing ? inputRef : undefined}
            setDraftLabel={setDraftLabel}
            startRename={startRename}
            saveRename={saveRename}
            cancelRename={cancelRename}
            onCrop={onCrop}
            onDelete={onDelete}
          />
        );
      })}
    </div>
  );
}