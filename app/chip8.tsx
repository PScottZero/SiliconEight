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
import { HexColorInput, HexColorPicker } from "react-colorful";
import React from "react";
import dynamic from "next/dynamic";

const DEFAULT_ON = "#00ffff";
const DEFAULT_OFF = "#000000";

const ON_KEY = "on";
const OFF_KEY = "off";

const KEYS = [
  0x1, 0x2, 0x3, 0xc, 0x4, 0x5, 0x6, 0xd, 0x7, 0x8, 0x9, 0xe, 0xa, 0x0, 0xb,
  0xf,
];

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

export default function Chip8() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const chip8 = useRef<Chip8Interpreter>();
  const [metadata, setMetadata] = useState<ProgramMetadata>();
  const [onColor, setOnColor] = useState<string>(DEFAULT_ON);
  const [offColor, setOffColor] = useState<string>(DEFAULT_OFF);
  const [showOnPicker, setShowOnPicker] = useState<boolean>(false);
  const [showOffPicker, setShowOffPicker] = useState<boolean>(false);

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
    setOnColor(onColor);
    setOffColor(offColor);

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
        <div key={metadata.title} onClick={() => runProgram(idx)}>
          {metadata.title}
        </div>
      );
    }
  });

  const toggleOnPicker = () => {
    setShowOnPicker(!showOnPicker);
    setShowOffPicker(false);
  };

  const toggleOffPicker = () => {
    setShowOnPicker(false);
    setShowOffPicker(!showOffPicker);
  };

  const _setOnColor = (color: string) => {
    chip8.current!.onColor = color;
    localStorage.setItem(ON_KEY, color);
    setOnColor(color);
  };

  const _setOffColor = (color: string) => {
    chip8.current!.offColor = color;
    localStorage.setItem(OFF_KEY, color);
    setOffColor(color);
  };

  const dynamicStyle = {
    color: onColor,
    backgroundColor: offColor,
  };

  const keyPress = (key: number) => {
    chip8.current!.keys[key] = true;
  };
  const keyRelease = (key: number) => {
    chip8.current!.keys[key] = false;
  };

  const keys = [];
  for (const key of KEYS) {
    keys.push(
      <div
        key={key}
        className={styles.key}
        style={dynamicStyle}
        onPointerDown={() => keyPress(key)}
        onPointerUp={() => keyRelease(key)}
        onTouchStart={() => keyPress(key)}
        onTouchEnd={() => keyRelease(key)}
      >
        {key.toString(16).toUpperCase()}
      </div>
    );
  }

  return (
    <div className={styles.chip8} style={{ backgroundColor: onColor }}>
      <div className={styles.titleBar} style={dynamicStyle}>
        <span>CHIP-8 Interpreter</span>
        <div className={styles.colorPickers}>
          <div
            className={styles.colorPickerIcon}
            style={{
              backgroundColor: onColor,
              border: `var(--gap-size) solid ${onColor}`,
            }}
            onClick={toggleOnPicker}
          />
          <div
            className={styles.colorPickerIcon}
            style={{
              backgroundColor: offColor,
              border: `var(--gap-size) solid ${onColor}`,
            }}
            onClick={toggleOffPicker}
          />
          {showOnPicker && (
            <div className={styles.colorPicker}>
              <HexColorPicker color={onColor} onChange={_setOnColor} />
              <HexColorInput color={onColor} onChange={_setOnColor} />
            </div>
          )}
          {showOffPicker && (
            <div className={styles.colorPicker}>
              <HexColorPicker color={offColor} onChange={_setOffColor} />
              <HexColorInput color={offColor} onChange={_setOffColor} />
            </div>
          )}
        </div>
      </div>
      <div className={styles.programList} style={dynamicStyle}>
        {programList}
      </div>
      <div className={styles.display} style={dynamicStyle}>
        <canvas
          ref={canvas}
          width={DISP_WIDTH * DISP_SCALE}
          height={DISP_HEIGHT * DISP_SCALE}
        ></canvas>
      </div>
      <div className={styles.info} style={dynamicStyle}>
        <p>Title: {metadata?.title ?? "Unknown"}</p>
        <p>Author(s): {metadata?.authors ?? "Unknown"}</p>
        <p>Release Date: {metadata?.release ?? "Unknown"}</p>
        <p>Platform: {metadata?.platformName ?? "Unknown"}</p>
      </div>
      <div className={styles.description} style={dynamicStyle}>
        {metadata?.description ?? "No description available."}
      </div>
      <div className={styles.keypad} style={{ backgroundColor: onColor }}>
        {keys}
      </div>
    </div>
  );
}
