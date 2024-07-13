import { RefObject } from "react";
import { Display } from "./display";
import { Keypad } from "./keypad";

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

const OPS_PER_FRAME = 10;

const CHAR_ROWS = 5;
const CHARS = [
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

export class Chip8Interpreter {
  mem: Uint8Array; // 4096 bytes of memory
  stack: Array<number>; // 12-bit address stack
  v: Uint8Array; // 16 8-bit registers
  pc: number; // 12-bit program counter
  i: number; // 12-bit memory pointer
  display: Display; // 64x32 monochrome display
  keypad: Keypad; // 16-key keypad
  delay: number; // 8-bit delay timer
  sound: number; // 8-bit sound timer

  constructor(canvasRef: RefObject<HTMLCanvasElement>) {
    this.mem = new Uint8Array(MEM_SIZE).fill(0);
    this.stack = Array<number>();
    this.v = new Uint8Array(REG_COUNT).fill(0);
    this.pc = START_ADDR;
    this.i = 0;
    this.delay = 0;
    this.sound = 0;
    this.display = new Display(this, canvasRef);
    this.keypad = new Keypad(this);
    for (let i = 0; i < CHARS.length; i++) {
      for (let row = 0; row < CHAR_ROWS; row++) {
        this.mem[i * CHAR_ROWS + row] = CHARS[i][row];
      }
    }
  }

  async run(program: string) {
    console.log("Running program:", program);
    await this.loadProgram(program);
    requestAnimationFrame(() => this.frameLoop());
  }

  frameLoop() {
    for (let i = 0; i < OPS_PER_FRAME; i++) this.step();
    this.decrementTimers();
    this.display.renderFrame();
    requestAnimationFrame(() => this.frameLoop());
  }

  async loadProgram(path: string) {
    const res = await fetch(encodeURI(path));
    if (res.ok) {
      const blob = await res.blob();
      const bytes = new Uint8Array(await blob.arrayBuffer());
      for (let byte = 0; byte < bytes.length; byte++) {
        this.mem[START_ADDR + byte] = bytes[byte];
      }
    }
  }

  step() {
    if (this.keypad.skipIfWaitingForKeyPress()) return;

    const hi = this.mem[this.pc++];
    const lo = this.mem[this.pc++];
    const opcode = (hi << BYTE_SHIFT) | lo;

    const op = (opcode & OP_MASK) >>> OP_SHIFT;
    const nnn = opcode & NNN_MASK;
    const nn = opcode & NN_MASK;
    const n = opcode & N_MASK;
    const x = (opcode & X_MASK) >>> X_SHIFT;
    const y = (opcode & Y_MASK) >>> Y_SHIFT;

    switch (op) {
      case 0x0:
        switch (nnn) {
          case 0x0e0:
            this.display.clear();
            break;
          case 0x0ee:
            this.pc = this.stack.pop() ?? START_ADDR;
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
        this.skipIfCond(this.v[x] === nn);
        break;
      case 0x4:
        this.skipIfCond(this.v[x] !== nn);
        break;
      case 0x5:
        this.skipIfCond(this.v[x] === this.v[y]);
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
            break;
          case 0x2:
            this.v[x] &= this.v[y];
            break;
          case 0x3:
            this.v[x] ^= this.v[y];
            break;
          case 0x4:
            this.add(x, x, y);
            break;
          case 0x5:
            this.add(x, x, y, true);
            break;
          case 0x6:
            this.v[0xf] = this.v[x] & 1;
            this.v[x] >>>= 1;
            break;
          case 0x7:
            this.add(x, y, x, true);
            break;
          case 0xe:
            this.v[0xf] = (this.v[x] >>> MSB_SHIFT) & 1;
            this.v[x] <<= 1;
            break;
        }
        break;
      case 0x9:
        this.skipIfCond(this.v[x] !== this.v[y]);
        break;
      case 0xa:
        this.i = nnn;
        break;
      case 0xb:
        this.pc = (this.v[0] + nnn) & NNN_MASK;
        break;
      case 0xc:
        this.v[x] = Math.floor(Math.random() * 256) & nn;
        break;
      case 0xd:
        this.display.drawSprite(x, y, n);
        break;
      case 0xe:
        switch (nn) {
          case 0x9e:
            this.skipIfCond(this.keypad.keys[this.v[x]]);
            break;
          case 0xa1:
            this.skipIfCond(!this.keypad.keys[this.v[x]]);
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
            this.keypad.keyReg = x;
            break;
          case 0x15:
            this.delay = this.v[x];
            break;
          case 0x18:
            this.sound = this.v[x];
            break;
          case 0x1e:
            this.i += this.v[x];
            this.i &= NNN_MASK;
            break;
          case 0x29:
            this.i = this.v[x] * CHAR_ROWS;
            break;
          case 0x33:
            this.bcd(x);
            break;
          case 0x55:
            for (let reg = 0; reg <= x; reg++) {
              this.mem[this.i + reg] = this.v[reg];
            }
            break;
          case 0x65:
            for (let reg = 0; reg <= x; reg++) {
              this.v[reg] = this.mem[this.i + reg];
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

  add(x: number, regA: number, regB: number, sub: boolean = false) {
    const regAVal = this.v[regA];
    if (sub) this.v[regB] = ~this.v[regB] + 1;
    this.v[x] = this.v[regA] + this.v[regB];
    this.v[0xf] = this.v[x] < regAVal || (sub && this.v[regB] == 0) ? 1 : 0;
  }

  bcd(x: number) {
    let value = this.v[x];
    this.mem[this.i] = Math.floor(value / 100);
    value %= 100;
    this.mem[this.i + 1] = Math.floor(value / 10);
    value %= 10;
    this.mem[this.i + 2] = Math.floor(value);
  }

  skipIfCond(cond: boolean) {
    if (cond) {
      this.pc += 2;
    }
  }

  decrementTimers() {
    if (this.delay > 0) {
      this.delay -= 1;
    }
    if (this.sound > 0) {
      this.sound -= 1;
    }
  }

  invalidOpcode(opcode: number) {
    console.log("Invalid opcode:", opcode);
  }
}
