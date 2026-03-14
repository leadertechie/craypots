import { useGame } from '../contexts/GameContext';
import PotPlacement from './PotPlacement';
import DiceRoll from './DiceRoll';
import RoundResults from './RoundResults';
import type { PlacementData } from '../types';

export default function GameBoard() {
  const { session, players, myPlayer, submitPlacement, rollDiceAction } = useGame();

  if (!session || !myPlayer) return null;

  const { phase, diceResult, currentRound } = session;

  const rollerPlayer = diceResult && session.rolledBy
    ? players.find(p => p.uid === session.rolledBy)
    : null;

  const activePlayers = players.filter(p => !p.isKicked);
  const allPlaced = activePlayers.length >= 2 && activePlayers.every(p => p.hasPlaced);

  // ── Placement phase ──────────────────────────────────────────────────────
  if (phase === 'placement') {
    if (myPlayer.hasPlaced) {
      return (
        <div>
          <div className="alert alert-success">✅ Your fleet is deployed! Waiting for other players…</div>
          <ul className="player-list mt-2">
            {activePlayers.map(p => (
              <li key={p.uid}>
                <span className={p.hasPlaced ? 'online-dot' : 'offline-dot'} />
                {p.displayName}
                <span className={`chip ${p.hasPlaced ? 'chip-placed' : 'chip-waiting'}`}>
                  {p.hasPlaced ? 'Ready' : 'Placing…'}
                </span>
                {p.isComputer && <span className="chip chip-computer">Computer</span>}
              </li>
            ))}
          </ul>
        </div>
      );
    }

    return (
      <PotPlacement
        pots={myPlayer.pots}
        boats={myPlayer.boats}
        boatSizes={myPlayer.boatSizes}
        onSubmit={(placement: PlacementData) => submitPlacement(placement)}
      />
    );
  }

  // ── Rolling phase ────────────────────────────────────────────────────────
  if (phase === 'rolling') {
    return (
      <DiceRoll
        onRoll={rollDiceAction}
        diceResult={null}
        canRoll={allPlaced}
        rollerName={null}
      />
    );
  }

  // ── Resolution phase ─────────────────────────────────────────────────────
  if (phase === 'resolution') {
    if (diceResult) {
      return (
        <>
          <DiceRoll
            onRoll={rollDiceAction}
            diceResult={diceResult}
            canRoll={false}
            rollerName={rollerPlayer?.displayName ?? null}
          />
          <div className="divider" />
          <RoundResults
            diceResult={diceResult}
            players={activePlayers}
            round={currentRound}
          />
        </>
      );
    }
    return (
      <div className="alert alert-info">⏳ Resolving round…</div>
    );
  }

  // ── Ended ────────────────────────────────────────────────────────────────
  if (phase === 'ended') {
    return <div className="alert alert-info">Game has ended. See final scores above.</div>;
  }

  return null;
}
