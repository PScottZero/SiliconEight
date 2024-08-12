import { ProgramMetadata } from "@/app/interpreter";
import styles from "./description.module.css";

const DEFAULT_DESCRIPTION = "No description available.";

export default function Description({
  metadata,
}: {
  metadata: ProgramMetadata | undefined;
}) {
  return (
    <div className={styles.description}>
      {metadata?.description ?? DEFAULT_DESCRIPTION}
    </div>
  );
}
