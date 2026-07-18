"use client";

import dynamic from "next/dynamic";
import { Suspense, useMemo, useState } from "react";
import { useCollected } from "@/hooks/useCollected";
import { useGeolocation } from "@/hooks/useGeolocation";
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
              locating={locating}
              onRequestLocation={request}
              focusStatueId={focusStatueId}
              onFocusHandled={() => setFocusStatueId(null)}
            />
          </Suspense>
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
