"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { haversineKm } from "@/lib/geo";
import type { Statue } from "@/types/statue";

export const CAPTURE_RADIUS_METERS = 250;
const ALERT_COOLDOWN_MS = 4 * 60 * 60 * 1000;
const ALERT_STORAGE_KEY = "cacaestatuas-walking-alerts-v1";

type Coords = { lat: number; lng: number; accuracy: number };
type WalkingStatus = "idle" | "starting" | "active" | "error";
type OrientationPermissionEvent = typeof DeviceOrientationEvent & {
  requestPermission?: () => Promise<"granted" | "denied">;
};

type CompassOrientationEvent = DeviceOrientationEvent & {
  webkitCompassHeading?: number;
};

interface Options {
  statues: Statue[];
  collected: Set<string>;
  onNearby: (statue: Statue) => void;
}

function readAlertTimes(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(ALERT_STORAGE_KEY) || "{}") as Record<string, number>;
  } catch {
    return {};
  }
}

async function showSystemNotification(statue: Statue) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  try {
    const registration = await navigator.serviceWorker?.ready;
    await registration?.showNotification("Estátua no raio de captura!", {
      body: `${statue.name} está a menos de ${CAPTURE_RADIUS_METERS} m de você.`,
      icon: "/icon.svg",
      badge: "/icon.svg",
      tag: `nearby-${statue.id}`,
      data: { url: `/?statue=${encodeURIComponent(statue.id)}` },
    });
  } catch {
    // The in-app alert remains available when system notifications fail.
  }
}

export function useWalkingMode({ statues, collected, onNearby }: Options) {
  const [status, setStatus] = useState<WalkingStatus>("idle");
  const [coords, setCoords] = useState<Coords | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [heading, setHeading] = useState<number | null>(null);
  const [compassAvailable, setCompassAvailable] = useState(true);
  const watchIdRef = useRef<number | null>(null);
  const walkingIntentRef = useRef(false);
  const insideRef = useRef<Set<string>>(new Set());
  const statuesRef = useRef(statues);
  const collectedRef = useRef(collected);
  const onNearbyRef = useRef(onNearby);

  useEffect(() => {
    statuesRef.current = statues;
    collectedRef.current = collected;
    onNearbyRef.current = onNearby;
  }, [statues, collected, onNearby]);

  const processOrientation = useCallback((rawEvent: DeviceOrientationEvent) => {
    const event = rawEvent as CompassOrientationEvent;
    const screenAngle = screen.orientation?.angle ?? 0;
    const baseHeading =
      typeof event.webkitCompassHeading === "number"
        ? event.webkitCompassHeading
        : typeof event.alpha === "number"
          ? 360 - event.alpha
          : null;
    if (baseHeading === null) return;
    setHeading((baseHeading + screenAngle + 360) % 360);
  }, []);

  const processPosition = useCallback((position: GeolocationPosition) => {
    const next = {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      accuracy: position.coords.accuracy,
    };
    setCoords(next);
    if (position.coords.heading !== null && Number.isFinite(position.coords.heading)) {
      setHeading((current) => current ?? position.coords.heading);
    }
    setStatus("active");
    setError(null);

    // An imprecise fix can produce false capture alerts; wait for a better reading.
    if (next.accuracy > 300) return;

    const eligible = statuesRef.current.filter(
      (statue) => statue.installed && !collectedRef.current.has(statue.id),
    );
    const nearby = eligible
      .map((statue) => ({
        statue,
        distance: haversineKm(next.lat, next.lng, statue.lat, statue.lng) * 1000,
      }))
      .filter(({ distance }) => distance <= CAPTURE_RADIUS_METERS)
      .sort((a, b) => a.distance - b.distance);

    const nowInside = new Set(nearby.map(({ statue }) => statue.id));
    const newlyEntered = nearby.find(({ statue }) => !insideRef.current.has(statue.id));
    insideRef.current = nowInside;
    if (!newlyEntered) return;

    const alertTimes = readAlertTimes();
    if (Date.now() - (alertTimes[newlyEntered.statue.id] || 0) < ALERT_COOLDOWN_MS) return;
    alertTimes[newlyEntered.statue.id] = Date.now();
    try {
      localStorage.setItem(ALERT_STORAGE_KEY, JSON.stringify(alertTimes));
    } catch {
      // A storage failure should not prevent the alert.
    }

    onNearbyRef.current(newlyEntered.statue);
    if ("vibrate" in navigator) navigator.vibrate([180, 100, 180]);
    void showSystemNotification(newlyEntered.statue);
  }, []);

  const stop = useCallback(() => {
    walkingIntentRef.current = false;
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    window.removeEventListener("deviceorientation", processOrientation);
    insideRef.current.clear();
    setHeading(null);
    setCompassAvailable(true);
    setStatus("idle");
  }, [processOrientation]);

  const start = useCallback(async () => {
    if (!("geolocation" in navigator)) {
      setError("Este navegador não oferece acesso à localização.");
      setStatus("error");
      return;
    }
    setStatus("starting");
    setError(null);
    walkingIntentRef.current = true;

    if ("Notification" in window && Notification.permission === "default") {
      void Notification.requestPermission().catch(() => undefined);
    }
    if ("DeviceOrientationEvent" in window) {
      try {
        const orientationApi = DeviceOrientationEvent as OrientationPermissionEvent;
        const permission = orientationApi.requestPermission
          ? await orientationApi.requestPermission()
          : "granted";
        if (permission === "granted") {
          window.addEventListener("deviceorientation", processOrientation);
        } else {
          setCompassAvailable(false);
        }
      } catch {
        setCompassAvailable(false);
      }
    } else {
      setCompassAvailable(false);
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      processPosition,
      (positionError) => {
        if (positionError.code === positionError.PERMISSION_DENIED) {
          walkingIntentRef.current = false;
          if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
          watchIdRef.current = null;
          setStatus("error");
          setError("Permita o acesso à localização para ativar o radar.");
          return;
        }
        setError("Sinal de localização fraco. O radar continuará tentando.");
      },
      {
        enableHighAccuracy: false,
        maximumAge: 20_000,
        timeout: 30_000,
      },
    );
  }, [processOrientation, processPosition]);

  useEffect(() => stop, [stop]);

  return { status, coords, error, heading, compassAvailable, start, stop };
}
