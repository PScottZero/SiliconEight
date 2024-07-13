import Image from "next/image";
import styles from "./page.module.css";
import Chip8 from "./components/chip8/chip8";

export default function Home() {
  return (
    <main className={styles.main}>
      <Chip8></Chip8>
    </main>
  );
}
