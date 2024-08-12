import {
  DISPLAY_HEIGHT,
  DISPLAY_SCALE,
  DISPLAY_WIDTH,
} from "@/app/interpreter";
import styles from "./display.module.css";

export default function Display({
  canvas,
}: {
  canvas: React.RefObject<HTMLCanvasElement>;
}) {
  return (
    <div className={styles.display}>
      <canvas
        ref={canvas}
        width={DISPLAY_WIDTH * DISPLAY_SCALE}
        height={DISPLAY_HEIGHT * DISPLAY_SCALE}
      ></canvas>
    </div>
  );
}
