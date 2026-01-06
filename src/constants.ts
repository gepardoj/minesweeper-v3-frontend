import { Difficulty, GameStatus } from "./types";

export const CELL_WIDTH = 32;
export const CELL_HEIGHT = 32;

export const ID = {
  status: "status",
  soundBtn: "sound-btn",
  optionsBtn: "options-btn",
  playBtn: "play-btn",
  infoBtn: "info-btn",
  menuPopup: "menu-popup",
  infoPopup: "info-popup",
  closeBtn: "close-btn",
};

export const DifficultyInputID: Record<Difficulty, string> = {
  [Difficulty.EASY]: "easy",
  [Difficulty.MEDIUM]: "medium",
  [Difficulty.HARD]: "hard",
  [Difficulty.IMPOSSIBLE]: "impossible",
};

export const CLASS = {
  disabled: "disabled",
  difficulty: "difficulty",
};

export const StatusText: Record<GameStatus, string> = {
  [GameStatus.START]: "Waiting to start",
  [GameStatus.DEFEAT]: "Defeat",
  [GameStatus.IN_PROGRESS]: "In progress",
  [GameStatus.PAUSE]: "Pause",
  [GameStatus.WIN]: "Win",
};

export const FLAG_SIZES_X = 20;
export const FLAG_SIZES_Y = 20;

export const DifficultyMines: Record<Difficulty, number> = {
  [Difficulty.EASY]: 10,
  [Difficulty.MEDIUM]: 15,
  [Difficulty.HARD]: 20,
  [Difficulty.IMPOSSIBLE]: 25,
};

export enum DifficultyValues {
  EASY = 10, MEDIUM = 15, HARD = 20, Impossible = 25
};

export const NUMBER_FONT = "24px serif";
export const NUMBER_X_OFFSET = 8;
export const NUMBER_Y_OFFSET = 22;

export const BACKGROUND_COLOR = "grey";

export const COLOR_NUMBERS = [
  "green",
  "yellow",
  "red",
  "blue",
  "orange",
  "purple",
  "aqua",
  "pink",
];
