"use client";

import { ReactElement, useEffect, useRef, useState } from "react";
import {
  Chip8Interpreter,
  DISP_HEIGHT,
  DISP_SCALE,
  DISP_WIDTH,
} from "./interpreter";
import styles from "./chip8.module.css";
// import { Chip8Tests } from "./test";

const PROGRAMS = new Map<string, string>([
  // ["Test 1: Chip-8 Logo", "tests/1-chip8-logo.ch8"],
  // ["Test 2: IBM Logo", "tests/2-ibm-logo.ch8"],
  // ["Test 3: Corax+", "tests/3-corax+.ch8"],
  // ["Test 4: Flags", "tests/4-flags.ch8"],
  // ["Test 5: Quirks", "tests/5-quirks.ch8"],
  // ["Test 6: Keypad", "tests/6-keypad.ch8"],
  // ["Test 7: Beep", "tests/7-beep.ch8"],
  ["15 Puzzle", "15 Puzzle [Roger Ivie].ch8"],
  ["Addition Problems", "Addition Problems [Paul C. Moews].ch8"],
  ["Airplane", "Airplane.ch8"],
  ["Animal Race", "Animal Race [Brian Astle].ch8"],
  ["Astro Dodge", "Astro Dodge [Revival Studios, 2008].ch8"],
  ["BMP Viewer - Hello", "BMP Viewer - Hello (C8 example) [Hap, 2005].ch8"],
  ["Biorhythm", "Biorhythm [Jef Winsor].ch8"],
  ["Blinky", "Blinky [Hans Christian Egeberg, 1991].ch8"],
  ["Blitz", "Blitz [David Winter].ch8"],
  ["Bowling", "Bowling [Gooitzen van der Wal].ch8"],
  ["Breakout (Brix hack)", "Breakout (Brix hack) [David Winter, 1997].ch8"],
  ["Breakout", "Breakout [Carmelo Cortez, 1979].ch8"],
  ["Brick", "Brick (Brix hack, 1990).ch8"],
  ["Brix", "Brix [Andreas Gustafsson, 1990].ch8"],
  ["Cave", "Cave.ch8"],
  ["Chip8 Picture", "Chip8 Picture.ch8"],
  ["Chip8 Emulator Logo", "Chip8 emulator Logo [Garstyciuks].ch8"],
  ["Clock Program", "Clock Program [Bill Fisher, 1981].ch8"],
  ["Coin Flipping", "Coin Flipping [Carmelo Cortez, 1978].ch8"],
  ["Connect 4", "Connect 4 [David Winter].ch8"],
  ["Craps", "Craps [Camerlo Cortez, 1978].ch8"],
  ["Deflection", "Deflection [John Fort].ch8"],
  ["Delay Timer Test", "Delay Timer Test [Matthew Mikolay, 2010].ch8"],
  ["Division Test", "Division Test [Sergey Naydenov, 2010].ch8"],
  ["Figures", "Figures.ch8"],
  ["Filter", "Filter.ch8"],
  ["Fishie", "Fishie [Hap, 2005].ch8"],
  ["Framed MK1", "Framed MK1 [GV Samways, 1980].ch8"],
  ["Framed MK2", "Framed MK2 [GV Samways, 1980].ch8"],
  ["Guess", "Guess [David Winter].ch8"],
  ["Hi-Lo", "Hi-Lo [Jef Winsor, 1978].ch8"],
  ["Hidden", "Hidden [David Winter, 1996].ch8"],
  ["IBM Logo", "IBM Logo.ch8"],
  ["Jumping X and O", "Jumping X and O [Harry Kleinberg, 1977].ch8"],
  ["Kaleidoscope", "Kaleidoscope [Joseph Weisbecker, 1978].ch8"],
  ["Keypad Test", "Keypad Test [Hap, 2006].ch8"],
  ["Landing", "Landing.ch8"],
  ["Life", "Life [GV Samways, 1980].ch8"],
  ["Lunar Lander", "Lunar Lander (Udo Pernisz, 1979).ch8"],
  ["Mastermind FourRow", "Mastermind FourRow (Robert Lindley, 1978).ch8"],
  ["Maze", "Maze [David Winter, 199x].ch8"],
  ["Merlin", "Merlin [David Winter].ch8"],
  ["Minimal game", "Minimal game [Revival Studios, 2007].ch8"],
  ["Missile", "Missile [David Winter].ch8"],
  ["Most Dangerous Game", "Most Dangerous Game [Peter Maruhnic].ch8"],
  ["Nim", "Nim [Carmelo Cortez, 1978].ch8"],
  ["Paddles", "Paddles.ch8"],
  ["Particle Demo", "Particle Demo [zeroZshadow, 2008].ch8"],
  ["Pong (1 player)", "Pong (1 player).ch8"],
  ["Pong (alt)", "Pong (alt).ch8"],
  ["Pong 2 (Pong hack)", "Pong 2 (Pong hack) [David Winter, 1997].ch8"],
  ["Pong", "Pong [Paul Vervalin, 1990].ch8"],
  ["Prog. Spacefighters", "Programmable Spacefighters [Jef Winsor].ch8"],
  ["Puzzle", "Puzzle.ch8"],
  ["Random Number Test", "Random Number Test [Matthew Mikolay, 2010].ch8"],
  ["Reversi", "Reversi [Philip Baltzer].ch8"],
  ["Rocket Launch", "Rocket Launch [Jonas Lindstedt].ch8"],
  ["Rocket Launcher", "Rocket Launcher.ch8"],
  ["Rocket", "Rocket [Joseph Weisbecker, 1978].ch8"],
  ["Rush Hour", "Rush Hour [Hap, 2006].ch8"],
  ["Russian Roulette", "Russian Roulette [Carmelo Cortez, 1978].ch8"],
  ["SQRT Test", "SQRT Test [Sergey Naydenov, 2010].ch8"],
  ["Sequence Shoot", "Sequence Shoot [Joyce Weisbecker].ch8"],
  ["Shooting Stars", "Shooting Stars [Philip Baltzer, 1978].ch8"],
  ["Sierpinski", "Sierpinski [Sergey Naydenov, 2010].ch8"],
  ["Slide", "Slide [Joyce Weisbecker].ch8"],
  ["Soccer", "Soccer.ch8"],
  ["Space Flight", "Space Flight.ch8"],
  ["Space Intercept", "Space Intercept [Joseph Weisbecker, 1978].ch8"],
  ["Space Invaders", "Space Invaders [David Winter].ch8"],
  ["Spooky Spot", "Spooky Spot [Joseph Weisbecker, 1978].ch8"],
  ["Squash", "Squash [David Winter].ch8"],
  ["Stars", "Stars [Sergey Naydenov, 2010].ch8"],
  ["Submarine", "Submarine [Carmelo Cortez, 1978].ch8"],
  ["Sum Fun", "Sum Fun [Joyce Weisbecker].ch8"],
  ["Syzygy", "Syzygy [Roy Trevino, 1990].ch8"],
  ["Tank", "Tank.ch8"],
  ["Tapeworm", "Tapeworm [JDR, 1999].ch8"],
  ["Tetris", "Tetris [Fran Dachille, 1991].ch8"],
  ["Tic-Tac-Toe", "Tic-Tac-Toe [David Winter].ch8"],
  ["Timebomb", "Timebomb.ch8"],
  ["Trip8 Demo", "Trip8 Demo (2008) [Revival Studios].ch8"],
  ["Tron", "Tron.ch8"],
  ["UFO", "UFO [Lutz V, 1992].ch8"],
  ["Vers", "Vers [JMN, 1991].ch8"],
  ["Vertical Brix", "Vertical Brix [Paul Robson, 1996].ch8"],
  ["Wall", "Wall [David Winter].ch8"],
  ["Wipe Off", "Wipe Off [Joseph Weisbecker].ch8"],
  ["Worm V4", "Worm V4 [RB-Revival Studios, 2007].ch8"],
  ["X-Mirror", "X-Mirror.ch8"],
  ["Zero Demo", "Zero Demo [zeroZshadow, 2007].ch8"],
  ["ZeroPong", "ZeroPong [zeroZshadow, 2007].ch8"],
]);

