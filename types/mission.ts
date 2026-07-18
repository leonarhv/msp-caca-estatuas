export interface MissionProgress {
  current: number;
  target: number;
}

export interface Mission {
  id: number;
  name: string;
  description: string;
  image: string | null;
  hook: string;
  points: number;
  unlocked: boolean;
  progress: MissionProgress;
}

export interface MissionsData {
  data: Mission[];
}
