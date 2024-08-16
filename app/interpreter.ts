import {
  DEFAULT_FILTER,
  DEFAULT_VOLUME,
  getFlagRegister,
  setFlagRegister,
} from "./local-storage";
import { Filter, Pixel } from "./pixel";

const MEM_SIZE = 0x1000;
const START_ADDR = 0x200;
const REG_COUNT = 16;

const OP_MASK = 0xf000;
const OP_SHIFT = 12;
const NNN_MASK = 0xfff;
const NN_MASK = 0xff;
const N_MASK = 0xf;
const X_MASK = 0x0f00;
const Y_MASK = 0x00f0;
const X_SHIFT = 8;
const Y_SHIFT = 4;
const MSB_SHIFT = 7;
const BYTE_SHIFT = 8;

export const LORES_WIDTH = 64;
export const LORES_HEIGHT = 32;
export const HIRES_WIDTH = 128;
export const HIRES_HEIGHT = 64;
const HIRES_SPRITE_SIZE = 16;
const BYTE_SIZE = 8;

const MS_PER_SEC = 1000;
const FRAMES_PER_SEC = 60;
const MS_PER_FRAME = MS_PER_SEC / FRAMES_PER_SEC;

const VOLUME_STEPS = 10;
const MAX_VOLUME = 0.25;

const LORES_ROWS = 5;
const LORES_FONT = [
  [0xf0, 0x90, 0x90, 0x90, 0xf0], // 0
  [0x20, 0x60, 0x20, 0x20, 0x70], // 1
  [0xf0, 0x10, 0xf0, 0x80, 0xf0], // 2
  [0xf0, 0x10, 0xf0, 0x10, 0xf0], // 3
  [0x90, 0x90, 0xf0, 0x10, 0x10], // 4
  [0xf0, 0x80, 0xf0, 0x10, 0xf0], // 5
  [0xf0, 0x80, 0xf0, 0x90, 0xf0], // 6
  [0xf0, 0x10, 0x20, 0x40, 0x40], // 7
  [0xf0, 0x90, 0xf0, 0x90, 0xf0], // 8
  [0xf0, 0x90, 0xf0, 0x10, 0xf0], // 9
  [0xf0, 0x90, 0xf0, 0x90, 0x90], // A
  [0xe0, 0x90, 0xe0, 0x90, 0xe0], // B
  [0xf0, 0x80, 0x80, 0x80, 0xf0], // C
  [0xe0, 0x90, 0x90, 0x90, 0xe0], // D
  [0xf0, 0x80, 0xf0, 0x80, 0xf0], // E
  [0xf0, 0x80, 0xf0, 0x80, 0x80], // F
];

const HIRES_ROWS = 10;
const HIRES_FONT_ADDR = 0x50;
const HIRES_FONT = [
  [0xff, 0xff, 0xc3, 0xc3, 0xc3, 0xc3, 0xc3, 0xc3, 0xff, 0xff], // 0
  [0x0c, 0x0c, 0x3c, 0x3c, 0x0c, 0x0c, 0x0c, 0x0c, 0x3f, 0x3f], // 1
  [0xff, 0xff, 0x03, 0x03, 0xff, 0xff, 0xc0, 0xc0, 0xff, 0xff], // 2
  [0xff, 0xff, 0x03, 0x03, 0xff, 0xff, 0x03, 0x03, 0xff, 0xff], // 3
  [0xc3, 0xc3, 0xc3, 0xc3, 0xff, 0xff, 0x03, 0x03, 0x03, 0x03], // 4
  [0xff, 0xff, 0xc0, 0xc0, 0xff, 0xff, 0x03, 0x03, 0xff, 0xff], // 5
  [0xff, 0xff, 0xc0, 0xc0, 0xff, 0xff, 0xc3, 0xc3, 0xff, 0xff], // 6
  [0xff, 0xff, 0x03, 0x03, 0x0c, 0x0c, 0x30, 0x30, 0x30, 0x30], // 7
  [0xff, 0xff, 0xc3, 0xc3, 0xff, 0xff, 0xc3, 0xc3, 0xff, 0xff], // 8
  [0xff, 0xff, 0xc3, 0xc3, 0xff, 0xff, 0x03, 0x03, 0xff, 0xff], // 9
  [0xff, 0xff, 0xc3, 0xc3, 0xff, 0xff, 0xc3, 0xc3, 0xc3, 0xc3], // A
  [0xfc, 0xfc, 0xc3, 0xc3, 0xfc, 0xfc, 0xc3, 0xc3, 0xfc, 0xfc], // B
  [0xff, 0xff, 0xc0, 0xc0, 0xc0, 0xc0, 0xc0, 0xc0, 0xff, 0xff], // C
  [0xfc, 0xfc, 0xc3, 0xc3, 0xc3, 0xc3, 0xc3, 0xc3, 0xfc, 0xfc], // D
  [0xff, 0xff, 0xc0, 0xc0, 0xff, 0xff, 0xc0, 0xc0, 0xff, 0xff], // E
  [0xff, 0xff, 0xc0, 0xc0, 0xff, 0xff, 0xc0, 0xc0, 0xc0, 0xc0], // F
];

