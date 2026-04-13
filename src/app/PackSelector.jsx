import { useMemo } from "react";

export default function PackSelector({
  packs,
  selectedPackId,
  setSelectedPackId,
  EMPTY_VIEW,
  ALL_PACKS,
  symbolCount,
  allowAllPacks = true,
}) {
  const { demoPacks, userPacks } = useMemo(() => {
    return {
      demoPacks: packs.filter((p) => p.type === "demo"),
      userPacks: packs.filter((p) => p.type !== "demo"),
    };
  }, [packs]);

  return (
    <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap"}}>
      <label>
        <b>Vali pakk:</b>{" "}
        <select
          value={selectedPackId}
          onChange={(e) => setSelectedPackId(e.target.value)}
        >
          <option value={EMPTY_VIEW}>—</option>
          {allowAllPacks && <option value={ALL_PACKS}>Kõik pakid</option>}

          {demoPacks.length > 0 && (
            <optgroup label="Demo pakid">
              {demoPacks.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </optgroup>
          )}

          {userPacks.length > 0 && (
            <optgroup label="Minu pakid">
              {userPacks.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </optgroup>
          )}
        </select>
      </label>
    </div>
  );
}