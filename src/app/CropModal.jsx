import Cropper from "react-easy-crop";
import { useCallback, useEffect, useMemo, useState } from "react";

export default function CropModal({ open, imageUrl, initialCrop, onCancel, onSave }) {
  const initialPosition = useMemo(
    () => ({
      x: initialCrop?.crop?.x ?? initialCrop?.x ?? 0,
      y: initialCrop?.crop?.y ?? initialCrop?.y ?? 0,
    }),
    [initialCrop]
  );

  const initialZoom = initialCrop?.zoom ?? 1;
  const initialArea = initialCrop?.croppedAreaPixels ?? null;

  const [crop, setCrop] = useState(initialPosition);
  const [zoom, setZoom] = useState(initialZoom);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(initialArea);

  useEffect(() => {
    if (!open) return;
    setCrop(initialPosition);
    setZoom(initialZoom);
    setCroppedAreaPixels(initialArea);
  }, [open, imageUrl, initialPosition, initialZoom, initialArea]);

  const onCropComplete = useCallback((_, areaPixels) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  if (!open) return null;

  return (
    <div style={backdrop}>
      <div style={modal}>
        <h3 style={{ marginTop: 0 }}>Kärbi pilt</h3>

        <div style={cropArea}>
          <Cropper
            image={imageUrl}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 12 }}>
          <label style={{ flex: 1 }}>
            Zoom
            <input
              type="range"
              min="1"
              max="3"
              step="0.01"
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              style={{ width: "100%" }}
            />
          </label>

          <button onClick={onCancel}>Tühista</button>
          <button
            onClick={() =>
              onSave({
                x: crop.x,
                y: crop.y,
                zoom,
                croppedAreaPixels,
              })
            }
          >
            Salvesta
          </button>
        </div>
      </div>
    </div>
  );
}

const backdrop = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.5)",
  display: "grid",
  placeItems: "center",
  zIndex: 1000,
};

const modal = {
  width: "min(720px, 95vw)",
  background: "white",
  borderRadius: 16,
  padding: 16,
  color: "#111",
};

const cropArea = {
  position: "relative",
  width: "100%",
  height: 420,
  background: "#222",
  borderRadius: 12,
  overflow: "hidden",
};