const KEY_MAP = new Map<string, number>([
  ["1", 0x1],
  ["2", 0x2],
  ["3", 0x3],
  ["4", 0xc],
  ["q", 0x4],
  ["w", 0x5],
  ["e", 0x6],
  ["r", 0xd],
  ["a", 0x7],
  ["s", 0x8],
  ["d", 0x9],
  ["f", 0xe],
  ["z", 0xa],
  ["x", 0x0],
  ["c", 0xb],
  ["v", 0xf],
]);

interface Resolution {
  width: number;
  height: number;
}

const LORES: Resolution = { width: 64, height: 32 };
const VIP_HIRES: Resolution = { width: 64, height: 64 };
const HIRES: Resolution = { width: 128, height: 64 };

export interface ProgramMetadata {
  title: string;
  authors: string;
  release: string;
  description: string;
  platformId: string;
  platformName: string;
  tickrate: number;
  logicQuirk: boolean; // 8XY1,8XY2,8XY3: vf = 0 if true else vf unchanged
  shiftQuirk: boolean; // 8XY6+8XYE: shift vx if true else shift vy
  jumpQuirk: boolean; // BNNN: pc = xnn + vx if true else pc = nnn + v0
  wrapQuirk: boolean; // DXYN: wrap sprites if true else clip sprites
  vBlankQuirk: boolean; // DXYN: wait for next frame before drawing sprite
  loadStoreQuirk: boolean; // FX55+FX65: i unchanged if true else i += x (+1)
  loadStoreQuirkAlt: boolean; // FX55+FX65: i += x if true else i += x + 1
}

export class Chip8Interpreter {
  metadata?: ProgramMetadata;
  ctx?: CanvasRenderingContext2D;
  stackTrace: string[];

  mem: Uint8Array; // 4096 bytes of memory
  stack: Array<number>; // 12-bit address stack
  v: Uint8Array; // 16 8-bit registers
  pc: number; // 12-bit program counter
  i: number; // 12-bit memory pointer
  display: Array<Array<Pixel>>; // monochrome display
  resolution: Resolution; // 64x32, 64x64, or 128x64
  filter: Filter; // current display filter
  keys: Array<boolean>; // 16 keypad keys
  keyReg: number; // stores output register while waiting for key press
  delay: number; // 8-bit delay timer
  sound: number; // 8-bit sound timer
  soundPlaying: boolean; // is sound currently playing
  oscillator: OscillatorNode | undefined; // oscillator for playing sound
  volume: number; // oscillator volume
  waitingForVBlank: boolean; // is the program waiting for v-blank
  spriteX: number; // stores sprite x coord register while waiting for v-blank
  spriteY: number; // stores sprite y coord register while waiting for v-blank
  spriteN: number; // stores the number of sprite rows while waiting for v-blank
  running: boolean; // start + stop interpreter

  constructor() {
    this.stackTrace = [];

    this.mem = new Uint8Array(MEM_SIZE).fill(0);
    this.stack = Array<number>();
    this.v = new Uint8Array(REG_COUNT).fill(0);
    this.pc = START_ADDR;
    this.i = 0;
    this.display = [];
    this.resolution = LORES;
    this.filter = DEFAULT_FILTER;
    this.keys = Array<boolean>(KEY_MAP.size).fill(false);
    this.keyReg = -1;
    this.delay = 0;
    this.sound = 0;
    this.soundPlaying = false;
    this.volume = DEFAULT_VOLUME;
    this.oscillator = undefined;
    this.waitingForVBlank = false;
    this.spriteX = 0;
    this.spriteY = 0;
    this.spriteN = 0;
    this.running = true;

    this.loadFontData();
    this.initDisplay();
  }

