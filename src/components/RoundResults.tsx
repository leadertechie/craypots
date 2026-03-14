import type { DiceResult, Player } from '../types';

interface Props {
  diceResult: DiceResult;
  players: Player[];
  round: number;
}

const WEATHER_EMOJI: Record<string, string> = {
  calm:  '☀️ Calm Seas',
  mild:  '🌧 Mild Storm',
  heavy: '⛈ Heavy Storm',
};

export default function RoundResults({ diceResult, players, round }: Props) {
  return (
    <div>
      <h2>📋 Round {round} Results</h2>
      <div style={{
        textAlign: 'center',
        fontSize: '1.3rem',
        fontWeight: 700,
        marginBottom: '1rem',
        color: diceResult.weather === 'calm' ? '#27ae60' : diceResult.weather === 'mild' ? '#e67e22' : '#c0392b',
      }}>
        {WEATHER_EMOJI[diceResult.weather]} (Dice: {diceResult.value})
      </div>

      {players.map(p => {
        const lastScore = p.roundScores[p.roundScores.length - 1];
        if (!lastScore) return null;
        return (
          <div key={p.uid} style={{
            background: 'rgba(255,255,255,0.9)',
            borderRadius: 8,
            padding: '0.75rem 1rem',
            marginBottom: '0.75rem',
          }}>
            <div className="flex-between">
              <strong>{p.displayName}{p.isComputer ? ' 🤖' : ''}</strong>
              <span className={lastScore.score > 0 ? 'result-positive' : ''}>
                +{lastScore.score} pts
              </span>
            </div>
            <div style={{ fontSize: '0.88rem', color: '#555', marginTop: '0.3rem' }}>
              {diceResult.weather === 'heavy' && (
                <span className="result-negative">⚓ Lost 1 boat!</span>
              )}
              {diceResult.weather === 'mild' && lastScore.potsLost > 0 && (
                <span className="result-negative"> 🦞 Lost {lastScore.potsLost} pot{lastScore.potsLost > 1 ? 's' : ''} to storm</span>
              )}
              {diceResult.weather !== 'heavy' && lastScore.crabsCaught > 0 && (
                <span className="result-positive"> 🦀 {lastScore.crabsCaught} crabs caught</span>
              )}
              {diceResult.weather === 'heavy' && (
                <span> — No crabs caught.</span>
              )}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#999', marginTop: '0.25rem' }}>
              Boats: {p.boats} · Pots: {p.pots.length} · Total: {p.totalScore} pts
            </div>
          </div>
        );
      })}
    </div>
  );
}
