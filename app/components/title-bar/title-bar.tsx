import { HexColorInput, HexColorPicker } from "react-colorful";
import styles from "./title-bar.module.css";
import { Chip8Interpreter } from "@/app/interpreter";
import { SetStateAction, useEffect, useState } from "react";
import {
  DEFAULT_OFF,
  DEFAULT_ON,
  DEFAULT_VOLUME,
  getColorStorage,
  getVolumeStorage,
  setColorStorage,
  setVolumeStorage,
} from "@/app/local-storage";

type TitleBarProps = {
  chip8: Chip8Interpreter;
};

function setColor(
  on: boolean,
  color: string,
  setState: (value: SetStateAction<string>) => void,
) {
  const cssVar = on ? "--on-color" : "--off-color";
  document.documentElement.style.setProperty(cssVar, color);
  setColorStorage(on, color);
  setState(color);
}

export default function TitleBar({ chip8 }: TitleBarProps) {
  const [onColor, setOnColor] = useState<string>(DEFAULT_ON);
  const [offColor, setOffColor] = useState<string>(DEFAULT_OFF);
  const [showOnPicker, setShowOnPicker] = useState<boolean>(false);
  const [showOffPicker, setShowOffPicker] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(DEFAULT_VOLUME);

  const _setOnColor = (color: string) => setColor(true, color, setOnColor);
  const _setOffColor = (color: string) => setColor(false, color, setOffColor);
  const _setVolume = (volume: number) => {
    chip8.volume = volume;
    setVolumeStorage(volume);
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
    _setOnColor(getColorStorage(true));
    _setOffColor(getColorStorage(false));
    _setVolume(getVolumeStorage());
  }, []);

  const onBorderColor = showOnPicker ? "white" : "var(--on-color)";
  const offBorderColor = showOffPicker ? "white" : "var(--on-color)";
  const onBorder = `var(--gap-size) solid ${onBorderColor}`;
  const offBorder = `var(--gap-size) solid  ${offBorderColor}`;

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
