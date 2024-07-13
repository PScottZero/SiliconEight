import { RefObject } from "react";
import { Chip8Interpreter } from "./interpreter";

export const DISP_WIDTH = 64;
export const DISP_HEIGHT = 32;
export const DISP_SCALE = 100;
const PX_ON_COLOR = "#00ffff";
const PX_OFF_COLOR = "#000000";

export class Display {
  chip8: Chip8Interpreter;
  canvasRef: RefObject<HTMLCanvasElement>;
  pixels: Array<Array<number>>; // 64x32 monochrome display

  constructor(
    chip8: Chip8Interpreter,
    canvasRef: RefObject<HTMLCanvasElement>,
  ) {
    this.chip8 = chip8;
    this.canvasRef = canvasRef;
    this.pixels = Array.from({ length: DISP_HEIGHT }, () =>
      Array<number>(DISP_WIDTH).fill(0),
    );
  }

  async renderFrame() {
    const context = this.canvasRef.current!.getContext("2d")!;
    for (let row = 0; row < DISP_HEIGHT; row++) {
      for (let col = 0; col < DISP_WIDTH; col++) {
        context.fillStyle = this.pixels[row][col] ? PX_ON_COLOR : PX_OFF_COLOR;
        context.fillRect(
          col * DISP_SCALE,
          row * DISP_SCALE,
          DISP_SCALE,
          DISP_SCALE,
        );
      }
    }
  }

  drawSprite(x: number, y: number, n: number) {
    const xCoord = this.chip8.v[x];
    const yCoord = this.chip8.v[y];
    for (let row = 0; row < n; row++) {
      let rowByte = this.chip8.mem[this.chip8.i + row];
      const pxY = (yCoord + row) % DISP_HEIGHT;
      for (let col = 0; col < 8; col++) {
        const px = (rowByte >>> (7 - col)) & 1;
        const pxX = (xCoord + col) % DISP_WIDTH;
        const oldPx = this.pixels[pxY][pxX];
        this.pixels[pxY][pxX] ^= px;
        if (oldPx == 1 && this.pixels[pxY][pxX] == 0) {
          this.chip8.v[0xf] = 1;
        }
      }
    }
  }

  clear() {
    this.pixels = Array.from({ length: DISP_HEIGHT }, () =>
      Array<number>(DISP_WIDTH).fill(0),
    );
  }
}
