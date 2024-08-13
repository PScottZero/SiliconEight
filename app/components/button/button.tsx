import styles from "./button.module.css";

type ButtonProps = {
  text: string;
  textColor: string;
  backgroundColor: string;
  borderColor: string;
  onClick: () => void;
};

export default function Button({
  text,
  textColor,
  backgroundColor,
  borderColor,
  onClick,
}: ButtonProps) {
  return (
    <div
      className={styles.button}
      style={{
        backgroundColor: backgroundColor,
        border: `var(--gap-size) solid ${borderColor}`,
      }}
      onClick={onClick}
    >
      <div style={{ color: textColor }}>{text}</div>
    </div>
  );
}
