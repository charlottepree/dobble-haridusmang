import { useEffect, useMemo, useRef, useState } from "react";
import { getImageBlob } from "../storage/db.js";

function revokeUrls(urls) {
  urls.forEach((url) => {
    try {
      URL.revokeObjectURL(url);
    } catch {
      // ignore revoke errors
    }
  });
}

export default function useObjectUrls(symbols) {
  const [urlMap, setUrlMap] = useState({});
  const urlMapRef = useRef({});

  useEffect(() => {
    urlMapRef.current = urlMap;
  }, [urlMap]);

  useEffect(() => {
    let cancelled = false;

    async function syncUrls() {
      const neededImageIds = [...new Set(symbols.map((s) => s.imageId).filter(Boolean))];
      const prev = urlMapRef.current;

      const currentIds = new Set(Object.keys(prev));
      const neededIds = new Set(neededImageIds);

      const idsToAdd = neededImageIds.filter((id) => !currentIds.has(id));
      const idsToRemove = [...currentIds].filter((id) => !neededIds.has(id));

      if (idsToAdd.length === 0 && idsToRemove.length === 0) {
        return;
      }

      const additions = {};

      for (const imageId of idsToAdd) {
        const blob = await getImageBlob(imageId);
        if (!blob) continue;
        additions[imageId] = URL.createObjectURL(blob);
      }

      if (cancelled) {
        revokeUrls(Object.values(additions));
        return;
      }

      setUrlMap((prevMap) => {
        const next = { ...prevMap };

        for (const imageId of idsToRemove) {
          if (next[imageId]) {
            try {
              URL.revokeObjectURL(next[imageId]);
            } catch {
              // ignore
            }
            delete next[imageId];
          }
        }

        for (const [imageId, url] of Object.entries(additions)) {
          next[imageId] = url;
        }

        return next;
      });
    }

    syncUrls();

    return () => {
      cancelled = true;
    };
  }, [symbols]);

  useEffect(() => {
    return () => {
      revokeUrls(Object.values(urlMapRef.current));
    };
  }, []);

  const enrichedSymbols = useMemo(() => {
    return symbols.map((s) => ({
      ...s,
      url: urlMap[s.imageId],
    }));
  }, [symbols, urlMap]);

  return {
    urlMap,
    enrichedSymbols,
  };
}