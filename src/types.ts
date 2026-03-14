// ─── Core game types ───────────────────────────────────────────────────────

export type Zone = 'shallow' | 'medium' | 'deep';
export type PotSize = 'large' | 'medium' | 'small';
export type BoatSize = 'small' | 'medium' | 'large';
export type Weather = 'calm' | 'mild' | 'heavy';
export type GamePhase = 'waiting' | 'placement' | 'rolling' | 'resolution' | 'ended';

export interface Pot {
  id: string;
  size: PotSize;
  maxCrabs: number;
  zone: Zone | null; // null = not placed yet this round
}

export interface PlacementData {
  boatZones: Zone[];                    // zone for each boat (null = not deployed)
  potAssignments: { potId: string; boatIndex: number | null }[];  // which pot on which boat (null = not deployed)
}

export interface RoundScore {
  round: number;
  score: number;
  crabsCaught: number;
  boatsLost: number;
  potsLost: number;
}

export interface Player {
  uid: string;
  displayName: string;
  lastSeen: number;          // ms timestamp (for heartbeat)
  isComputer: boolean;
  boats: number;             // remaining boats (starts 3)
  boatSizes: BoatSize[];     // sizes of each boat: ['small', 'medium', 'large']
  pots: Pot[];               // remaining pots
  placement: PlacementData | null;
  hasPlaced: boolean;
  totalScore: number;
  roundScores: RoundScore[]; // full history — last round hidden on other players' view
  currentRoundScore: number;
  isKicked: boolean;
}

export interface DiceResult {
  value: number;             // 1–6
  weather: Weather;
}

export interface Session {
  sessionId: string;
  createdAt: number;
  expiresAt: number;
  gameStarted: boolean;
  gameEnded: boolean;
  gameStopped: boolean;
  stopReason: string | null;
  currentRound: number;
  phase: GamePhase;
  diceResult: DiceResult | null;
  diceRollCompleted: boolean;
  rolledBy: string | null;
}
