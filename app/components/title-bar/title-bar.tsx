import { HexColorInput, HexColorPicker } from "react-colorful";
import { Chip8Interpreter } from "@/app/interpreter";
import { SetStateAction, useEffect, useState } from "react";
import {
  DEFAULT_FILTER,
  DEFAULT_OFF,
  DEFAULT_ON,
  DEFAULT_VOLUME,
  getColorStorage,
  getFilterStorage,
  getVolumeStorage,
  setColorStorage,
  setFilterStorage,
  setVolumeStorage,
} from "@/app/local-storage";
import Button from "../button/button";
import { FILTERS, Filter } from "@/app/pixel";
import styles from "./title-bar.module.css";

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

type TitleBarProps = {
  chip8: Chip8Interpreter;
};

export default function TitleBar({ chip8 }: TitleBarProps) {
  const [onColor, setOnColor] = useState<string>(DEFAULT_ON);
  const [offColor, setOffColor] = useState<string>(DEFAULT_OFF);
  const [showOnPicker, setShowOnPicker] = useState<boolean>(false);
  const [showOffPicker, setShowOffPicker] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(DEFAULT_VOLUME);
  const [filter, setFilter] = useState<Filter>(DEFAULT_FILTER);

  const hidePickers = () => {
    setShowOnPicker(false);
    setShowOffPicker(false);
  };

  const _setOnColor = (color: string) => setColor(true, color, setOnColor);
  const _setOffColor = (color: string) => setColor(false, color, setOffColor);
  const _setVolume = (volume: number) => {
    chip8.volume = volume;
    setVolumeStorage(volume);
    setVolume(volume);
    hidePickers();
  };
  const _setFilter = (filter: Filter) => {
    chip8.filter = filter;
    setFilterStorage(filter);
    setFilter(filter);
    hidePickers();
  };

  const toggleFilter = () => {
    const idx = FILTERS.indexOf(filter)!;
    _setFilter(FILTERS[(idx + 1) % FILTERS.length]);
  };

  const toggleOnPicker = () => {
    hidePickers();
    setShowOnPicker(!showOnPicker);
  };

  const toggleOffPicker = () => {
    hidePickers();
    setShowOffPicker(!showOffPicker);
  };

  useEffect(() => {
    _setOnColor(getColorStorage(true));
    _setOffColor(getColorStorage(false));
    _setVolume(getVolumeStorage());
    _setFilter(getFilterStorage());
  }, []);

  const onBorderColor = showOnPicker ? "white" : "var(--on-color)";
  const offBorderColor = showOffPicker ? "white" : "var(--on-color)";

  return (
    <div className={styles.titleBar}>
      <span className={styles.title}>CHIP-8 Interpreter</span>
      <div className={styles.settings}>
        <div className={styles.separator} />
        <span className={styles.volumeSlider}>
          Volume
          <input
            type="range"
            min={0}
            max={10}
            defaultValue={volume}
            onChange={(e) => _setVolume(parseInt(e.target.value))}
          />
          {`${volume.toString().padStart(2, "0")}`}
        </span>
        <div className={styles.separator} />
        <Button
          text={filter.name}
          textColor={onColor}
          backgroundColor={offColor}
          borderColor={onColor}
          onClick={toggleFilter}
        />
        <div className={styles.separator} />
        <Button
          text="On Color"
          textColor={offColor}
          backgroundColor={onColor}
          borderColor={onBorderColor}
          onClick={toggleOnPicker}
        />
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
        <Button
          text="Off Color"
          textColor={onColor}
          backgroundColor={offColor}
          borderColor={offBorderColor}
          onClick={toggleOffPicker}
        />
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
