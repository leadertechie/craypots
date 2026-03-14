import { useState, useMemo, useRef } from 'react';
import type { Pot, PlacementData, Zone, BoatSize } from '../types';
import { ZONE_MULTIPLIER, BOAT_CONFIG } from '../constants';

interface Props {
  pots: Pot[];
  boats: number;
  boatSizes: BoatSize[];
  onSubmit: (placement: PlacementData) => void;
  disabled?: boolean;
}

const ZONES: Zone[] = ['shallow', 'medium', 'deep'];
const ZONE_LABELS: Record<Zone, string> = {
  shallow: '🏖 Shallow',
  medium:  '🌊 Medium',
  deep:    '🌑 Deep',
};
const ZONE_DESC: Record<Zone, string> = {
  shallow: '×1 crabs · No storm risk',
  medium:  '×2 crabs · Mild: −15% pots',
  deep:    '×3 crabs · Mild: −30% pots',
};

const BOAT_SIZE_ICONS: Record<BoatSize, string> = {
  small:  '🛶',
  medium: '🚤',
  large:  '⛵',
};

type DragItem = { type: 'boat'; index: number } | { type: 'pot'; id: string };

export default function PotPlacement({ pots, boats, boatSizes, onSubmit, disabled }: Props) {
  const effectiveBoatSizes: BoatSize[] = boatSizes.length > 0 ? boatSizes : Array.from({ length: boats }, () => 'medium' as BoatSize);
  const [boatZones, setBoatZones] = useState<Record<number, Zone | null>>({});
  const [potAssignments, setPotAssignments] = useState<Record<string, Zone | null>>({});
  const [error, setError] = useState<string | null>(null);
  const [dragItem, setDragItem] = useState<DragItem | null>(null);
  const [selectedItem, setSelectedItem] = useState<DragItem | null>(null);
  const dragOverRef = useRef<{ type: 'boat' | 'pot'; zone: Zone } | null>(null);

  const undeployedBoats = useMemo(() => {
    return effectiveBoatSizes.map((size, idx) => ({ size, index: idx })).filter(
      ({ index }) => !boatZones[index]
    );
  }, [effectiveBoatSizes, boatZones]);

  const deployedBoats = useMemo(() => {
    return Object.entries(boatZones)
      .filter(([_, zone]) => zone !== null)
      .map(([idx, zone]) => ({ index: Number(idx), zone: zone as Zone }));
  }, [boatZones]);

  const potsByZone = useMemo(() => {
    const result: Record<Zone, { pot: Pot; id: string }[]> = { shallow: [], medium: [], deep: [] };
    for (const pot of pots) {
      const zone = potAssignments[pot.id];
      if (zone) result[zone].push({ pot, id: pot.id });
    }
    return result;
  }, [pots, potAssignments]);

  const undeployedPots = useMemo(() => {
    return pots.filter(p => !potAssignments[p.id]);
  }, [pots, potAssignments]);

  function getBoatConfig(boatIdx: number) {
    return BOAT_CONFIG[effectiveBoatSizes[boatIdx]];
  }

  function canDropPot(potId: string, zone: Zone): boolean {
    const pot = pots.find(p => p.id === potId);
    if (!pot) return false;

    const boatsInZone = deployedBoats.filter(b => b.zone === zone);
    if (boatsInZone.length === 0) return false;

    for (const boat of boatsInZone) {
      const config = getBoatConfig(boat.index);
      const currentPots = potsByZone[zone].length;
      const boatsInThisZone = deployedBoats.filter(b => b.zone === zone).length;
      
      if (currentPots < config.maxPots * boatsInThisZone) {
        if (pot.size === 'large') {
          const largePotsInZone = potsByZone[zone].filter(p => p.pot.size === 'large').length;
          if (largePotsInZone < config.maxLarge * boatsInThisZone) {
            return true;
          }
        } else {
          return true;
        }
      }
    }
    return false;
  }

  // Drag and drop handlers
  function handleDragStart(e: React.DragEvent, item: DragItem) {
    if (disabled) return;
    setDragItem(item);
    e.dataTransfer.effectAllowed = 'move';
  }

  function handleDragEnd() {
    setDragItem(null);
    dragOverRef.current = null;
  }

  function handleDragOver(e: React.DragEvent, zone: Zone, itemType: 'boat' | 'pot') {
    e.preventDefault();
    dragOverRef.current = { type: itemType, zone };
    const canDrop = itemType === 'boat' || (dragItem?.type === 'pot' ? canDropPot(dragItem.id, zone) : true);
    e.dataTransfer.dropEffect = canDrop ? 'move' : 'none';
  }

  function handleDrop(e: React.DragEvent, zone: Zone) {
    e.preventDefault();
    if (!dragItem) return;

    if (dragItem.type === 'boat') {
      setBoatZones(prev => ({ ...prev, [dragItem.index]: zone }));
    } else if (dragItem.type === 'pot') {
      if (canDropPot(dragItem.id, zone)) {
        setPotAssignments(prev => ({ ...prev, [dragItem.id]: zone }));
      }
    }
    setDragItem(null);
    dragOverRef.current = null;
  }

  // Tap/click handlers for mobile
  function handleBoatTap(index: number) {
    if (disabled) return;
    if (selectedItem?.type === 'boat' && selectedItem.index === index) {
      setSelectedItem(null);
    } else {
      setSelectedItem({ type: 'boat', index });
    }
  }

  function handlePotTap(id: string) {
    if (disabled) return;
    if (selectedItem?.type === 'pot' && selectedItem.id === id) {
      setSelectedItem(null);
    } else {
      setSelectedItem({ type: 'pot', id });
    }
  }

  function handleZoneTap(zone: Zone) {
    if (!selectedItem) return;
    
    if (selectedItem.type === 'boat') {
      setBoatZones(prev => ({ ...prev, [selectedItem.index]: zone }));
      setSelectedItem(null);
    } else if (selectedItem.type === 'pot') {
      if (canDropPot(selectedItem.id, zone)) {
        setPotAssignments(prev => ({ ...prev, [selectedItem.id]: zone }));
        setSelectedItem(null);
      }
    }
  }

  function removeBoatFromZone(boatIdx: number) {
    setBoatZones(prev => ({ ...prev, [boatIdx]: null }));
  }

  function removePotFromZone(potId: string) {
    setPotAssignments(prev => {
      const { [potId]: _, ...rest } = prev;
      return rest;
    });
  }

  function handleSubmit() {
    const finalBoatZones: (Zone | null)[] = effectiveBoatSizes.map((_, i) => boatZones[i] ?? null);
    const finalPotAssignments: { potId: string; boatIndex: number | null }[] = pots.map(pot => {
      const zone = potAssignments[pot.id];
      if (!zone) {
        return { potId: pot.id, boatIndex: null };
      }
      const boatsInZone = deployedBoats.filter(b => b.zone === zone);
      return { potId: pot.id, boatIndex: boatsInZone[0]?.index ?? null };
    });

    if (finalPotAssignments.some(p => p.boatIndex !== null && finalBoatZones[p.boatIndex!] === null)) {
      setError('All pots must be on deployed boats');
      return;
    }

    onSubmit({
      boatZones: finalBoatZones as Zone[],
      potAssignments: finalPotAssignments,
    });
  }

  const totalDeployedBoats = deployedBoats.length;
  const totalDeployedPots = Object.keys(potAssignments).length;

  return (
    <div>
      <h2>⚓ Deploy Your Fleet</h2>
      <p style={{ color: '#555', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
        📱 Tap to select, then tap a zone • 💻 Drag & drop
      </p>
      <p style={{ color: '#555', marginBottom: '1rem' }}>
        More boats & pots = more points!
      </p>

      {error && <div className="alert alert-error">{error}</div>}
      {selectedItem && (
        <div className="alert alert-info" style={{ marginBottom: '0.5rem' }}>
          {selectedItem.type === 'boat' 
            ? `Selected: Boat ${selectedItem.index + 1} (${effectiveBoatSizes[selectedItem.index]}) — tap a zone to place`
            : `Selected: ${selectedItem.id.slice(0,6)} pot — tap a zone with a boat`}
          <button className="btn btn-sm" style={{ marginLeft: '0.5rem' }} onClick={() => setSelectedItem(null)}>Cancel</button>
        </div>
      )}

      {undeployedBoats.length > 0 && (
        <div style={{ marginBottom: '0.75rem' }}>
          <h4>⚓ Undeployed Boats</h4>
          <div className="pot-tray" style={{ minHeight: '50px', background: 'rgba(0,0,0,0.05)' }}>
            {undeployedBoats.map(({ size, index }) => (
              <span
                key={index}
                draggable={!disabled}
                onDragStart={(e) => handleDragStart(e, { type: 'boat', index })}
                onDragEnd={handleDragEnd}
                onClick={() => handleBoatTap(index)}
                style={{ 
                  fontSize: '2rem', 
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  opacity: dragItem ? 0.5 : 1,
                  border: selectedItem?.type === 'boat' && selectedItem.index === index ? '3px solid #2980b9' : 'none',
                  borderRadius: '50%',
                  padding: '4px',
                }}
                title={`Boat ${index + 1} (${size})`}
              >
                {BOAT_SIZE_ICONS[size]}
              </span>
            ))}
          </div>
        </div>
      )}

      {undeployedPots.length > 0 && (
        <div style={{ marginBottom: '0.75rem' }}>
          <h4>🦞 Unassigned Pots</h4>
          <div className="pot-tray" style={{ minHeight: '50px', background: 'rgba(0,0,0,0.05)' }}>
            {undeployedPots.map(pot => (
              <span
                key={pot.id}
                draggable={!disabled}
                onDragStart={(e) => handleDragStart(e, { type: 'pot', id: pot.id })}
                onDragEnd={handleDragEnd}
                onClick={() => handlePotTap(pot.id)}
                className={`pot-token pot-${pot.size}`}
                title={`${pot.size} pot (max ${pot.maxCrabs})`}
                style={{ 
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  opacity: dragItem ? 0.5 : 1,
                  border: selectedItem?.type === 'pot' && selectedItem.id === pot.id ? '3px solid #2980b9' : undefined,
                }}
              >
                {pot.size === 'large' ? 'L' : pot.size === 'medium' ? 'M' : 'S'}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="zones-container">
        {ZONES.map(zone => {
          const boatsInZone = deployedBoats.filter(b => b.zone === zone);
          const potsInZone = potsByZone[zone];
          const isDragOverBoat = dragItem?.type === 'boat' && dragOverRef.current?.zone === zone;
          const isDragOverPot = dragItem?.type === 'pot' && dragOverRef.current?.zone === zone;
          const canDropPotHere = dragItem?.type === 'pot' ? canDropPot(dragItem.id, zone) : true;
          const isZoneSelected = selectedItem !== null;

          return (
            <div 
              key={zone} 
              className={`zone-column zone-${zone}`}
              style={{
                borderStyle: (isDragOverBoat || isDragOverPot || isZoneSelected) ? 'solid' : 'dashed',
                borderColor: (isDragOverBoat) || (isDragOverPot && !canDropPotHere) 
                  ? 'red' : isZoneSelected && selectedItem.type === 'pot' && !canDropPot(selectedItem.id, zone)
                  ? 'red' : isZoneSelected ? '#2980b9' : 'rgba(255,255,255,0.8)',
                background: (isDragOverBoat || isDragOverPot || isZoneSelected) 
                  ? 'rgba(255,255,255,0.15)' : undefined,
                cursor: isZoneSelected ? 'pointer' : undefined,
              }}
              onClick={() => handleZoneTap(zone)}
              onDragOver={(e) => handleDragOver(e, zone, dragItem?.type || 'boat')}
              onDrop={(e) => handleDrop(e, zone)}
            >
              <div className="zone-title">{ZONE_LABELS[zone]} ×{ZONE_MULTIPLIER[zone]}</div>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', textAlign: 'center', marginBottom: '0.5rem' }}>
                {ZONE_DESC[zone]}
              </div>

              <div className="pot-tray" style={{ justifyContent: 'center', minHeight: '40px' }}>
                {boatsInZone.map(({ index }) => (
                  <span
                    key={index}
                    style={{ fontSize: '2rem', position: 'relative', cursor: 'pointer' }}
                    title={`Boat ${index + 1} (${effectiveBoatSizes[index]}) - click to remove`}
                    onClick={(e) => { e.stopPropagation(); removeBoatFromZone(index); }}
                  >
                    {BOAT_SIZE_ICONS[effectiveBoatSizes[index]]}
                    <span style={{ 
                      position: 'absolute', top: -5, right: -5, fontSize: '0.6rem', 
                      background: 'red', borderRadius: '50%', width: '14px', height: '14px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
                    }}>×</span>
                  </span>
                ))}
              </div>

              <div className="pot-tray" style={{ minHeight: '40px' }}>
                {potsInZone.map(({ pot, id }) => (
                  <span
                    key={id}
                    className={`pot-token pot-${pot.size}`}
                    title={`${pot.size} pot (max ${pot.maxCrabs}) - click to remove`}
                    onClick={(e) => { e.stopPropagation(); removePotFromZone(id); }}
                    style={{ cursor: 'pointer' }}
                  >
                    {pot.size === 'large' ? 'L' : pot.size === 'medium' ? 'M' : 'S'}
                  </span>
                ))}
                {potsInZone.length === 0 && !boatsInZone.length && (
                  <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem' }}>Tap zone to place</span>
                )}
                {potsInZone.length === 0 && boatsInZone.length > 0 && (
                  <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem' }}>Tap zone to place</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: '0.75rem', textAlign: 'center', color: '#888', fontSize: '0.85rem' }}>
        <strong>Deployed:</strong> {totalDeployedBoats}/{boats} boats, {totalDeployedPots}/{pots.length} pots
      </div>

      <button className="btn btn-success btn-full btn-lg mt-2" onClick={handleSubmit} disabled={disabled}>
        ✅ Confirm Deployment
      </button>
      
      <p className="text-center mt-1" style={{ fontSize: '0.8rem', color: '#888' }}>
        Tip: More boats & pots deployed = more points!
      </p>
    </div>
  );
}
