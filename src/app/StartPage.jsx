import { useState } from "react";

export default function StartPage({
  onCreateNew,
  onManageExisting,
  onPlayExisting,
}) {
  const [showIntro, setShowIntro] = useState(false);

  const cardStyle = {
    padding: 22,
    borderRadius: 16,
    textAlign: "left",
    minHeight: 150,
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-start",
  };

  return (
    <div
      style={{
        maxWidth: 900,
        margin: "0 auto",
        padding: 24,
        fontFamily: "system-ui",
        color: "var(--text)",
      }}
    >
      <h1 style={{ marginBottom: 16 }}>Dobble-tüüpi haridusmäng</h1>

      <div style={{ marginBottom: 28 }}>
        <button
          type="button"
          onClick={() => setShowIntro((v) => !v)}
        >
          {showIntro ? "Peida" : "Mis see on?"}
        </button>

        {showIntro && (
          <p
            style={{
              opacity: 0.85,
              maxWidth: 820,
              marginTop: 16,
              marginBottom: 0,
              fontSize: 18,
              lineHeight: 1.5,
            }}
          >
            See on Dobble-tüüpi haridusmäng, kus tuleb leida kahe kaardi vahel üks ühine sümbol. <br />
            Loo ise oma sümbolitega kaardipakid või kasuta mõnda valmis demopakki. <br />
            Mäng sobib hästi sõnavara ja tähelepanu arendamiseks.
          </p>
        )}
      </div>

      <div style={{ display: "grid", gap: 18 }}>
        <button onClick={onCreateNew} style={cardStyle}>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>
            Loo uus pakk
          </div>
          <div style={{ opacity: 0.82, lineHeight: 1.5 }}>
            Sobib siis, kui soovid alustada nullist ja lisada mängu oma
            pildid.
          </div>
        </button>

        <button onClick={onManageExisting} style={cardStyle}>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>
            Muuda olemasolevat pakki
          </div>
          <div style={{ opacity: 0.82, lineHeight: 1.5 }}>
            Sobib siis, kui soovid olemasoleva paki sisu muuta, pilte lisada
            või neid korrastada.
          </div>
        </button>

        <button onClick={onPlayExisting} style={cardStyle}>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>
            Alusta mängu
          </div>
          <div style={{ opacity: 0.82, lineHeight: 1.5 }}>
            Sobib siis, kui soovid valida olemasoleva paki või importida
            kiireks alustamiseks demopaki.
          </div>
        </button>
      </div>
    </div>
  );
}