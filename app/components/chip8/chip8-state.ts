const MEM_SIZE = 0x1000;
const START_ADDR = 0x200;
const REG_COUNT = 16;
const KEY_COUNT = 16;
export const DISP_WIDTH = 64;
export const DISP_HEIGHT = 32;

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

export class Chip8State {
  private _mem: Array<number>; // 4096 bytes of memory
  private _stack: Array<number>; // 12-bit address stack
  private _v: Array<number>; // 16 8-bit registers
  private _pc: number; // 12-bit program counter
  private _i: number; // 12-bit memory pointer
  private _delay: number; // 8-bit delay timer
  private _sound: number; // 8-bit sound timer
  display: Array<Array<number>>; // 64x32 monochrome display
  keys: Array<boolean>; // 16 keyboard keys

  constructor() {
    this._mem = Array<number>(MEM_SIZE).fill(0);
    this._stack = Array<number>();
    this._v = Array<number>(REG_COUNT).fill(0);
    this._pc = START_ADDR;
    this._i = 0;
    this._delay = 0;
    this._sound = 0;
    this.display = Array.from({ length: DISP_HEIGHT }, () =>
      Array<number>(DISP_WIDTH).fill(0),
    );
    this.keys = Array<boolean>(KEY_COUNT).fill(false);

    // copy character data
    for (let i = 0; i < CHARS.length; i++) {
      for (let row = 0; row < CHAR_ROWS; row++) {
        this._mem[i * CHAR_ROWS + row] = CHARS[i][row];
      }
    }
  }

  // :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  // :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  // Machine Cycle
  // :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  // :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

