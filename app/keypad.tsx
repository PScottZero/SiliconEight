import styles from "./keypad.module.css";
import { Chip8Interpreter } from "./interpreter";
import { ColorData } from "./chip8";

type KeypadProps = {
  chip8: Chip8Interpreter | undefined;
  colorData: ColorData;
};

const ORDERED_KEYS = [
  0x1, 0x2, 0x3, 0xc, 0x4, 0x5, 0x6, 0xd, 0x7, 0x8, 0x9, 0xe, 0xa, 0x0, 0xb,
  0xf,
];

const press = (chip8: Chip8Interpreter | undefined, key: number) => {
  if (chip8 !== undefined) chip8!.keys[key] = true;
};

const release = (chip8: Chip8Interpreter | undefined, key: number) => {
  if (chip8 !== undefined) chip8!.keys[key] = false;
};

export default function Keypad({ chip8, colorData }: KeypadProps) {
  const keys = [];
  for (const key of ORDERED_KEYS) {
    keys.push(
      <div
        key={key}
        className={styles.key}
        style={{
          color: colorData.onColor,
          backgroundColor: colorData.offColor,
        }}
        onPointerDown={() => press(chip8, key)}
        onPointerUp={() => release(chip8, key)}
        onTouchStart={() => press(chip8, key)}
        onTouchEnd={() => release(chip8, key)}
      >
        {key.toString(16).toUpperCase()}
      </div>
    );
  }
  return (
    <div
      className={styles.keypad}
      style={{ backgroundColor: colorData.onColor }}
    >
      {keys}
    </div>
  );
}
