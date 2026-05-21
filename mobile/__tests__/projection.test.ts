// Saybon v2 — 3D Projection Engine Unit Tests
// Verifies coordinate rotation matrices, perspective camera scaling,
// near clipping plane culling, and offscreen culling.

import { project3D, FOCAL_LENGTH, BASE_Z_DEPTH } from '../canvas/nebula/projection';

describe('3D Projection Math Tests', () => {
  const screenWidth = 400;
  const screenHeight = 800;
  const cx = screenWidth / 2; // 200
  const cy = screenHeight / 2; // 400
  const baseRadius = 10;

  test('projects origin (0, 0, 0) to screen center with no rotation', () => {
    const pt = { x: 0, y: 0, z: 0 };
    const proj = project3D(pt, 0, 0, 1.0, 0, 0, screenWidth, screenHeight, baseRadius);

    expect(proj.screenX).toBeCloseTo(cx);
    expect(proj.screenY).toBeCloseTo(cy);
    expect(proj.visible).toBe(true);
    expect(proj.alpha).toBeCloseTo(0.6); // Neutral depth alpha
  });

  test('90 degree yaw (around Y-axis) rotates X-coordinate to Z-coordinate', () => {
    const pt = { x: 100, y: 0, z: 0 };
    // Rotate Y by 90 degrees (Math.PI / 2)
    // x1 = x * cos(pi/2) - z * sin(pi/2) = 0 - 0 = 0
    // z1 = x * sin(pi/2) + z * cos(pi/2) = 100 * 1 + 0 = 100
    const proj = project3D(pt, 0, Math.PI / 2, 1.0, 0, 0, screenWidth, screenHeight, baseRadius);

    // Projected screenX should be exactly screen center since x1 rotates to 0
    expect(proj.screenX).toBeCloseTo(cx);
    
    // The rotated z depth should be close to 100
    expect(proj.zDepth).toBeCloseTo(100);
  });

  test('90 degree pitch (around X-axis) rotates Y-coordinate to Z-coordinate', () => {
    const pt = { x: 0, y: 100, z: 0 };
    // Rotate X by 90 degrees (Math.PI / 2)
    const proj = project3D(pt, Math.PI / 2, 0, 1.0, 0, 0, screenWidth, screenHeight, baseRadius);

    // Projected screenY should be exactly screen center
    expect(proj.screenY).toBeCloseTo(cy);
    expect(proj.zDepth).toBeCloseTo(100);
  });

  test('clips/culls nodes that pass behind the camera', () => {
    // If a node is placed extremely close to the camera (e.g. z = 900)
    // cameraZ = 900 / 1.0 = 900. denominator = cameraZ - z = 900 - 900 = 0.
    // Near clipping plane blocks it.
    const pt = { x: 0, y: 0, z: 890 }; // Extremely close
    const proj = project3D(pt, 0, 0, 1.0, 0, 0, screenWidth, screenHeight, baseRadius);

    expect(proj.visible).toBe(false);
    expect(proj.radius).toBe(0);
    expect(proj.alpha).toBe(0);
  });

  test('performs viewport boundary culling correctly', () => {
    // Point is placed extremely far to the side (e.g., x = 2000)
    const pt = { x: 2000, y: 0, z: 0 };
    const proj = project3D(pt, 0, 0, 1.0, 0, 0, screenWidth, screenHeight, baseRadius);

    // Circle is way off screen, visible should be false
    expect(proj.visible).toBe(false);
  });

  test('depth scaling scales size and alpha correctly', () => {
    // Point A is closer (z = 200)
    // Point B is farther (z = -200)
    const ptA = { x: 0, y: 0, z: 200 };
    const ptB = { x: 0, y: 0, z: -200 };

    const projA = project3D(ptA, 0, 0, 1.0, 0, 0, screenWidth, screenHeight, baseRadius);
    const projB = project3D(ptB, 0, 0, 1.0, 0, 0, screenWidth, screenHeight, baseRadius);

    // Near node has larger radius and higher opacity
    expect(projA.radius).toBeGreaterThan(projB.radius);
    expect(projA.alpha).toBeGreaterThan(projB.alpha);
  });
});
