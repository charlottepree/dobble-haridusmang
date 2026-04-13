import { useMemo, useState } from "react";

export default function PackCreator({
  onConfirmName,
  packs = [],
}) {
  const [packName, setPackName] = useState("");
  const [error, setError] = useState("");

  const normalizedExistingNames = useMemo(() => {
    return new Set(
      packs.map((p) => (p.name ?? "").trim().toLowerCase()).filter(Boolean)
    );
  }, [packs]);

  function handleConfirm() {
    const name = packName.trim();

    if (!name) return;

    if (normalizedExistingNames.has(name.toLowerCase())) {
      setError("Sellise nimega pakk on juba olemas. Palun vali teine nimi.");
      return;
    }

    setError("");
    onConfirmName?.(name);
  }

  return (
    <>
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
        <input
          value={packName}
          onChange={(e) => {
            setPackName(e.target.value);
            if (error) setError("");
          }}
          placeholder="Paki nimi… (nt Loomad, Puuviljad)"
          style={{ flex: 1 }}
        />
        <button onClick={handleConfirm} disabled={!packName.trim()}>
          Loo pakk
        </button>
      </div>

      {error && (
        <p style={{ marginTop: 8, color: "var(--danger)" }}>
          {error}
        </p>
      )}
    </>
  );
}