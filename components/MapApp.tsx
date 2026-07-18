"use client";

import dynamic from "next/dynamic";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useCollected } from "@/hooks/useCollected";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useWalkingMode } from "@/hooks/useWalkingMode";
import { useUrlFilters } from "@/hooks/useUrlFilters";
import { filterAndSortStatues } from "@/lib/filterStatues";
import type { Statue } from "@/types/statue";
import type { Mission } from "@/types/mission";
import FilterControls from "./FilterControls";
import Header from "./Header";
import styles from "./MapApp.module.css";
import MissionList from "./MissionList";
import Panel from "./Panel";
import StatueList from "./StatueList";
import WalkingMode from "./WalkingMode";

const MapView = dynamic(() => import("./MapView"), {
  ssr: false,
  loading: () => <div className={styles.mapFallback}>Carregando mapa...</div>,
});

interface Props {
  initialStatues: Statue[];
  missions: Mission[];
}

export default function MapApp({ initialStatues, missions }: Props) {
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
  const [panelView, setPanelView] = useState<"statues" | "missions">("statues");
  const [nearbyStatue, setNearbyStatue] = useState<Statue | null>(null);

  const handleNearby = useCallback((statue: Statue) => {
    setNearbyStatue(statue);
    setActiveId(statue.id);
    setFocusStatueId(statue.id);
  }, []);

  const walking = useWalkingMode({
    statues: initialStatues,
    collected,
    onNearby: handleNearby,
  });
  const effectiveUserLoc = walking.coords ?? userLoc;

  const filteredStatues = useMemo(
    () =>
      filterAndSortStatues({
        statues: initialStatues,
        status,
        tiers,
        hideCollected,
        collected,
        query,
        userLoc: effectiveUserLoc,
      }),
    [initialStatues, status, tiers, hideCollected, collected, query, effectiveUserLoc],
  );

  const mapStatues = useMemo(() => {
    if (!nearbyStatue || filteredStatues.some((s) => s.id === nearbyStatue.id)) {
      return filteredStatues;
    }
    return [...filteredStatues, nearbyStatue];
  }, [filteredStatues, nearbyStatue]);

  const installedCount = useMemo(
    () => initialStatues.filter((s) => s.installed).length,
    [initialStatues],
  );

  const handleSelect = (id: string) => {
    setActiveId(id);
    setFocusStatueId(id);
  };

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("statue");
    if (!id || !initialStatues.some((statue) => statue.id === id)) return;
    setActiveId(id);
    setFocusStatueId(id);
  }, [initialStatues]);

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
              statues={mapStatues}
              collected={collected}
              onToggleCollected={toggleCollected}
              userLoc={effectiveUserLoc}
              locating={locating}
              onRequestLocation={request}
              focusStatueId={focusStatueId}
              onFocusHandled={() => setFocusStatueId(null)}
            />
          </Suspense>
          <WalkingMode
            status={walking.status}
            error={walking.error}
            wakeLockStatus={walking.wakeLockStatus}
            coords={walking.coords}
            statues={initialStatues}
            collected={collected}
            nearbyStatue={nearbyStatue}
            onStart={walking.start}
            onStop={walking.stop}
            onRetryWakeLock={walking.retryWakeLock}
            onOpenNearby={() => {
              if (nearbyStatue) handleSelect(nearbyStatue.id);
            }}
            onDismissNearby={() => setNearbyStatue(null)}
          />
        </div>

        <Panel
          summary={
            panelView === "statues"
              ? `${filteredStatues.length} resultados`
              : `${missions.length} missões`
          }
        >
          <div className={styles.viewTabs} role="tablist" aria-label="Conteúdo do painel">
            <button
              type="button"
              role="tab"
              aria-selected={panelView === "statues"}
              aria-controls="statue-list-panel"
              className={panelView === "statues" ? styles.activeTab : ""}
              onClick={() => setPanelView("statues")}
            >
              📍 Estátuas
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={panelView === "missions"}
              aria-controls="missions-panel"
              className={panelView === "missions" ? styles.activeTab : ""}
              onClick={() => setPanelView("missions")}
            >
              🎯 Missões
              <span className={styles.tabBadge}>{missions.length}</span>
            </button>
          </div>

          <div
            id="statue-list-panel"
            role="tabpanel"
            className={styles.panelView}
            hidden={panelView !== "statues"}
          >
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
          <div
            id="missions-panel"
            role="tabpanel"
            className={styles.panelView}
            hidden={panelView !== "missions"}
          >
            <MissionList missions={missions} />
          </div>
        </Panel>
      </div>
    </div>
  );
}
