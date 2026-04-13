import { useEffect, useState } from "react";

const imagePromiseCache = new Map();

function preloadImage(url) {
  if (!url) return Promise.resolve();

  if (imagePromiseCache.has(url)) {
    return imagePromiseCache.get(url);
  }

  const promise = new Promise((resolve, reject) => {
    const img = new Image();
    img.src = url;

    const done = () => resolve(img);
    const fail = (err) => reject(err);

    img.onload = async () => {
      try {
        if (typeof img.decode === "function") {
          await img.decode();
        }
      } catch {
        // decode võib ebaõnnestuda ka siis, kui pilt ise on kasutatav
      }
      done();
    };

    img.onerror = fail;
  });

  imagePromiseCache.set(url, promise);
  return promise;
}

export default function usePreloadedImages(symbols) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!symbols.length) {
        setReady(true);
        return;
      }

      const allUrlsPresent = symbols.every((s) => !s.imageId || !!s.url);

      if (!allUrlsPresent) {
        setReady(false);
        return;
      }

      setReady(false);

      const urls = [
        ...new Set(
          symbols
            .map((s) => s.url)
            .filter(Boolean)
        ),
      ];

      try {
        await Promise.all(urls.map(preloadImage));

        if (!cancelled) {
          setReady(true);
        }
      } catch {
        if (!cancelled) {
          setReady(true);
        }
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [symbols]);

  return ready;
}