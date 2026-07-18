"use client";

import { useEffect, useMemo, useState } from "react";
import { formatDistance, haversineKm } from "@/lib/geo";
import type { WakeLockStatus } from "@/hooks/useWalkingMode";
import type { Statue } from "@/types/statue";
import styles from "./WalkingMode.module.css";

interface Props {
  status: "idle" | "starting" | "active" | "error";
  error: string | null;
  wakeLockStatus: WakeLockStatus;
  coords: { lat: number; lng: number; accuracy: number } | null;
  statues: Statue[];
  collected: Set<string>;
  nearbyStatue: Statue | null;
  onStart: () => void;
  onStop: () => void;
  onRetryWakeLock: () => void;
  onOpenNearby: () => void;
  onDismissNearby: () => void;
}

export default function WalkingMode({
  status,
  error,
  wakeLockStatus,
  coords,
  statues,
  collected,
  nearbyStatue,
  onStart,
  onStop,
  onRetryWakeLock,
  onOpenNearby,
  onDismissNearby,
}: Props) {
  const enabled = status === "active" || status === "starting";
  const [economyView, setEconomyView] = useState(false);

  useEffect(() => {
    if (status === "active") setEconomyView(true);
    if (status === "idle" || status === "error") setEconomyView(false);
  }, [status]);

  const nearest = useMemo(() => {
    if (!coords) return null;
    return statues
      .filter((statue) => statue.installed && !collected.has(statue.id))
      .map((statue) => ({
        statue,
        distanceKm: haversineKm(coords.lat, coords.lng, statue.lat, statue.lng),
      }))
      .sort((a, b) => a.distanceKm - b.distanceKm)[0] ?? null;
  }, [collected, coords, statues]);

  const wakeMessage = {
    idle: "Proteção da tela desligada",
    requesting: "Tentando manter a tela ligada…",
    active: "Tela será mantida ligada",
    unsupported: "Este iOS não oferece Wake Lock para web apps",
    blocked: "O iOS liberou o bloqueio automático da tela",
  }[wakeLockStatus];

  if (enabled && economyView) {
    return (
      <section className={styles.economy} aria-live="polite">
        <div className={styles.economyTop}>
          <span className={styles.economyBadge}>
            <span className={styles.pulse} aria-hidden="true" /> Radar ativo · 250 m
          </span>
          <div className={styles.economyActions}>
            <button type="button" className={styles.mapButton} onClick={() => setEconomyView(false)}>
              Ver mapa
            </button>
            <button type="button" className={styles.topStopButton} onClick={onStop}>
              Encerrar
            </button>
          </div>
        </div>

        <div className={styles.economyCenter}>
          <span className={styles.walkIcon} aria-hidden="true">🚶</span>
          <h2>Modo economia</h2>
          <p>A tela escura reduz o consumo em iPhones com display OLED.</p>
          {nearest && (
            <div className={styles.nearest}>
              <span>Estátua não coletada mais próxima</span>
              <strong>{nearest.statue.name}</strong>
              <b>{formatDistance(nearest.distanceKm)}</b>
            </div>
          )}
          <div className={wakeLockStatus === "active" ? styles.wakeOk : styles.wakeWarning}>
            <span aria-hidden="true">{wakeLockStatus === "active" ? "✓" : "!"}</span>
            <div>
              <strong>{wakeMessage}</strong>
              {wakeLockStatus !== "active" && (
                <small>Wake Lock em apps da Tela de Início requer iOS 18.4 ou mais recente.</small>
              )}
            </div>
          </div>
          {(wakeLockStatus === "blocked" || wakeLockStatus === "unsupported") && (
            <button type="button" className={styles.retryButton} onClick={onRetryWakeLock}>
              Tentar manter a tela ligada
            </button>
          )}
        </div>

        {nearbyStatue && (
          <section className={`${styles.alert} ${styles.economyAlert}`} role="alert">
            <span className={styles.alertIcon} aria-hidden="true">🎯</span>
            <div>
              <strong>Você entrou no raio de captura!</strong>
              <span>{nearbyStatue.name} está a menos de 250 m.</span>
            </div>
            <button
              type="button"
              className={styles.openButton}
              onClick={() => {
                setEconomyView(false);
                onOpenNearby();
              }}
            >
              Ver estátua no mapa
            </button>
          </section>
        )}
      </section>
    );
  }

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
            {wakeLockStatus === "active" ? " · tela protegida" : " · tela pode apagar"}
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
