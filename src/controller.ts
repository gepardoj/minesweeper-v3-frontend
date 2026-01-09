import {
  Canvas,
} from "./Canvas";
import {
  CELL_WIDTH,
  CELL_HEIGHT,
  ID,
} from "./constants";
import { GameModel } from "./model/GameModel";
import { sounds, spritesheets } from "./resources";
import { SoundSystem } from "./sound-system";
import { MenuPopup } from "./menu-popup/menu-popup";
import { getById } from "./helpers";
import { EventType, GameStatus } from "./types";
import { GameState } from "./GameState";
import { initInformationPanel, writeMinesLeft } from "./ui/ui";
import { InfoPopup } from "./info-popup/InfoPopup";
import { Storage } from "./Storage";
import { ConfettiEffect } from "./effects/ConfettiEffect";
import { GLCanvas } from "./gl/GLCanvas";

const DELAY_TO_OPEN_MS = 150;
const PLAY_EFFECT_DELAY = 7_000;


/**
 * Used to interact with user and change the model. Makes Canvas and Model to work together
 */
export class GameController {
  gl: GLCanvas;
  canvas: Canvas;
  clickStartedAt: number = 0;
  isPointerUp: boolean = false;
  selectedCell?: { x: number; y: number; };
  pressedCell?: { x: number, y: number; };
  model: GameModel;
  soundSystem: SoundSystem;
  menu: MenuPopup;
  info: InfoPopup;
  winEffect: ConfettiEffect;

  constructor() {
    this.gl = new GLCanvas;
    this.canvas = new Canvas(this.gl);
    this.model = GameState.Load() ?? GameModel.Create();
    this.soundSystem = new SoundSystem();
    this.menu = new MenuPopup({
      gameController: this,
      onPlay: this.OnPlay,
      onInfo: this.OnInfo,
    });
    this.info = new InfoPopup;
    if (!Storage.IsTutorialShowed()) {
      this.OnInfo();
    }

    this.canvas.Init(this.model.gameField.cellsX, this.model.gameField.cellsY);
    this.winEffect = new ConfettiEffect(this.canvas.ctx);

    initInformationPanel(this.model.mines);
    this.AttachHandlers();
    this.GameLoop();
    this.InitOptionsBtn();
    this.OnSave();
  }

  private OnPlay = () => {
    this.gl.Stop();
    this.AttachHandlers();
    this.model.NewGame(MenuPopup.GetDifficultyFromInput());
    this.canvas.Init(this.model.gameField.cellsX, this.model.gameField.cellsY);
    writeMinesLeft(this.model.GetFlagsNumber(), this.model.mines);
    this.menu.PreventMenuOpen();
    this.menu.ToggleShow(false);
  };

  private OnInfo = () => {
    this.info.Show(true, [
      "1. Short touch is to open a cell",
      "2. Longer touch is to flag a cell",
      "3. Holding over an open cell, it highlights around cells"
    ]);
  };

  private OnOpen = (x: number, y: number) => {
    this.model.OpenAt(x, y);
    this.model.OpenAround(x, y);
  };

  private OnFlag = (x: number, y: number) => {
    const cell = this.model.gameField.GetCell(x, y);
    if (cell.opened) return;
    this.model.FlagAt(x, y);
    navigator.vibrate(5);
    const flags = this.model.GetFlagsNumber();
    writeMinesLeft(flags, this.model.mines);
  };

  private OnSave = () => {
    // on save
    document.onvisibilitychange = () => {
      if (document.hidden) {
        GameState.Save(this.model);
      }
    };
  };

  private InitOptionsBtn() {
    getById(ID.optionsBtn).onclick = () => {
      this.menu.ToggleShow();
    };
  }

  private GetCellNumberByUIEvent(event: MouseEvent | TouchEvent) {
    let offsetX = 0;
    let offsetY = 0;
    if (event instanceof MouseEvent) {
      offsetX = event.offsetX;
      offsetY = event.offsetY;
    } else if (event instanceof TouchEvent) {
      const target = event.target as HTMLElement;
      const bcr = target.getBoundingClientRect();
      offsetX = event.targetTouches[0].clientX - bcr.x;
      offsetY = event.targetTouches[0].clientY - bcr.y;
    }
    else throw new Error("Couldn't determine the type of the event");
    const x = this.canvas.GetCellNumberByOffset(offsetX, CELL_WIDTH);
    const y = this.canvas.GetCellNumberByOffset(offsetY, CELL_HEIGHT);
    return { x, y };
  }

