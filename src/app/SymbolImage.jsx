export default function SymbolImage({ url, alt, cropData, size = 110, radius = 10 }) {
  const area = cropData?.croppedAreaPixels;

  // fallback: kui cropi pole, kuva cover
  if (!area) {
    return (
      <div style={{ width: size, height: size, overflow: "hidden", borderRadius: radius, background: "transparent" }}>
        <img src={url} alt={alt} loading="eager" decoding="async" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
      </div>
    );
  }

  const scale = size / area.width;
  const translateX = -area.x * scale;
  const translateY = -area.y * scale;

  return (
    <div style={{ width: size, height: size, overflow: "hidden", borderRadius: radius, background: "transparent", position: "relative" }}>
      <img
        src={url}
        alt={alt}
        loading="eager"
        decoding="async"
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          transformOrigin: "top left",
          transform: `translate(${translateX}px, ${translateY}px) scale(${scale})`,
          display: "block",
          userSelect: "none",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}