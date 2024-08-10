"use client";

import programs from "../public/programs.json";

import { ReactElement, useEffect, useRef, useState } from "react";
import {
  Chip8Interpreter,
  DISP_HEIGHT,
  DISP_SCALE,
  DISP_WIDTH,
  ProgramMetadata,
} from "./interpreter";
import styles from "./chip8.module.css";
import React from "react";
import Keypad from "./keypad";
import ColorPicker from "./color-picker";

const DEFAULT_ON = "#00ffc0";
const DEFAULT_OFF = "#041640";

const ON_KEY = "on";
const OFF_KEY = "off";

const SUPPORTED_PLATFORMS = [
  "originalChip8",
  "hybridVIP",
  "modernChip8",
  "chip8x",
  "chip48",
];

function getColorCookie(key: string): string {
  const defaultColor = key === ON_KEY ? DEFAULT_ON : DEFAULT_OFF;
  if (localStorage.getItem(key) === undefined) {
    localStorage.setItem(key, defaultColor);
  }
  return localStorage.getItem(key) ?? defaultColor;
}

export type ColorData = {
  onColor: string;
  offColor: string;
  showOnPicker: boolean;
  showOffPicker: boolean;
};

export default function Chip8() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const chip8 = useRef<Chip8Interpreter>();
  const [metadata, setMetadata] = useState<ProgramMetadata>();
  const [colorData, setColorData] = useState<ColorData>({
    onColor: DEFAULT_ON,
    offColor: DEFAULT_OFF,
    showOnPicker: false,
    showOffPicker: false,
  });

  const runProgram = async (idx: number) => {
    const metadata = programs[idx];
    chip8.current!.running = false;
    await new Promise((resolve) => setTimeout(resolve, 100));
    chip8.current!.reset(metadata);
    await chip8.current!.run(metadata.path);
    setMetadata(metadata);
  };

  useEffect(() => {
    const onColor = getColorCookie(ON_KEY);
    const offColor = getColorCookie(OFF_KEY);

    setColorData({
      ...colorData,
      onColor: onColor,
      offColor: offColor,
    });

    const { idx, metadata } = programs
      .map((metadata, idx) => ({ idx: idx, metadata: metadata }))
      .filter((entry) => entry.metadata.title == "Maze")[0];
    const ctx = canvas.current!.getContext("2d")!;
    chip8.current = new Chip8Interpreter(metadata, ctx, onColor, offColor);

    const keyDownHandler = (e: KeyboardEvent) =>
      chip8.current!.keyDownHandler(e);
    const keyUpHandler = (e: KeyboardEvent) => chip8.current!.keyUpHandler(e);

    document.addEventListener("keydown", keyDownHandler);
    document.addEventListener("keyup", keyUpHandler);

    runProgram(idx);

    return () => {
      document.removeEventListener("keydown", keyDownHandler);
      document.removeEventListener("keyup", keyUpHandler);
    };
  }, []);

  const programList: ReactElement[] = [];
  programs.forEach((metadata: ProgramMetadata, idx) => {
    if (SUPPORTED_PLATFORMS.includes(metadata.platformId)) {
      programList.push(
        <li key={metadata.title} onClick={() => runProgram(idx)}>
          {metadata.title}
        </li>
      );
    }
  });

  const toggleOnPicker = () => {
    setColorData({
      ...colorData,
      showOnPicker: !colorData.showOnPicker,
      showOffPicker: false,
    });
  };

  const toggleOffPicker = () => {
    setColorData({
      ...colorData,
      showOnPicker: false,
      showOffPicker: !colorData.showOffPicker,
    });
  };

  const _setOnColor = (color: string) => {
    chip8.current!.onColor = color;
    localStorage.setItem(ON_KEY, color);
    setColorData({ ...colorData, onColor: color });
  };

  const _setOffColor = (color: string) => {
    chip8.current!.offColor = color;
    localStorage.setItem(OFF_KEY, color);
    setColorData({ ...colorData, offColor: color });
  };

  const dynamicStyle = {
    color: colorData.onColor,
    backgroundColor: colorData.offColor,
  };

  return (
    <div
      className={styles.chip8}
      style={{ backgroundColor: colorData.onColor }}
    >
      <div className={styles.titleBar} style={dynamicStyle}>
        <span>CHIP-8 Interpreter</span>
        <div className={styles.colorPickers}>
          <ColorPicker
            name="On Color"
            onPicker={true}
            colorData={colorData}
            togglePicker={toggleOnPicker}
            setColor={_setOnColor}
          />
          <ColorPicker
            name="Off Color"
            onPicker={false}
            colorData={colorData}
            togglePicker={toggleOffPicker}
            setColor={_setOffColor}
          />
        </div>
      </div>
      <div className={styles.programList} style={dynamicStyle}>
        <ul>{programList}</ul>
      </div>
      <div className={styles.display} style={dynamicStyle}>
        <canvas
          ref={canvas}
          width={DISP_WIDTH * DISP_SCALE}
          height={DISP_HEIGHT * DISP_SCALE}
        ></canvas>
      </div>
      <div className={styles.info} style={dynamicStyle}>
        <ul>
          <li>Title: {metadata?.title ?? "Unknown"}</li>
          <li>Author(s): {metadata?.authors ?? "Unknown"}</li>
          <li>Release Date: {metadata?.release ?? "Unknown"}</li>
          <li>Platform: {metadata?.platformName ?? "Unknown"}</li>
        </ul>
      </div>
      <div className={styles.description} style={dynamicStyle}>
        {metadata?.description ?? "No description available."}
      </div>
      <Keypad chip8={chip8.current} colorData={colorData} />
    </div>
  );
}