  // :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  // Interpreter
  // :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

  async run(program: string) {
    await this.loadProgram(program);
    const startTime = Date.now();
    requestAnimationFrame(() => this.runLoop(startTime, startTime));
  }

  reset(metadata: ProgramMetadata) {
    if (this.soundPlaying) this.oscillator!.stop();

    this.metadata = metadata;

    this.mem = new Uint8Array(MEM_SIZE).fill(0);
    this.stack = Array<number>();
    this.v = new Uint8Array(REG_COUNT).fill(0);
    this.pc = START_ADDR;
    this.i = 0;
    this.resolution = LORES;
    this.keys = Array<boolean>(KEY_MAP.size).fill(false);
    this.keyReg = -1;
    this.delay = 0;
    this.sound = 0;
    this.soundPlaying = false;
    this.oscillator = this.newOscillator();
    this.waitingForVBlank = false;
    this.running = true;

    this.loadFontData();
    this.clearDisplay();
  }

  loadFontData() {
    this.copyFontIntoMem(LORES_FONT);
    this.copyFontIntoMem(HIRES_FONT, HIRES_FONT_ADDR);
  }

  copyFontIntoMem(font: number[][], startAddr: number = 0) {
    for (let i = 0; i < font.length; i++) {
      for (let row = 0; row < font[i].length; row++) {
        this.mem[i * font[i].length + startAddr + row] = font[i][row];
      }
    }
  }

  runLoop(timeStamp: number, frameStamp: number) {
    if (!this.running) return;

    const now = Date.now();

    const diffMs = now - timeStamp;
    const opsPerMs = (this.metadata!.tickrate * 60) / MS_PER_SEC;
    const frameOps = diffMs * opsPerMs;
    for (let i = 0; i < frameOps; i++) this.step();

    const frameDiffMs = now - frameStamp;
    if (frameDiffMs >= MS_PER_FRAME) {
      frameStamp = now - (frameDiffMs - MS_PER_FRAME);
      this.decrementTimers();
      this.renderFrame();
    }

    requestAnimationFrame(() => this.runLoop(now, frameStamp));
  }

  async loadProgram(program: string) {
    const res = await fetch("bin/" + encodeURI(program));
    if (res.ok) {
      const blob = await res.blob();
      const bytes = new Uint8Array(await blob.arrayBuffer());
      for (let byte = 0; byte < bytes.length; byte++) {
        this.mem[START_ADDR + byte] = bytes[byte];
      }
    }
  }

  newOscillator(): OscillatorNode {
    const ctx = new AudioContext();

    const gainNode = ctx.createGain();
    gainNode.connect(ctx.destination);
    gainNode.gain.value = (this.volume / VOLUME_STEPS) * MAX_VOLUME;

    const oscillator = ctx.createOscillator();
    oscillator.type = "square";
    oscillator.frequency.value = 493;
    oscillator.connect(gainNode);

    return oscillator;
  }

