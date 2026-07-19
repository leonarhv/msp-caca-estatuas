"use client";

import { useMemo } from "react";
import { bearingDegrees, formatDistance, haversineKm } from "@/lib/geo";
import type { Statue } from "@/types/statue";
import styles from "./WalkingMode.module.css";

interface Props {
  status: "idle" | "starting" | "active" | "error";
  error: string | null;
  coords: { lat: number; lng: number; accuracy: number } | null;
  heading: number | null;
  compassAvailable: boolean;
  statues: Statue[];
  collected: Set<string>;
  nearbyStatue: Statue | null;
  onStart: () => void;
  onStop: () => void;
  onOpenNearby: () => void;
  onDismissNearby: () => void;
}

export default function WalkingMode({
  status,
  error,
  coords,
  heading,
  compassAvailable,
  statues,
  collected,
  nearbyStatue,
  onStart,
  onStop,
  onOpenNearby,
  onDismissNearby,
}: Props) {
  const enabled = status === "active" || status === "starting";
  const nearest = useMemo(() => {
    if (!coords) return null;
    return statues
      .filter((statue) => statue.installed && !collected.has(statue.id))
      .map((statue) => ({
        statue,
        distanceKm: haversineKm(coords.lat, coords.lng, statue.lat, statue.lng),
        bearing: bearingDegrees(coords.lat, coords.lng, statue.lat, statue.lng),
      }))
      .sort((a, b) => a.distanceKm - b.distanceKm)[0] ?? null;
  }, [collected, coords, statues]);

  const arrowRotation = nearest && heading !== null ? nearest.bearing - heading : 0;

  if (enabled) {
    return (
      <section className={styles.compass} aria-live="polite">
        <div className={styles.compassTop}>
          <span className={styles.activeBadge}>
            <span className={styles.pulse} aria-hidden="true" /> Bússola ativa
          </span>
          <button type="button" className={styles.topStopButton} onClick={onStop}>
            Encerrar
          </button>
        </div>

        <div className={styles.compassCenter}>
          {nearest ? (
            <>
              <div className={styles.targetLabel}>Estátua mais próxima</div>
              <h2>{nearest.statue.name}</h2>
              <p className={styles.location}>{nearest.statue.local}</p>
              <div className={styles.dial} aria-label={`Direção para ${nearest.statue.name}`}>
                <span className={styles.north}>N</span>
                <div
                  className={`${styles.arrow} ${heading === null ? styles.searching : ""}`}
                  style={{ transform: `rotate(${arrowRotation}deg)` }}
                  aria-hidden="true"
                >
                  <span />
                </div>
                <div className={styles.dialCenter} />
              </div>
              <strong className={styles.distance}>{formatDistance(nearest.distanceKm)}</strong>
              <span className={styles.hint}>
                {heading === null
                  ? compassAvailable
                    ? "Mova o iPhone em forma de 8 para calibrar a bússola"
                    : "Siga a distância; a orientação não está disponível"
                  : "A seta aponta para a estátua"}
              </span>
              {coords && coords.accuracy > 100 && (
                <span className={styles.accuracy}>Precisão aproximada: {Math.round(coords.accuracy)} m</span>
              )}
            </>
          ) : (
            <div className={styles.loadingTarget}>
              <span className={styles.spinner} aria-hidden="true" />
              <h2>Buscando sua localização…</h2>
              <p>A primeira leitura do GPS pode levar alguns segundos.</p>
            </div>
          )}
          {error && <span className={styles.compassError}>{error}</span>}
        </div>

        {nearbyStatue && (
          <section className={`${styles.alert} ${styles.compassAlert}`} role="alert">
            <button type="button" className={styles.dismiss} onClick={onDismissNearby} aria-label="Fechar aviso">×</button>
            <span className={styles.alertIcon} aria-hidden="true">🎯</span>
            <div>
              <strong>Você entrou no raio de captura!</strong>
              <span>{nearbyStatue.name} está a menos de 250 m.</span>
            </div>
            <button type="button" className={styles.openButton} onClick={onOpenNearby}>Ver estátua</button>
          </section>
        )}
      </section>
    );
  }

  return (
    <div className={styles.layer} aria-live="polite">
      <div className={styles.control}>
        <button type="button" className={styles.startButton} onClick={onStart} aria-pressed="false">
          <span aria-hidden="true">🧭</span> Modo caminhada
        </button>
        {error && <span className={styles.error}>{error}</span>}
      </div>
    </div>
  );
}
