import { useMemo, useState } from "react";
import ImageManager from "./ImageManager.jsx";
import PackSelector from "./PackSelector.jsx";
import PackCreator from "./PackCreator.jsx";
import PackActions from "./PackActions.jsx";
import PresetImportButtons from "./PresetImportButtons.jsx";
import {
  clearPack,
  createOrReuseDemoPack,
  importPresetTheme,
} from "../storage/db.js";

export default function SetupPage({
  setupMode,
  required,
  missing,
  symbolCount,

  packs,
  refreshPacks,
  refreshSymbols,

  setSymbols,

  selectedPackId,
  setSelectedPackId,

  EMPTY_VIEW,
  ALL_PACKS,

  onBack,
  onStart,
  onEditCurrentPack,

  onPackCreated,
  onPendingPackNameConfirmed,
  onFinishNewPack,

  pendingNewPackName,
  symbolsPerCard,
  setSymbolsPerCard,
  askSymbolName,
  setAskSymbolName,
  useTimer,
  setUseTimer,
  answerTimeSec,
  setAnswerTimeSec,
  roundCount,
  setRoundCount,
}) {
  const selectedPack = useMemo(() => {
    if (
      !selectedPackId ||
      selectedPackId === EMPTY_VIEW ||
      selectedPackId === ALL_PACKS
    ) {
      return null;
    }

    return packs.find((p) => p.id === selectedPackId) || null;
  }, [packs, selectedPackId, EMPTY_VIEW, ALL_PACKS]);

  const isNewMode = setupMode === "new";
  const isManageMode = setupMode === "manage";
  const isPlayMode = setupMode === "play";

  const uploadPackId = isNewMode
    ? selectedPack?.id ?? null
    : isManageMode &&
        selectedPackId !== EMPTY_VIEW &&
        selectedPackId !== ALL_PACKS
      ? selectedPackId
      : null;

  const hasEnoughSymbols = symbolCount >= required;
  const [showImageCountHelp, setShowImageCountHelp] = useState(false);
  const [showSymbolsPerCardHelp, setShowSymbolsPerCardHelp] = useState(false);
  const [importingPresetKey, setImportingPresetKey] = useState(null);

  async function handleImportPreset(preset) {
    if (importingPresetKey) return;

    setImportingPresetKey(preset.key);

    try {
      const pack = await createOrReuseDemoPack(preset.name);

      await clearPack(pack.id);
      await importPresetTheme({
        packId: pack.id,
        items: preset.items,
      });

      await refreshPacks();
      await refreshSymbols();
      setSelectedPackId(pack.id);
    } finally {
      setImportingPresetKey(null);
    }
  }

  function formatImageCount(count) {
    return `${count} ${count === 1 ? "pilt" : "pilti"}`;
  }

  const hasPendingNewPack = isNewMode && !!pendingNewPackName;
  const newPackDisplayName = selectedPack?.name ?? pendingNewPackName ?? "";

  return (
    <>
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          background: "rgba(31, 33, 40, 0.92)",
          backdropFilter: "blur(6px)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            padding: "12px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <button onClick={onBack}>Tagasi algusesse</button>

          {isNewMode && hasPendingNewPack && (
            <button
              onClick={() =>
                onFinishNewPack?.(selectedPack ?? { name: newPackDisplayName })
              }
              disabled={symbolCount < 5}
              style={{
                background: symbolCount >= 5 ? "#5562f6" : undefined,
                borderColor: symbolCount >= 5 ? "#5562f6" : undefined,
                color: symbolCount >= 5 ? "#fff" : undefined,
                fontWeight: 700,
              }}
            >
              Lõpeta paki loomine
            </button>
          )}
        </div>
      </div>

      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "20px 16px 16px",
          fontFamily: "system-ui",
          color: "var(--text)",
        }}
      >
        <h1 style={{ marginTop: 8, marginBottom: 20 }}>
          Dobble-tüüpi haridusmäng
        </h1>
        <h2 style={{ marginBottom: 16 }}>Seadistamine</h2>

        {isNewMode &&
          (!hasPendingNewPack ? (
            <div
              style={{
                marginBottom: 14,
                padding: 12,
                border: "1px solid var(--border)",
                borderRadius: 12,
                background: "var(--panel-soft)",
                color: "var(--text)",
                fontWeight: 500,
              }}
            >
              Pane pakile nimi ja vajuta nuppu &quot;Loo pakk&quot;.
            </div>
          ) : symbolCount < 5 ? (
            <div
              style={{
                marginBottom: 14,
                padding: 12,
                border: "1px solid #8a4d58",
                borderRadius: 12,
                background: "rgba(138, 77, 88, 0.18)",
                color: "#ffd9df",
                fontWeight: 500,
              }}
            >
              Paki lõpetamiseks lisa veel{" "}
              <b>{formatImageCount(5 - symbolCount)}</b>. Minimaalselt on vaja{" "}
              <b>5 pilti</b>.
            </div>
          ) : (
            <div
              style={{
                marginBottom: 14,
                padding: 12,
                border: "1px solid #3f7a57",
                borderRadius: 12,
                background: "rgba(63, 122, 87, 0.18)",
                color: "#d6ffe5",
                fontWeight: 500,
              }}
            >
              Pakis on piisavalt pilte. Mängu alustamisel saad valida, mitu
              sümbolit kuvatakse ühel kaardil.
            </div>
          ))}

        {isManageMode &&
          selectedPack &&
          (symbolCount < 5 ? (
            <div
              style={{
                marginBottom: 14,
                padding: 12,
                border: "1px solid #8a4d58",
                borderRadius: 12,
                background: "rgba(138, 77, 88, 0.18)",
                color: "#ffd9df",
                fontWeight: 500,
              }}
            >
              Selles pakis on liiga vähe pilte. Minimaalselt on vaja <b>5 pilti</b>, et pakki saaks mängus kasutada.
            </div>
          ) : (
            <div
              style={{
                marginBottom: 14,
                padding: 12,
                border: "1px solid #3f7a57",
                borderRadius: 12,
                background: "rgba(63, 122, 87, 0.18)",
                color: "#d6ffe5",
                fontWeight: 500,
              }}
            >
              Pakis on piisavalt pilte ja seda saab mängus kasutada.
            </div>
          ))}

        {isPlayMode && (
          <p style={{ marginBottom: 12 }}>
            Vali kõigepealt pakk või kasuta kiireks alustamiseks demopakki.
          </p>
        )}

        {isNewMode ? (
          !hasPendingNewPack ? (
            <PackCreator
              onConfirmName={onPendingPackNameConfirmed}
              packs={packs}
            />
          ) : (
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
              <b>Loodav pakk:</b> {newPackDisplayName}
            </div>
          )
        ) : isPlayMode ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
              flexWrap: "wrap",
              marginBottom: 14,
            }}
          >
            <PackSelector
              packs={packs}
              selectedPackId={selectedPackId}
              setSelectedPackId={setSelectedPackId}
              EMPTY_VIEW={EMPTY_VIEW}
              ALL_PACKS={ALL_PACKS}
              symbolCount={symbolCount}
              allowAllPacks={true}
            />

            <PresetImportButtons
              onImportPreset={handleImportPreset}
              importingPresetKey={importingPresetKey}
            />
          </div>
        ) : (
          <div style={{ marginBottom: 12 }}>
            <PackSelector
              packs={packs}
              selectedPackId={selectedPackId}
              setSelectedPackId={setSelectedPackId}
              EMPTY_VIEW={EMPTY_VIEW}
              ALL_PACKS={ALL_PACKS}
              symbolCount={symbolCount}
              allowAllPacks={false}
            />
          </div>
        )}

        {isPlayMode && (
          <div
            style={{
              marginBottom: 14,
              padding: 12,
              border: "1px solid var(--border)",
              borderRadius: 12,
              background: "var(--panel-soft)",
              color: "var(--text)",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <label>
                <b>Voorude arv:</b>{" "}
                <select
                  value={roundCount}
                  onChange={(e) => setRoundCount(Number(e.target.value))}
                  style={{ marginLeft: 8 }}
                >
                  {[5, 10, 15, 20].map((count) => (
                    <option key={count} value={count}>
                      {count}
                    </option>
                  ))}
                </select>
              </label>

              <div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    flexWrap: "wrap",
                  }}
                >
                  <label>
                    <b>Sümboleid ühel kaardil:</b>{" "}
                    <select
                      value={symbolsPerCard}
                      onChange={(e) =>
                        setSymbolsPerCard(Number(e.target.value))
                      }
                      style={{ marginLeft: 8 }}
                    >
                      {[3, 4, 5, 6, 7, 8].map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                  </label>

                  <button
                    type="button"
                    onClick={() => setShowSymbolsPerCardHelp((v) => !v)}
                    aria-label="Selgitus sümbolite arvu kohta"
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: "50%",
                      padding: 0,
                      display: "grid",
                      placeItems: "center",
                      fontSize: 13,
                      fontWeight: 700,
                      lineHeight: 1,
                    }}
                  >
                    ?
                  </button>
                </div>

                {showSymbolsPerCardHelp && (
                  <div
                    style={{
                      marginTop: 10,
                      padding: 12,
                      border: "1px solid var(--border)",
                      borderRadius: 12,
                      background: "var(--panel)",
                      color: "var(--text)",
                      lineHeight: 1.5,
                    }}
                  >
                    Määrab, mitu sümbolit kuvatakse mängus ühel kaardil. Selle
                    valiku jaoks on vaja vähemalt <b>{required}</b> pilti.
                  </div>
                )}
              </div>

              <label
                style={{ display: "flex", alignItems: "center", gap: 8 }}
              >
                <input
                  type="checkbox"
                  checked={askSymbolName}
                  onChange={(e) => setAskSymbolName(e.target.checked)}
                />
                <span>Küsi pärast õiget vastust ka sümboli nimetust</span>
              </label>

              <label
                style={{ display: "flex", alignItems: "center", gap: 8 }}
              >
                <input
                  type="checkbox"
                  checked={useTimer}
                  onChange={(e) => setUseTimer(e.target.checked)}
                />
                <span>Kasuta vastamisel ajapiirangut</span>
              </label>

              {useTimer && (
                <label>
                  <b>Vastamise aeg:</b>{" "}
                  <select
                    value={answerTimeSec}
                    onChange={(e) => setAnswerTimeSec(Number(e.target.value))}
                    style={{ marginLeft: 8 }}
                  >
                    {[3, 5, 10, 15, 20, 30].map((sec) => (
                      <option key={sec} value={sec}>
                        {sec} sekundit
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </div>
          </div>
        )}

        {selectedPack && isManageMode && (
          <PackActions
            selectedPack={selectedPack}
            refreshPacks={refreshPacks}
            setSelectedPackId={setSelectedPackId}
            EMPTY_VIEW={EMPTY_VIEW}
            allowDelete={true}
            allowRename={true}
          />
        )}

        {((isNewMode && hasPendingNewPack) ||
          (isManageMode && selectedPack)) && (
          <ImageManager
            onSymbolsChange={setSymbols}
            onPacksChange={refreshPacks}
            onPackCreated={onPackCreated}
            selectedPackId={selectedPackId}
            uploadPackId={uploadPackId}
            pendingPackName={isNewMode ? pendingNewPackName : ""}
            setupMode={setupMode}
            EMPTY_VIEW={EMPTY_VIEW}
            ALL_PACKS={ALL_PACKS}
            onClearExisting={() => setSelectedPackId(EMPTY_VIEW)}
            symbolCount={symbolCount}
          />
        )}

        <div style={{ marginTop: 20 }}>
          {isNewMode ? (
            !hasPendingNewPack ? null : (
              <div style={{ marginTop: 10 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    flexWrap: "wrap",
                  }}
                >
                  <b>Spikker piltide arvu valimiseks</b>

                  <button
                    type="button"
                    onClick={() => setShowImageCountHelp((v) => !v)}
                    style={{
                      padding: "2px 8px",
                      borderRadius: 999,
                      fontSize: 13,
                      lineHeight: 1.2,
                    }}
                  >
                    {showImageCountHelp ? "Peida" : "Kuva rohkem"}
                  </button>
                </div>

                {showImageCountHelp && (
                  <div
                    style={{
                      marginTop: 10,
                      padding: 12,
                      border: "1px solid var(--border)",
                      borderRadius: 12,
                      background: "var(--panel-soft)",
                      color: "var(--text)",
                      lineHeight: 1.6,
                    }}
                  >
                    <div>3 sümbolit kaardil, vähemalt 5 pilti</div>
                    <div>4 sümbolit kaardil, vähemalt 7 pilti</div>
                    <div>5 sümbolit kaardil, vähemalt 9 pilti</div>
                    <div>6 sümbolit kaardil, vähemalt 11 pilti</div>
                    <div>7 sümbolit kaardil, vähemalt 13 pilti</div>
                    <div>8 sümbolit kaardil, vähemalt 15 pilti</div>
                  </div>
                )}
              </div>
            )
          ) : isPlayMode ? (
            selectedPackId === EMPTY_VIEW ? null : (
              <>
                <div style={{ marginTop: 8 }}>
                  <p style={{ margin: 0 }}>
                    <b>Pakis pilte:</b> {symbolCount}
                  </p>

                  {!hasEnoughSymbols && (
                    <p style={{ margin: "6px 0 0", color: "var(--danger)" }}>
                      Valitud seadistuse jaoks on vaja veel <b>{missing}</b>{" "}
                      pilti.
                    </p>
                  )}
                </div>

                {!hasEnoughSymbols ? (
                  <button
                    onClick={onEditCurrentPack}
                    style={{
                      marginTop: 12,
                    }}
                  >
                    Muuda pakki
                  </button>
                ) : (
                  <button
                    onClick={onStart}
                    style={{
                      marginTop: 12,
                      background: "#5562f6",
                      borderColor: "#5562f6",
                      color: "#fff",
                      fontWeight: 700,
                    }}
                  >
                    Alusta mängu
                  </button>
                )}
              </>
            )
          ) : selectedPackId === EMPTY_VIEW ? null : (
            <p>
              <b>Lisatud pilte:</b> {symbolCount}
            </p>
          )}
        </div>
      </div>
    </>
  );
}