  step() {
    if (this.sound === 0 && this.soundPlaying) {
      this.oscillator!.stop();
      this.soundPlaying = false;
    }

    if (this.waitingForVBlank || this.waitingForKeyPress()) return;

    const hi = this.mem[this.pc++];
    const lo = this.mem[this.pc++];
    let opcode = (hi << BYTE_SHIFT) | lo;
    this.stackTrace.push(
      `${(this.pc - 2).toString(16)}: ${opcode.toString(16)}`
    );
    if (this.stackTrace.length > 5) {
      this.stackTrace = this.stackTrace.slice(1);
    }

    // cosmac vip hires mode
    if (this.pc - 2 === START_ADDR && opcode === 0x1260) {
      this.resolution = VIP_HIRES;
      opcode = 0x12c0;
    }

    const op = (opcode & OP_MASK) >>> OP_SHIFT;
    const nnn = opcode & NNN_MASK;
    const nn = opcode & NN_MASK;
    const n = opcode & N_MASK;
    const x = (opcode & X_MASK) >>> X_SHIFT;
    const y = (opcode & Y_MASK) >>> Y_SHIFT;

    let temp = 0;
    switch (op) {
      case 0x0:
        if ((nnn & 0x0f0) === 0x0c0) {
          this.scrollDisplayDown(n);
          break;
        }
        switch (nnn) {
          case 0x0e0:
            this.clearDisplay();
            break;
          case 0x0ee:
            this.pc = this.stack.pop() ?? START_ADDR;
            break;
          case 0x0fb:
            this.scrollDisplayRight();
            break;
          case 0x0fc:
            this.scrollDisplayLeft();
            break;
          case 0x0fd:
            this.running = false;
            break;
          case 0x0fe:
            this.resolution = LORES;
            break;
          case 0x0ff:
            this.resolution = HIRES;
            break;
          case 0x230:
            this.clearDisplay();
            break;
          default:
            this.invalidOpcode(opcode);
            break;
        }
        break;
      case 0x1:
        this.pc = nnn;
        break;
      case 0x2:
        this.stack.push(this.pc);
        this.pc = nnn;
        break;
      case 0x3:
        if (this.v[x] === nn) this.pc += 2;
        break;
      case 0x4:
        if (this.v[x] !== nn) this.pc += 2;
        break;
      case 0x5:
        if (this.v[x] === this.v[y]) this.pc += 2;
        break;
      case 0x6:
        this.v[x] = nn;
        break;
      case 0x7:
        this.v[x] += nn;
        break;
      case 0x8:
        switch (n) {
          case 0x0:
            this.v[x] = this.v[y];
            break;
          case 0x1:
            this.v[x] |= this.v[y];
            if (this.metadata!.logicQuirk) this.v[0xf] = 0;
            break;
          case 0x2:
            this.v[x] &= this.v[y];
            if (this.metadata!.logicQuirk) this.v[0xf] = 0;
            break;
          case 0x3:
            this.v[x] ^= this.v[y];
            if (this.metadata!.logicQuirk) this.v[0xf] = 0;
            break;
          case 0x4:
            temp = this.v[x] + this.v[y] > 0xff ? 1 : 0;
            this.v[x] += this.v[y];
            this.v[0xf] = temp;
            break;
          case 0x5:
            temp = this.v[x] < this.v[y] ? 0 : 1;
            this.v[x] -= this.v[y];
            this.v[0xf] = temp;
            break;
          case 0x6:
            if (!this.metadata!.shiftQuirk) this.v[x] = this.v[y];
            temp = this.v[x] & 1;
            this.v[x] >>>= 1;
            this.v[0xf] = temp;
            break;
          case 0x7:
            temp = this.v[y] < this.v[x] ? 0 : 1;
            this.v[x] = this.v[y] - this.v[x];
            this.v[0xf] = temp;
            break;
          case 0xe:
            if (!this.metadata!.shiftQuirk) this.v[x] = this.v[y];
            temp = (this.v[x] >>> MSB_SHIFT) & 1;
            this.v[x] <<= 1;
            this.v[0xf] = temp;
            break;
        }
        break;
      case 0x9:
        if (this.v[x] !== this.v[y]) this.pc += 2;
        break;
      case 0xa:
        this.i = nnn;
        break;
      case 0xb:
        this.pc = (this.v[this.metadata!.jumpQuirk ? x : 0] + nnn) & NNN_MASK;
        break;
      case 0xc:
        this.v[x] = Math.floor(Math.random() * 256) & nn;
        break;
      case 0xd:
        this.drawSprite(x, y, n);
        break;
      case 0xe:
        switch (nn) {
          case 0x9e:
            if (this.keys[this.v[x]]) this.pc += 2;
            break;
          case 0xa1:
            if (!this.keys[this.v[x]]) this.pc += 2;
            break;
          default:
            this.invalidOpcode(opcode);
            break;
        }
        break;
      case 0xf:
        switch (nn) {
          case 0x07:
            this.v[x] = this.delay;
            break;
          case 0x0a:
            this.keyReg = x;
            break;
          case 0x15:
            this.delay = this.v[x];
            break;
          case 0x18:
            this.sound = this.v[x];
            if (this.sound > 0) {
              if (this.soundPlaying) this.oscillator!.stop();
              this.oscillator = this.newOscillator();
              this.soundPlaying = this.sound > 0;
              this.oscillator.start();
            }
            break;
          case 0x1e:
            // This code is needed for one game
            // if (this.i + this.v[x] > NNN_MASK) {
            //   this.v[0xf] = 1;
            // }
            this.i += this.v[x];
            this.i &= NNN_MASK;
            break;
          case 0x29:
            this.i = this.v[x] * LORES_ROWS;
            break;
          case 0x30:
            this.i = this.v[x] * HIRES_ROWS + HIRES_FONT_ADDR;
            break;
          case 0x33:
            this.bcd(x);
            break;
          case 0x55:
            for (let reg = 0; reg <= x; reg++) {
              this.mem[this.i + reg] = this.v[reg];
            }
            if (!this.metadata!.loadStoreQuirk) {
              this.i += this.metadata!.loadStoreQuirkAlt ? x : x + 1;
            }
            break;
          case 0x65:
            for (let reg = 0; reg <= x; reg++) {
              this.v[reg] = this.mem[this.i + reg];
            }
            if (!this.metadata!.loadStoreQuirk) {
              this.i += this.metadata!.loadStoreQuirkAlt ? x : x + 1;
            }
            break;
          case 0x75:
            for (let reg = 0; reg <= x; reg++) {
              setFlagRegister(reg, this.v[reg]);
            }
            break;
          case 0x85:
            for (let reg = 0; reg <= x; reg++) {
              this.v[reg] = getFlagRegister(reg);
            }
            break;
          default:
            this.invalidOpcode(opcode);
            break;
        }
        break;
      default:
        this.invalidOpcode(opcode);
        break;
    }
  }

