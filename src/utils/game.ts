import { v4 as uuidv4 } from 'uuid';
import type { Pot, Player, DiceResult, PlacementData, RoundScore, BoatSize, Zone } from '../types';
import {
  POT_CONFIGS,
  DICE_WEATHER,
  ZONE_MULTIPLIER,
  MILD_STORM_POT_LOSS,
  BOAT_CONFIG,
} from '../constants';

// ─── Pot Factory ────────────────────────────────────────────────────────────

export function createInitialPots(): Pot[] {
  const pots: Pot[] = [];
  for (const cfg of POT_CONFIGS) {
    for (let i = 0; i < cfg.count; i++) {
      pots.push({ id: uuidv4(), size: cfg.size, maxCrabs: cfg.maxCrabs, zone: null });
    }
  }
  return pots;
}

// ─── Boat Factory ────────────────────────────────────────────────────────────

export function createInitialBoats(): BoatSize[] {
  return ['small', 'medium', 'large'];
}

// ─── Validation ───────────────────────────────────────────────────────────────

export function validatePlacement(
  boatSizes: BoatSize[],
  potAssignments: { potId: string; boatIndex: number | null }[],
  pots: Pot[]
): { valid: boolean; error?: string } {
  const potsByBoat: Record<number, number> = {};

  for (const assignment of potAssignments) {
    if (assignment.boatIndex === null) continue;
    potsByBoat[assignment.boatIndex] = (potsByBoat[assignment.boatIndex] || 0) + 1;
  }

  for (let boatIdx = 0; boatIdx < boatSizes.length; boatIdx++) {
    const boatSize = boatSizes[boatIdx];
    const config = BOAT_CONFIG[boatSize];
    const potCount = potsByBoat[boatIdx] || 0;

    if (potCount > config.maxPots) {
      return { valid: false, error: `${boatSize} boat can only hold ${config.maxPots} pots` };
    }

    const assignedPots = potAssignments.filter(p => p.boatIndex === boatIdx);
    const largeCount = assignedPots.filter(p => {
      const pot = pots.find(pot => pot.id === p.potId);
      return pot?.size === 'large';
    }).length;

    if (largeCount > config.maxLarge) {
      return { valid: false, error: `${boatSize} boat can only hold ${config.maxLarge} large pot(s)` };
    }
  }

  return { valid: true };
}

// ─── Dice ────────────────────────────────────────────────────────────────────

export function rollDice(): DiceResult {
  const value = Math.floor(Math.random() * 6) + 1;
  return { value, weather: DICE_WEATHER[value] };
}

// ─── Scoring ─────────────────────────────────────────────────────────────────

export function calcRoundScore(
  potAssignments: { potId: string; boatIndex: number | null }[],
  boatZones: (Zone | null)[],
  pots: Pot[]
): number {
  const activePots: Pot[] = [];

  for (const assignment of potAssignments) {
    if (assignment.boatIndex === null) continue;
    if (boatZones[assignment.boatIndex] === null) continue;

    const pot = pots.find(p => p.id === assignment.potId);
    if (pot) {
      activePots.push({
        ...pot,
        zone: boatZones[assignment.boatIndex] as Zone,
      });
    }
  }

  return activePots.reduce((sum, p) => sum + p.maxCrabs * ZONE_MULTIPLIER[p.zone!], 0);
}

// ─── Storm damage ────────────────────────────────────────────────────────────

function applyStormDamage(
  potAssignments: { potId: string; boatIndex: number | null }[],
  boatZones: (Zone | null)[],
  pots: Pot[]
): { survivingAssignments: typeof potAssignments; survivingPots: Pot[]; lost: number } {
  const survivingAssignments: typeof potAssignments = [];
  const survivingPots: Pot[] = [];
  let lost = 0;

  for (const assignment of potAssignments) {
    if (assignment.boatIndex === null) {
      survivingAssignments.push(assignment);
      const pot = pots.find(p => p.id === assignment.potId);
      if (pot) survivingPots.push(pot);
      continue;
    }

    const zone = boatZones[assignment.boatIndex];
    if (!zone) {
      survivingAssignments.push(assignment);
      const pot = pots.find(p => p.id === assignment.potId);
      if (pot) survivingPots.push(pot);
      continue;
    }

    const lossRate = MILD_STORM_POT_LOSS[zone];
    const pot = pots.find(p => p.id === assignment.potId);
    
    if (lossRate > 0 && Math.random() < lossRate) {
      lost++;
    } else {
      survivingAssignments.push(assignment);
      if (pot) survivingPots.push(pot);
    }
  }

  return { survivingAssignments, survivingPots, lost };
}

