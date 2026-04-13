import { useEffect, useMemo, useRef, useState } from "react";
import { pickTwoCards, checkAnswer } from "../game/engine.js";
import SymbolImage from "./SymbolImage.jsx";

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getCircularPositions(count) {
  const layouts = {
    3: [
      { x: 50, y: 22 },
      { x: 28, y: 70 },
      { x: 72, y: 70 },
    ],
    4: [
      { x: 50, y: 20 },
      { x: 24, y: 50 },
      { x: 76, y: 50 },
      { x: 50, y: 80 },
    ],
    5: [
      { x: 50, y: 22 },
      { x: 26, y: 50 },
      { x: 74, y: 50 },
      { x: 50, y: 78 },
      { x: 50, y: 50 },
    ],
    6: [
      { x: 50, y: 18 },
      { x: 28, y: 34 },
      { x: 72, y: 34 },
      { x: 28, y: 70 },
      { x: 72, y: 70 },
      { x: 50, y: 50 },
    ],
    7: [
      { x: 50, y: 16 },
      { x: 28, y: 28 },
      { x: 72, y: 28 },
      { x: 22, y: 54 },
      { x: 78, y: 54 },
      { x: 50, y: 80 },
      { x: 50, y: 50 },
    ],
    8: [
      { x: 50, y: 16 },
      { x: 30, y: 24 },
      { x: 70, y: 24 },
      { x: 20, y: 50 },
      { x: 80, y: 50 },
      { x: 30, y: 76 },
      { x: 70, y: 76 },
      { x: 50, y: 50 },
    ],
  };

  return layouts[count] ?? [];
}