  bcd(x: number) {
    let value = this.v[x];
    this.mem[this.i] = Math.floor(value / 100);
    value %= 100;
    this.mem[this.i + 1] = Math.floor(value / 10);
    value %= 10;
    this.mem[this.i + 2] = Math.floor(value);
  }

  decrementTimers() {
    if (this.delay > 0) this.delay -= 1;
    if (this.sound > 0) this.sound -= 1;
  }

  invalidOpcode(opcode: number) {
    console.log(
      "Invalid opcode ",
      opcode.toString(16),
      "at pc =",
      (this.pc - 2).toString(16)
    );
    console.log(this.stackTrace);
    this.running = false;
  }

  // :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  // Display
  // :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

  async renderFrame() {
    const documentStyle = document.documentElement.style;
    const onColor = documentStyle.getPropertyValue("--on-color");
    const offColor = documentStyle.getPropertyValue("--off-color");
    for (let y = 0; y < HIRES_HEIGHT; y++) {
      for (let x = 0; x < HIRES_WIDTH; x++) {
        this.display[y][x].draw(
          x,
          y,
          onColor,
          offColor,
          this.filter,
          this.ctx!
        );
      }
    }
    if (this.waitingForVBlank) {
      this.drawSprite(this.spriteX, this.spriteY, this.spriteN);
      this.waitingForVBlank = false;
    }
  }

  drawSprite(x: number, y: number, n: number) {
    if (this.metadata!.vBlankQuirk && !this.waitingForVBlank) {
      this.waitingForVBlank = true;
      this.spriteX = x;
      this.spriteY = y;
      this.spriteN = n;
      return;
    }
    if (n === 0 && this.resolution === HIRES) {
      this.drawHiresSprite(x, y);
    } else {
      this.drawLoresSprite(x, y, n);
    }
  }

  drawLoresSprite(x: number, y: number, n: number) {
    const xCoord = this.v[x] % this.resolution.width;
    const yCoord = this.v[y] % this.resolution.height;

    this.v[0xf] = 0;
    for (let row = 0; row < n; row++) {
      let pxY = yCoord + row;
      if (this.metadata!.wrapQuirk) pxY %= this.resolution.height;
      if (pxY >= this.resolution.height) continue;
      let rowByte = this.mem[this.i + row];
      for (let col = 0; col < BYTE_SIZE; col++) {
        let pxX = xCoord + col;
        if (this.metadata!.wrapQuirk) pxX %= this.resolution.width;
        if (pxX >= this.resolution.width) continue;
        const px = (rowByte >>> (BYTE_SIZE - col - 1)) & 1;
        if (px === 1) this.setPixel(pxX, pxY);
      }
    }
  }

