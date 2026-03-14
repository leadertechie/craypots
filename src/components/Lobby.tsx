import type { Player } from '../types';
import { MIN_PLAYERS, OFFLINE_THRESHOLD_MS } from '../constants';

interface Props {
  players: Player[];
  myUid: string;
  sessionId: string;
  onAddComputer: () => void;
  onStart: () => void;
}

export default function Lobby({ players, myUid, sessionId, onAddComputer, onStart }: Props) {
  const sessionUrl = `${window.location.origin}/session/${sessionId}`;

  function copyLink() {
    navigator.clipboard.writeText(sessionUrl);
  }

  const realPlayers = players.filter(p => !p.isComputer);
  const hasComputer = players.some(p => p.isComputer);
  const canStart = players.length >= MIN_PLAYERS;

  function onlineDot(p: Player) {
    const online = (Date.now() - p.lastSeen) < OFFLINE_THRESHOLD_MS;
    return <span className={online ? 'online-dot' : 'offline-dot'} title={online ? 'Online' : 'Offline'} />;
  }

  return (
    <>
      <div className="logo">🦀</div>
      <h1>Game Lobby</h1>
      <p style={{ color: '#555', marginBottom: '1rem' }}>
        Share this link so others can join:
      </p>
      <div className="url-box">
        <input readOnly value={sessionUrl} />
        <button className="btn btn-primary btn-sm" onClick={copyLink}>Copy</button>
      </div>

      <div className="divider" />
      <h2>Players ({players.length})</h2>
      <ul className="player-list">
        {players.map(p => (
          <li key={p.uid}>
            {onlineDot(p)}
            <span style={{ fontWeight: p.uid === myUid ? 700 : 400 }}>
              {p.displayName}
            </span>
            {p.uid === myUid && <span className="chip chip-placed">You</span>}
            {p.isComputer && <span className="chip chip-computer">Computer</span>}
          </li>
        ))}
        {players.length === 0 && <li style={{ color: '#999' }}>No players yet…</li>}
      </ul>

      {realPlayers.length < MIN_PLAYERS && !hasComputer && (
        <div className="alert alert-info mt-2">
          Waiting for at least {MIN_PLAYERS} players.{' '}
          Playing alone? Add a computer opponent below.
        </div>
      )}

      <div className="mt-2 flex gap-2" style={{ flexWrap: 'wrap' }}>
        {!hasComputer && (
          <button className="btn btn-secondary" onClick={onAddComputer}>
            🤖 Add Computer Player
          </button>
        )}
        <button
          className="btn btn-success btn-lg"
          onClick={onStart}
          disabled={!canStart}
          title={canStart ? '' : `Need at least ${MIN_PLAYERS} players`}
        >
          🚢 Start Game
        </button>
      </div>
    </>
  );
}
