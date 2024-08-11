import { HexColorInput, HexColorPicker } from "react-colorful";
import styles from "./title-bar.module.css";
import { Chip8Interpreter } from "@/app/interpreter";
import { useEffect, useState } from "react";

type TitleBarProps = {
  chip8: Chip8Interpreter;
};

export const ON_KEY = "on";
export const OFF_KEY = "off";
export const VOLUME_KEY = "volume";

const DEFAULT_ON = "#00ffc0";
const DEFAULT_OFF = "#041640";
const DEFAULT_VOLUME = "5";

function getColorStorage(key: string): string {
  const defaultColor = key === ON_KEY ? DEFAULT_ON : DEFAULT_OFF;
  if (localStorage.getItem(key) === undefined) {
    localStorage.setItem(key, defaultColor);
  }
  return localStorage.getItem(key) ?? defaultColor;
}

function getVolumeStorage(): number {
  if (localStorage.getItem(VOLUME_KEY) === undefined) {
    localStorage.setItem(VOLUME_KEY, DEFAULT_VOLUME);
  }
  return parseInt(localStorage.getItem(VOLUME_KEY) ?? DEFAULT_VOLUME);
}

export default function TitleBar({ chip8 }: TitleBarProps) {
  const [onColor, setOnColor] = useState<string>(DEFAULT_ON);
  const [offColor, setOffColor] = useState<string>(DEFAULT_OFF);
  const [showOnPicker, setShowOnPicker] = useState<boolean>(false);
  const [showOffPicker, setShowOffPicker] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(parseInt(DEFAULT_VOLUME));

  const _setOnColor = (color: string) => {
    document.documentElement.style.setProperty("--on-color", color);
    localStorage.setItem(ON_KEY, color);
    setOnColor(color);
  };

  const _setOffColor = (color: string) => {
    document.documentElement.style.setProperty("--off-color", color);
    localStorage.setItem(OFF_KEY, color);
    setOffColor(color);
  };

  const _setVolume = (volume: number) => {
    chip8.volume = volume;
    localStorage.setItem(VOLUME_KEY, volume.toString());
    setVolume(volume);
  };

  const toggleOnPicker = () => {
    setShowOnPicker(!showOnPicker);
    setShowOffPicker(false);
  };
  const toggleOffPicker = () => {
    setShowOnPicker(false);
    setShowOffPicker(!showOffPicker);
  };

  useEffect(() => {
    const _onColor = getColorStorage(ON_KEY);
    const _offColor = getColorStorage(OFF_KEY);
    const _volume = getVolumeStorage();

    document.documentElement.style.setProperty("--on-color", _onColor);
    document.documentElement.style.setProperty("--off-color", _offColor);
    chip8.volume = _volume;

    setOnColor(_onColor);
    setOffColor(_offColor);
    setVolume(_volume);
  }, []);

  const onBorder = `var(--gap-size) solid ${showOnPicker ? "white" : "var(--on-color)"}`;
  const offBorder = `var(--gap-size) solid  ${showOffPicker ? "white" : "var(--on-color)"}`;

  return (
    <div className={styles.titleBar}>
      <span className={styles.title}>CHIP-8 Interpreter</span>
      <span className={styles.volumeSlider}>
        Volume
        <input
          type="range"
          min={0}
          max={100}
          defaultValue={volume}
          onChange={(e) => _setVolume(parseInt(e.target.value))}
        />
        {`${volume.toString().padStart(3, "0")}%`}
      </span>
      <div className={styles.colorPickers}>
        <div
          className={styles.colorPickerIcon}
          style={{ backgroundColor: onColor, border: onBorder }}
          onClick={toggleOnPicker}
        >
          <div style={{ color: offColor }}>On Color</div>
        </div>
        {showOnPicker && (
          <div className={styles.colorPicker}>
            <HexColorPicker
              color={onColor}
              onChange={_setOnColor}
              style={{ width: "100%" }}
            />
            <HexColorInput color={onColor} onChange={_setOnColor} />
          </div>
        )}
        <div
          className={styles.colorPickerIcon}
          style={{ backgroundColor: offColor, border: offBorder }}
          onClick={toggleOffPicker}
        >
          <div style={{ color: onColor }}>Off Color</div>
        </div>
        {showOffPicker && (
          <div className={styles.colorPicker}>
            <HexColorPicker
              color={offColor}
              onChange={_setOffColor}
              style={{ width: "100%" }}
            />
            <HexColorInput color={offColor} onChange={_setOffColor} />
          </div>
        )}
      </div>
    </div>
  );
}
