"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { haversineKm } from "@/lib/geo";
import type { Statue } from "@/types/statue";

export const CAPTURE_RADIUS_METERS = 250;
const ALERT_COOLDOWN_MS = 4 * 60 * 60 * 1000;
const ALERT_STORAGE_KEY = "cacaestatuas-walking-alerts-v1";

type Coords = { lat: number; lng: number; accuracy: number };
type WalkingStatus = "idle" | "starting" | "active" | "error";

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
  const [wakeLockActive, setWakeLockActive] = useState(false);
  const watchIdRef = useRef<number | null>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const insideRef = useRef<Set<string>>(new Set());
  const statuesRef = useRef(statues);
  const collectedRef = useRef(collected);
  const onNearbyRef = useRef(onNearby);

  useEffect(() => {
    statuesRef.current = statues;
    collectedRef.current = collected;
    onNearbyRef.current = onNearby;
  }, [statues, collected, onNearby]);

  const requestWakeLock = useCallback(async () => {
    if (document.visibilityState !== "visible") return;
    try {
      if (!("wakeLock" in navigator)) return;
      const sentinel = await navigator.wakeLock.request("screen");
      if (!sentinel) return;
      wakeLockRef.current = sentinel;
      setWakeLockActive(true);
      sentinel.addEventListener("release", () => setWakeLockActive(false), { once: true });
    } catch {
      setWakeLockActive(false);
    }
  }, []);

  const processPosition = useCallback((position: GeolocationPosition) => {
    const next = {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      accuracy: position.coords.accuracy,
    };
    setCoords(next);
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
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    void wakeLockRef.current?.release();
    wakeLockRef.current = null;
    insideRef.current.clear();
    setWakeLockActive(false);
    setStatus("idle");
  }, []);

  const start = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setError("Este navegador não oferece acesso à localização.");
      setStatus("error");
      return;
    }
    setStatus("starting");
    setError(null);

    if ("Notification" in window && Notification.permission === "default") {
      void Notification.requestPermission().catch(() => undefined);
    }
    void requestWakeLock();

    watchIdRef.current = navigator.geolocation.watchPosition(
      processPosition,
      (positionError) => {
        if (positionError.code === positionError.PERMISSION_DENIED) {
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
  }, [processPosition, requestWakeLock]);

  useEffect(() => {
    const resumeWakeLock = () => {
      if (document.visibilityState === "visible" && watchIdRef.current !== null) {
        void requestWakeLock();
      }
    };
    document.addEventListener("visibilitychange", resumeWakeLock);
    return () => document.removeEventListener("visibilitychange", resumeWakeLock);
  }, [requestWakeLock]);

  useEffect(() => stop, [stop]);

  return { status, coords, error, wakeLockActive, start, stop };
}
