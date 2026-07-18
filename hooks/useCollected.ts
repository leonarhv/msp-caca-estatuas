"use client";

import { useCallback, useEffect, useState } from "react";
import { COLLECTED_STORAGE_KEY } from "@/lib/constants";

export function useCollected() {
  const [collected, setCollected] = useState<Set<string>>(new Set());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(COLLECTED_STORAGE_KEY);
      if (raw) setCollected(new Set(JSON.parse(raw)));
    } catch {
      // ignore corrupted storage, start fresh
    } finally {
      setHydrated(true);
    }
  }, []);

  const toggle = useCallback((id: string) => {
    setCollected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      try {
        window.localStorage.setItem(
          COLLECTED_STORAGE_KEY,
          JSON.stringify([...next]),
        );
      } catch {
        // storage full or unavailable; state still updates in-memory
      }
      return next;
    });
  }, []);

  const mark = useCallback((id: string) => {
    setCollected((prev) => {
      if (prev.has(id)) return prev;

      const next = new Set(prev).add(id);
      try {
        window.localStorage.setItem(
          COLLECTED_STORAGE_KEY,
          JSON.stringify([...next]),
        );
      } catch {
        // storage full or unavailable; state still updates in-memory
      }
      return next;
    });
  }, []);

  return { collected, toggle, mark, hydrated };
}
