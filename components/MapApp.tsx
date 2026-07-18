"use client";

import dynamic from "next/dynamic";
import { Suspense, useMemo, useState } from "react";
import { useCollected } from "@/hooks/useCollected";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useUrlFilters } from "@/hooks/useUrlFilters";
import { filterAndSortStatues } from "@/lib/filterStatues";
import type { Statue } from "@/types/statue";
import FilterControls from "./FilterControls";
import Header from "./Header";
import styles from "./MapApp.module.css";
import Panel from "./Panel";
import StatueList from "./StatueList";

const MapView = dynamic(() => import("./MapView"), {
  ssr: false,
  loading: () => <div className={styles.mapFallback}>Carregando mapa...</div>,
});

interface Props {
  initialStatues: Statue[];
}

export default function MapApp({ initialStatues }: Props) {
  const {
    status,
    tiers,
    hideCollected,
    query,
    setStatus,
    toggleTier,
    setHideCollected,
    setQuery,
  } = useUrlFilters();

  const { collected, toggle: toggleCollected } = useCollected();
  const {
    coords: userLoc,
    loading: locating,
    error: locationError,
    request,
  } = useGeolocation();

  const [activeId, setActiveId] = useState<string | null>(null);
  const [focusStatueId, setFocusStatueId] = useState<string | null>(null);

  const filteredStatues = useMemo(
    () =>
      filterAndSortStatues({
        statues: initialStatues,
        status,
        tiers,
        hideCollected,
        collected,
        query,
        userLoc,
      }),
    [initialStatues, status, tiers, hideCollected, collected, query, userLoc],
  );

  const installedCount = useMemo(
    () => initialStatues.filter((s) => s.installed).length,
    [initialStatues],
  );

  const handleSelect = (id: string) => {
    setActiveId(id);
    setFocusStatueId(id);
  };

  return (
    <div className={styles.app}>
      <a href="#statue-list-panel" className="skip-link">
        Pular para a lista de estátuas
      </a>

      <Header
        installedCount={installedCount}
        totalCount={initialStatues.length}
        collectedCount={collected.size}
      />

      <div className={styles.bodyWrap}>
        <div className={styles.mapWrap}>
          <Suspense
            fallback={
              <div className={styles.mapFallback}>Carregando mapa...</div>
            }
          >
            <MapView
              statues={filteredStatues}
              collected={collected}
              onToggleCollected={toggleCollected}
              userLoc={userLoc}
              focusStatueId={focusStatueId}
              onFocusHandled={() => setFocusStatueId(null)}
            />
          </Suspense>
        </div>

        <Panel resultCount={filteredStatues.length}>
          <div id="statue-list-panel">
            <FilterControls
              query={query}
              onQueryChange={setQuery}
              status={status}
              onStatusChange={setStatus}
              tiers={tiers}
              onToggleTier={toggleTier}
              hideCollected={hideCollected}
              onHideCollectedChange={setHideCollected}
              onRequestLocation={request}
              locating={locating}
              locationError={locationError}
            />
            <StatueList
              statues={filteredStatues}
              activeId={activeId}
              collected={collected}
              onSelect={handleSelect}
              onToggleCollected={toggleCollected}
            />
          </div>
        </Panel>
      </div>
    </div>
  );
}
