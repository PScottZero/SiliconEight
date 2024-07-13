"use client";

import { useEffect, useRef } from "react";
import { Chip8State, DISP_WIDTH, DISP_HEIGHT } from "./chip8-state";
import styles from "./chip8.module.css";

const DISP_SCALE = 100;
const PX_ON_COLOR = "#00ff00";
const PX_OFF_COLOR = "#000000";
const OPS_PER_FRAME = 50;

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

async function run(chip8: Chip8State, context: CanvasRenderingContext2D) {
  await chip8.loadProgram("bin/games/Blinky [Hans Christian Egeberg, 1991].ch8");
  requestAnimationFrame(() => renderFrame(chip8, context));
}

async function renderFrame(
  chip8: Chip8State,
  context: CanvasRenderingContext2D,
) {
  for (let i = 0; i < OPS_PER_FRAME; i++) {
    chip8.step();
  }

  for (let row = 0; row < DISP_HEIGHT; row++) {
    for (let col = 0; col < DISP_WIDTH; col++) {
      context.fillStyle = chip8.display[row][col] ? PX_ON_COLOR : PX_OFF_COLOR;
      context.fillRect(
        col * DISP_SCALE,
        row * DISP_SCALE,
        DISP_SCALE,
        DISP_SCALE,
      );
    }
  }

  requestAnimationFrame(() => renderFrame(chip8, context));
}

export default function Chip8() {
  const chip8 = new Chip8State();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const context = canvas.getContext("2d")!;

    const keyDownHandler = (ev: KeyboardEvent) => {
      const key = KEY_MAP.get(ev.key);
      if (key !== undefined) chip8.keys[key] = true;
    };
    const keyUpHandler = (ev: KeyboardEvent) => {
      const key = KEY_MAP.get(ev.key);
      if (key !== undefined) chip8.keys[key] = false;
    };

    const timersInterval = setInterval(() => chip8.decrementTimers(), 16);
    document.addEventListener("keydown", keyDownHandler);
    document.addEventListener("keyup", keyUpHandler);
    
    run(chip8, context);

    return () => {
      clearInterval(timersInterval);
      document.removeEventListener("keydown", keyDownHandler);
      document.removeEventListener("keyup", keyUpHandler);
    };
  }, []);

  return (
    <canvas
      className={styles.display}
      ref={canvasRef}
      width={DISP_WIDTH * DISP_SCALE}
      height={DISP_HEIGHT * DISP_SCALE}
    ></canvas>
  );
}
