import React, { useRef, useState, useMemo } from 'react';
import { GameState, HexCoordinate, HexCell, BiomeType, ThreatLevel, ResourceType } from '../types';
import { hexToPixel, HEX_SIZE, hexToString, getHexDistance, getPath } from '../utils/hexMath';

interface HexGridProps {
  gameState: GameState;
  selectedHex: HexCoordinate | null;
  hoveredHex: HexCoordinate | null;
  visibleHexes: Set<string>; // Currently in view radius
  setHoveredHex: (hex: HexCoordinate | null) => void;
  onHexClick: (hex: HexCell) => void;
}

const getResourceIcon = (type: ResourceType, size: number) => {
  const center = 0;
  const s = size * 0.5; // Scale down for icon
  
  switch (type) {
    case ResourceType.SCRAP:
      return (
        <g fill="#94a3b8" stroke="none">
           <path d="M-4 -4 L4 -4 L4 4 L-4 4 Z" opacity="0.5"/>
           <circle r="2" fill="#e2e8f0"/>
        </g>
      );
    case ResourceType.FOOD:
      return (
        <g fill="#4ade80" stroke="none">
          <path d="M0 -5 Q5 -5 5 0 Q5 5 0 5 Q-5 5 -5 0 Q-5 -5 0 -5" opacity="0.8"/>
          <path d="M0 -5 L0 5" stroke="#166534" strokeWidth="1"/>
        </g>
      );
    case ResourceType.WATER:
      return (
        <g fill="#60a5fa" stroke="none">
           <path d="M0 -5 Q-4 0 0 5 Q4 0 0 -5" />
        </g>
      );
    case ResourceType.FUEL:
      return (
        <g fill="#f97316" stroke="none">
          <rect x="-3" y="-5" width="6" height="8" rx="1"/>
          <rect x="-1" y="-6" width="2" height="1"/>
        </g>
      );
    case ResourceType.TECH:
      return (
        <g fill="#a855f7" stroke="none">
          <path d="M-1 -5 L3 -1 L0 0 L1 5 L-3 1 L0 0 Z" />
        </g>
      );
    default:
      return null;
  }
};

