import { ProgramMetadata } from "@/app/interpreter";

import programs from "../../../public/programs.json";
import { ReactElement } from "react";
import styles from "./program-list.module.css";

const SUPPORTED_PLATFORMS = [
  "originalChip8",
  "hybridVIP",
  "modernChip8",
  "chip8x",
  "chip48",
];

type ProgramListProps = {
  runProgram: (idx: number) => void;
};

export default function ProgramList({ runProgram }: ProgramListProps) {
  const programList: ReactElement[] = [];
  programs.forEach((metadata: ProgramMetadata, idx) => {
    if (SUPPORTED_PLATFORMS.includes(metadata.platformId)) {
      programList.push(
        <li key={metadata.title} onClick={() => runProgram(idx)}>
          {metadata.title}
        </li>,
      );
    }
  });

  return (
    <div className={styles.programList}>
      <ul>{programList}</ul>
    </div>
  );
}
