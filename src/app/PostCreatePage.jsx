export default function PostCreatePage({ packName, onCreateAnother, onBrowseAndPlay }) {
  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 24, fontFamily: "system-ui", color: "var(--text)" }}>
      <h1>Pakk valmis</h1>
      <p>
        Loodud pakk: <b>{packName}</b>
      </p>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 16 }}>
        <button onClick={onCreateAnother}>Loo uus pakk</button>
        <button onClick={onBrowseAndPlay}>Vaata pakke ja asu mängima</button>
      </div>
    </div>
  );
}