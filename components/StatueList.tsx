"use client";

import { TIER_COLOR } from "@/lib/constants";
import { formatDistance } from "@/lib/geo";
import type { StatueWithDistance } from "@/types/statue";
import styles from "./StatueList.module.css";

interface Props {
  statues: StatueWithDistance[];
  activeId: string | null;
  collected: Set<string>;
  onSelect: (id: string) => void;
  onToggleCollected: (id: string) => void;
}

function initialOf(name: string): string {
  return name
    .replace(/\s*\(.*?\)\s*/g, "")
    .trim()
    .charAt(0);
}

export default function StatueList({
  statues,
  activeId,
  collected,
  onSelect,
  onToggleCollected,
}: Props) {
  return (
    <>
      <p className={styles.resultCount} aria-live="polite">
        {statues.length} estátua{statues.length === 1 ? "" : "s"} encontrada
        {statues.length === 1 ? "" : "s"}
      </p>

      {statues.length === 0 ? (
        <div className={styles.emptyState}>
          Nenhuma estátua encontrada com esses filtros.
          <br />
          Tenta ajustar a busca 🔍
        </div>
      ) : (
        <ul className={styles.list} aria-label="Lista de estátuas">
          {statues.map((s) => {
            const isOn = collected.has(s.id);
            return (
              <li key={s.id} className={styles.item}>
                <div
                  className={`${styles.card} ${
                    activeId === s.id ? styles.cardActive : ""
                  } ${isOn ? styles.cardCollected : ""}`}
                >
                  <button
                    type="button"
                    onClick={() => onSelect(s.id)}
                    style={{
                      all: "unset",
                      display: "flex",
                      gap: 10,
                      flex: 1,
                      minWidth: 0,
                      cursor: "pointer",
                    }}
                    aria-label={`Ver ${s.name} em ${s.local} no mapa`}
                  >
                    <span
                      className={styles.badge}
                      style={{ background: TIER_COLOR[s.tier] }}
                      aria-hidden="true"
                    >
                      {isOn ? "✓" : initialOf(s.name)}
                    </span>
                    <span className={styles.body}>
                      <span className={styles.cardTitle}>
                        {s.name}
                        {s.isNew && (
                          <span className={`${styles.tag} ${styles.tagNew}`}>
                            nova
                          </span>
                        )}
                        {!s.installed && (
                          <span
                            className={`${styles.tag} ${styles.tagMissing}`}
                          >
                            a instalar
                          </span>
                        )}
                      </span>
                      <span className={styles.cardLocal}>{s.local}</span>
                      {s.distanceKm !== undefined && (
                        <span className={styles.dist}>
                          📍 {formatDistance(s.distanceKm)}
                        </span>
                      )}
                    </span>
                  </button>

                  <button
                    type="button"
                    className={`${styles.check} ${isOn ? styles.checkOn : ""}`}
                    onClick={() => onToggleCollected(s.id)}
                    aria-pressed={isOn}
                    aria-label={
                      isOn
                        ? `Desmarcar ${s.name} como coletada`
                        : `Marcar ${s.name} como coletada`
                    }
                  >
                    {isOn ? "✓" : ""}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
