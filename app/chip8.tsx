"use client";

import { ReactElement, useEffect, useRef, useState } from "react";
import {
  Chip8Interpreter,
  DISP_HEIGHT,
  DISP_SCALE,
  DISP_WIDTH,
} from "./interpreter";
import styles from "./chip8.module.css";
import { Chip8Tests } from "./test";

const PROGRAMS = new Map<string, string>([
  ["Clock", "Clock Program [Bill Fisher, 1981].ch8"],
  ["Delay Timer Test", "Delay Timer Test [Matthew Mikolay, 2010].ch8"],
  ["Hello", "BMP Viewer - Hello (C8 example) [Hap, 2005].ch8"],
  // ["Division Test", "Division Test [Sergey Naydenov, 2010].ch8"],

  // ["15 Puzzle", "15 Puzzle [Roger Ivie].ch8"],
  ["IBM Logo", "IBM Logo.ch8"],
  ["Blinky", "Blinky [Hans Christian Egeberg, 1991].ch8"],
  // ["Keypad Test", "Keypad Test [Hap, 2006].ch8"],
  ["Maze", "Maze [David Winter, 199x].ch8"],
  // ["Particle Demo", "Particle Demo [zeroZshadow, 2008].ch8"],
  // ["Sierpinski", "Sierpinski [Sergey Naydenov, 2010].ch8"],
  // ["Stars", "Stars [Sergey Naydenov, 2010].ch8"],
  // ["Tetris", "Tetris [Fran Dachille, 1991].ch8"],
  // ["Trip8 Demo", "Trip8 Demo (2008) [Revival Studios].ch8"],
  // ["Zero Demo", "Zero Demo [zeroZshadow, 2007].ch8"],
]);

export default function Chip8() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const chip8 = useRef<Chip8Interpreter>();
  const [description, setDescription] = useState<string>("");

  const runProgram = async (program: string) => {
    let programPath = PROGRAMS.get(program)!;
    chip8.current!.running = false;
    await new Promise((resolve) => setTimeout(resolve, 100));
    chip8.current!.reset();
    await chip8.current!.run(programPath);

    let descriptionPath = programPath.replace(".ch8", ".txt");
    const res = await fetch("bin/" + encodeURI(descriptionPath));
    const description = res.ok ? await res.text() : "No description available.";

    setDescription(description);
  };

  useEffect(() => {
    const ctx = canvas.current!.getContext("2d")!;
    chip8.current = new Chip8Interpreter(ctx);
    new Chip8Tests(ctx);

    const keyDownHandler = (e: KeyboardEvent) =>
      chip8.current!.keyDownHandler(e);
    const keyUpHandler = (e: KeyboardEvent) => chip8.current!.keyUpHandler(e);

    document.addEventListener("keydown", keyDownHandler);
    document.addEventListener("keyup", keyUpHandler);

    runProgram("IBM Logo");

    return () => {
      document.removeEventListener("keydown", keyDownHandler);
      document.removeEventListener("keyup", keyUpHandler);
    };
  }, []);

  const programList: ReactElement[] = [];
  PROGRAMS.forEach((_, key) => {
    programList.push(
      <div key={key} onClick={() => runProgram(key)}>
        {key}
      </div>,
    );
  });

  return (
    <div className={styles.chip8}>
      <div className={styles.titleBar}>CHIP-8 Interpreter [WIP]</div>
      <div className={styles.programList}>{programList}</div>
      <div className={styles.display}>
        <canvas
          ref={canvas}
          width={DISP_WIDTH * DISP_SCALE}
          height={DISP_HEIGHT * DISP_SCALE}
        ></canvas>
      </div>
      <div className={styles.description}>{description}</div>
    </div>
  );
}
