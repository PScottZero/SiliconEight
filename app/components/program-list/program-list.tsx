import { ProgramMetadata } from "@/app/interpreter";

import programs from "../../../public/programs.json";
import { ReactElement } from "react";
import styles from "./program-list.module.css";

const PLATFORM_EXCLUSIONS = ["megachip8", "xochip", "superchip1"];

type ProgramListProps = {
  runProgram: (idx: number) => void;
};

export default function ProgramList({ runProgram }: ProgramListProps) {
  const programList: ReactElement[] = [];
  programs.forEach((metadata: ProgramMetadata, idx) => {
    if (!PLATFORM_EXCLUSIONS.includes(metadata.platformId)) {
      programList.push(
        <li key={metadata.title} onClick={() => runProgram(idx)}>
          {metadata.platformId === "superchip" ? "⚠" : ""}
          {metadata.title}
        </li>
      );
    }
  });

  return (
    <div className={styles.programList}>
      <ul>{programList}</ul>
    </div>
  );
}
