"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import type { StatusFilter, Tier } from "@/types/statue";

const VALID_STATUS: StatusFilter[] = ["installed", "all", "missing"];
const VALID_TIERS: Tier[] = ["gold", "silver", "colored"];

export function useUrlFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const status = useMemo<StatusFilter>(() => {
    const v = searchParams.get("status");
    return VALID_STATUS.includes(v as StatusFilter)
      ? (v as StatusFilter)
      : "installed";
  }, [searchParams]);

  const tiers = useMemo<Set<Tier>>(() => {
    const v = searchParams.get("tier");
    if (!v) return new Set();
    return new Set(
      v.split(",").filter((t): t is Tier => VALID_TIERS.includes(t as Tier)),
    );
  }, [searchParams]);

  const hideCollected = searchParams.get("hideCollected") === "1";
  const query = searchParams.get("q") || "";

  const update = useCallback(
    (
      patch: Partial<{
        status: StatusFilter;
        tiers: Set<Tier>;
        hideCollected: boolean;
        query: string;
      }>,
    ) => {
      const params = new URLSearchParams(searchParams.toString());

      if (patch.status !== undefined) {
        if (patch.status === "installed") params.delete("status");
        else params.set("status", patch.status);
      }
      if (patch.tiers !== undefined) {
        if (patch.tiers.size === 0) params.delete("tier");
        else params.set("tier", [...patch.tiers].join(","));
      }
      if (patch.hideCollected !== undefined) {
        if (!patch.hideCollected) params.delete("hideCollected");
        else params.set("hideCollected", "1");
      }
      if (patch.query !== undefined) {
        if (!patch.query) params.delete("q");
        else params.set("q", patch.query);
      }

      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const toggleTier = useCallback(
    (tier: Tier) => {
      const next = new Set(tiers);
      if (next.has(tier)) next.delete(tier);
      else next.add(tier);
      update({ tiers: next });
    },
    [tiers, update],
  );

  return {
    status,
    tiers,
    hideCollected,
    query,
    setStatus: (s: StatusFilter) => update({ status: s }),
    toggleTier,
    setHideCollected: (v: boolean) => update({ hideCollected: v }),
    setQuery: (q: string) => update({ query: q }),
  };
}
