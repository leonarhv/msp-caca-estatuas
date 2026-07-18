"use client";

import { TIER_COLOR, TIER_LABEL, TIER_ORDER } from "@/lib/constants";
import type { StatusFilter, Tier } from "@/types/statue";
import styles from "./FilterControls.module.css";

interface Props {
  query: string;
  onQueryChange: (q: string) => void;
  status: StatusFilter;
  onStatusChange: (s: StatusFilter) => void;
  tiers: Set<Tier>;
  onToggleTier: (t: Tier) => void;
  hideCollected: boolean;
  onHideCollectedChange: (v: boolean) => void;
  onRequestLocation: () => void;
  locating: boolean;
  locationError: string | null;
}

const TIER_CLASS: Record<Tier, string> = {
  gold: styles.tierGold,
  silver: styles.tierSilver,
  colored: styles.tierColored,
};

export default function FilterControls({
  query,
  onQueryChange,
  status,
  onStatusChange,
  tiers,
  onToggleTier,
  hideCollected,
  onHideCollectedChange,
  onRequestLocation,
  locating,
  locationError,
}: Props) {
  return (
    <div className={styles.controls}>
      <div className={styles.searchBox}>
        <label htmlFor="statue-search" className={styles.searchLabel}>
          Buscar
        </label>
        <input
          id="statue-search"
          type="search"
          className={styles.searchInput}
          placeholder="Personagem ou praça..."
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
        />
      </div>

      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>Status</legend>
        <div className={styles.optionRow} role="radiogroup" aria-label="Status">
          {(
            [
              { value: "installed", label: "Instaladas" },
              { value: "all", label: "Todas" },
              { value: "missing", label: "Ainda vêm" },
            ] as { value: StatusFilter; label: string }[]
          ).map((opt) => (
            <label key={opt.value} className={styles.optionLabel}>
              <input
                type="radio"
                name="status"
                className={styles.optionInput}
                value={opt.value}
                checked={status === opt.value}
                onChange={() => onStatusChange(opt.value)}
              />
              <span className={styles.optionLabelInner}>{opt.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>Raridade</legend>
        <div className={styles.optionRow}>
          {TIER_ORDER.map((tier) => (
            <label
              key={tier}
              className={`${styles.optionLabel} ${TIER_CLASS[tier]}`}
            >
              <input
                type="checkbox"
                className={styles.optionInput}
                checked={tiers.has(tier)}
                onChange={() => onToggleTier(tier)}
              />
              <span
                className={styles.swatch}
                style={{ background: TIER_COLOR[tier] }}
                aria-hidden="true"
              />
              <span className={styles.optionLabelInner}>
                {TIER_LABEL[tier]}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className={styles.toggleRow}>
        <label className={styles.optionLabel}>
          <input
            type="checkbox"
            className={styles.optionInput}
            checked={hideCollected}
            onChange={(e) => onHideCollectedChange(e.target.checked)}
          />
          <span className={styles.optionLabelInner}>Esconder já coletadas</span>
        </label>
      </div>

      <button
        type="button"
        className={styles.nearBtn}
        onClick={onRequestLocation}
        disabled={locating}
        aria-describedby={locationError ? "geo-error" : undefined}
      >
        📍 {locating ? "Localizando..." : "Estátuas perto de mim"}
      </button>
      {locationError && (
        <p id="geo-error" role="alert" className={styles.errorText}>
          {locationError}
        </p>
      )}
    </div>
  );
}
