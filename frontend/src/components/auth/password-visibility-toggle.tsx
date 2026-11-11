import styles from "./auth.module.css";

interface PasswordVisibilityToggleProps {
  visible: boolean;
  onToggle: () => void;
}

export function PasswordVisibilityToggle({
  visible,
  onToggle,
}: PasswordVisibilityToggleProps) {
  return (
    <button
      aria-label={visible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
      aria-pressed={visible}
      className={styles.passwordToggle}
      onClick={onToggle}
      type="button"
    >
      <svg aria-hidden="true" viewBox="0 0 24 24">
        {visible ? (
          <>
            <path d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8" />
            <path d="M9.9 5.2A10.7 10.7 0 0 1 12 5c5.2 0 8.7 4.7 9.5 6-.3.5-1.2 1.8-2.6 3" />
            <path d="M6.2 6.2C3.9 7.7 2.7 9.6 2.5 11c.5.8 3.9 6 9.5 6 1 0 1.9-.2 2.7-.5" />
          </>
        ) : (
          <>
            <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
            <circle cx="12" cy="12" r="3" />
          </>
        )}
      </svg>
    </button>
  );
}
