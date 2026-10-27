"use client";

import { useEffect, useRef } from "react";
import styles from "./auth.module.css";

export type DialogTone = "success" | "error" | "warning" | "info";

interface AuthResultDialogProps {
  tone: DialogTone;
  title: string;
  message: string;
  primaryLabel: string;
  onPrimary: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
}

const toneIcons: Record<DialogTone, string> = {
  success: "✓",
  error: "!",
  warning: "↗",
  info: "i",
};

export function AuthResultDialog({
  tone,
  title,
  message,
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
}: AuthResultDialogProps) {
  const dialog = useRef<HTMLElement>(null);
  const primaryButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    primaryButton.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        (onSecondary ?? onPrimary)();
        return;
      }

      if (event.key === "Tab") {
        const focusable = dialog.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], input:not([disabled]), [tabindex]:not([tabindex="-1"])',
        );
        if (!focusable?.length) {
          return;
        }

        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onPrimary, onSecondary]);

  return (
    <div
      className={styles.dialogBackdrop}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          (onSecondary ?? onPrimary)();
        }
      }}
    >
      <section
        aria-labelledby="auth-dialog-title"
        aria-describedby="auth-dialog-message"
        aria-modal="true"
        className={styles.dialogCard}
        ref={dialog}
        role="alertdialog"
      >
        <span
          className={`${styles.dialogIcon} ${styles[`dialogIcon--${tone}`]}`}
          aria-hidden="true"
        >
          {toneIcons[tone]}
        </span>
        <h2 id="auth-dialog-title">{title}</h2>
        <p id="auth-dialog-message">{message}</p>
        <div className={styles.dialogActions}>
          {secondaryLabel && onSecondary && (
            <button
              className={styles.dialogSecondary}
              type="button"
              onClick={onSecondary}
            >
              {secondaryLabel}
            </button>
          )}
          <button
            className={styles.dialogPrimary}
            onClick={onPrimary}
            ref={primaryButton}
            type="button"
          >
            {primaryLabel}
          </button>
        </div>
      </section>
    </div>
  );
}
