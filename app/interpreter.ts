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
export const DISPLAY_SCALE = 32;

const MS_PER_SEC = 1000;
const FRAMES_PER_SEC = 60;
const MS_PER_FRAME = MS_PER_SEC / FRAMES_PER_SEC;
const OFF_DELAY = 5;

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

export class Pixel {
  on: boolean;
  framesUntilOff: number;

  constructor() {
    this.on = false;
    this.framesUntilOff = 0;
  }

  turnOn() {
    this.on = true;
  }

  turnOff(flickerFix: boolean) {
    if (this.on) {
      this.on = false;
      this.framesUntilOff = flickerFix ? OFF_DELAY : 0;
    }
  }

  shouldDraw(): boolean {
    return this.on || this.framesUntilOff > 0;
  }

  step() {
    this.framesUntilOff = Math.min(0, this.framesUntilOff - 1);
  }
}

export class Chip8Interpreter {
  metadata: ProgramMetadata | undefined;
  ctx: CanvasRenderingContext2D | undefined;

  mem: Uint8Array; // 4096 bytes of memory
  stack: Array<number>; // 12-bit address stack
  v: Uint8Array; // 16 8-bit registers
  pc: number; // 12-bit program counter
  i: number; // 12-bit memory pointer
  display: Array<Array<Pixel>>; // 64x32 monochrome display
  hires: boolean; // should hires mode be used
  flickerFix: boolean; // should flicker fix be applied
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
    this.metadata = undefined;
    this.ctx = undefined;

    this.mem = new Uint8Array(MEM_SIZE).fill(0);
    this.stack = Array<number>();
    this.v = new Uint8Array(REG_COUNT).fill(0);
    this.pc = START_ADDR;
    this.i = 0;
    this.display = [];
    this.hires = false;
    this.flickerFix = false;
    this.keys = Array<boolean>(KEY_MAP.size).fill(false);
    this.keyReg = -1;
    this.delay = 0;
    this.sound = 0;
    this.soundPlaying = false;
    this.volume = 5;
    this.oscillator = undefined;
    this.waitingForVBlank = false;
    this.spriteX = 0;
    this.spriteY = 0;
    this.spriteN = 0;
    this.running = true;

    this.copyCharData();
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
    this.hires = false;
    this.keys = Array<boolean>(KEY_MAP.size).fill(false);
    this.keyReg = -1;
    this.delay = 0;
    this.sound = 0;
    this.soundPlaying = false;
    this.oscillator = this.newOscillator();
    this.waitingForVBlank = false;
    this.running = true;

    this.copyCharData();
    this.clearDisplay();
  }

  copyCharData() {
    for (let i = 0; i < CHARS.length; i++) {
      for (let row = 0; row < CHAR_ROWS; row++) {
        this.mem[i * CHAR_ROWS + row] = CHARS[i][row];
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
    gainNode.gain.value = this.volume / 100.0;

    const oscillator = ctx.createOscillator();
    oscillator.type = "square";
    oscillator.frequency.value = 493;
    oscillator.connect(gainNode);

    return oscillator;
  }

  step() {
    if (this.sound == 0 && this.soundPlaying) {
      this.oscillator!.stop();
      this.soundPlaying = false;
    }

    if (this.waitingForVBlank || this.skipIfWaitingForKeyPress()) return;

    const hi = this.mem[this.pc++];
    const lo = this.mem[this.pc++];
    const opcode = (hi << BYTE_SHIFT) | lo;

    const op = (opcode & OP_MASK) >>> OP_SHIFT;
    const nnn = opcode & NNN_MASK;
    const nn = opcode & NN_MASK;
    const n = opcode & N_MASK;
    const x = (opcode & X_MASK) >>> X_SHIFT;
    const y = (opcode & Y_MASK) >>> Y_SHIFT;

    let temp = 0;
    switch (op) {
      case 0x0:
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
            this.hires = false;
            break;
          case 0x0ff:
            this.hires = true;
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
            this.i = this.v[x] * CHAR_ROWS;
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
    console.log("Invalid opcode:", opcode.toString(16));
    this.running = false;
  }

  // :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  // Display
  // :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

  async renderFrame() {
    const documentStyle = document.documentElement.style;
    const onColor = documentStyle.getPropertyValue("--on-color");
    const offColor = documentStyle.getPropertyValue("--off-color");
    for (let row = 0; row < HIRES_HEIGHT; row++) {
      for (let col = 0; col < HIRES_WIDTH; col++) {
        const px = this.display[row][col];
        this.ctx!.fillStyle = px.shouldDraw() ? onColor : offColor;
        this.ctx!.fillRect(
          col * DISPLAY_SCALE,
          row * DISPLAY_SCALE,
          DISPLAY_SCALE,
          DISPLAY_SCALE
        );
        px.step();
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
    n === 0 ? this.drawHiresSprite(x, y) : this.drawLoresSprite(x, y, n);
  }

  drawLoresSprite(x: number, y: number, n: number) {
    const width = this.hires ? HIRES_WIDTH : LORES_WIDTH;
    const height = this.hires ? HIRES_HEIGHT : LORES_HEIGHT;

    const xCoord = this.v[x] % width;
    const yCoord = this.v[y] % height;

    this.v[0xf] = 0;
    for (let row = 0; row < n; row++) {
      let pxY = yCoord + row;
      if (this.metadata!.wrapQuirk) pxY %= height;
      if (pxY >= height) continue;
      let rowByte = this.mem[this.i + row];
      for (let col = 0; col < 8; col++) {
        let pxX = xCoord + col;
        if (this.metadata!.wrapQuirk) pxX %= width;
        if (pxX >= width) continue;
        const px = (rowByte >>> (7 - col)) & 1;
        if (px === 1) this.setPixel(pxX, pxY);
      }
    }
  }

  drawHiresSprite(x: number, y: number) {
    // TODO
  }

  setPixel(x: number, y: number) {
    [x, y] = this.hires ? [x, y] : [x * 2, y * 2];
    const coords = this.hires
      ? [[x, y]]
      : [
          [x, y],
          [x + 1, y],
          [x, y + 1],
          [x + 1, y + 1],
        ];
    for (const coord of coords) {
      const px = this.display[coord[1]][coord[0]];
      if (px.on) {
        this.v[0xf] = 1;
        px.turnOff(this.flickerFix);
      } else {
        px.turnOn();
      }
    }
  }

  scrollDisplayRight() {
    // TODO
  }

  scrollDisplayLeft() {
    // TODO
  }

  scrollDisplayDown() {
    // TODO
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
        this.display[y][x].turnOff(this.flickerFix);
      }
    }
  }

  // :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  // Keypad
  // :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

  keyDownHandler(ev: KeyboardEvent) {
    if (ev.key === "`") this.flickerFix = !this.flickerFix;
    const key = KEY_MAP.get(ev.key);
    if (key !== undefined) this.keys[key] = true;
  }

  keyUpHandler(ev: KeyboardEvent) {
    const key = KEY_MAP.get(ev.key);
    if (key !== undefined) this.keys[key] = false;
  }

  skipIfWaitingForKeyPress(): boolean {
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
