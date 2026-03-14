import type { PotSize, Zone, Weather, BoatSize } from './types';

export const ADMIN_EMAIL = 'your-admin-email@example.com';

export const INITIAL_BOATS = 3;

export const BOAT_SIZES: BoatSize[] = ['small', 'medium', 'large'];

export const BOAT_CONFIG: Record<BoatSize, { maxPots: number; maxLarge: number }> = {
  small:  { maxPots: 2, maxLarge: 0 },
  medium: { maxPots: 3, maxLarge: 0 },
  large:  { maxPots: 4, maxLarge: 1 },
};

export const POT_CONFIGS: { size: PotSize; count: number; maxCrabs: number }[] = [
  { size: 'large',  count: 2, maxCrabs: 10 },
  { size: 'medium', count: 3, maxCrabs: 6  },
  { size: 'small',  count: 4, maxCrabs: 3  },
];

export const ZONE_MULTIPLIER: Record<Zone, number> = {
  shallow: 1,
  medium:  2,
  deep:    3,
};

/** % of pots lost per zone during a mild storm */
export const MILD_STORM_POT_LOSS: Record<Zone, number> = {
  shallow: 0,
  medium:  0.15,
  deep:    0.30,
};

/** Dice value → weather */
export const DICE_WEATHER: Record<number, Weather> = {
  1: 'heavy', 2: 'heavy',
  3: 'mild',  4: 'mild',
  5: 'calm',  6: 'calm',
};

export const SESSION_DURATION_MS   = 24 * 60 * 60 * 1000; // 24 h
export const HEARTBEAT_INTERVAL_MS = 30_000;               // 30 s
export const OFFLINE_THRESHOLD_MS  = 60_000;               // 60 s
export const MIN_PLAYERS           = 2;
export const RESOLUTION_DELAY_MS   = 3_000;                // auto-advance after results
