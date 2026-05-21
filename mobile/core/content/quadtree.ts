// Saybon v2 — Spatial Quadtree Index
// O(log N) hit detection and viewport culling for the infinite concept grid
// Runs on the JS thread alongside the Skia rendering loop

export interface Point2D {
  x: number;
  y: number;
}

export interface BoundingBox {
  x: number;       // Center x
  y: number;       // Center y
  halfW: number;   // Half-width
  halfH: number;   // Half-height
}

export interface IndexedNode extends Point2D {
  id: string;
  radius: number;  // Visual hit radius for tap detection
}

function boxContains(box: BoundingBox, point: Point2D): boolean {
  return (
    point.x >= box.x - box.halfW &&
    point.x <= box.x + box.halfW &&
    point.y >= box.y - box.halfH &&
    point.y <= box.y + box.halfH
  );
}

function boxIntersects(a: BoundingBox, b: BoundingBox): boolean {
  return !(
    a.x - a.halfW > b.x + b.halfW ||
    a.x + a.halfW < b.x - b.halfW ||
    a.y - a.halfH > b.y + b.halfH ||
    a.y + a.halfH < b.y - b.halfH
  );
}

const QUADTREE_CAPACITY = 8;

export class Quadtree {
  private boundary: BoundingBox;
  private points: IndexedNode[] = [];
  private divided = false;

  private ne?: Quadtree;
  private nw?: Quadtree;
  private se?: Quadtree;
  private sw?: Quadtree;

  constructor(boundary: BoundingBox) {
    this.boundary = boundary;
  }

  /** Insert a node into the tree. Returns false if outside boundary. */
  insert(node: IndexedNode): boolean {
    if (!boxContains(this.boundary, node)) {
      return false;
    }

    if (this.points.length < QUADTREE_CAPACITY && !this.divided) {
      this.points.push(node);
      return true;
    }

    if (!this.divided) {
      this.subdivide();
    }

    return (
      this.ne!.insert(node) ||
      this.nw!.insert(node) ||
      this.se!.insert(node) ||
      this.sw!.insert(node)
    );
  }

  private subdivide(): void {
    const { x, y, halfW, halfH } = this.boundary;
    const qW = halfW / 2;
    const qH = halfH / 2;

    this.ne = new Quadtree({ x: x + qW, y: y - qH, halfW: qW, halfH: qH });
    this.nw = new Quadtree({ x: x - qW, y: y - qH, halfW: qW, halfH: qH });
    this.se = new Quadtree({ x: x + qW, y: y + qH, halfW: qW, halfH: qH });
    this.sw = new Quadtree({ x: x - qW, y: y + qH, halfW: qW, halfH: qH });

    this.divided = true;

    // Re-insert existing points into children
    for (const p of this.points) {
      this.ne.insert(p) ||
      this.nw!.insert(p) ||
      this.se!.insert(p) ||
      this.sw!.insert(p);
    }
    this.points = [];
  }

  /** Query all nodes within a rectangular bounding box. */
  queryRange(range: BoundingBox, found: IndexedNode[] = []): IndexedNode[] {
    if (!boxIntersects(this.boundary, range)) {
      return found;
    }

    for (const p of this.points) {
      if (boxContains(range, p)) {
        found.push(p);
      }
    }

    if (this.divided) {
      this.ne!.queryRange(range, found);
      this.nw!.queryRange(range, found);
      this.se!.queryRange(range, found);
      this.sw!.queryRange(range, found);
    }

    return found;
  }

  /**
   * Find the nearest node to a tap point within a search radius.
   * Used for touch hit detection — returns the best candidate node id.
   */
  findNearest(
    tap: Point2D,
    searchRadius: number
  ): IndexedNode | null {
    const range: BoundingBox = {
      x: tap.x,
      y: tap.y,
      halfW: searchRadius,
      halfH: searchRadius,
    };

    const candidates = this.queryRange(range);
    let best: IndexedNode | null = null;
    let bestDist = Infinity;

    for (const node of candidates) {
      const dx = node.x - tap.x;
      const dy = node.y - tap.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      // Use the node's visual radius as part of the hit check
      if (dist <= node.radius + searchRadius && dist < bestDist) {
        bestDist = dist;
        best = node;
      }
    }

    return best;
  }
}

/**
 * Build a fresh Quadtree from a list of screen-space node positions.
 * Call after every pan/zoom transform update.
 */
export function buildQuadtree(
  nodes: IndexedNode[],
  worldHalfSize = 2000
): Quadtree {
  const tree = new Quadtree({
    x: 0,
    y: 0,
    halfW: worldHalfSize,
    halfH: worldHalfSize,
  });

  for (const node of nodes) {
    tree.insert(node);
  }

  return tree;
}
