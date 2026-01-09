import {
  BACKGROUND_COLOR,
  CELL_WIDTH,
  CELL_HEIGHT,
  COLOR_NUMBERS,
  FLAG_SIZES_X,
  FLAG_SIZES_Y,
  NUMBER_FONT,
  NUMBER_X_OFFSET,
  NUMBER_Y_OFFSET,
} from "./constants";
import { GameController } from "./controller";
import { GLCanvas } from "./gl/GLCanvas";
import { GameModel } from "./model/GameModel";
import { images, Spritesheet, spritesheets } from "./resources";

type SpritesheetAnimation = { spritesheet: Spritesheet; x: number; y: number; currentFrame: number; };

export class Canvas {
  el: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  glCanvas: GLCanvas;
  private _spritesheetAnimations: SpritesheetAnimation[] = [];

  constructor(gl: GLCanvas) {
    const canvas = document.getElementById("game");
    if (!(canvas instanceof HTMLCanvasElement)) throw new Error("the canvas is not HTMLCanvasElement");
    this.el = canvas;

    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("the canvas's 2d context is null");
    this.ctx = ctx;

    this.glCanvas = gl;
  }

  Init(cellsX: number, cellsY: number) {
    this.el.style.background = BACKGROUND_COLOR;
    this.el.width = cellsX * CELL_WIDTH;
    this.el.height = cellsY * CELL_HEIGHT;
    this.glCanvas.gl.canvas.width = this.ctx.canvas.width;
    this.glCanvas.gl.canvas.height = this.ctx.canvas.height;
    this.ctx.font = NUMBER_FONT;
  }

  StartSpritesheetAnimation(spritesheet: Spritesheet, x: number, y: number) {
    this._spritesheetAnimations.push({ spritesheet, x, y, currentFrame: 0 });
  }

  TickSpritesheetAnimations() {
    let reducedAnimations = this._spritesheetAnimations;
    for (let i = 0; i < this._spritesheetAnimations.length; i++) {
      const { spritesheet, currentFrame, x, y } = this._spritesheetAnimations[i];
      this.ctx.clearRect(x * CELL_WIDTH, y * CELL_HEIGHT, CELL_WIDTH, CELL_HEIGHT);
      this.ctx.drawImage(
        spritesheet.img, currentFrame * CELL_WIDTH, 0, CELL_WIDTH, CELL_HEIGHT,
        x * CELL_WIDTH, y * CELL_HEIGHT, CELL_WIDTH, CELL_HEIGHT
      );
      this._spritesheetAnimations[i].currentFrame++;
      // end of animation
      if (this._spritesheetAnimations[i].currentFrame === spritesheet.frames) {
        reducedAnimations = reducedAnimations.filter((_, animI) => animI !== i);
        this.ctx.clearRect(x * CELL_WIDTH, y * CELL_HEIGHT, CELL_WIDTH, CELL_HEIGHT);
      }
    }
    this._spritesheetAnimations = reducedAnimations;
  }

  /**
   * Called each frame, in game loop
   */
  Draw(model: GameModel) {
    for (let x = 0; x < model.gameField.cellsX; x++) {
      for (let y = 0; y < model.gameField.cellsY; y++) {
        const cell = model.gameField.GetCell(x, y);
        if (cell.opened) {
          // cell is opened
          this.ctx.fillStyle = "grey";
          this.ctx.fillRect(
            x * CELL_WIDTH,
            y * CELL_HEIGHT,
            CELL_WIDTH,
            CELL_HEIGHT
          );
          if (cell.mined) { // bomb here
            //this.DrawImageAt(images.mine, x, y, CELL_WIDTH, CELL_HEIGHT);
          } else if (cell.nearbyMines) {
            this.ctx.fillStyle = COLOR_NUMBERS[cell.nearbyMines - 1];
            this.ctx.fillText(
              String(cell.nearbyMines),
              x * CELL_WIDTH + NUMBER_X_OFFSET,
              y * CELL_HEIGHT + NUMBER_Y_OFFSET
            );
            this.ctx.fillStyle = BACKGROUND_COLOR;
          }
        } else {
          // cell is not opened
          const img = cell.highlighted && !cell.flagged ? images.selectedCell : images.cell;
          this.ctx.drawImage(
            img,
            x * CELL_WIDTH,
            y * CELL_HEIGHT,
            CELL_WIDTH,
            CELL_HEIGHT
          );
          if (cell.flagged) {
            this.DrawImageAt(images.flag, x, y, FLAG_SIZES_X, FLAG_SIZES_Y);
          }
        }
      }
    }

    this.TickSpritesheetAnimations();
  }

  RenderSelectedCell(controller: GameController) {
    const { selectedCell, model } = controller;
    if (!selectedCell) return;
    const cell = model.gameField.GetCell(selectedCell.x, selectedCell.y);
    if (!cell.opened && !cell.flagged) {
      this.DrawImageAt(images.selectedCell, selectedCell.x, selectedCell.y);
    }
  }

  DrawImageAt(
    image: HTMLImageElement,
    x: number,
    y: number,
    sizeX?: number,
    sizeY?: number
  ) {
    this.ctx.drawImage(
      image,
      x * CELL_WIDTH +
      // if size defined then add padding to put at middle
      (sizeX ? (CELL_WIDTH - sizeX) / 2 : 0),
      y * CELL_HEIGHT + (sizeY ? (CELL_HEIGHT - sizeY) / 2 : 0),
      sizeX ? sizeX : CELL_WIDTH,
      sizeY ? sizeY : CELL_HEIGHT
    );
  }

  ClearAtByOffset(
    offsetX: number,
    offsetY: number
  ) {
    this.ctx.clearRect(
      this.GetCellPositionOnCanvasByOffset(offsetX, CELL_WIDTH),
      this.GetCellPositionOnCanvasByOffset(offsetY, CELL_HEIGHT),
      CELL_WIDTH,
      CELL_HEIGHT
    );
  }

  GetCellNumberByOffset(offset: number, cellSize: number) {
    return Math.floor(offset / cellSize);
  }

  GetCellPositionOnCanvasByOffset(
    offset: number,
    cellSize: number
  ) {
    return this.GetCellNumberByOffset(offset, cellSize) * cellSize;
  }
}