export default function PlayPage({
  activeSymbols,
  onBack,
  onRestart,
  required,
  symbolsPerCard,
  askSymbolName,
  useTimer,
  answerTimeSec,
  roundCount,
  imagesReady,
}) {
  const symbolIds = useMemo(() => activeSymbols.map((s) => s.id), [activeSymbols]);
  const byId = useMemo(() => new Map(activeSymbols.map((s) => [s.id, s])), [activeSymbols]);

  const [round, setRound] = useState(null);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [locked, setLocked] = useState(false);

  const [nameQuestion, setNameQuestion] = useState(null);
  const [answerOptions, setAnswerOptions] = useState([]);
  const [timeLeft, setTimeLeft] = useState(answerTimeSec);

  const [currentRoundIndex, setCurrentRoundIndex] = useState(1);
  const [gameFinished, setGameFinished] = useState(false);
  const [nameAnswerLocked, setNameAnswerLocked] = useState(false);

  const timeoutRef = useRef(null);
  const intervalRef = useRef(null);

  function clearDelay() {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
  }

  function clearTimer() {
    clearInterval(intervalRef.current);
    intervalRef.current = null;
  }

  useEffect(() => {
    clearDelay();
    clearTimer();

    if (symbolIds.length >= required) {
      setRound(pickTwoCards(symbolIds, symbolsPerCard));
    } else {
      setRound(null);
    }

    setScore(0);
    setFeedback("");
    setLocked(false);
    setNameQuestion(null);
    setAnswerOptions([]);
    setNameAnswerLocked(false);
    setTimeLeft(answerTimeSec);
    setCurrentRoundIndex(1);
    setGameFinished(false);

    return () => {
      clearDelay();
      clearTimer();
    };
  }, [symbolIds, required, symbolsPerCard, askSymbolName, useTimer, answerTimeSec, roundCount]);

  useEffect(() => {
    clearTimer();

    if (!useTimer) return;
    if (!round) return;
    if (locked) return;
    if (nameQuestion) return;
    if (gameFinished) return;

    setTimeLeft(answerTimeSec);

    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearTimer();
  }, [round, useTimer, answerTimeSec, locked, nameQuestion, gameFinished]);

  useEffect(() => {
    if (!useTimer) return;
    if (!round) return;
    if (locked) return;
    if (nameQuestion) return;
    if (gameFinished) return;
    if (timeLeft > 0) return;

    clearTimer();
    setLocked(true);
    setFeedback("Aeg sai otsa ⏰");

    timeoutRef.current = setTimeout(() => {
      advanceAfterRound();
    }, 700);
  }, [timeLeft, useTimer, round, locked, nameQuestion, gameFinished]);

  function finishGame() {
    clearDelay();
    clearTimer();
    setRound(null);
    setLocked(true);
    setNameQuestion(null);
    setAnswerOptions([]);
    setNameAnswerLocked(false);
    setGameFinished(true);
    setFeedback("");
  }

  function advanceAfterRound() {
    clearDelay();
    clearTimer();

    if (currentRoundIndex >= roundCount) {
      finishGame();
      return;
    }

    if (symbolIds.length < required) {
      setRound(null);
      setLocked(false);
      setNameQuestion(null);
      setAnswerOptions([]);
      setTimeLeft(answerTimeSec);
      return;
    }

    setCurrentRoundIndex((prev) => prev + 1);
    setFeedback("");
    setLocked(false);
    setNameQuestion(null);
    setAnswerOptions([]);
    setNameAnswerLocked(false);
    setTimeLeft(answerTimeSec);
    setRound(pickTwoCards(symbolIds, symbolsPerCard));
  }

  function buildAnswerOptions(correctSymbol) {
    const wrongLabels = activeSymbols
      .filter((s) => s.id !== correctSymbol.id && s.label !== correctSymbol.label)
      .map((s) => s.label)
      .filter(Boolean);

    const uniqueWrongLabels = [...new Set(wrongLabels)];
    const pickedWrong = shuffle(uniqueWrongLabels).slice(0, 3);

    return shuffle([correctSymbol.label, ...pickedWrong]);
  }

  function onPick(id) {
    if (!round || locked || nameQuestion || gameFinished) return;

    clearTimer();

    const ok = checkAnswer(round.cardA, round.cardB, id);

    if (!ok) {
      setLocked(true);
      setFeedback("Vale ❌");

      timeoutRef.current = setTimeout(() => {
        advanceAfterRound();
      }, 600);

      return;
    }

    const correctSymbol = byId.get(id);

    if (!correctSymbol) {
      setLocked(true);
      setFeedback("Viga sümboli laadimisel.");

      timeoutRef.current = setTimeout(() => {
        advanceAfterRound();
      }, 600);

      return;
    }

    if (askSymbolName) {
      setLocked(true);
      setFeedback("Õige sümbol! Mis selle nimi on?");
      setNameQuestion(correctSymbol);
      setAnswerOptions(buildAnswerOptions(correctSymbol));
      setNameAnswerLocked(false);
      return;
    }

    setLocked(true);
    setFeedback("Õige! ✅");
    setScore((s) => s + 1);

    timeoutRef.current = setTimeout(() => {
      advanceAfterRound();
    }, 600);
  }

  function onPickName(label) {
    if (!nameQuestion || gameFinished || nameAnswerLocked) return;

    setNameAnswerLocked(true);
    clearDelay();

    const ok = label === nameQuestion.label;

    if (ok) {
      setFeedback("Õige! ✅");
      setScore((s) => s + 1);
    } else {
      setFeedback("Vale ❌");
    }

    timeoutRef.current = setTimeout(() => {
      advanceAfterRound();
    }, 700);
  }

  const notEnoughSymbols = symbolIds.length < required;

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
          }}
        >
          <button onClick={onBack}>
            Tagasi seadistusse
          </button>
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
        <h1 style={{ marginTop: 8, marginBottom: 20 }}>Dobble-tüüpi haridusmäng</h1>

        {notEnoughSymbols ? (
          <p>
            Mängu alustamiseks on vaja vähemalt <b>{required}</b> sümbolit. Praegu on valikus{" "}
            <b>{symbolIds.length}</b>.
          </p>
        ) : gameFinished ? (
          <div
            style={{
              padding: 16,
              border: "1px solid var(--border)",
              borderRadius: 12,
              background: "var(--panel-soft)",
            }}
          >
            <h2 style={{ marginTop: 0 }}>Mäng läbi</h2>
            <p>
              <b>Lõppskoor:</b> {score} / {roundCount}
            </p>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
              <button onClick={onRestart}>
                Alusta uuesti
              </button>
            </div>
          </div>
        ) : !imagesReady ? (
          <p>Pilte valmistatakse ette…</p>
        ) : !round ? (
          <p>Valmistun mänguks…</p>
        ) : (
          <>
            <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", marginBottom: 12 }}>
              <div
                style={{
                  display: "inline-block",
                  padding: "10px 14px",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  background: "var(--panel-soft)",
                }}
              >
                <b>Skoor:</b> {score}
              </div>

              <div
                style={{
                  display: "inline-block",
                  padding: "10px 14px",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  background: "var(--panel-soft)",
                }}
              >
                <b>Voor:</b> {currentRoundIndex} / {roundCount}
              </div>

              {useTimer && !nameQuestion && (
                <div
                  style={{
                    display: "inline-block",
                    padding: "10px 14px",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    background: "var(--panel-soft)",
                  }}
                >
                  <b>Aega järel:</b> {Math.max(0, timeLeft)}s
                </div>
              )}
            </div>

            {feedback && (
              <p style={{ fontSize: 20, fontWeight: 700, marginBottom: 14 }}>
                {feedback}
              </p>
            )}

            <div
              style={{
                display: "grid",
                gap: 16,
                gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))",
              }}
            >
              <Card
                title="Kaart A"
                ids={round.cardA}
                byId={byId}
                onPick={onPick}
                disabled={locked}
                roundKey={`A-${currentRoundIndex}`}
              />
              <Card
                title="Kaart B"
                ids={round.cardB}
                byId={byId}
                onPick={onPick}
                disabled={locked}
                roundKey={`B-${currentRoundIndex}`}
              />
            </div>

            {nameQuestion && (
              <div
                style={{
                  marginTop: 20,
                  padding: 16,
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  background: "var(--panel-soft)",
                }}
              >
                <h2 style={{ marginTop: 0, marginBottom: 8 }}>Mis selle sümboli nimi on?</h2>
                <p style={{ marginTop: 0, marginBottom: 12, opacity: 0.85 }}>
                  Vaata pilti ja vali õige nimetus.
                </p>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 14,
                  }}
                >
                  <div
                    style={{
                      width: 150,
                      height: 150,
                      borderRadius: 16,
                      overflow: "hidden",
                      border: "2px solid #5562f6",
                      background: "#fff",
                      display: "grid",
                      placeItems: "center",
                      boxShadow: "0 0 0 4px rgba(85, 98, 246, 0.15)",
                    }}
                  >
                    {nameQuestion.url ? (
                      <SymbolImage
                        url={nameQuestion.url}
                        alt={nameQuestion.label}
                        cropData={nameQuestion.crop}
                        size={150}
                        radius={14}
                      />
                    ) : (
                      <span
                        style={{
                          fontSize: 14,
                          color: "#555",
                          padding: 12,
                          textAlign: "center",
                        }}
                      >
                        {nameQuestion.label}
                      </span>
                    )}
                  </div>

                  <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center" }}>
                    {answerOptions.map((label) => (
                      <button
                        key={label}
                        disabled={nameAnswerLocked}
                        onClick={() => onPickName(label)}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}

function Card({ title, ids, byId, onPick, disabled, roundKey }) {
  const positions = getCircularPositions(ids.length);
  const itemSize =
    ids.length <= 4 ? 112 :
    ids.length <= 6 ? 94 :
    ids.length === 7 ? 84 :
    76;

  return (
    <div
      style={{
        border: "1px solid var(--border)",
        borderRadius: 18,
        padding: 16,
        background: "var(--panel)",
        color: "var(--text)",
      }}
    >
      <h2 style={{ marginTop: 0, marginBottom: 14, textAlign: "center" }}>{title}</h2>

      <div
        style={{
          width: "100%",
          display: "grid",
          placeItems: "center",
        }}
      >
        <div
          style={{
            position: "relative",
            width: "min(420px, 100%)",
            aspectRatio: "1 / 1",
            borderRadius: "50%",
            border: "2px solid var(--border)",
            background: "var(--panel-soft)",
            overflow: "hidden",
          }}
        >
          {ids.map((id, index) => {
            const s = byId.get(id);
            const pos = positions[index] ?? { x: 50, y: 50 };

            return (
              <button
                key={`${roundKey}-${id}`}
                onClick={() => onPick(id)}
                disabled={disabled}
                style={{
                  position: "absolute",
                  left: `${pos.x}%`,
                  top: `${pos.y}%`,
                  transform: "translate(-50%, -50%)",
                  width: itemSize,
                  height: itemSize,
                  borderRadius: "50%",
                  cursor: disabled ? "default" : "pointer",
                  display: "grid",
                  placeItems: "center",
                  padding: s?.url ? 0 : 8,
                  overflow: "hidden",
                  opacity: disabled ? 0.7 : 1,
                  background: "transparent",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.16)",
                  border: "1px solid rgba(0,0,0,0.08)",
                }}
              >
                {s?.url ? (
                  <SymbolImage
                    url={s.url}
                    alt={s.label}
                    cropData={s.crop}
                    size={itemSize}
                    radius={itemSize / 2}
                  />
                ) : (
                  <span
                    style={{
                      fontSize: 12,
                      textAlign: "center",
                      lineHeight: 1.2,
                      padding: 6,
                    }}
                  >
                    {s?.label ?? id}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}