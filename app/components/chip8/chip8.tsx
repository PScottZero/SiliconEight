"use client";

import { useEffect, useRef } from "react";
import { Chip8State, DISP_WIDTH, DISP_HEIGHT } from "./chip8-state";
import styles from "./chip8.module.css";

const DISP_SCALE = 100;
const PX_ON_COLOR = "blue";
const PX_OFF_COLOR = "white";

async function drawDisplay(
  chip8: Chip8State,
  context: CanvasRenderingContext2D,
) {
  await chip8.runIBMLogo();
  for (let i = 0; i < 10; i++) {
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
}

export default function Chip8() {
  const chip8 = useRef<Chip8State>(new Chip8State());
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const context = canvas.getContext("2d")!;
    drawDisplay(chip8.current, context);
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
