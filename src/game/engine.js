function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickUnique(arr, count, exclude = new Set()) {
  const pool = arr.filter((x) => !exclude.has(x));
  return shuffle(pool).slice(0, count);
}

export function pickTwoCards(symbolIds, symbolsPerCard = 3) {
  if (symbolsPerCard < 3 || symbolsPerCard > 8) {
    throw new Error("symbolsPerCard peab olema vahemikus 3 kuni 8.");
  }

  const required = 2 * symbolsPerCard - 1;
  if (symbolIds.length < required) {
    throw new Error(`Vaja on vähemalt ${required} sümbolit.`);
  }

  const common = pick(symbolIds);
  const pool = symbolIds.filter((x) => x !== common);

  const aExtras = pickUnique(pool, symbolsPerCard - 1);
  const excludeForB = new Set(aExtras);
  const bExtras = pickUnique(pool, symbolsPerCard - 1, excludeForB);

  if (aExtras.length !== symbolsPerCard - 1 || bExtras.length !== symbolsPerCard - 1) {
    throw new Error("Kaartide genereerimiseks ei ole piisavalt erinevaid sümboleid.");
  }

  const cardA = shuffle([common, ...aExtras]);
  const cardB = shuffle([common, ...bExtras]);

  return { cardA, cardB, common };
}

export function checkAnswer(cardA, cardB, chosen) {
  return cardA.includes(chosen) && cardB.includes(chosen);
}