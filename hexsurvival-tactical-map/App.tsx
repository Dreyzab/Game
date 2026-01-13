import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { HexGrid } from './components/HexGrid';
import { HUD } from './components/HUD';
import { generateMap } from './services/mapGenerator';
import { getHexDistance, getPath, hexToString } from './utils/hexMath';
import { HexCell, GameState, HexCoordinate } from './types';

// Initial Configuration
const MAP_RADIUS = 8;
const INITIAL_AP = 5;
const VIEW_RADIUS = 3; // Radius for active sensor data

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [selectedHex, setSelectedHex] = useState<HexCoordinate | null>(null);
  const [hoveredHex, setHoveredHex] = useState<HexCoordinate | null>(null);
  const [isMoving, setIsMoving] = useState(false);

  // Initialize Game
  useEffect(() => {
    const initialMap = generateMap(MAP_RADIUS);
    const startNode = initialMap.find(h => h.q === 0 && h.r === 0);
    
    // Initial Fog of War reveal around start (Memory)
    const revealed: string[] = [];
    initialMap.forEach(hex => {
      if (getHexDistance({q:0, r:0}, hex) <= VIEW_RADIUS) {
        revealed.push(`${hex.q},${hex.r}`);
      }
    });

    setGameState({
      map: initialMap,
      player: {
        position: { q: 0, r: 0 },
        ap: INITIAL_AP,
        maxAp: 10,
        health: 100,
        maxHealth: 100,
        inventory: []
      },
      revealedHexes: new Set(revealed),
      turn: 1
    });
  }, []);

  // Calculate currently visible hexes (Real-time sensors)
  const visibleHexes = useMemo(() => {
    if (!gameState) return new Set<string>();
    const visible = new Set<string>();
    gameState.map.forEach(hex => {
      if (getHexDistance(gameState.player.position, hex) <= VIEW_RADIUS) {
        visible.add(hexToString(hex));
      }
    });
    return visible;
  }, [gameState?.player.position, gameState?.map]);

  const handleHexClick = useCallback((hex: HexCell) => {
    if (!gameState || isMoving) return;

    // Select the hex logic
    if (selectedHex?.q === hex.q && selectedHex?.r === hex.r) {
      // Deselect if clicking same
      setSelectedHex(null);
      return;
    }

    // Check if it's a move command (clicking a reachable neighbor)
    const dist = getHexDistance(gameState.player.position, hex);
    
    // Allow selection if it has been explored at least once
    const isExplored = gameState.revealedHexes.has(`${hex.q},${hex.r}`);
    
    if (isExplored) {
      setSelectedHex(hex);
    }
  }, [gameState, isMoving, selectedHex]);

  const handleMove = useCallback(() => {
    if (!gameState || !selectedHex) return;

    const path = getPath(gameState.player.position, selectedHex, gameState.map);
    // Path includes start, so cost is length - 1
    const cost = Math.max(0, path.length - 1); 

    if (cost > gameState.player.ap) {
      alert("Not enough AP!");
      return;
    }

    setIsMoving(true);

    // Simulate movement delay for effect
    setTimeout(() => {
      setGameState(prev => {
        if (!prev) return null;
        
        // Update revealed area (Memory) based on new position
        const newRevealed = new Set(prev.revealedHexes);
        
        prev.map.forEach(h => {
          if (getHexDistance(selectedHex, h) <= VIEW_RADIUS) {
            newRevealed.add(`${h.q},${h.r}`);
          }
        });

        return {
          ...prev,
          player: {
            ...prev.player,
            position: selectedHex,
            ap: prev.player.ap - cost
          },
          revealedHexes: newRevealed
        };
      });
      setSelectedHex(null);
      setIsMoving(false);
    }, 500);
  }, [gameState, selectedHex]);

  const handleEndTurn = useCallback(() => {
    setGameState(prev => {
      if (!prev) return null;
      return {
        ...prev,
        turn: prev.turn + 1,
        player: {
          ...prev.player,
          ap: Math.min(prev.player.maxAp, prev.player.ap + 4) // Recover AP
        }
      };
    });
  }, []);

  if (!gameState) return <div className="flex items-center justify-center h-screen bg-terminal-black text-terminal-green animate-pulse">BOOTING TACTICAL INTERFACE...</div>;

  return (
    <div className="relative w-full h-full bg-terminal-black overflow-hidden font-mono text-sm">
      
      {/* Background Grid Pattern for texture */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#00ff41 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
      </div>

      <HUD 
        player={gameState.player} 
        turn={gameState.turn} 
        selectedHex={selectedHex}
        mapData={gameState.map}
        visibleHexes={visibleHexes}
        onMove={handleMove}
        onEndTurn={handleEndTurn}
      />

      <HexGrid 
        gameState={gameState}
        selectedHex={selectedHex}
        hoveredHex={hoveredHex}
        visibleHexes={visibleHexes}
        setHoveredHex={setHoveredHex}
        onHexClick={handleHexClick}
      />

      {/* Vignette Effect */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_50%,rgba(0,0,0,0.8)_100%)]"></div>
    </div>
  );
};

export default App;