  drawHiresSprite(x: number, y: number) {
    const xCoord = this.v[x] % HIRES_WIDTH;
    const yCoord = this.v[y] % HIRES_HEIGHT;

    this.v[0xf] = 0;
    for (let row = 0; row < HIRES_SPRITE_SIZE; row++) {
      let pxY = yCoord + row;
      if (this.metadata!.wrapQuirk) pxY %= HIRES_HEIGHT;
      if (pxY >= HIRES_HEIGHT) continue;
      let rowByte1 = this.mem[this.i + row * 2];
      let rowByte2 = this.mem[this.i + row * 2 + 1];
      for (let col = 0; col < BYTE_SIZE; col++) {
        let pxX = xCoord + col;
        if (this.metadata!.wrapQuirk) pxX %= HIRES_WIDTH;
        if (pxX >= HIRES_WIDTH) continue;
        const px = (rowByte1 >>> (BYTE_SIZE - col - 1)) & 1;
        if (px === 1) this.setPixel(pxX, pxY);
      }
      for (let col = 0; col < BYTE_SIZE; col++) {
        let pxX = xCoord + col + BYTE_SIZE;
        if (this.metadata!.wrapQuirk) pxX %= HIRES_WIDTH;
        if (pxX >= HIRES_WIDTH) continue;
        const px = (rowByte2 >>> (BYTE_SIZE - col - 1)) & 1;
        if (px === 1) this.setPixel(pxX, pxY);
      }
    }
  }

  setPixel(x: number, y: number) {
    let coords = [];
    if (this.resolution === HIRES) {
      coords = [[x, y]];
    } else if (this.resolution === VIP_HIRES) {
      coords = [[x + 32, y]];
    } else {
      x *= 2;
      y *= 2;
      coords = [
        [x, y],
        [x + 1, y],
        [x, y + 1],
        [x + 1, y + 1],
      ];
    }

    for (const coord of coords) {
      const px = this.display[coord[1]][coord[0]];
      if (px.on) {
        this.v[0xf] = 1;
        px.turnOff(this.filter);
      } else {
        px.turnOn();
      }
    }
  }

  scrollDisplayRight() {
    for (let y = 0; y < HIRES_HEIGHT; y++) {
      for (let x = HIRES_WIDTH - 5; x >= 0; x--) {
        const px = this.display[y][x];
        const scrollPx = this.display[y][x + 4];
        if (px.on) {
          px.turnOff(this.filter);
          scrollPx.turnOn();
        } else {
          scrollPx.turnOff(this.filter);
        }
      }
    }
  }

  scrollDisplayLeft() {
    for (let y = 0; y < HIRES_HEIGHT; y++) {
      for (let x = 4; x < HIRES_WIDTH; x++) {
        const px = this.display[y][x];
        const scrollPx = this.display[y][x - 4];
        if (px.on) {
          px.turnOff(this.filter);
          scrollPx.turnOn();
        } else {
          scrollPx.turnOff(this.filter);
        }
      }
    }
  }

  scrollDisplayDown(n: number) {
    for (let y = HIRES_HEIGHT - (n + 1); y >= 0; y--) {
      for (let x = 4; x < HIRES_WIDTH; x++) {
        const px = this.display[y][x];
        const scrollPx = this.display[y + n][x];
        if (px.on) {
          px.turnOff(this.filter);
          scrollPx.turnOn();
        } else {
          scrollPx.turnOff(this.filter);
        }
      }
    }
  }

  initDisplay() {
    for (let y = 0; y < HIRES_HEIGHT; y++) {
      const row: Pixel[] = [];
      for (let x = 0; x < HIRES_WIDTH; x++) {
        row.push(new Pixel());
      }
      this.display.push(row);
    }
  }

  clearDisplay() {
    for (let y = 0; y < HIRES_HEIGHT; y++) {
      for (let x = 0; x < HIRES_WIDTH; x++) {
        this.display[y][x].turnOff(this.filter);
      }
    }
  }

  // :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  // Keypad
  // :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

  keyDownHandler(ev: KeyboardEvent) {
    const key = KEY_MAP.get(ev.key);
    if (key !== undefined) this.keys[key] = true;
  }

  keyUpHandler(ev: KeyboardEvent) {
    const key = KEY_MAP.get(ev.key);
    if (key !== undefined) this.keys[key] = false;
  }

  waitingForKeyPress(): boolean {
    if (this.keyReg < 0) return false;

    const key = this.getFirstPressedKey();
    if (key < 0) return true;

    this.v[this.keyReg] = key;
    this.keys[key] = false;
    this.keyReg = -1;
    return false;
  }

  getFirstPressedKey(): number {
    for (let key = 0; key < KEY_MAP.size; key++) {
      if (this.keys[key]) {
        return key;
      }
    }
    return -1;
  }
}
