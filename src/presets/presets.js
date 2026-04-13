const animalFiles = [
  "hiir.jpg",
  "hobune.jpg",
  "hunt.jpg",
  "ilves.jpg",
  "jänes.jpg",
  "karu.jpg",
  "kass.jpg",
  "koer.jpg",
  "lammas.jpg",
  "lehm.jpg",
  "öökull.jpg",
  "orav.jpg",
  "põder.jpg",
  "rebane.jpg",
  "siil.jpg",
];

const fruitFiles = [
  "ananass.jpg",
  "apelsin.jpg",
  "arbuus.jpg",
  "banaan.jpg",
  "kiivi.jpg",
  "kirss.jpg",
  "maasikas.jpg",
  "melon.jpg",
  "õun.jpg",
  "pirn.jpg",
  "ploom.jpg",
  "sidrun.jpg",
  "vaarikas.jpg",
  "viinamari.jpg",
  "virsik.jpg",
];

function buildItems(folder, files) {
  return files.map((filename) => {
    const label = filename.replace(/\.[^/.]+$/, "");
    return {
      label,
      src: `/presets/${folder}/${filename}`,
    };
  });
}

export const PRESETS = [
  {
    key: "animals",
    name: "Loomad",
    items: buildItems("animals", animalFiles),
  },
  {
    key: "fruits",
    name: "Puuviljad",
    items: buildItems("fruits", fruitFiles),
  },
];