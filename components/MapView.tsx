"use client";

import L from "leaflet";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Circle,
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  Tooltip,
  useMap,
} from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import { characterImage } from "@/lib/characterImages";
import {
  officialStatueUrl,
  TIER_COLOR,
  TILE_PROVIDERS,
} from "@/lib/constants";
import type { Statue } from "@/types/statue";

interface Props {
  statues: Statue[];
  collected: Set<string>;
  onToggleCollected: (id: string) => void;
  onCapture: (id: string) => void;
  userLoc: { lat: number; lng: number } | null;
  locating: boolean;
  onRequestLocation: () => void;
  focusStatueId: string | null;
  onFocusHandled: () => void;
}

const SP_CENTER: [number, number] = [-23.5505, -46.6333];
const CAPTURE_RADIUS_METERS = 250;

function initialOf(name: string): string {
  return name
    .replace(/\s*\(.*?\)\s*/g, "")
    .trim()
    .charAt(0);
}

function pinIcon(statue: Statue, isCollected: boolean) {
  const color = TIER_COLOR[statue.tier] || "#333";
  const image = characterImage(statue.name);
  const size = image ? 42 : 30;
  const content = isCollected
    ? "✓"
    : image
      ? `<img src="${image}" alt="" />`
      : initialOf(statue.name);
  const html = `<div class="statue-pin ${
    !statue.installed ? "faded" : ""
  }" style="width:${size}px;height:${size}px;background:${color};">
      <span class="inner">${content}</span>
    </div>`;
  return L.divIcon({
    html,
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
  });
}

function TileWithFallback() {
  const [providerIdx, setProviderIdx] = useState(0);
  const [ok, setOk] = useState(false);
  const provider =
    TILE_PROVIDERS[Math.min(providerIdx, TILE_PROVIDERS.length - 1)];

  return (
    <TileLayer
      key={providerIdx}
      url={provider.url}
      attribution={provider.attribution}
      maxZoom={19}
      eventHandlers={{
        load: () => setOk(true),
        tileerror: () => {
          if (!ok && providerIdx < TILE_PROVIDERS.length - 1) {
            setProviderIdx((i) => i + 1);
          }
        },
      }}
    />
  );
}

function FocusController({
  statues,
  focusStatueId,
  onFocusHandled,
  markerRefs,
}: {
  statues: Statue[];
  focusStatueId: string | null;
  onFocusHandled: () => void;
  markerRefs: React.MutableRefObject<Record<string, L.Marker | null>>;
}) {
  const map = useMap();

  useEffect(() => {
    if (!focusStatueId) return;
    const s = statues.find((x) => x.id === focusStatueId);
    if (!s) return;
    map.flyTo([s.lat, s.lng], Math.max(map.getZoom(), 16), { duration: 0.6 });
    const marker = markerRefs.current[focusStatueId];
    // slight delay so flyTo has started and the marker is in view before opening
    const t = setTimeout(() => marker?.openPopup(), 300);
    onFocusHandled();
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusStatueId]);

  return null;
}