  step() {
    const opcode = (this.read(this._pc++) << 8) | this.read(this._pc++);

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
            this.clearDisplay();
            break;
          case 0x0ee:
            this.returnFromSubroutine();
            break;
          default:
            this.invalidOpcode(opcode);
            break;
        }
        break;
      case 0x1:
        this.jump(nnn);
        break;
      case 0x2:
        this.callSubroutine(nnn);
        break;
      case 0x3:
        this.skipIfRegXEqualsNN(x, nn);
        break;
      case 0x4:
        this.skipIfRegXNotEqualsNN(x, nn);
        break;
      case 0x5:
        this.skipIfRegXEqualsRegY(x, y);
        break;
      case 0x6:
        this.setRegXToNN(x, nn);
        break;
      case 0x7:
        this.addNNToRegX(x, nn);
        break;
      case 0x8:
        switch (n) {
          case 0x0:
            this.setRegXToRegY(x, y);
            break;
          case 0x1:
            this.orRegXAndRegY(x, y);
            break;
          case 0x2:
            this.andRegXAndRegY(x, y);
            break;
          case 0x3:
            this.xorRegXAndRegY(x, y);
            break;
          case 0x4:
            this.addRegYToRegX(x, y);
            break;
          case 0x5:
            this.subRegYFromRegX(x, y);
            break;
          case 0x6:
            this.rightShiftRegX(x);
            break;
          case 0x7:
            this.subRegXFromRegY(x, y);
            break;
          case 0xe:
            this.leftShiftRegX(x);
            break;
        }
        break;
      case 0x9:
        this.skipIfRegXNotEqualsRegY(x, y);
        break;
      case 0xa:
        this.setIToNNN(nnn);
        break;
      case 0xb:
        this.setPCToReg0PlusNNN(nnn);
        break;
      case 0xc:
        this.setRegXToRandAndNN(x, nn);
        break;
      case 0xd:
        this.drawSprite(x, y, n);
        break;
      case 0xe:
        switch (nn) {
          case 0x9e:
            this.skipIfKeyInRegXPressed(x);
            break;
          case 0xa1:
            this.skipIfKeyInRegXNotPressed(x);
            break;
          default:
            this.invalidOpcode(opcode);
            break;
        }
        break;
      case 0xf:
        switch (nn) {
          case 0x07:
            this.setRegXToDelay(x);
            break;
          case 0x0a:
            this.waitForKeyPress(x);
            break;
          case 0x15:
            this.setDelayToRegX(x);
            break;
          case 0x18:
            this.setSoundToRegX(x);
            break;
          case 0x1e:
            this.addRegXToI(x);
            break;
          case 0x29:
            this.setIToAddrOfCharInRegX(x);
            break;
          case 0x33:
            this.regXToBinaryCodedDecimal(x);
            break;
          case 0x55:
            this.regDump(x);
            break;
          case 0x65:
            this.regLoad(x);
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

  // :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  // :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  // Instructions
  // :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  // :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

  // :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  // Flow Instructions
  // :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

  jump(addr: number) {
    this._pc = addr;
  }

  callSubroutine(addr: number) {
    this._stack.push(this._pc);
    this._pc = addr;
  }

  returnFromSubroutine() {
    this._pc = this._stack.pop() ?? START_ADDR;
  }

  setPCToReg0PlusNNN(nnn: number) {
    this._pc = (this._v[0] + nnn) & NNN_MASK;
  }

  setRegXToRandAndNN(x: number, nn: number) {
    this._v[x] = Math.floor(Math.random() * 256) & nn;
  }

  // :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  // Conditional Instructions
  // :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

  skipIfRegXEqualsNN(x: number, nn: number) {
    this.skipIfCond(this._v[x] == nn);
  }

  skipIfRegXNotEqualsNN(x: number, nn: number) {
    this.skipIfCond(this._v[x] != nn);
  }

  skipIfRegXEqualsRegY(x: number, y: number) {
    this.skipIfCond(this._v[x] == this._v[y]);
  }

  skipIfRegXNotEqualsRegY(x: number, y: number) {
    this.skipIfCond(this._v[x] != this._v[y]);
  }

  // :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  // Key Instructions
  // :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

  skipIfKeyInRegXPressed(x: number) {
    this.skipIfCond(this.keys[this._v[x]]);
  }

  skipIfKeyInRegXNotPressed(x: number) {
    this.skipIfCond(!this.keys[this._v[x]]);
  }

  waitForKeyPress(x: number) {
    let key = 0;
    while ((key = this.pressedKey()) >= 0) {}
    this._v[x] = key;
  }

  // :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  // Constant Instructions
  // :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

  setRegXToNN(x: number, nn: number) {
    this._v[x] = nn;
  }

  addNNToRegX(x: number, nn: number) {
    this._v[x] += nn;
    this._v[x] &= NN_MASK;
  }

  // :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  // Assign Instruction
  // :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

  setRegXToRegY(x: number, y: number) {
    this._v[x] = this._v[y];
  }

  // :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  // Memory Instructions
  // :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

  setIToNNN(nnn: number) {
    this._i = nnn;
  }

  addRegXToI(x: number) {
    this._i += this._v[x];
    this._i &= NNN_MASK;
  }

  setIToAddrOfCharInRegX(x: number) {
    this._i = this._v[x] * CHAR_ROWS;
  }

  regXToBinaryCodedDecimal(x: number) {
    let value = this._v[x];
    this._mem[this._i] = Math.floor(value / 100);
    value %= 100;
    this._mem[this._i + 1] = Math.floor(value / 10);
    value %= 10;
    this._mem[this._i + 2] = Math.floor(value);
  }

  regDump(x: number) {
    for (let reg = 0; reg <= x; reg++) {
      this._mem[this._i + reg] = this._v[reg];
    }
  }

  regLoad(x: number) {
    for (let reg = 0; reg <= x; reg++) {
      this._v[reg] = this._mem[this._i + reg];
    }
  }

  // :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  // Sound + Delay Timer Instructions
  // :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

  setRegXToDelay(x: number) {
    this._v[x] = this._delay;
  }

  setDelayToRegX(x: number) {
    this._delay = this._v[x];
  }

  setSoundToRegX(x: number) {
    this._sound = this._v[x];
  }

  // :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  // Math Instructions
  // :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

  addRegYToRegX(x: number, y: number) {
    const result = this._v[x] + this._v[y];
    this._v[x] = result & NN_MASK;
    this._v[0xf] = result > 0xff ? 1 : 0;
  }

  subRegYFromRegX(x: number, y: number) {
    const result = this._v[x] - this._v[y];
    this._v[x] = result < 0 ? result + 0x100 : result;
    this._v[0xf] = result < 0 ? 0 : 1;
  }

  subRegXFromRegY(x: number, y: number) {
    const result = this._v[y] - this._v[x];
    this._v[x] = result < 0 ? result + 0x100 : result;
    this._v[0xf] = result < 0 ? 0 : 1;
  }

  // :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  // Bitwise Instructions
  // :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

  orRegXAndRegY(x: number, y: number) {
    this._v[x] |= this._v[y];
  }

  andRegXAndRegY(x: number, y: number) {
    this._v[x] &= this._v[y];
  }

  xorRegXAndRegY(x: number, y: number) {
    this._v[x] ^= this._v[y];
  }

  rightShiftRegX(x: number) {
    this._v[0xf] = this._v[x] & 1;
    this._v[x] >>>= 1;
  }

  leftShiftRegX(x: number) {
    this._v[0xf] = (this._v[x] >>> MSB_SHIFT) & 1;
    this._v[x] <<= 1;
    this._v[x] &= NN_MASK;
  }

  // :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  // Display Instructions
  // :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

  clearDisplay() {
    this.display = Array.from({ length: DISP_HEIGHT }, () =>
      Array<number>(DISP_WIDTH).fill(0),
    );
  }

  drawSprite(x: number, y: number, n: number) {
    const xCoord = this._v[x];
    const yCoord = this._v[y];
    for (let row = 0; row < n; row++) {
      let rowByte = this._mem[this._i + row];
      const pxY = yCoord + row;
      for (let col = 0; col < 8; col++) {
        const px = (rowByte >>> (7 - col)) & 1;
        const pxX = xCoord + col;
        const oldPx = this.display[pxY][pxX];
        this.display[pxY][pxX] ^= px;
        if (oldPx == 1 && this.display[pxY][pxX] == 0) {
          this._v[0xf] = 1;
        }
      }
    }
  }

  // :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  // Invalid Instruction
  // :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

  invalidOpcode(opcode: number) {
    console.log("invalid opcode: %04x", opcode);
  }

  // :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  // :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  // Memory
  // :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  // :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

  read(addr: number): number {
    return this._mem[addr];
  }

  write(addr: number, value: number) {
    this._mem[addr] = value & NN_MASK;
  }

  // :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  // :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  // Helpers
  // :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  // :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

  skipIfCond(cond: boolean) {
    if (cond) {
      this._pc++;
    }
  }

  pressedKey(): number {
    for (let key = 0; key < KEY_COUNT; key++) {
      if (this.keys[key]) {
        return key;
      }
    }
    return -1;
  }

  async runIBMLogo() {
    const res = await fetch(encodeURI("bin/IBM Logo.ch8"));
    if (res.ok) {
      const blob = await res.blob();
      const bytes = new Uint8Array(await blob.arrayBuffer());
      for (let byte = 0; byte < bytes.length; byte++) {
        this._mem[START_ADDR + byte] = bytes[byte];
      }
    }
  }
}
