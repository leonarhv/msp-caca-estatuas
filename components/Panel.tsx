"use client";

import { useCallback, useEffect, useState } from "react";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import styles from "./Panel.module.css";

interface Props {
  children: React.ReactNode;
  resultCount: number;
}

export default function Panel({ children, resultCount }: Props) {
  const isMobile = useMediaQuery("(max-width: 760px)");
  const [open, setOpen] = useState(false);
  const isModal = isMobile && open;
  const containerRef = useFocusTrap<HTMLDivElement>(isModal);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!isModal) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isModal, close]);

  // Desktop: panel is always visible, no dialog semantics needed.
  // Mobile: panel is a bottom-sheet dialog toggled by the handle button.
  // The handle itself must stay outside aria-hidden so it's always reachable;
  // only the content below it is hidden from assistive tech while collapsed.
  return (
    <aside
      ref={containerRef}
      className={`${styles.panel} ${open ? styles.panelOpen : ""}`}
      role={isModal ? "dialog" : undefined}
      aria-modal={isModal ? true : undefined}
      aria-labelledby={isModal ? "panel-heading" : undefined}
    >
      <h2 id="panel-heading" className={styles.heading}>
        Filtros e lista de estátuas
      </h2>

      <button
        type="button"
        className={styles.handle}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className={styles.bar} aria-hidden="true" />
        <span>{open ? "Fechar" : `Ver filtros e lista (${resultCount})`}</span>
      </button>

      <div
        className={styles.content}
        aria-hidden={isMobile && !open ? true : undefined}
      >
        {children}
      </div>
    </aside>
  );
}
