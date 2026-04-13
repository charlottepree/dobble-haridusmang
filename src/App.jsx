import { useEffect, useMemo, useState } from "react";
import StartPage from "./app/StartPage.jsx";
import SetupPage from "./app/SetupPage.jsx";
import PlayPage from "./app/PlayPage.jsx";
import PostCreatePage from "./app/PostCreatePage.jsx";

import { getAllPacks, getAllSymbols } from "./storage/db.js";
import useObjectUrls from "./app/useObjectUrls.js";
import usePreloadedImages from "./hooks/usePreloadedImages.js";

const EMPTY_VIEW = "__EMPTY__";
const ALL_PACKS = "__ALL__";

export default function App() {
  const [view, setView] = useState("start");
  const [setupMode, setSetupMode] = useState("manage");
  const [symbols, setSymbols] = useState([]);
  const [packs, setPacks] = useState([]);
  const [selectedPackId, setSelectedPackId] = useState(EMPTY_VIEW);
  const [draftPackName, setDraftPackName] = useState("");
  const [pendingNewPackName, setPendingNewPackName] = useState("");
  const [symbolsPerCard, setSymbolsPerCard] = useState(3);
  const [askSymbolName, setAskSymbolName] = useState(false);
  const [useTimer, setUseTimer] = useState(false);
  const [answerTimeSec, setAnswerTimeSec] = useState(5);
  const [playSessionKey, setPlaySessionKey] = useState(0);
  const [roundCount, setRoundCount] = useState(10);

  const { enrichedSymbols } = useObjectUrls(symbols);
  const imagesReady = usePreloadedImages(enrichedSymbols);

  async function refreshPacks() {
    const list = await getAllPacks();
    setPacks(list);
    return list;
  }

  async function refreshSymbols() {
    const list = await getAllSymbols();
    setSymbols(list);
    return list;
  }

  useEffect(() => {
    refreshPacks();
    refreshSymbols();
  }, []);

  const activeSymbols = useMemo(() => {
    if (selectedPackId === EMPTY_VIEW) return [];
    if (selectedPackId === ALL_PACKS) return enrichedSymbols;
    return enrichedSymbols.filter((s) => s.packId === selectedPackId);
  }, [enrichedSymbols, selectedPackId]);

  const symbolCount = activeSymbols.length;
  const required = 2 * symbolsPerCard - 1;
  const missing = Math.max(0, required - symbolCount);

  function resetPackFlowState() {
    setDraftPackName("");
    setPendingNewPackName("");
    setSelectedPackId(EMPTY_VIEW);
  }

  function goNew() {
    setSetupMode("new");
    resetPackFlowState();
    setView("setup");
  }

  function goManageExisting() {
    setSetupMode("manage");
    resetPackFlowState();
    setView("setup");
  }

  function goPlayExisting() {
    setSetupMode("play");
    resetPackFlowState();
    setView("setup");
  }

  function goManageSelectedPack() {
    if (
      !selectedPackId ||
      selectedPackId === EMPTY_VIEW ||
      selectedPackId === ALL_PACKS
    ) {
      setSetupMode("manage");
      setView("setup");
      return;
    }

    setSetupMode("manage");
    setView("setup");
  }

  function startGame() {
    setView("play");
  }

  function backToSetup() {
    setView("setup");
  }

  function backToStart() {
    setView("start");
  }

  function onNewPackNameConfirmed(name) {
    setPendingNewPackName(name);
  }

  function onRealPackCreated(pack) {
    setSelectedPackId(pack.id);
    setDraftPackName(pack.name);
    setPendingNewPackName(pack.name);
  }

  function finishNewPack(pack) {
    setDraftPackName(pack?.name || pendingNewPackName || "");
    setPendingNewPackName("");
    setView("postCreate");
  }

  function createAnotherPack() {
    setSetupMode("new");
    resetPackFlowState();
    setView("setup");
  }

  function browsePacksAndPlay() {
    setSetupMode("play");
    resetPackFlowState();
    setView("setup");
  }

  function restartGame() {
    setPlaySessionKey((k) => k + 1);
    setView("play");
  }

  if (view === "start") {
    return (
      <StartPage
        onCreateNew={goNew}
        onManageExisting={goManageExisting}
        onPlayExisting={goPlayExisting}
      />
    );
  }

  if (view === "setup") {
    return (
      <SetupPage
        setupMode={setupMode}
        required={required}
        missing={missing}
        symbolCount={symbolCount}
        packs={packs}
        refreshPacks={refreshPacks}
        refreshSymbols={refreshSymbols}
        setSymbols={setSymbols}
        selectedPackId={selectedPackId}
        setSelectedPackId={setSelectedPackId}
        EMPTY_VIEW={EMPTY_VIEW}
        ALL_PACKS={ALL_PACKS}
        onBack={backToStart}
        onStart={startGame}
        onEditCurrentPack={goManageSelectedPack}
        onPackCreated={onRealPackCreated}
        onPendingPackNameConfirmed={onNewPackNameConfirmed}
        onFinishNewPack={finishNewPack}
        pendingNewPackName={pendingNewPackName}
        symbolsPerCard={symbolsPerCard}
        setSymbolsPerCard={setSymbolsPerCard}
        askSymbolName={askSymbolName}
        setAskSymbolName={setAskSymbolName}
        useTimer={useTimer}
        setUseTimer={setUseTimer}
        answerTimeSec={answerTimeSec}
        setAnswerTimeSec={setAnswerTimeSec}
        roundCount={roundCount}
        setRoundCount={setRoundCount}
      />
    );
  }

  if (view === "postCreate") {
    return (
      <PostCreatePage
        packName={draftPackName}
        onCreateAnother={createAnotherPack}
        onBrowseAndPlay={browsePacksAndPlay}
      />
    );
  }

  return (
    <PlayPage
      key={playSessionKey}
      activeSymbols={activeSymbols}
      onBack={backToSetup}
      onRestart={restartGame}
      symbolsPerCard={symbolsPerCard}
      required={required}
      askSymbolName={askSymbolName}
      useTimer={useTimer}
      answerTimeSec={answerTimeSec}
      roundCount={roundCount}
      imagesReady={imagesReady}
    />
  );
}