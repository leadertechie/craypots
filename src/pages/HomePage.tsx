import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import RulesModal from '../components/RulesModal';

export default function HomePage() {
  const [sessionUrl, setSessionUrl] = useState('');
  const [showRules, setShowRules] = useState(false);
  const navigate = useNavigate();

  function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    const url = sessionUrl.trim();
    const match = url.match(/session\/([a-zA-Z0-9]+)/);
    const id = match ? match[1] : url;
    if (id) navigate(`/session/${id}`);
  }

  return (
    <div className="page">
      <button className="rules-btn" onClick={() => setShowRules(true)} title="Game Rules">
        📜
      </button>
      <div className="card">
        <div className="logo">🦀</div>
        <h1>Craypots</h1>
        <p className="text-center mb-2" style={{ color: '#555' }}>
          A multiplayer crayfish pot fishing game
        </p>
        <div className="divider" />
        <form onSubmit={handleJoin}>
          <div className="field">
            <label htmlFor="sessionUrl">Game Session URL or ID</label>
            <input
              id="sessionUrl"
              type="text"
              placeholder="Paste the session link you received…"
              value={sessionUrl}
              onChange={e => setSessionUrl(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={!sessionUrl.trim()}>
            Join Game 🚢
          </button>
        </form>
        <div className="divider" />
        <p className="text-center">
          <small>
            Are you the game host?{' '}
            <a href="/admin" style={{ color: '#2980b9' }}>Go to Admin →</a>
          </small>
        </p>
      </div>
      {showRules && <RulesModal onClose={() => setShowRules(false)} />}
    </div>
  );
}
