"use client";

import type { Statue } from "@/types/statue";
import styles from "./WalkingMode.module.css";

interface Props {
  status: "idle" | "starting" | "active" | "error";
  error: string | null;
  wakeLockActive: boolean;
  nearbyStatue: Statue | null;
  onStart: () => void;
  onStop: () => void;
  onOpenNearby: () => void;
  onDismissNearby: () => void;
}

export default function WalkingMode({
  status,
  error,
  wakeLockActive,
  nearbyStatue,
  onStart,
  onStop,
  onOpenNearby,
  onDismissNearby,
}: Props) {
  const enabled = status === "active" || status === "starting";

  return (
    <div className={styles.layer} aria-live="polite">
      <div className={styles.control}>
        <button
          type="button"
          className={enabled ? styles.stopButton : styles.startButton}
          onClick={enabled ? onStop : onStart}
          disabled={status === "starting"}
          aria-pressed={enabled}
        >
          <span aria-hidden="true">{enabled ? "●" : "🚶"}</span>
          {status === "starting"
            ? "Ativando radar…"
            : enabled
              ? "Encerrar caminhada"
              : "Modo caminhada"}
        </button>
        {status === "active" && (
          <span className={styles.status}>
            <span className={styles.pulse} aria-hidden="true" />
            Radar ativo · 250 m
            {wakeLockActive ? " · tela protegida" : ""}
          </span>
        )}
        {error && <span className={styles.error}>{error}</span>}
      </div>

      {nearbyStatue && (
        <section className={styles.alert} role="alert">
          <button
            type="button"
            className={styles.dismiss}
            onClick={onDismissNearby}
            aria-label="Fechar aviso"
          >
            ×
          </button>
          <span className={styles.alertIcon} aria-hidden="true">🎯</span>
          <div>
            <strong>Você entrou no raio de captura!</strong>
            <span>{nearbyStatue.name} está a menos de 250 m.</span>
          </div>
          <button type="button" className={styles.openButton} onClick={onOpenNearby}>
            Ver estátua
          </button>
        </section>
      )}
    </div>
  );
}
