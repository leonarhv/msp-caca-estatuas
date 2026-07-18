"use client";

import { useEffect } from "react";

export default function PwaRegistration() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // The radar still works without the service worker; only system notifications degrade.
    });
  }, []);

  return null;
}