function UserLocationMarker({ loc }: { loc: { lat: number; lng: number } }) {
  const map = useMap();
  const centeredOnce = useRef(false);
  useEffect(() => {
    if (centeredOnce.current) return;
    centeredOnce.current = true;
    map.flyTo([loc.lat, loc.lng], 14, { duration: 0.6 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loc.lat, loc.lng]);

  const icon = useMemo(
    () =>
      L.divIcon({
        html: '<div style="width:16px;height:16px;border-radius:50%;background:#1a73e8;border:3px solid #fff;box-shadow:0 0 0 3px rgba(26,115,232,0.35);"></div>',
        className: "",
        iconSize: [16, 16],
      }),
    [],
  );

  return (
    <Marker position={[loc.lat, loc.lng]} icon={icon}>
      <Popup>Você está aqui</Popup>
    </Marker>
  );
}

export default function MapView({
  statues,
  collected,
  onToggleCollected,
  onCapture,
  userLoc,
  locating,
  onRequestLocation,
  focusStatueId,
  onFocusHandled,
}: Props) {
  const markerRefs = useRef<Record<string, L.Marker | null>>({});
  const mapRef = useRef<L.Map | null>(null);
  const centerOnNextLocation = useRef(false);
  const [selectedStatueId, setSelectedStatueId] = useState<string | null>(null);

  const selectedStatue = statues.find((s) => s.id === selectedStatueId);

  useEffect(() => {
    if (focusStatueId) setSelectedStatueId(focusStatueId);
  }, [focusStatueId]);

  useEffect(() => {
    if (!userLoc || !centerOnNextLocation.current) return;
    centerOnNextLocation.current = false;
    mapRef.current?.flyTo([userLoc.lat, userLoc.lng], 16, { duration: 0.6 });
  }, [userLoc]);

  const handleLocate = () => {
    centerOnNextLocation.current = true;
    onRequestLocation();
  };

  return (
    <div className="map-view">
      <MapContainer
        ref={mapRef}
        center={SP_CENTER}
        zoom={12}
        minZoom={10}
        maxZoom={19}
        style={{ height: "100%", width: "100%" }}
        aria-label="Mapa de São Paulo com as estátuas da promoção Caça Estátuas"
      >
        <TileWithFallback />

        <MarkerClusterGroup
          maxClusterRadius={50}
          iconCreateFunction={(cluster: any) => {
            const count = cluster.getChildCount();
            const size = count < 10 ? 34 : count < 30 ? 40 : 46;
            return L.divIcon({
              html: `<div class="marker-cluster-custom" style="width:${size}px;height:${size}px;">${count}</div>`,
              className: "",
              iconSize: [size, size],
            });
          }}
        >
        {statues.map((s) => {
          const isOn = collected.has(s.id);
          const image = characterImage(s.name);
          const gmaps = `https://www.google.com/maps/search/?api=1&query=${s.lat},${s.lng}`;
          return (
            <Marker
              key={s.id}
              position={[s.lat, s.lng]}
              icon={pinIcon(s, isOn)}
              ref={(ref) => {
                markerRefs.current[s.id] = ref;
                return undefined;
              }}
              alt={s.name}
              eventHandlers={{
                click: () => setSelectedStatueId(s.id),
              }}
            >
              <Popup>
                {image && (
                  <img
                    className="popup-character"
                    src={image}
                    alt={s.name}
                    loading="lazy"
                  />
                )}
                <p className="popup-title">{s.name}</p>
                <p className="popup-local">
                  {s.local}
                  {!s.installed && (
                    <>
                      {" "}
                      · <em>ainda não instalada</em>
                    </>
                  )}
                </p>
                <p className="popup-desc">{s.desc}</p>
                <div className="popup-actions">
                  <a
                    href={officialStatueUrl(s.id)}
                    onClick={() => onCapture(s.id)}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Capturar ${s.name} no site oficial (abre em nova aba)`}
                  >
                    📸 Capturar
                  </a>
                  <a href={gmaps} target="_blank" rel="noopener noreferrer">
                    🧭 Google Maps
                  </a>
                  <button
                    type="button"
                    className={isOn ? "on" : ""}
                    onClick={() => onToggleCollected(s.id)}
                  >
                    {isOn ? "✓ Coletada" : "Marcar coletada"}
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}
        </MarkerClusterGroup>

        {selectedStatue && (
          <Circle
            center={[selectedStatue.lat, selectedStatue.lng]}
            radius={CAPTURE_RADIUS_METERS}
            pathOptions={{
              color: TIER_COLOR[selectedStatue.tier] || "#333",
              fillColor: TIER_COLOR[selectedStatue.tier] || "#333",
              fillOpacity: 0.14,
              opacity: 0.85,
              weight: 2,
            }}
          >
            <Tooltip direction="center" permanent>
              Raio de captura: 250 m
            </Tooltip>
          </Circle>
        )}

        {userLoc && <UserLocationMarker loc={userLoc} />}

        <FocusController
          statues={statues}
          focusStatueId={focusStatueId}
          onFocusHandled={onFocusHandled}
          markerRefs={markerRefs}
        />
      </MapContainer>

      <button
        type="button"
        className="locate-control"
        onClick={handleLocate}
        disabled={locating}
        aria-label={
          locating
            ? "Obtendo sua localização"
            : userLoc
              ? "Atualizar minha localização"
              : "Obter minha localização"
        }
        title={
          locating
            ? "Atualizando localização…"
            : userLoc
              ? "Atualizar minha localização"
              : "Minha localização"
        }
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
        </svg>
      </button>
    </div>
  );
}
