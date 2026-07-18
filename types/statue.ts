export type Tier = "gold" | "silver" | "colored";

export interface Statue {
  id: string;
  name: string;
  local: string;
  desc: string;
  lat: number;
  lng: number;
  tier: Tier;
  installed: boolean;
  isNew: boolean;
}

export interface StatueWithDistance extends Statue {
  distanceKm?: number;
}

export type StatusFilter = "installed" | "all" | "missing";
