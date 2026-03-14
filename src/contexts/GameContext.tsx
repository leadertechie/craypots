import React, {
  createContext, useContext, useEffect, useRef, useState, useCallback,
} from 'react';
import {
  doc, collection, onSnapshot, setDoc, updateDoc,
  getDoc,
} from 'firebase/firestore';
import { ref, onDisconnect, set as rtdbSet, onValue } from 'firebase/database';
import { db, rtdb } from '../firebase';
import { useAuth } from './AuthContext';
import type { Session, Player, PlacementData } from '../types';
import {
  resolveRound, rollDice, computeComputerPlacement, createInitialPots, createInitialBoats,
  activePlayers as getActivePlayers,
} from '../utils/game';
import {
  HEARTBEAT_INTERVAL_MS, OFFLINE_THRESHOLD_MS, RESOLUTION_DELAY_MS,
} from '../constants';

interface GameContextValue {
  session: Session | null;
  players: Player[];
  myPlayer: Player | null;
  sessionId: string | null;
  loading: boolean;
  error: string | null;
  // Actions
  joinSession: (sessionId: string, displayName: string) => Promise<void>;
  addComputerPlayer: () => Promise<void>;
  startGame: () => Promise<void>;
  submitPlacement: (placement: PlacementData) => Promise<void>;
  rollDiceAction: () => Promise<void>;
  stopGame: () => Promise<void>;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({
  children,
  sessionId,
}: {
  children: React.ReactNode;
  sessionId: string | null;
}) {
  const { user } = useAuth();
  const [session, setSession] = useState<Session | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Firestore listeners ──────────────────────────────────────────────────
  useEffect(() => {
    if (!sessionId) { setLoading(false); return; }

    const sessionRef = doc(db, 'sessions', sessionId);
    const unsubSession = onSnapshot(sessionRef, snap => {
      if (!snap.exists()) { setError('Session not found or expired.'); setLoading(false); return; }
      const d = snap.data();
      const now = Date.now();
      if (d.expiresAt < now) { setError('This session has expired.'); setLoading(false); return; }
      setSession(d as Session);
      setLoading(false);
    }, err => { setError(err.message); setLoading(false); });

    const playersRef = collection(db, 'sessions', sessionId, 'players');
    const unsubPlayers = onSnapshot(playersRef, snap => {
      setPlayers(snap.docs.map(d => d.data() as Player));
    });

    return () => { unsubSession(); unsubPlayers(); };
  }, [sessionId]);

  // ── RTDB presence heartbeat ──────────────────────────────────────────────
  useEffect(() => {
    if (!sessionId || !user) return;
    const presenceRef = ref(rtdb, `presence/${sessionId}/${user.uid}`);

    async function beat() {
      await rtdbSet(presenceRef, { online: true, lastSeen: Date.now() });
    }
    beat();
    heartbeatRef.current = setInterval(beat, HEARTBEAT_INTERVAL_MS);

    // Mark offline on disconnect
    onDisconnect(presenceRef).set({ online: false, lastSeen: Date.now() });

    return () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    };
  }, [sessionId, user]);

  // ── Monitor RTDB presence → update Firestore player status ───────────────
  useEffect(() => {
    if (!sessionId || !user) return;
    const presRef = ref(rtdb, `presence/${sessionId}`);
    const unsub = onValue(presRef, async snapshot => {
      const data = snapshot.val() as Record<string, { online: boolean; lastSeen: number }> | null;
      if (!data) return;
      const now = Date.now();
      for (const [uid, presence] of Object.entries(data)) {
        const isOnline = presence.online && (now - presence.lastSeen) < OFFLINE_THRESHOLD_MS;
        // Only update own status (to avoid permission issues)
        if (uid === user.uid && sessionId) {
          const playerRef = doc(db, 'sessions', sessionId, 'players', uid);
          const snap = await getDoc(playerRef);
          if (snap.exists()) {
            await updateDoc(playerRef, { lastSeen: now, online: isOnline });
          }
        }
      }
    });
    return () => unsub();
  }, [sessionId, user]);

  // ── Offline → stop game if only 2 players ────────────────────────────────
  useEffect(() => {
    if (!session?.gameStarted || session.gameEnded || session.gameStopped) return;
    const online = players.filter(p => !p.isKicked && (Date.now() - p.lastSeen) < OFFLINE_THRESHOLD_MS);
    if (players.length === 2 && online.length < 2) {
      const sessionRef = doc(db, 'sessions', sessionId!);
      updateDoc(sessionRef, {
        gameStopped: true,
        stopReason: 'A player went offline.',
      }).catch(() => {});
    }
  }, [players, session, sessionId]);

  // ── Auto-resolve: when all placed & phase=rolling & user is first joiner ─
  useEffect(() => {
    if (!session || !sessionId || !user) return;
    if (session.phase !== 'placement') return;
    if (!session.gameStarted || session.gameEnded || session.gameStopped) return;

    const active = getActivePlayers(players);
    const allPlaced = active.length >= 2 && active.every(p => p.hasPlaced);

    // Computer player auto-place
    const myP = players.find(p => p.uid === user.uid);
    if (myP) {
      const computers = players.filter(p => p.isComputer && !p.hasPlaced);
      computers.forEach(async comp => {
        const placement = computeComputerPlacement(comp);
        const pRef = doc(db, 'sessions', sessionId, 'players', comp.uid);
        await updateDoc(pRef, { placement, hasPlaced: true });
      });
    }

    if (allPlaced) {
      const sRef = doc(db, 'sessions', sessionId);
      updateDoc(sRef, { phase: 'rolling' }).catch(() => {});
    }
  }, [session, players, sessionId, user]);

