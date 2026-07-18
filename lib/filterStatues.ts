import type {
  Statue,
  StatueWithDistance,
  StatusFilter,
  Tier,
} from "@/types/statue";
import { haversineKm, normalize } from "@/lib/geo";

interface FilterArgs {
  statues: Statue[];
  status: StatusFilter;
  tiers: Set<Tier>;
  hideCollected: boolean;
  collected: Set<string>;
  query: string;
  userLoc: { lat: number; lng: number } | null;
}

export function filterAndSortStatues({
  statues,
  status,
  tiers,
  hideCollected,
  collected,
  query,
  userLoc,
}: FilterArgs): StatueWithDistance[] {
  const q = normalize(query);

  let result: StatueWithDistance[] = statues.filter((s) => {
    if (status === "installed" && !s.installed) return false;
    if (status === "missing" && s.installed) return false;
    if (tiers.size > 0 && !tiers.has(s.tier)) return false;
    if (hideCollected && collected.has(s.id)) return false;
    if (q) {
      const hay = normalize(`${s.name} ${s.local}`);
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  if (userLoc) {
    result = result.map((s) => ({
      ...s,
      distanceKm: haversineKm(userLoc.lat, userLoc.lng, s.lat, s.lng),
    }));
    result.sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));
  } else {
    result = result
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  }

  return result;
}
