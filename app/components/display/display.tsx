import { HIRES_WIDTH, HIRES_HEIGHT } from "@/app/interpreter";
import styles from "./display.module.css";
import { PX_SCALE } from "@/app/pixel";

export default function Display({
  canvas,
}: {
  canvas: React.RefObject<HTMLCanvasElement>;
}) {
  return (
    <div className={styles.display}>
      <canvas
        ref={canvas}
        width={HIRES_WIDTH * PX_SCALE}
        height={HIRES_HEIGHT * PX_SCALE}
      ></canvas>
    </div>
  );
}