const shiftUseVyPrograms = ["Test 5: Quirks"];
const regIncIPrograms = ["Animal Race", "Vertical Brix", "Test 5: Quirks"];

export default function Chip8() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const chip8 = useRef<Chip8Interpreter>();
  const [description, setDescription] = useState<string>("");

  const runProgram = async (program: string) => {
    let programPath = PROGRAMS.get(program)!;
    chip8.current!.running = false;
    await new Promise((resolve) => setTimeout(resolve, 100));
    chip8.current!.reset();
    chip8.current!.shiftUseVy = shiftUseVyPrograms.includes(program);
    chip8.current!.regIncI = regIncIPrograms.includes(program);
    await chip8.current!.run(programPath);

    let descriptionPath = programPath.replace(".ch8", ".txt");
    const res = await fetch("bin/" + encodeURI(descriptionPath));
    const description = res.ok ? await res.text() : "No description available.";

    setDescription(description);
  };

  useEffect(() => {
    const ctx = canvas.current!.getContext("2d")!;
    chip8.current = new Chip8Interpreter(ctx);
    // new Chip8Tests(ctx);

    const keyDownHandler = (e: KeyboardEvent) =>
      chip8.current!.keyDownHandler(e);
    const keyUpHandler = (e: KeyboardEvent) => chip8.current!.keyUpHandler(e);

    document.addEventListener("keydown", keyDownHandler);
    document.addEventListener("keyup", keyUpHandler);

    runProgram("Maze");

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
