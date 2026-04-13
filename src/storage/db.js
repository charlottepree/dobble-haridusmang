const DB_NAME = "edu_dobble_db";
const DB_VERSION = 2;

function requestToPromise(req) {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = () => {
      const db = req.result;
      const tx = req.transaction;

      if (!db.objectStoreNames.contains("images")) {
        db.createObjectStore("images", { keyPath: "id" });
      }

      let symbolsStore;
      if (!db.objectStoreNames.contains("symbols")) {
        symbolsStore = db.createObjectStore("symbols", { keyPath: "id" });
      } else {
        symbolsStore = tx.objectStore("symbols");
      }

      let packsStore;
      if (!db.objectStoreNames.contains("packs")) {
        packsStore = db.createObjectStore("packs", { keyPath: "id" });
      } else {
        packsStore = tx.objectStore("packs");
      }

      if (!packsStore.indexNames.contains("by_name")) {
        packsStore.createIndex("by_name", "name", { unique: true });
      }
      if (!packsStore.indexNames.contains("by_createdAt")) {
        packsStore.createIndex("by_createdAt", "createdAt", { unique: false });
      }

      // Legacy migration: vanad theme-põhised sümbolid -> packId
      const byNameIndex = packsStore.index("by_name");
      const cursorReq = symbolsStore.openCursor();

      cursorReq.onsuccess = (e) => {
        const cursor = e.target.result;
        if (!cursor) return;

        const sym = cursor.value;

        if (sym.packId) {
          cursor.continue();
          return;
        }

        const packName = (sym.theme ?? "Minu pildid").trim() || "Minu pildid";

        const getPackReq = byNameIndex.get(packName);
        getPackReq.onsuccess = () => {
          const existing = getPackReq.result;

          if (existing?.id) {
            sym.packId = existing.id;
            cursor.update(sym);
            cursor.continue();
            return;
          }

          const packId = crypto.randomUUID();
          packsStore.put({
            id: packId,
            name: packName,
            type: "user",
            createdAt: Date.now(),
            lastUsedAt: Date.now(),
          });

          sym.packId = packId;
          cursor.update(sym);
          cursor.continue();
        };

        getPackReq.onerror = () => {
          cursor.continue();
        };
      };
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function txDone(tx) {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

export async function addSymbolWithImage({ label, file, packId }) {
  const db = await openDb();
  const symbolId = crypto.randomUUID();
  const imageId = crypto.randomUUID();
  const now = Date.now();

  const tx = db.transaction(["images", "symbols"], "readwrite");
  const images = tx.objectStore("images");
  const symbols = tx.objectStore("symbols");

  images.put({
    id: imageId,
    blob: file,
    mime: file.type,
    filename: file.name,
    createdAt: now,
  });

  symbols.put({
    id: symbolId,
    label,
    imageId,
    packId: packId ?? null,
    createdAt: now,
    crop: null,
  });

  await txDone(tx);
  db.close();

  return { id: symbolId, label, imageId, packId: packId ?? null };
}

export async function getAllSymbols() {
  const db = await openDb();
  const tx = db.transaction(["symbols"], "readonly");
  const store = tx.objectStore("symbols");

  const symbols = (await requestToPromise(store.getAll())) || [];

  await txDone(tx);
  db.close();

  symbols.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
  return symbols;
}

export async function getImageBlob(imageId) {
  const db = await openDb();
  const tx = db.transaction(["images"], "readonly");
  const store = tx.objectStore("images");

  const img = await requestToPromise(store.get(imageId));

  await txDone(tx);
  db.close();

  return img?.blob ?? null;
}

export async function deleteSymbol(symbolId) {
  const db = await openDb();
  const tx = db.transaction(["symbols", "images"], "readwrite");
  const symbols = tx.objectStore("symbols");
  const images = tx.objectStore("images");

  const sym = await requestToPromise(symbols.get(symbolId));

  if (sym?.imageId) images.delete(sym.imageId);
  symbols.delete(symbolId);

  await txDone(tx);
  db.close();
}

export async function clearAll() {
  const db = await openDb();
  const tx = db.transaction(["symbols", "images"], "readwrite");
  tx.objectStore("symbols").clear();
  tx.objectStore("images").clear();
  await txDone(tx);
  db.close();
}

export async function importPresetTheme({ packId, items }) {
  for (const it of items) {
    const res = await fetch(it.src);
    if (!res.ok) throw new Error(`Ei saanud laadida: ${it.src}`);

    const blob = await res.blob();
    const file = new File([blob], it.label, { type: blob.type || "image/png" });

    await addSymbolWithImage({
      label: it.label,
      file,
      packId,
    });
  }
}

export async function updateSymbolCrop(symbolId, crop) {
  const db = await openDb();
  const tx = db.transaction(["symbols"], "readwrite");
  const store = tx.objectStore("symbols");

  const sym = await requestToPromise(store.get(symbolId));

  if (!sym) {
    db.close();
    throw new Error("Symbol not found");
  }

  sym.crop = crop;
  store.put(sym);

  await txDone(tx);
  db.close();
}

export async function renameSymbol(symbolId, newLabel) {
  const clean = (newLabel ?? "").trim();
  if (!clean) throw new Error("Sümboli nimi puudub.");

  const db = await openDb();
  const tx = db.transaction(["symbols"], "readwrite");
  const store = tx.objectStore("symbols");

  const sym = await requestToPromise(store.get(symbolId));

  if (!sym) {
    db.close();
    throw new Error("Sümbolit ei leitud.");
  }

  sym.label = clean;
  store.put(sym);

  await txDone(tx);
  db.close();

  return sym;
}

export async function getAllPacks() {
  const db = await openDb();
  const tx = db.transaction(["packs"], "readonly");
  const store = tx.objectStore("packs");

  const packs = (await requestToPromise(store.getAll())) || [];

  await txDone(tx);
  db.close();

  packs.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
  return packs;
}

export async function getPackByName(name) {
  const clean = (name ?? "").trim();
  if (!clean) return null;

  const db = await openDb();
  const tx = db.transaction(["packs"], "readonly");
  const store = tx.objectStore("packs");
  const idx = store.index("by_name");

  const pack = await requestToPromise(idx.get(clean));

  await txDone(tx);
  db.close();

  return pack ?? null;
}

export async function createPack({ name, type = "user", reuseExisting = true }) {
  const clean = (name ?? "").trim();
  if (!clean) throw new Error("Paki nimi puudub.");

  const db = await openDb();
  const tx = db.transaction(["packs"], "readwrite");
  const store = tx.objectStore("packs");
  const byName = store.index("by_name");

  const exists = await requestToPromise(byName.get(clean));

  if (exists?.id) {
    await txDone(tx);
    db.close();

    if (reuseExisting) return exists;
    throw new Error("Sellise nimega pakk on juba olemas.");
  }

  const pack = {
    id: crypto.randomUUID(),
    name: clean,
    type,
    createdAt: Date.now(),
    lastUsedAt: Date.now(),
  };

  store.put(pack);

  await txDone(tx);
  db.close();

  return pack;
}

export async function createOrReuseDemoPack(baseName) {
  const clean = (baseName ?? "").trim();
  if (!clean) throw new Error("Demo paki nimi puudub.");

  const existing = await getPackByName(clean);
  if (existing?.id) {
    if (existing.type === "demo") return existing;

    let n = 1;
    let candidate = `${clean} (demo)`;

    while (await getPackByName(candidate)) {
      n += 1;
      candidate = `${clean} (demo ${n})`;
    }

    return createPack({ name: candidate, type: "demo", reuseExisting: false });
  }

  return createPack({ name: clean, type: "demo", reuseExisting: false });
}

export async function renamePack(packId, newName) {
  const clean = (newName ?? "").trim();
  if (!clean) throw new Error("Uus nimi puudub.");

  const db = await openDb();
  const tx = db.transaction(["packs"], "readwrite");
  const store = tx.objectStore("packs");
  const byName = store.index("by_name");

  const conflict = await requestToPromise(byName.get(clean));
  if (conflict?.id && conflict.id !== packId) {
    await txDone(tx);
    db.close();
    throw new Error("Sellise nimega pakk on juba olemas.");
  }

  const pack = await requestToPromise(store.get(packId));
  if (!pack) {
    await txDone(tx);
    db.close();
    throw new Error("Pakk ei leitud.");
  }

  pack.name = clean;
  store.put(pack);

  await txDone(tx);
  db.close();

  return pack;
}

export async function convertDemoPackToUser(packId) {
  const db = await openDb();
  const tx = db.transaction(["packs"], "readwrite");
  const store = tx.objectStore("packs");
  const byName = store.index("by_name");

  const pack = await requestToPromise(store.get(packId));

  if (!pack) {
    await txDone(tx);
    db.close();
    throw new Error("Pakk ei leitud.");
  }

  if (pack.type !== "demo") {
    await txDone(tx);
    db.close();
    return { pack, converted: false };
  }

  const baseName = `${pack.name} (muudetud)`;
  let candidate = baseName;
  let n = 2;

  while (true) {
    const existing = await requestToPromise(byName.get(candidate));
    if (!existing || existing.id === packId) break;

    candidate = `${baseName} ${n}`;
    n += 1;
  }

  pack.name = candidate;
  pack.type = "user";
  store.put(pack);

  await txDone(tx);
  db.close();

  return { pack, converted: true };
}

export async function deletePack(packId) {
  const db = await openDb();
  const tx = db.transaction(["packs", "symbols", "images"], "readwrite");
  const packs = tx.objectStore("packs");
  const symbols = tx.objectStore("symbols");
  const images = tx.objectStore("images");

  const allSymbols = (await requestToPromise(symbols.getAll())) || [];

  for (const s of allSymbols) {
    if (s.packId === packId) {
      if (s.imageId) images.delete(s.imageId);
      symbols.delete(s.id);
    }
  }

  packs.delete(packId);

  await txDone(tx);
  db.close();
}

export async function clearPack(packId) {
  const db = await openDb();
  const tx = db.transaction(["symbols", "images"], "readwrite");
  const symbols = tx.objectStore("symbols");
  const images = tx.objectStore("images");

  const allSymbols = (await requestToPromise(symbols.getAll())) || [];

  for (const s of allSymbols) {
    if (s.packId === packId) {
      if (s.imageId) images.delete(s.imageId);
      symbols.delete(s.id);
    }
  }

  await txDone(tx);
  db.close();
}