"use client";

import programs from "../public/programs.json";

import { useEffect, useRef, useState } from "react";
import { Chip8Interpreter, ProgramMetadata } from "./interpreter";
import styles from "./page.module.css";
import React from "react";
import Keypad from "./components/keypad/keypad";
import TitleBar from "./components/title-bar/title-bar";
import ProgramList from "./components/program-list/program-list";
import Display from "./components/display/display";
import Info from "./components/info/info";
import Description from "./components/description/description";

const DEFAULT_PROGRAM = "1D Cellular Automata";

function getDefaultProgram(): [number, ProgramMetadata] {
  const { idx, metadata } = programs
    .map((metadata, idx) => ({ idx: idx, metadata: metadata }))
    .filter((entry) => entry.metadata.title == DEFAULT_PROGRAM)[0];
  return [idx, metadata];
}

export default function Chip8() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const chip8 = useRef<Chip8Interpreter>(new Chip8Interpreter());
  const [metadata, setMetadata] = useState<ProgramMetadata>();

  const runProgram = async (idx: number) => {
    const metadata = programs[idx];
    chip8.current!.running = false;
    await new Promise((resolve) => setTimeout(resolve, 100));
    chip8.current!.reset(metadata);
    await chip8.current!.run(metadata.path);
    setMetadata(metadata);
  };

  useEffect(() => {
    const [idx, metadata] = getDefaultProgram();
    chip8.current.metadata = metadata;
    chip8.current.ctx = canvas.current!.getContext("2d")!;

    const downHandler = (e: KeyboardEvent) => chip8.current!.keyDownHandler(e);
    const upHandler = (e: KeyboardEvent) => chip8.current!.keyUpHandler(e);

    document.addEventListener("keydown", downHandler);
    document.addEventListener("keyup", upHandler);

    runProgram(idx);

    return () => {
      document.removeEventListener("keydown", downHandler);
      document.removeEventListener("keyup", upHandler);
    };
  }, []);

  return (
    <main className={styles.chip8}>
      <TitleBar chip8={chip8.current} />
      <ProgramList runProgram={runProgram} />
      <Display canvas={canvas} />
      <Info metadata={metadata} />
      <Description metadata={metadata} />
      <Keypad chip8={chip8.current} />
    </main>
  );
}
