import { Suspense } from "react";
import MapApp from "@/components/MapApp";
import missionsData from "@/data/missions.json";
import statuesData from "@/data/statues.json";
import type { MissionsData } from "@/types/mission";
import type { Statue } from "@/types/statue";

export default function Page() {
  const statues = statuesData as Statue[];
  const missions = (missionsData as MissionsData).data;
  return (
    <Suspense fallback={null}>
      <MapApp initialStatues={statues} missions={missions} />
    </Suspense>
  );
}
