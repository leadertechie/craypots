import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { GameProvider, useGame } from '../contexts/GameContext';
import Lobby from '../components/Lobby';
import GameBoard from '../components/GameBoard';
import Scoreboard from '../components/Scoreboard';
import RulesModal from '../components/RulesModal';

function SessionInner() {
  const { session, players, myPlayer, loading, error, joinSession, addComputerPlayer, startGame, stopGame } = useGame();
  const { user, loginAnonymously } = useAuth();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState('');
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState('');
  const { sessionId } = useParams<{ sessionId: string }>();

  // Auth + join
  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    if (!displayName.trim() || !sessionId) return;
    setJoining(true);
    setJoinError('');
    try {
      let u = user;
      if (!u) u = await loginAnonymously();
      await joinSession(sessionId, displayName.trim());
    } catch (err: unknown) {
      setJoinError((err as Error).message);
    } finally {
      setJoining(false);
    }
  }

  if (loading) return (
    <div className="loading-page">
      <div className="spinner" />
      <span style={{ color: '#fff' }}>Loading session…</span>
    </div>
  );

  if (error) return (
    <div className="page">
      <div className="card">
        <div className="logo">🦀</div>
        <div className="alert alert-error">{error}</div>
        <button className="btn btn-secondary btn-full mt-2" onClick={() => navigate('/')}>← Back to Home</button>
      </div>
    </div>
  );

  // Not joined yet
  if (!myPlayer) {
    if (session?.gameStarted) {
      return (
        <div className="page">
          <div className="card">
            <div className="logo">🦀</div>
            <div className="alert alert-error">This game has already started. You cannot join.</div>
            <button className="btn btn-secondary btn-full mt-2" onClick={() => navigate('/')}>← Back</button>
          </div>
        </div>
      );
    }
    return (
      <div className="page">
        <div className="card">
          <div className="logo">🦀</div>
          <h1>Join Game</h1>
          <p className="text-center mb-2" style={{ color: '#555' }}>
            Enter your name to join this Craypots session.
          </p>
          {joinError && <div className="alert alert-error">{joinError}</div>}
          <form onSubmit={handleJoin}>
            <div className="field">
              <label htmlFor="name">Your Name</label>
              <input
                id="name"
                type="text"
                placeholder="Captain Jack…"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                maxLength={24}
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary btn-full btn-lg"
              disabled={!displayName.trim() || joining}
            >
              {joining ? 'Joining…' : 'Set Sail! 🚢'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Game ended
  if (session?.gameEnded || session?.gameStopped) {
    return (
      <div className="page">
        <div className="card card-wide">
          <div className="logo">🏆</div>
          <h1>Game Over!</h1>
          {session.stopReason && (
            <div className="alert alert-warn">{session.stopReason}</div>
          )}
          <Scoreboard players={players} myUid={user?.uid ?? ''} showAll />
          <div className="mt-3 text-center">
            <button className="btn btn-primary" onClick={() => navigate('/')}>← Home</button>
          </div>
        </div>
      </div>
    );
  }

  // Lobby (waiting to start)
  if (!session?.gameStarted) {
    return (
      <div className="page">
        <div className="card">
          <Lobby
            players={players}
            myUid={user?.uid ?? ''}
            sessionId={sessionId ?? ''}
            onAddComputer={addComputerPlayer}
            onStart={startGame}
          />
        </div>
      </div>
    );
  }

  // Active game
  return (
    <div className="page">
      <div className="card card-wide">
        <div className="game-header flex-between mb-2">
          <h1>🦀 Craypots — Round {session.currentRound}</h1>
          <button className="btn btn-danger btn-sm" onClick={stopGame}>⏹ Stop Game</button>
        </div>
        <Scoreboard players={players} myUid={user?.uid ?? ''} />
        <div className="divider" />
        <GameBoard />
      </div>
    </div>
  );
}

export default function SessionPage() {
  const [showRules, setShowRules] = useState(false);
  const { sessionId } = useParams<{ sessionId: string }>();
  return (
    <GameProvider sessionId={sessionId ?? null}>
      <button className="rules-btn" onClick={() => setShowRules(true)} title="Game Rules">
        📜
      </button>
      {showRules && <RulesModal onClose={() => setShowRules(false)} />}
      <SessionInner />
    </GameProvider>
  );
}
