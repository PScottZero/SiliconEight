import { ProgramMetadata } from "@/app/interpreter";
import styles from "./info.module.css";

export default function Info({
  metadata,
}: {
  metadata: ProgramMetadata | undefined;
}) {
  return (
    <div className={styles.info}>
      <ul>
        <li>Title: {metadata?.title ?? "???"}</li>
        <li>Author(s): {metadata?.authors ?? "???"}</li>
        <li>Release Date: {metadata?.release ?? "???"}</li>
        <li>Platform: {metadata?.platformName ?? "???"}</li>
      </ul>
    </div>
  );
}
