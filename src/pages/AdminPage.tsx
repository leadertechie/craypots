import { useState, useEffect } from 'react';
import { doc, setDoc, deleteDoc, collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { SESSION_DURATION_MS } from '../constants';
import { v4 as uuidv4 } from 'uuid';
import RulesModal from '../components/RulesModal';

interface SessionInfo {
  id: string;
  sessionId: string;
  createdAt: number;
  expiresAt: number;
  gameStarted: boolean;
  gameEnded: boolean;
  playerCount: number;
}

export default function AdminPage() {
  const { user, isAdmin, loading, loginAsAdmin, logout } = useAuth();
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showRules, setShowRules] = useState(false);

  useEffect(() => {
    if (!isAdmin) return;

    const q = query(collection(db, 'sessions'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, async (snap) => {
      const sess: SessionInfo[] = [];
      for (const docSnap of snap.docs) {
        const d = docSnap.data();
        const playersSnap = await import('firebase/firestore').then(m => 
          m.getDocs(m.collection(db, 'sessions', docSnap.id, 'players'))
        );
        sess.push({
          id: docSnap.id,
          sessionId: d.sessionId,
          createdAt: d.createdAt,
          expiresAt: d.expiresAt,
          gameStarted: d.gameStarted,
          gameEnded: d.gameEnded,
          playerCount: playersSnap.size,
        });
      }
      setSessions(sess);
    });

    return unsub;
  }, [isAdmin]);

  if (loading) return (
    <div className="loading-page"><div className="spinner" /><span style={{ color: '#fff' }}>Loading…</span></div>
  );

  if (!isAdmin) {
    return (
      <div className="page">
        <button className="rules-btn" onClick={() => setShowRules(true)} title="Game Rules">📜</button>
        {showRules && <RulesModal onClose={() => setShowRules(false)} />}
        <div className="card">
          <div className="logo">🦀</div>
          <h1>Craypots Admin</h1>
          <p className="text-center mb-2">Sign in with the admin Google account to manage game sessions.</p>
          {error && <div className="alert alert-error">{error}</div>}
          <button
            className="btn btn-google btn-full btn-lg mt-2"
            onClick={() => loginAsAdmin().catch(e => setError(e.message))}
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="" width={20} />
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  async function createSession() {
    setCreating(true);
    setError('');
    try {
      const sessionId = uuidv4().replace(/-/g, '').slice(0, 12);
      const now = Date.now();
      await setDoc(doc(db, 'sessions', sessionId), {
        sessionId,
        createdAt: now,
        expiresAt: now + SESSION_DURATION_MS,
        gameStarted: false,
        gameEnded: false,
        gameStopped: false,
        stopReason: null,
        currentRound: 0,
        phase: 'waiting',
        diceResult: null,
        diceRollCompleted: false,
        rolledBy: null,
      });
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setCreating(false);
    }
  }

  async function deleteSession(sessionId: string) {
    if (!confirm('Are you sure you want to delete this session? This cannot be undone.')) return;
    setDeleting(sessionId);
    try {
      await deleteDoc(doc(db, 'sessions', sessionId));
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setDeleting(null);
    }
  }

  function copyUrl(id: string) {
    const url = `${window.location.origin}/session/${id}`;
    navigator.clipboard.writeText(url);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }

  function formatDate(ts: number) {
    return new Date(ts).toLocaleString();
  }

  function isExpired(expiresAt: number) {
    return expiresAt < Date.now();
  }

  return (
    <div className="page">
      <div className="card card-wide">
        <div className="logo">🦀</div>
        <h1>Craypots Admin</h1>
        <div className="flex-between mb-2">
          <span style={{ color: '#555' }}>👤 {user?.email}</span>
          <button className="btn btn-secondary btn-sm" onClick={logout}>Logout</button>
        </div>
        <div className="divider" />
        {error && <div className="alert alert-error">{error}</div>}
        
        <button
          className="btn btn-primary btn-lg"
          onClick={createSession}
          disabled={creating}
        >
          {creating ? 'Creating…' : '➕ Create New Game Session'}
        </button>
        <p className="text-center mt-1"><small>Sessions expire after 24 hours.</small></p>

        <div className="divider" />
        <h2>All Sessions ({sessions.length})</h2>
        
        {sessions.length === 0 ? (
          <p className="text-center" style={{ color: '#888' }}>No sessions yet</p>
        ) : (
          <table className="scoreboard">
            <thead>
              <tr>
                <th>Session ID</th>
                <th>Created</th>
                <th>Expires</th>
                <th>Status</th>
                <th>Players</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map(s => (
                <tr key={s.id}>
                  <td>
                    <button
                      className="btn btn-sm"
                      style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem' }}
                      onClick={() => copyUrl(s.id)}
                    >
                      {copied === s.id ? '✓ Copied' : '📋'}
                    </button>
                    {' '}{s.id}
                  </td>
                  <td style={{ fontSize: '0.85rem' }}>{formatDate(s.createdAt)}</td>
                  <td style={{ fontSize: '0.85rem', color: isExpired(s.expiresAt) ? 'red' : 'inherit' }}>
                    {formatDate(s.expiresAt)}
                    {isExpired(s.expiresAt) && ' (expired)'}
                  </td>
                  <td>
                    {s.gameEnded ? (
                      <span className="chip" style={{ background: '#999', color: '#fff' }}>Ended</span>
                    ) : s.gameStarted ? (
                      <span className="chip" style={{ background: '#27ae60', color: '#fff' }}>Active</span>
                    ) : (
                      <span className="chip" style={{ background: '#f39c12', color: '#fff' }}>Waiting</span>
                    )}
                  </td>
                  <td>{s.playerCount}</td>
                  <td>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => deleteSession(s.id)}
                      disabled={deleting === s.id}
                    >
                      {deleting === s.id ? '...' : '🗑️ Delete'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