  private AttachHandlers() {
    this.EnableContextMenu(false);
    // on hover show selected cell
    this.canvas.el.onmousemove = (event) => {
      const { x, y } = this.GetCellNumberByUIEvent(event);
      if (x >= 0 && x < this.model.gameField.cellsX && y >= 0 && y < this.model.gameField.cellsY)
        this.selectedCell = { x, y };
    };
    this.canvas.el.onpointerdown = (event) => {
      const { x, y } = this.GetCellNumberByUIEvent(event);
      this.pressedCell = { x, y };
      this.model.SetHighlightAround(x, y, true);
      switch (event.button) {
        case 0: // left click
          this.clickStartedAt = new Date().getTime();
          this.isPointerUp = false;
          this.WaitingClick(x, y);
          break;
        case 2: // right click
          this.OnFlag(x, y);
          break;
      }
    };
    this.canvas.el.ontouchmove = (event) => {
      const { x, y } = this.GetCellNumberByUIEvent(event);
      if (this.pressedCell) {
        this.model.SetHighlightAround(this.pressedCell.x, this.pressedCell.y, false);
      }
      this.model.SetHighlightAround(x, y, true);
      this.pressedCell = { x, y };
    };
    this.canvas.el.ontouchend = () => {
      if (this.pressedCell) {
        this.model.SetHighlightAround(this.pressedCell.x, this.pressedCell.y, false);
      }
      this.pressedCell = undefined;
    };
    this.canvas.el.onpointerup = () => {
      this.isPointerUp = true;
      if (!this.pressedCell) return;
      this.model.SetHighlightAround(this.pressedCell.x, this.pressedCell.y, false);
      this.pressedCell = undefined;
    };
  }

  private DetachHandlers() {
    this.EnableContextMenu(true);
    this.canvas.el.onmousemove = null;
    this.canvas.el.onpointerdown = null;
    this.canvas.el.onpointerup = null;
  }

  private EnableContextMenu(enable: boolean) {
    this.canvas.el.oncontextmenu = () => enable;
  }

  private ManageEventQueue() {
    const event = this.model.eventQueue.pop();
    if (event) {
      switch (event.type) {
        case EventType.DEFEAT:
          this.OnDefeat(event.x, event.y);
          break;
        case EventType.WIN:
          this.OnWin();
          break;
      }
    }
  }

  private OnDefeat(x: number, y: number) {
    this.DetachHandlers();
    this.soundSystem.Play(sounds.death);
    const posX = x / (this.model.gameField.cellsX - 1);
    const posY = y / (this.model.gameField.cellsY - 1);
    this.canvas.StartSpritesheetAnimation(spritesheets.bomb, x, y);
    // Starting wave explosion effect
    setTimeout(() => {
      this.gl.SetTexture(this.canvas.ctx.canvas.toDataURL());
      this.gl.Play([posX, posY], PLAY_EFFECT_DELAY);
    }, 1500);
    // this.menu.RequestMenuOpen(PLAY_EFFECT_DELAY);
  }

  private OnWin() {
    this.DetachHandlers();
    this.soundSystem.Play(sounds.win);
    this.winEffect.Play(PLAY_EFFECT_DELAY);
    // this.menu.RequestMenuOpen(PLAY_EFFECT_DELAY);
  }

  // Arrow functions save context compared to classic functions/methods
  private WaitingClick = (x: number, y: number) => {
    const delay = new Date().getTime() - this.clickStartedAt;
    if (this.isPointerUp && delay <= DELAY_TO_OPEN_MS) {
      this.OnOpen(x, y);
      return;
    }
    if (delay > DELAY_TO_OPEN_MS) {
      this.OnFlag(x, y);
      return;
    }
    setTimeout(() => this.WaitingClick(x, y), 5);
  };

  private GameLoop = () => {
    this.ManageEventQueue();
    this.Render();
    this.winEffect.Draw();
    setTimeout(() => requestAnimationFrame(this.GameLoop), 30);
  };

  private Render() {
    this.canvas.Draw(this.model);
    this.canvas.glCanvas.Draw();

    if (this.model.status !== GameStatus.IN_PROGRESS && this.model.status !== GameStatus.START) return;

    this.canvas.RenderSelectedCell(this);
  }
}
