import type { Player } from '../types';

interface Props {
  players: Player[];
  myUid: string;
  showAll?: boolean;
}

export default function Scoreboard({ players, myUid, showAll = false }: Props) {
  const sorted = [...players].sort((a, b) => b.totalScore - a.totalScore);

  // Score shown: total minus current round score (revealed after next round or game ends)
  function getDisplayScore(p: Player): number {
    if (showAll) return p.totalScore;
    // During game: show previous rounds' total
    if (p.roundScores.length === 0) return 0;
    return p.totalScore - p.currentRoundScore;
  }

  function getRoundScores(p: Player): string {
    if (showAll || p.uid === myUid) {
      return p.roundScores.map(r => r.score).join(', ');
    }
    // Hide current round for opponents
    if (p.roundScores.length <= 1) return '—';
    return p.roundScores.slice(0, -1).map(r => r.score).join(', ');
  }

  return (
    <div>
      <h3>🏆 Scoreboard</h3>
      <table className="scoreboard">
        <thead>
          <tr>
            <th>#</th>
            <th>Player</th>
            <th>Boats ⚓</th>
            <th>Pots 🦞</th>
            <th>Score</th>
            <th>Rounds</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((p, i) => (
            <tr key={p.uid} className={p.uid === myUid ? 'you' : ''}>
              <td>{i + 1}</td>
              <td>
                {p.displayName}
                {p.uid === myUid && ' ★'}
                {p.isComputer && ' 🤖'}
              </td>
              <td>{'⚓'.repeat(Math.max(0, p.boats))}</td>
              <td>{p.pots.length}</td>
              <td><strong>{getDisplayScore(p).toLocaleString()}</strong></td>
              <td style={{ fontSize: '0.8rem', color: '#666' }}>
                {getRoundScores(p)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!showAll && (
        <p style={{ fontSize: '0.75rem', color: '#999', marginTop: '0.3rem' }}>
          * Score shows previous rounds. Current round revealed after next round.
        </p>
      )}
    </div>
  );
}
