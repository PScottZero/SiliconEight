"use client";

import { ReactElement, useEffect, useRef, useState } from "react";
import { Chip8Interpreter } from "./interpreter";
import styles from "./chip8.module.css";
import { DISP_HEIGHT, DISP_SCALE, DISP_WIDTH } from "./display";
import { Keypad } from "./keypad";

const PROGRAMS = new Map<string, string>([
  ["IBM Logo", "bin/programs/IBM Logo.ch8"],
  ["Keypad Test", "bin/programs/Keypad Test [Hap, 2006].ch8"],
  ["Maze", "bin/demos/Maze [David Winter, 199x].ch8"],
  ["Particle Demo", "bin/demos/Particle Demo [zeroZshadow, 2008].ch8"],
  ["Sierpinski", "bin/demos/Sierpinski [Sergey Naydenov, 2010].ch8"],
  ["Stars", "bin/demos/Stars [Sergey Naydenov, 2010].ch8"],
  ["Trip8 Demo", "bin/demos/Trip8 Demo (2008) [Revival Studios].ch8"],
  ["Zero Demo", "bin/demos/Zero Demo [zeroZshadow, 2007].ch8"],
]);

export default function Chip8() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [chip8, setChip8] = useState<Chip8Interpreter>(
    new Chip8Interpreter(canvasRef),
  );
  const [program, setProgram] = useState<string>("IBM Logo");
  const [description, setDescription] = useState<string>("");

  const runProgram = async (program: string) => {
    const newChip8 = new Chip8Interpreter(canvasRef);

    let path = PROGRAMS.get(program)!;
    path = path.replace(".ch8", ".txt");
    const res = await fetch(encodeURI(path));
    const description = res.ok ? await res.text() : "No description available.";

    setDescription(description);
    setProgram(program);
    setChip8(newChip8);
  };

  useEffect(() => {
    runProgram("Keypad Test");
  }, []);

  if (canvasRef.current !== null) {
    document.addEventListener("keydown", (ev) =>
      chip8.keypad.keyDownHandler(ev),
    );
    document.addEventListener("keyup", (ev) => chip8.keypad.keyUpHandler(ev));
    chip8.run(PROGRAMS.get(program)!);
  }

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
          ref={canvasRef}
          width={DISP_WIDTH * DISP_SCALE}
          height={DISP_HEIGHT * DISP_SCALE}
        ></canvas>
      </div>
      <div className={styles.description}>{description}</div>
    </div>
  );
}