export const HexGrid: React.FC<HexGridProps> = ({ 
  gameState, 
  selectedHex, 
  hoveredHex,
  visibleHexes,
  setHoveredHex,
  onHexClick 
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  
  // Viewport State for Pan/Zoom
  const [viewState, setViewState] = useState({ x: 0, y: 0, scale: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Calculate hex points for polygon
  const hexPoints = useMemo(() => {
    const angles = [30, 90, 150, 210, 270, 330];
    return angles.map(deg => {
      const rad = (Math.PI / 180) * deg;
      return `${HEX_SIZE * Math.cos(rad)},${HEX_SIZE * Math.sin(rad)}`;
    }).join(' ');
  }, []);

  const movementPath = useMemo(() => {
    if (!selectedHex) return [];
    return getPath(gameState.player.position, selectedHex, gameState.map);
  }, [gameState.player.position, selectedHex, gameState.map]);

  const movementPathSet = useMemo(() => new Set(movementPath.map(hexToString)), [movementPath]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      setViewState(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => setIsDragging(false);
  const handleWheel = (e: React.WheelEvent) => {
    const scaleAmount = -e.deltaY * 0.001;
    setViewState(prev => ({ ...prev, scale: Math.min(Math.max(0.5, prev.scale + scaleAmount), 3) }));
  };

  const getBiomeColor = (biome: BiomeType) => {
    switch (biome) {
      case BiomeType.BUNKER: return '#475569';
      case BiomeType.FOREST: return '#065f46';
      case BiomeType.WATER: return '#1e40af';
      case BiomeType.INDUSTRIAL: return '#78350f';
      case BiomeType.URBAN: return '#374151';
      case BiomeType.WASTELAND: return '#3f3f46';
      default: return '#18181b';
    }
  };

  const getThreatColor = (level: ThreatLevel) => {
    switch (level) {
      case ThreatLevel.SAFE: return '#00ff41';
      case ThreatLevel.LOW: return '#3b82f6';
      case ThreatLevel.MEDIUM: return '#eab308';
      case ThreatLevel.HIGH: return '#f97316';
      case ThreatLevel.EXTREME: return '#ef4444';
      default: return '#333';
    }
  };

  const getStrokeColor = (cell: HexCell, isExplored: boolean, isVisible: boolean, isSelected: boolean, isPath: boolean) => {
    if (isSelected) return '#00ff41';
    if (isPath) return '#00ff41';
    if (!isExplored) return '#333';
    
    // Only show threat borders if visible
    if (isVisible) {
      if (cell.threatLevel === ThreatLevel.EXTREME) return '#ef4444';
      if (cell.threatLevel === ThreatLevel.HIGH) return '#f97316';
    }

    return '#1a1a1a';
  };

  return (
    <svg 
      ref={svgRef}
      className="w-full h-full cursor-crosshair touch-none select-none"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      viewBox={`${-window.innerWidth/2} ${-window.innerHeight/2} ${window.innerWidth} ${window.innerHeight}`}
    >
      <defs>
        <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(0, 255, 65, 0.2)" strokeWidth="0.5"/>
        </pattern>
        {gameState.map.map((cell) => {
          const cellKey = hexToString(cell);
          // Only generate patterns for explored cells
          if (!gameState.revealedHexes.has(cellKey)) return null;

          return (
            <pattern 
              key={`pat-${cellKey}`} 
              id={`pat-${cellKey}`} 
              patternUnits="objectBoundingBox" 
              width="1" 
              height="1"
            >
              <image 
                href={`https://picsum.photos/seed/${cell.biome}_${cell.q}_${cell.r}/200/200?grayscale&blur=2`} 
                x="0" y="0" 
                width="200" height="200" 
                preserveAspectRatio="xMidYMid slice" 
              />
              <rect width="200" height="200" fill={getBiomeColor(cell.biome)} opacity="0.65" />
              <path d="M0 100 L200 100 M100 0 L100 200" stroke="rgba(0,0,0,0.2)" strokeWidth="1" />
              <rect width="200" height="200" fill="url(#grid)" opacity="0.1" />
            </pattern>
          );
        })}
      </defs>

      <g transform={`translate(${viewState.x}, ${viewState.y}) scale(${viewState.scale})`}>
        
        {/* Render Hex Cells */}
        {gameState.map.map((cell) => {
          const { x, y } = hexToPixel(cell.q, cell.r);
          const cellKey = hexToString(cell);
          const isExplored = gameState.revealedHexes.has(cellKey);
          const isVisible = visibleHexes.has(cellKey);
          
          const isSelected = selectedHex?.q === cell.q && selectedHex?.r === cell.r;
          const isPath = movementPathSet.has(cellKey);
          const isHovered = hoveredHex?.q === cell.q && hoveredHex?.r === cell.r;

          return (
            <g 
              key={cellKey} 
              transform={`translate(${x},${y})`}
              onClick={() => onHexClick(cell)}
              onMouseEnter={() => setHoveredHex(cell)}
              onMouseLeave={() => setHoveredHex(null)}
              className="transition-all duration-300"
              style={{ 
                // Visible = 1, Explored but outdated = 0.3, Unexplored = hidden essentially
                opacity: isVisible ? 1 : (isExplored ? 0.3 : 1) 
              }}
            >
              <polygon
                points={hexPoints}
                fill={isExplored ? `url(#pat-${cellKey})` : '#050505'} // Darker black for unexplored
                stroke={getStrokeColor(cell, isExplored, isVisible, isSelected, isPath)}
                strokeWidth={isSelected || isPath ? 3 : 1}
                className="transition-all duration-200"
              />

              {!isExplored && (
                 <text x="0" y="0" fontSize="10" fill="#222" textAnchor="middle" dy=".3em" className="pointer-events-none font-mono">?</text>
              )}

              {/* Only render details if currently VISIBLE (Active Sensor) */}
              {isVisible && (
                <g className="pointer-events-none">
                  
                  {/* Resource Icon (Bottom Left position) */}
                  {cell.resource !== ResourceType.NONE && (
                    <g transform={`translate(${-HEX_SIZE/2.5}, ${HEX_SIZE/3})`}>
                       <circle r="6" fill="#000" fillOpacity="0.6" stroke="#555" strokeWidth="0.5"/>
                       {getResourceIcon(cell.resource, HEX_SIZE)}
                    </g>
                  )}

                  {cell.threatLevel === ThreatLevel.EXTREME && (
                    <path 
                       d={`M-${HEX_SIZE/2} 0 L${HEX_SIZE/2} 0`} 
                       stroke="#ef4444" 
                       strokeWidth="2" 
                       strokeDasharray="4 2" 
                       opacity="0.5" 
                    />
                  )}

                  {cell.threatLevel !== ThreatLevel.SAFE && (
                    <g transform={`translate(0, ${HEX_SIZE * 0.65})`}>
                       <rect 
                         x="-6" 
                         y="-2" 
                         width="12" 
                         height="3" 
                         rx="1"
                         fill={getThreatColor(cell.threatLevel)} 
                         className={cell.threatLevel === ThreatLevel.EXTREME ? "animate-pulse" : ""}
                       />
                    </g>
                  )}

                  {(cell.threatLevel === ThreatLevel.HIGH || cell.threatLevel === ThreatLevel.EXTREME) && (
                     <text 
                       x={HEX_SIZE * 0.5} 
                       y={-HEX_SIZE * 0.5} 
                       fill={getThreatColor(cell.threatLevel)} 
                       fontSize="8" 
                       fontWeight="bold"
                     >!</text>
                  )}
                </g>
              )}

              {isExplored && viewState.scale > 1.2 && (
                <text 
                  x="0" y="-8" 
                  fontSize="6" 
                  fill="rgba(255,255,255,0.8)" 
                  textAnchor="middle" 
                  dy=".3em" 
                  className="pointer-events-none font-mono font-bold drop-shadow-md select-none"
                >
                  {cell.q},{cell.r}
                </text>
              )}

              {(isHovered || isSelected) && isExplored && (
                <polygon
                  points={hexPoints}
                  fill="none"
                  stroke={isSelected ? "#00ff41" : "white"}
                  strokeWidth="2"
                  opacity={isSelected ? 1 : 0.5}
                  className="pointer-events-none"
                />
              )}
            </g>
          );
        })}

        {/* Player Token */}
        {(() => {
          const { x, y } = hexToPixel(gameState.player.position.q, gameState.player.position.r);
          return (
            <g transform={`translate(${x},${y})`} className="pointer-events-none filter drop-shadow-[0_0_8px_rgba(0,255,65,0.8)]">
              <circle r={HEX_SIZE * 0.4} fill="none" stroke="#00ff41" strokeWidth="1.5" strokeDasharray="3 2" className="animate-[spin_12s_linear_infinite]" />
              <circle r={HEX_SIZE * 0.25} fill="#0a0a0a" stroke="#00ff41" strokeWidth="2" />
              <text y="3" fill="#00ff41" fontSize="8" textAnchor="middle" className="font-mono font-bold">OP</text>
              <rect x="-12" y="-22" width="24" height="8" fill="#000" opacity="0.8" rx="2" />
              <text y="-16" fill="#00ff41" fontSize="6" textAnchor="middle" className="font-mono tracking-tighter">UNIT-1</text>
            </g>
          );
        })()}

      </g>
    </svg>
  );
};