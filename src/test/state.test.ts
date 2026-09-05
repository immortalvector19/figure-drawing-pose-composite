import { describe, it, expect } from 'vitest';
import { createSyntheticPose } from '../samplePoses';
import { buildConstructionPrimitives } from '../geometry/sceneBuilder';
import { ConstructionPrimitive } from '../types/shapes';

describe('Shape State Management & Persistence', () => {
  it('preserves manual modifications without losing state', () => {
    const pose = createSyntheticPose();
    const primitives = buildConstructionPrimitives(pose, 800, 1000);

    // Initial state
    let shapes = [...primitives];
    const initialCranium = shapes.find(s => s.id === 'primitive-cranium')!;
    expect(initialCranium.isUserCreated).toBe(false);

    // Simulate user moving and rotating the cranium
    const updatedCranium: ConstructionPrimitive = {
      ...initialCranium,
      x: initialCranium.x + 50,
      y: initialCranium.y - 30,
      rotation: 45,
      isUserCreated: true,
    };

    shapes = shapes.map(s => s.id === updatedCranium.id ? updatedCranium : s);

    const retrieved = shapes.find(s => s.id === 'primitive-cranium')!;
    expect(retrieved.x).toBe(initialCranium.x + 50);
    expect(retrieved.rotation).toBe(45);
    expect(retrieved.isUserCreated).toBe(true);
  });

  it('allows adding manual custom primitives', () => {
    const pose = createSyntheticPose();
    const shapes = buildConstructionPrimitives(pose, 800, 1000);

    const customOval: ConstructionPrimitive = {
      id: 'custom-user-oval-1',
      type: 'oval',
      bodyPart: 'torso',
      name: 'Custom Oval',
      x: 300,
      y: 400,
      width: 100,
      height: 120,
      rotation: 15,
      depthZ: -0.1,
      strokeColor: '#38bdf8',
      strokeWidth: 2,
      fillColor: '#0284c7',
      fillOpacity: 0.2,
      isUserCreated: true,
      isVisible: true,
    };

    const nextShapes = [...shapes, customOval];
    expect(nextShapes.length).toBe(shapes.length + 1);
    expect(nextShapes.find(s => s.id === 'custom-user-oval-1')).toBeDefined();
  });

  it('allows deleting any shape', () => {
    const pose = createSyntheticPose();
    const shapes = buildConstructionPrimitives(pose, 800, 1000);
    const targetId = shapes[0].id;

    const remaining = shapes.filter(s => s.id !== targetId);
    expect(remaining.length).toBe(shapes.length - 1);
    expect(remaining.find(s => s.id === targetId)).toBeUndefined();
  });

  it('resets to auto-detected baseline without losing initial geometry', () => {
    const pose = createSyntheticPose();
    const autoDetected = buildConstructionPrimitives(pose, 800, 1000);
    
    // Mutate
    let current = autoDetected.filter((_, i) => i !== 0);
    expect(current.length).toBe(autoDetected.length - 1);

    // Reset
    current = autoDetected.map(s => ({ ...s }));
    expect(current.length).toBe(autoDetected.length);
    expect(current[0].id).toBe(autoDetected[0].id);
  });
});
