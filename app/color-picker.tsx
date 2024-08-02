import { HexColorInput, HexColorPicker } from "react-colorful";
import styles from "./color-picker.module.css";

type ColorPickerProps = {
  name: string;
  onPicker: boolean;
  onColor: string;
  offColor: string;
  show: boolean;
  togglePicker: () => void;
  setColor: (color: string) => void;
};

export default function ColorPicker({
  name,
  onPicker,
  onColor,
  offColor,
  show,
  togglePicker,
  setColor,
}: ColorPickerProps) {
  const color = onPicker ? onColor : offColor;
  const otherColor = onPicker ? offColor : onColor;
  const borderColor = onColor;

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
            backgroundColor: offColor,
            border: `var(--gap-size) solid ${borderColor}`,
          }}
        >
          <HexColorPicker
            color={color}
            onChange={setColor}
            style={{ width: "100%" }}
          />
          <HexColorInput color={color} onChange={setColor} />
        </div>
      )}
    </>
  );
}
