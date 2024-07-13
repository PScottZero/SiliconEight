import styles from "./page.module.css";
import Chip8 from "./chip8";

export default function Home() {
  return (
    <main className={styles.main}>
      <Chip8></Chip8>
    </main>
  );
}