// ─── Resolution ──────────────────────────────────────────────────────────────

export interface ResolutionResult {
  updatedPlayer: Partial<Player>;
  roundScore: RoundScore;
}

export function resolveRound(
  player: Player,
  diceResult: DiceResult,
  round: number
): ResolutionResult {
  const placement = player.placement;
  let pots = [...player.pots];
  let boats = player.boats;
  let boatsLost = 0;
  let potsLost = 0;

  if (diceResult.weather === 'heavy') {
    boats = Math.max(0, boats - 1);
    boatsLost = 1;
    potsLost = pots.length;
    pots = [];
    // No score for heavy storm - all pots lost
  } else if (diceResult.weather === 'mild' && placement) {
    const { survivingPots, lost } = applyStormDamage(
      placement.potAssignments,
      placement.boatZones,
      pots
    );
    pots = survivingPots;
    potsLost = lost;
  }

  // Score is 0 for heavy storms, calculated from pots in zones for calm/mild
  let score = 0;
  if (diceResult.weather !== 'heavy' && placement) {
    // Calculate score from pots that were actually deployed (in zones)
    const activePots: Pot[] = [];
    for (const assignment of placement.potAssignments) {
      if (assignment.boatIndex === null) continue;
      const zone = placement.boatZones[assignment.boatIndex];
      if (!zone) continue;
      
      const pot = pots.find(p => p.id === assignment.potId);
      if (pot) {
        activePots.push({ ...pot, zone });
      }
    }
    score = activePots.reduce((sum, p) => sum + p.maxCrabs * ZONE_MULTIPLIER[p.zone!], 0);
  }
  
  const totalScore = player.totalScore + score;

  const roundScore: RoundScore = {
    round,
    score,
    crabsCaught: diceResult.weather === 'heavy' ? 0 : score,
    boatsLost,
    potsLost,
  };

  return {
    updatedPlayer: {
      boats,
      pots: pots.map(p => ({ ...p, zone: null })),
      placement: null,
      hasPlaced: false,
      totalScore,
      roundScores: [...player.roundScores, roundScore],
      currentRoundScore: score,
    },
    roundScore,
  };
}

// ─── Game end checks ─────────────────────────────────────────────────────────

export function isPlayerEliminated(player: Player): boolean {
  return player.boats <= 0 || player.pots.length === 0;
}

// ─── Computer player AI ──────────────────────────────────────────────────────

const ZONES = ['shallow', 'medium', 'deep'] as const;

function randomZone(): Zone {
  return ZONES[Math.floor(Math.random() * ZONES.length)];
}

export function computeComputerPlacement(player: Player): PlacementData {
  const boatZones: Zone[] = player.boatSizes.map(() => randomZone());
  
  const potAssignments: { potId: string; boatIndex: number | null }[] = [];
  let boatIdx = 0;
  
  for (const pot of player.pots) {
    const boatSize = player.boatSizes[boatIdx % player.boatSizes.length];
    const config = BOAT_CONFIG[boatSize];
    const currentOnBoat = potAssignments.filter(a => a.boatIndex === boatIdx).length;
    
    if (currentOnBoat < config.maxPots) {
      potAssignments.push({ potId: pot.id, boatIndex: boatIdx });
    } else {
      potAssignments.push({ potId: pot.id, boatIndex: null });
    }
    
    if (currentOnBoat + 1 >= config.maxPots) {
      boatIdx++;
    }
  }

  return { boatZones, potAssignments };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function activePlayers(players: Player[]): Player[] {
  return players.filter(p => !p.isKicked && !isPlayerEliminated(p));
}
