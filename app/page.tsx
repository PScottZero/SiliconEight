import styles from "./page.module.css";
import Chip8 from "./chip8";
import { cookies } from "next/headers";

const DEFAULT_ON_COLOR = "#00ffff";
const DEFAULT_OFF_COLOR = "#000000";

export default function Home() {
  cookies().getAll();
  return (
    <main className={styles.main}>
      <Chip8
        initOnColor={cookies().get("on")?.value ?? DEFAULT_ON_COLOR}
        initOffColor={cookies().get("off")?.value ?? DEFAULT_OFF_COLOR}
      />
    </main>
  );
}
