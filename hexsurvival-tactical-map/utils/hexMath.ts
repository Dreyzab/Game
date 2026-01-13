import { HexCoordinate, HexCell } from '../types';

export const HEX_SIZE = 30;

// Convert Axial (q,r) to Pixel (x,y) for Pointy-topped hexes
export const hexToPixel = (q: number, r: number, size: number = HEX_SIZE) => {
  const x = size * (Math.sqrt(3) * q + (Math.sqrt(3) / 2) * r);
  const y = size * ((3 / 2) * r);
  return { x, y };
};

// Cube coordinate helper
interface Cube {
  q: number;
  r: number;
  s: number;
}

const axialToCube = (hex: HexCoordinate): Cube => {
  return { q: hex.q, r: hex.r, s: -hex.q - hex.r };
};

const cubeDistance = (a: Cube, b: Cube): number => {
  return (Math.abs(a.q - b.q) + Math.abs(a.r - b.r) + Math.abs(a.s - b.s)) / 2;
};

export const getHexDistance = (a: HexCoordinate, b: HexCoordinate): number => {
  const ac = axialToCube(a);
  const bc = axialToCube(b);
  return cubeDistance(ac, bc);
};

export const getNeighbors = (hex: HexCoordinate): HexCoordinate[] => {
  const directions = [
    { q: 1, r: 0 }, { q: 1, r: -1 }, { q: 0, r: -1 },
    { q: -1, r: 0 }, { q: -1, r: 1 }, { q: 0, r: 1 }
  ];
  return directions.map(d => ({ q: hex.q + d.q, r: hex.r + d.r }));
};

// A simple pathfinding implementation (BFS as weights are 1 for now)
// Can be upgraded to A* if movement costs vary
export const getPath = (start: HexCoordinate, end: HexCoordinate, map: HexCell[]): HexCoordinate[] => {
  const queue: HexCoordinate[] = [start];
  const cameFrom: Record<string, HexCoordinate | null> = {};
  const startKey = `${start.q},${start.r}`;
  cameFrom[startKey] = null;

  // Create a quick lookup for map traversal validity
  const mapSet = new Set(map.map(h => `${h.q},${h.r}`));

  while (queue.length > 0) {
    const current = queue.shift()!;
    const currentKey = `${current.q},${current.r}`;

    if (current.q === end.q && current.r === end.r) {
      break;
    }

    const neighbors = getNeighbors(current);
    for (const next of neighbors) {
      const nextKey = `${next.q},${next.r}`;
      // Check if in map and not visited
      if (mapSet.has(nextKey) && !(nextKey in cameFrom)) {
        // Here you would check for obstacles
        cameFrom[nextKey] = current;
        queue.push(next);
      }
    }
  }

  // Reconstruct path
  const endKey = `${end.q},${end.r}`;
  if (!(endKey in cameFrom)) return []; // No path

  let current: HexCoordinate | null = end;
  const path: HexCoordinate[] = [];
  while (current) {
    path.push(current);
    const key = `${current.q},${current.r}`;
    current = cameFrom[key] || null;
    if (current?.q === start.q && current?.r === start.r) {
      path.push(start); // Add start
      break;
    }
  }
  return path.reverse();
};

export const hexToString = (h: HexCoordinate) => `${h.q},${h.r}`;
