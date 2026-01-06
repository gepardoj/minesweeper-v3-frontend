import { CELL_WIDTH, CELL_HEIGHT } from "./constants";

export const pathname = `.`;//window.location.pathname;

export const images = {
  cell: new Image(CELL_WIDTH, CELL_HEIGHT),
  selectedCell: new Image(CELL_WIDTH, CELL_HEIGHT),
  flag: new Image(CELL_WIDTH, CELL_HEIGHT),
  mine: new Image(CELL_WIDTH, CELL_HEIGHT),
};
images.cell.src = `${pathname}/img/cell.svg`;
images.selectedCell.src = `${pathname}/img/selected-cell.svg`;
images.flag.src = `${pathname}/img/flag.svg`;
images.mine.src = `${pathname}/img/mine.svg`;

type ImagesObject = typeof images;
type ImageKeys = keyof ImagesObject;

export const sounds = {
  death: new Audio(`${pathname}/sounds/pig-bomb.mp3`),
  win: new Audio(`${pathname}/sounds/win.mp3`),
};

type SoundsObject = typeof sounds;
type SoundKeys = keyof SoundsObject;

// TODO not used
export function onloadResources(
  onLoadAllResources: (images: ImagesObject, sounds: SoundsObject) => void
) {
  Promise.all([
    Object.keys(images).map((key) => {
      const image = images[key as ImageKeys];
      return new Promise((resolve) => (image.onload = image.onerror = resolve));
    }),
    Object.keys(sounds).map((key) => {
      const sound = sounds[key as SoundKeys];
      return new Promise((resolve) => (sound.onload = sound.onerror = resolve));
    }),
  ]).then((results) =>
    results.every((res) => {
      if (res) {
        onLoadAllResources(images, sounds);
      } else {
        throw new Error("some resources didn't loaded successfully");
      }
    })
  );
}