  // ── Auto-resolve after dice ───────────────────────────────────────────────
  useEffect(() => {
    if (!session || !sessionId) return;
    if (session.phase !== 'resolution') return;
    if (!session.diceResult) return;

    const dr = session.diceResult;

    // First player (by uid sort) runs resolution to avoid double-writes
    const sorted = [...players].sort((a, b) => a.uid.localeCompare(b.uid));
    const resolverUid = sorted[0]?.uid;
    // Run resolution if user is the first player, OR if there's no user (computer-only game)
    if (user && resolverUid !== user.uid && !user.isAnonymous) return;

    async function resolve() {
      const round = session!.currentRound;
      
      // First, show results to all players (delay for viewing)
      await new Promise(r => setTimeout(r, RESOLUTION_DELAY_MS));
      
      // Then resolve the round
      for (const player of players) {
        if (player.isKicked) continue;
        const result = resolveRound(player, dr, round);
        const pRef = doc(db, 'sessions', sessionId!, 'players', player.uid);
        await updateDoc(pRef, result.updatedPlayer);
      }

      // Check if game should end
      const updated = players.map(p => {
        const res = resolveRound(p, dr, round);
        return { ...p, ...res.updatedPlayer } as Player;
      });
      const stillPlaying = getActivePlayers(updated);
      const ended = stillPlaying.length < 2;

      const sRef = doc(db, 'sessions', sessionId!);
      await updateDoc(sRef, {
        phase: ended ? 'ended' : 'placement',
        currentRound: round + 1,
        diceResult: null,
        diceRollCompleted: false,
        gameEnded: ended,
      });
    }

    resolve().catch(e => setError(e.message));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.phase, session?.diceResult]);

  // ── Actions ──────────────────────────────────────────────────────────────

  const myPlayer = players.find(p => p.uid === user?.uid) ?? null;

  const joinSession = useCallback(async (sid: string, displayName: string) => {
    if (!user) throw new Error('Not authenticated');
    const pRef = doc(db, 'sessions', sid, 'players', user.uid);
    const snap = await getDoc(pRef);
    if (snap.exists()) return; // already joined

    await setDoc(pRef, {
      uid: user.uid,
      displayName,
      lastSeen: Date.now(),
      isComputer: false,
      boats: 3,
      boatSizes: createInitialBoats(),
      pots: createInitialPots(),
      placement: null,
      hasPlaced: false,
      totalScore: 0,
      roundScores: [],
      currentRoundScore: 0,
      isKicked: false,
      online: true,
    });
  }, [user]);

  const addComputerPlayer = useCallback(async () => {
    if (!sessionId) return;
    const compId = `computer-${Date.now()}`;
    const pRef = doc(db, 'sessions', sessionId, 'players', compId);
    await setDoc(pRef, {
      uid: compId,
      displayName: '🤖 Computer',
      lastSeen: Date.now(),
      isComputer: true,
      boats: 3,
      boatSizes: createInitialBoats(),
      pots: createInitialPots(),
      placement: null,
      hasPlaced: false,
      totalScore: 0,
      roundScores: [],
      currentRoundScore: 0,
      isKicked: false,
      online: true,
    });
  }, [sessionId]);

  const startGame = useCallback(async () => {
    if (!sessionId) return;
    const sRef = doc(db, 'sessions', sessionId);
    await updateDoc(sRef, {
      gameStarted: true,
      phase: 'placement',
      currentRound: 1,
    });
  }, [sessionId]);

  const submitPlacement = useCallback(async (placement: PlacementData) => {
    if (!sessionId || !user) return;
    // Apply placement: get zone from boat assignment
    const pRef = doc(db, 'sessions', sessionId, 'players', user.uid);
    const snap = await getDoc(pRef);
    if (!snap.exists()) return;
    const player = snap.data() as Player;
    const updatedPots = player.pots.map(pot => {
      const assignment = placement.potAssignments.find(pp => pp.potId === pot.id);
      if (assignment && assignment.boatIndex !== null && placement.boatZones[assignment.boatIndex]) {
        return { ...pot, zone: placement.boatZones[assignment.boatIndex] };
      }
      return { ...pot, zone: null };
    });
    await updateDoc(pRef, {
      pots: updatedPots,
      placement,
      hasPlaced: true,
    });
  }, [sessionId, user]);

  const rollDiceAction = useCallback(async () => {
    if (!sessionId || !user || session?.phase !== 'rolling') return;
    const result = rollDice();
    const sRef = doc(db, 'sessions', sessionId);
    await updateDoc(sRef, {
      diceResult: result,
      diceRollCompleted: true,
      rolledBy: user.uid,
      phase: 'resolution',
    });
  }, [sessionId, user, session]);

  const stopGame = useCallback(async () => {
    if (!sessionId) return;
    const sRef = doc(db, 'sessions', sessionId);
    await updateDoc(sRef, {
      gameStopped: true,
      gameEnded: true,
      phase: 'ended',
      stopReason: 'Game stopped by player.',
    });
  }, [sessionId]);

  return (
    <GameContext.Provider value={{
      session, players, myPlayer, sessionId,
      loading, error,
      joinSession, addComputerPlayer, startGame,
      submitPlacement, rollDiceAction, stopGame,
    }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used inside <GameProvider>');
  return ctx;
}
