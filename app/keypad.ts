import { Chip8Interpreter } from "./interpreter";

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

export class Keypad {
  chip8: Chip8Interpreter;
  keys: Array<boolean>; // 16 keypad keys
  keyReg: number; // used for wait for key press opcode

  constructor(chip8: Chip8Interpreter) {
    this.chip8 = chip8;
    this.keys = Array<boolean>(KEY_MAP.size).fill(false);
    this.keyReg = -1;
  }

  keyDownHandler(ev: KeyboardEvent) {
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

    console.log("Accepted key press:", key);
    this.chip8.v[this.keyReg] = key;
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
