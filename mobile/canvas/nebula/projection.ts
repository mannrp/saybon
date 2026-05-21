// Saybon v2 — 3D Projection Engine
// Mathematically projects 3D coordinates (x, y, z) into flat 2D screen positions.
// Supports rotational matrices (yaw, pitch) and perspective distance scaling.
// Highly optimized for UI-thread execution inside Reanimated worklets.

export interface Coordinate3D {
  x: number;
  y: number;
  z: number;
}

export interface ProjectedPoint {
  screenX: number;
  screenY: number;
  radius: number;
  alpha: number;      // Depth fading (fog)
  zDepth: number;     // Projected Z for Painter's Algorithm sorting
  visible: boolean;   // True if within clipping planes & viewport culling
}

// Visual layout constants
export const FOCAL_LENGTH = 680;      // Standard camera focal projection depth
export const BASE_Z_DEPTH = 900;       // Eye distance of camera

/**
 * Projects a single 3D world coordinate into 2D screen coordinate space.
 * Marking as a Reanimated "worklet" ensures it can run at 120fps on the UI thread.
 */
export function project3D(
  pt: Coordinate3D,
  pitch: number,       // Rotation around X-axis (radians)
  yaw: number,         // Rotation around Y-axis (radians)
  zoom: number,        // Zoom multiplier (pinch scale)
  panX: number,        // Horizontal offset
  panY: number,        // Vertical offset
  screenWidth: number,
  screenHeight: number,
  baseRadius: number
): ProjectedPoint {
  "worklet";

  const cx = screenWidth / 2;
  const cy = screenHeight / 2;

  // 1. Yaw Rotation (around Y-axis, horizontal drag)
  const cosY = Math.cos(yaw);
  const sinY = Math.sin(yaw);
  const x1 = pt.x * cosY - pt.z * sinY;
  const z1 = pt.x * sinY + pt.z * cosY;

  // 2. Pitch Rotation (around X-axis, vertical drag)
  const cosX = Math.cos(pitch);
  const sinX = Math.sin(pitch);
  const y2 = pt.y * cosX - z1 * sinX;
  const z2 = pt.y * sinX + z1 * cosX;

  // 3. Perspective Projection
  // As zoom increases, the camera moves closer (shrinking the eye distance)
  const cameraZ = BASE_Z_DEPTH / zoom;
  const denominator = cameraZ - z2;

  // Near clipping plane: if node passes behind the camera
  if (denominator <= 30) {
    return {
      screenX: 0,
      screenY: 0,
      radius: 0,
      alpha: 0,
      zDepth: z2,
      visible: false,
    };
  }

  const scale = FOCAL_LENGTH / denominator;

  // 4. Transform to screen space, incorporating camera panning
  const screenX = cx + (x1 + panX) * scale;
  const screenY = cy + (y2 + panY) * scale;

  // 5. Visual scaling attributes
  const projectedRadius = baseRadius * scale;

  // Depth factors for opacity fading (from -350 to +350 coordinates)
  // Deeper background nodes are smaller and dimmer (fog of space)
  const depthPercent = (z2 + 350) / 700;
  const alpha = Math.max(0.12, Math.min(1.0, 0.2 + depthPercent * 0.8));

  // Viewport culling check: is the projected circle on screen?
  const pad = projectedRadius + 40;
  const visible =
    screenX >= -pad &&
    screenX <= screenWidth + pad &&
    screenY >= -pad &&
    screenY <= screenHeight + pad;

  return {
    screenX,
    screenY,
    radius: projectedRadius,
    alpha,
    zDepth: z2,
    visible,
  };
}
