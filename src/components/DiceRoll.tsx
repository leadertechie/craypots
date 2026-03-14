import { useState } from 'react';
import type { DiceResult } from '../types';

const DICE_FACES = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
const WEATHER_LABEL: Record<string, string>  = { calm: '☀️ Calm Seas', mild: '🌧 Mild Storm', heavy: '⛈ Heavy Storm!' };
const WEATHER_CLASS: Record<string, string>  = { calm: 'weather-calm', mild: 'weather-mild', heavy: 'weather-heavy' };

interface Props {
  onRoll: () => Promise<void>;
  diceResult: DiceResult | null;
  canRoll: boolean;
  rollerName: string | null;
}

export default function DiceRoll({ onRoll, diceResult, canRoll, rollerName }: Props) {
  const [rolling, setRolling] = useState(false);

  async function handleRoll() {
    setRolling(true);
    await onRoll();
    setRolling(false);
  }

  return (
    <div className="dice-container">
      <h2>🎲 Roll the Dice</h2>
      {diceResult ? (
        <>
          <div className="dice">{DICE_FACES[diceResult.value - 1]}</div>
          <div className={`weather-banner ${WEATHER_CLASS[diceResult.weather]}`}>
            {WEATHER_LABEL[diceResult.weather]}
          </div>
          <p style={{ color: '#555', marginTop: '0.5rem' }}>
            Dice rolled by {rollerName ?? 'unknown'}. Calculating results…
          </p>
        </>
      ) : canRoll ? (
        <>
          <div style={{ fontSize: '4rem', opacity: 0.3 }}>🎲</div>
          <button
            className="btn btn-deep btn-lg mt-2"
            onClick={handleRoll}
            disabled={rolling}
          >
            {rolling ? '⏳ Rolling…' : '🎲 Roll Dice!'}
          </button>
        </>
      ) : (
        <>
          <div style={{ fontSize: '4rem', opacity: 0.3 }}>🎲</div>
          <div className="alert alert-info mt-2">
            Waiting for all players to place their pots before the dice can be rolled…
          </div>
        </>
      )}
    </div>
  );
}
