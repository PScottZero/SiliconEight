"use client";

import { ReactElement, useEffect, useRef, useState } from "react";
import {
  Chip8Interpreter,
  DISP_HEIGHT,
  DISP_SCALE,
  DISP_WIDTH,
  HP48_CONFIG,
} from "./interpreter";
import styles from "./chip8.module.css";
import { HexColorInput, HexColorPicker } from "react-colorful";
import JSCookie from "js-cookie";
import { EXCLUDE_PROGRAMS, PROGRAM_CONFIGS, PROGRAMS } from "./programs";

const DEFAULT_ON_COLOR = "#00ffff";
const DEFAULT_OFF_COLOR = "#000000";

const ON_COOKIE = "on";
const OFF_COOKIE = "off";

const expiration = { expires: 400 };

function getColorCookie(key: string): string {
  const defaultColor = key === "on" ? DEFAULT_ON_COLOR : DEFAULT_OFF_COLOR;
  if (JSCookie.get(key) === undefined) {
    JSCookie.set(key, defaultColor, expiration);
  }
  return JSCookie.get(key) ?? defaultColor;
}

export default function Chip8() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const chip8 = useRef<Chip8Interpreter>();
  const [description, setDescription] = useState<string>("");
  const [onColor, setOnColor] = useState<string>(DEFAULT_ON_COLOR);
  const [offColor, setOffColor] = useState<string>(DEFAULT_OFF_COLOR);
  const [showOnPicker, setShowOnPicker] = useState<boolean>(false);
  const [showOffPicker, setShowOffPicker] = useState<boolean>(false);

  const runProgram = async (program: string) => {
    let programPath = PROGRAMS.get(program)!;
    const config = PROGRAM_CONFIGS.get(program)!;
    chip8.current!.running = false;
    await new Promise((resolve) => setTimeout(resolve, 100));
    chip8.current!.reset(config);
    await chip8.current!.run(programPath);

    let descriptionPath = programPath.replace(".ch8", ".txt");
    const res = await fetch("bin/" + encodeURI(descriptionPath));
    const description = res.ok ? await res.text() : "No description available.";

    setDescription(description);
  };

  useEffect(() => {
    const onColor = getColorCookie(ON_COOKIE);
    const offColor = getColorCookie(OFF_COOKIE);
    setOnColor(onColor);
    setOffColor(offColor);

    const ctx = canvas.current!.getContext("2d")!;
    chip8.current = new Chip8Interpreter(HP48_CONFIG, ctx, onColor, offColor);

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
    if (!EXCLUDE_PROGRAMS.includes(key)) {
      programList.push(
        <div key={key} onClick={() => runProgram(key)}>
          {key}
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
    JSCookie.set(ON_COOKIE, color, expiration);
    setOnColor(color);
  };

  const _setOffColor = (color: string) => {
    chip8.current!.offColor = color;
    JSCookie.set(OFF_COOKIE, color, expiration);
    setOffColor(color);
  };

  const dynamicStyle = {
    color: onColor,
    backgroundColor: offColor,
  };

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
      <div className={styles.description} style={dynamicStyle}>
        {description}
      </div>
    </div>
  );
}
