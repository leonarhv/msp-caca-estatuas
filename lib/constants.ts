import type { Tier } from "@/types/statue";

export const TIER_COLOR: Record<Tier, string> = {
  gold: "#C9962C",
  silver: "#7C868F",
  colored: "#0F8B7E",
};

export const TIER_LABEL: Record<Tier, string> = {
  gold: "Ouro",
  silver: "Prata",
  colored: "Pintada",
};

export const TIER_ORDER: Tier[] = ["gold", "silver", "colored"];

export const COLLECTED_STORAGE_KEY = "cacaestatuas-collected-v1";

export const TILE_PROVIDERS = [
  {
    url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: "&copy; OpenStreetMap",
  },
  {
    url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    attribution: "&copy; OpenStreetMap &copy; CARTO",
  },
  {
    url: "https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png",
    attribution: "&copy; OpenStreetMap contributors",
  },
];
