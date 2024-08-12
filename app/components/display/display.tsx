import { DISPLAY_SCALE, HIRES_WIDTH, HIRES_HEIGHT } from "@/app/interpreter";
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
        width={HIRES_WIDTH * DISPLAY_SCALE}
        height={HIRES_HEIGHT * DISPLAY_SCALE}
      ></canvas>
    </div>
  );
}
