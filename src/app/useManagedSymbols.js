import { useEffect, useMemo, useState } from "react";
import {
  addSymbolWithImage,
  convertDemoPackToUser,
  createPack,
  deletePack,
  deleteSymbol,
  getAllSymbols,
  renameSymbol,
  updateSymbolCrop,
} from "../storage/db.js";

function inferLabel(filename) {
  return filename.replace(/\.[^.]+$/, "").trim();
}

function normalizeLabel(label) {
  return (label ?? "").trim().toLowerCase();
}

export default function useManagedSymbols({
  selectedPackId,
  uploadPackId,
  pendingPackName,
  setupMode,
  EMPTY_VIEW,
  ALL_PACKS,
  onSymbolsChange,
  onPacksChange,
  onPackCreated,
  onClearExisting,
}) {
  const [symbols, setSymbols] = useState([]);
  const [error, setError] = useState("");
  const [cropTarget, setCropTarget] = useState(null);

  async function reloadAll() {
    const list = await getAllSymbols();
    setSymbols(list);
    onSymbolsChange?.(list);
    await onPacksChange?.();
  }

  function updateLocalSymbol(symbolId, patch) {
    setSymbols((prev) => {
      const next = prev.map((s) =>
        s.id === symbolId ? { ...s, ...patch } : s
      );

      onSymbolsChange?.(next);
      return next;
    });
  }

  async function ensureEditablePack(packId) {
    if (!packId || packId === EMPTY_VIEW || packId === ALL_PACKS) {
      return packId;
    }

    const result = await convertDemoPackToUser(packId);

    if (result.converted) {
      await onPacksChange?.();
    }

    return result.pack.id;
  }

  useEffect(() => {
    reloadAll();
  }, [selectedPackId]);

  const visibleSymbols = useMemo(() => {
    if (selectedPackId === EMPTY_VIEW) return [];
    if (selectedPackId === ALL_PACKS) return symbols;
    return symbols.filter((s) => s.packId === selectedPackId);
  }, [symbols, selectedPackId, EMPTY_VIEW, ALL_PACKS]);

  async function handleFileList(fileList) {
    setError("");

    const files = Array.from(fileList || []);
    const images = files.filter((f) => f.type.startsWith("image/"));

    if (images.length === 0) {
      setError("Palun vali pildifailid (png/jpg/webp).");
      return;
    }

    let packId = uploadPackId;

    if (!packId) {
      const name = (pendingPackName ?? "").trim();
      if (!name) {
        setError("Pane pakile nimi enne üleslaadimist.");
        return;
      }

      try {
        const pack = await createPack({
          name,
          type: "user",
          reuseExisting: false,
        });
        packId = pack.id;
        onPackCreated?.(pack);
        await onPacksChange?.();
      } catch (e) {
        setError("Sellise nimega pakk on juba olemas. Palun vali teine nimi.");
        return;
      }
    } else {
      packId = await ensureEditablePack(packId);
    }

    const currentSymbols = await getAllSymbols();
    const existingLabelsInPack = new Set(
      currentSymbols
        .filter((s) => s.packId === packId)
        .map((s) => normalizeLabel(s.label))
        .filter(Boolean)
    );

    const filesToAdd = [];
    const skippedLabels = [];
    const batchLabels = new Set();

    for (const file of images) {
      const label = inferLabel(file.name);
      const normalized = normalizeLabel(label);

      if (!normalized) continue;

      if (existingLabelsInPack.has(normalized) || batchLabels.has(normalized)) {
        skippedLabels.push(label);
        continue;
      }

      batchLabels.add(normalized);
      filesToAdd.push({ file, label });
    }

    for (const item of filesToAdd) {
      await addSymbolWithImage({
        label: item.label,
        file: item.file,
        packId,
      });
    }

    await reloadAll();

    if (filesToAdd.length === 0 && skippedLabels.length > 0) {
      setError(
        "Valitud pilte ei lisatud, sest sama nimega sümbolid on selles pakis juba olemas."
      );
      return;
    }

    if (skippedLabels.length > 0) {
      setError(
        "Mõnda pilti ei lisatud, sest sama nimega sümbol on selles pakis juba olemas."
      );
      return;
    }

    setError("");
  }

  async function handleFiles(e) {
    await handleFileList(e.target.files);
    e.target.value = "";
  }

  async function handleDelete(symbolId) {
    setError("");

    const targetSymbol = symbols.find((s) => s.id === symbolId);
    const targetPackId = targetSymbol?.packId ?? selectedPackId;

    if (setupMode === "manage" && targetPackId) {
      await ensureEditablePack(targetPackId);
    }

    await deleteSymbol(symbolId);

    setSymbols((prev) => {
      const next = prev.filter((s) => s.id !== symbolId);
      onSymbolsChange?.(next);
      return next;
    });

    await onPacksChange?.();
  }

  async function handleRenameSymbol(symbolId, newLabel) {
    const trimmed = (newLabel ?? "").trim();
    const normalizedNew = normalizeLabel(trimmed);

    if (!trimmed) {
      setError("Sümboli nimi ei tohi olla tühi.");
      return;
    }

    const currentSymbols = await getAllSymbols();
    const targetSymbol = currentSymbols.find((s) => s.id === symbolId);

    if (!targetSymbol) {
      setError("Sümbolit ei leitud.");
      return;
    }

    const targetPackId = targetSymbol.packId;

    if (setupMode === "manage" && targetPackId) {
      await ensureEditablePack(targetPackId);
    }

    const currentNormalized = normalizeLabel(targetSymbol.label);

    if (normalizedNew === currentNormalized) {
      setError("");
      return;
    }

    const duplicateExists = currentSymbols.some(
      (s) =>
        s.id !== symbolId &&
        s.packId === targetPackId &&
        normalizeLabel(s.label) === normalizedNew
    );

    if (duplicateExists) {
      setError("Sama nimega sümbol on selles pakis juba olemas.");
      return;
    }

    setError("");
    await renameSymbol(symbolId, trimmed);

    setSymbols((prev) => {
      const next = prev.map((s) =>
        s.id === symbolId ? { ...s, label: trimmed } : s
      );
      onSymbolsChange?.(next);
      return next;
    });
  }

  async function handleClear() {
    setError("");

    if (setupMode !== "new") {
      onClearExisting?.();
      return;
    }

    if (
      selectedPackId &&
      selectedPackId !== EMPTY_VIEW &&
      selectedPackId !== ALL_PACKS
    ) {
      await deletePack(selectedPackId);
      onClearExisting?.();
      await reloadAll();
    }
  }

  function handleOpenCrop(symbol) {
    setCropTarget({
      symbolId: symbol.id,
      imageUrl: symbol.url,
      initialCrop: symbol.crop ?? null,
    });
  }

  async function handleSaveCrop(data) {
    if (!cropTarget?.symbolId) return;

    const targetSymbol = symbols.find((s) => s.id === cropTarget.symbolId);
    const targetPackId = targetSymbol?.packId;

    if (setupMode === "manage" && targetPackId) {
      await ensureEditablePack(targetPackId);
    }

    await updateSymbolCrop(cropTarget.symbolId, data);
    updateLocalSymbol(cropTarget.symbolId, { crop: data });
    setCropTarget(null);
  }

  function handleCloseCrop() {
    setCropTarget(null);
  }

  return {
    error,
    cropTarget,
    visibleSymbols,
    handleFiles,
    handleFileList,
    handleDelete,
    handleRenameSymbol,
    handleClear,
    handleOpenCrop,
    handleSaveCrop,
    handleCloseCrop,
  };
}