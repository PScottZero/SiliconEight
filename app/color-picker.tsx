import { HexColorInput, HexColorPicker } from "react-colorful";
import styles from "./color-picker.module.css";
import { ColorData } from "./chip8";

type ColorPickerProps = {
  name: string;
  onPicker: boolean;
  colorData: ColorData;
  togglePicker: () => void;
  setColor: (color: string) => void;
};

export default function ColorPicker({
  name,
  onPicker,
  colorData,
  togglePicker,
  setColor,
}: ColorPickerProps) {
  const show = onPicker ? colorData.showOnPicker : colorData.showOffPicker;
  const color = onPicker ? colorData.onColor : colorData.offColor;
  const otherColor = onPicker ? colorData.offColor : colorData.onColor;
  const borderColor = colorData.onColor;

  return (
    <>
      <div
        className={styles.colorPickerIcon}
        style={{
          backgroundColor: color,
          border: `var(--gap-size) solid ${borderColor}`,
        }}
        onClick={togglePicker}
      >
        <div style={{ color: otherColor }}>{name}</div>
      </div>
      {show && (
        <div
          className={styles.colorPicker}
          style={{
            backgroundColor: colorData.offColor,
            border: `var(--gap-size) solid ${borderColor}`,
          }}
        >
          <HexColorPicker
            color={color}
            onChange={setColor}
            style={{
              width: "100%",
              border: `var(--gap-size) solid ${borderColor}`,
            }}
          />
          <HexColorInput
            color={color}
            onChange={setColor}
            style={{
              color: colorData.onColor,
              backgroundColor: colorData.offColor,
              border: `var(--gap-size) solid ${borderColor}`,
            }}
          />
        </div>
      )}
    </>
  );
}
