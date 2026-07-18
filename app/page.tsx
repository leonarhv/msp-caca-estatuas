import { Suspense } from "react";
import MapApp from "@/components/MapApp";
import statuesData from "@/data/statues.json";
import type { Statue } from "@/types/statue";

export default function Page() {
  const statues = statuesData as Statue[];
  return (
    <Suspense fallback={null}>
      <MapApp initialStatues={statues} />
    </Suspense>
  );
}
