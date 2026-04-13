import { useEffect, useState } from "react";
import { deletePack, getAllPacks, renamePack } from "../storage/db.js";

export default function PackActions({
  selectedPack,
  refreshPacks,
  setSelectedPackId,
  EMPTY_VIEW,
  allowDelete = true,
  allowRename = true,
}) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [draftName, setDraftName] = useState(selectedPack?.name ?? "");
  const [error, setError] = useState("");

  useEffect(() => {
    setDraftName(selectedPack?.name ?? "");
    setIsRenaming(false);
    setError("");
  }, [selectedPack?.id, selectedPack?.name]);

  function normalizeName(name) {
    return (name ?? "").trim().toLowerCase();
  }

  async function handleSaveRename() {
    const trimmed = (draftName ?? "").trim();

    if (!trimmed) {
      setError("Paki nimi ei tohi olla tühi.");
      return;
    }

    if (!selectedPack) return;

    const currentNormalized = normalizeName(selectedPack.name);
    const nextNormalized = normalizeName(trimmed);

    if (currentNormalized === nextNormalized) {
      setError("");
      setIsRenaming(false);
      return;
    }

    const allPacks = await getAllPacks();
    const duplicateExists = allPacks.some(
      (pack) =>
        pack.id !== selectedPack.id &&
        normalizeName(pack.name) === nextNormalized
    );

    if (duplicateExists) {
      setError("Sellise nimega pakk on juba olemas.");
      return;
    }

    try {
      await renamePack(selectedPack.id, trimmed);
      await refreshPacks?.();
      setError("");
      setIsRenaming(false);
    } catch (e) {
      setError("Sellise nimega pakk on juba olemas.");
    }
  }

  async function handleDelete() {
    if (!selectedPack) return;

    const ok = window.confirm(
      `Kas soovid paki "${selectedPack.name}" kustutada?`
    );
    if (!ok) return;

    await deletePack(selectedPack.id);
    await refreshPacks?.();
    setSelectedPackId?.(EMPTY_VIEW);
    setError("");
    setIsRenaming(false);
  }

  if (!selectedPack) return null;

  return (
    <div
      style={{
        marginBottom: 12,
        padding: 12,
        border: "1px solid var(--border)",
        borderRadius: 12,
        background: "var(--panel-soft)",
        color: "var(--text)",
      }}
    >
      <div
        style={{
          display: "flex",
          gap: 10,
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
        }}
      >
        <div>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>Paki toimingud</div>
          <div style={{ opacity: 0.82 }}>
            Praegune pakk: <b>{selectedPack.name}</b>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {allowRename && !isRenaming && (
            <button
              type="button"
              onClick={() => {
                setDraftName(selectedPack.name ?? "");
                setError("");
                setIsRenaming(true);
              }}
            >
              Muuda nime
            </button>
          )}

          {allowDelete && (
            <button
              type="button"
              onClick={handleDelete}
              style={{
                background: "rgba(138, 77, 88, 0.18)",
                borderColor: "#8a4d58",
                color: "#ffd9df",
                fontWeight: 600,
              }}
            >
              Kustuta pakk
            </button>
          )}
        </div>
      </div>

      {allowRename && isRenaming && (
        <div style={{ marginTop: 12 }}>
          <div
            style={{
              display: "flex",
              gap: 8,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <input
              value={draftName}
              onChange={(e) => {
                setDraftName(e.target.value);
                if (error) setError("");
              }}
              placeholder="Uus paki nimi"
              style={{ flex: 1, minWidth: 220 }}
            />

            <button type="button" onClick={handleSaveRename}>
              Salvesta
            </button>

            <button
              type="button"
              onClick={() => {
                setDraftName(selectedPack.name ?? "");
                setError("");
                setIsRenaming(false);
              }}
            >
              Loobu
            </button>
          </div>

          {error && (
            <p style={{ marginTop: 8, color: "var(--danger)" }}>{error}</p>
          )}
        </div>
      )}
    </div>
  );
}