export type ControlMode = 'WALK' | 'DRIVE';
export type CameraMode = 'FOLLOW' | 'WIDE' | 'CLOSE' | 'HOOD';
export type TimeOfDay = 'DAY' | 'SUNSET' | 'NIGHT';

export interface Quest {
  id: string;
  titleHi: string;
  titleEn: string;
  descHi: string;
  descEn: string;
  targetPos: [number, number, number];
  targetRadius: number;
  timeLimit?: number; // seconds
  rewardPoints: number;
  icon: string;
  completed: boolean;
}

export interface Landmark {
  id: string;
  nameHi: string;
  nameEn: string;
  pos: [number, number, number];
  type: 'temple' | 'chai' | 'bridge' | 'viewpoint' | 'orchard' | 'village';
}

export interface GameStats {
  score: number;
  completedQuests: number;
  totalQuests: number;
  distanceTraveledKm: number;
  speedKmh: number;
  timeRemaining?: number;
  activeQuestId: string | null;
}
