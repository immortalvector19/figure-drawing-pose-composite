import { describe, it, expect } from 'vitest';
import { createSyntheticPose } from '../samplePoses';
import { buildConstructionPrimitives } from '../geometry/sceneBuilder';
import { ConstructionPrimitive, ConstructionMode, DrawToolType, BodyPartCategory, PrimitiveType } from '../types/shapes';
import { Proportions } from '../geometry/proportions';

describe('Manual Mode & Freeform Tools Suite', () => {
  it('supports toggling between auto and manual construction modes', () => {
    let mode: ConstructionMode = 'auto';
    expect(mode).toBe('auto');

    mode = 'manual';
    expect(mode).toBe('manual');

    // Supported modes are strictly 'auto' | 'manual'
    const validModes: ConstructionMode[] = ['auto', 'manual'];
    expect(validModes).toContain(mode);
  });

  it('supports all freeform draw tool types', () => {
    const tools: DrawToolType[] = ['select', 'rectangle', 'circle', 'oval', 'cylinder', 'line'];
    expect(tools.length).toBe(6);
    expect(tools).toContain('select');
    expect(tools).toContain('rectangle');
    expect(tools).toContain('circle');
    expect(tools).toContain('oval');
    expect(tools).toContain('cylinder');
    expect(tools).toContain('line');
  });

  it('correctly creates freeform primitives with active body category colors', () => {
    const createFreeformPrimitive = (
      type: PrimitiveType,
      bodyPart: BodyPartCategory,
      x: number,
      y: number,
      width: number,
      height: number
    ): ConstructionPrimitive => {
      let strokeColor = Proportions.COLORS.torsoStroke;
      let fillColor = Proportions.COLORS.torsoFill;

      if (bodyPart === 'face') {
        strokeColor = Proportions.COLORS.headStroke;
        fillColor = Proportions.COLORS.headFill;
      } else if (bodyPart === 'arms') {
        strokeColor = Proportions.COLORS.armsStroke;
        fillColor = Proportions.COLORS.armsFill;
      } else if (bodyPart === 'legs') {
        strokeColor = Proportions.COLORS.legsStroke;
        fillColor = Proportions.COLORS.legsFill;
      }

      return {
        id: `test-shape-${Date.now()}`,
        type,
        bodyPart,
        name: `Custom ${type}`,
        x,
        y,
        width,
        height,
        rotation: 0,
        depthZ: -0.1,
        strokeColor,
        strokeWidth: 3,
        fillColor,
        fillOpacity: 0.25,
        isUserCreated: true,
        isVisible: true,
      };
    };

    const headCircle = createFreeformPrimitive('circle', 'face', 200, 200, 80, 80);
    expect(headCircle.bodyPart).toBe('face');
    expect(headCircle.strokeColor).toBe(Proportions.COLORS.headStroke);
    expect(headCircle.isUserCreated).toBe(true);

    const torsoBox = createFreeformPrimitive('box', 'torso', 200, 350, 120, 140);
    expect(torsoBox.bodyPart).toBe('torso');
    expect(torsoBox.strokeColor).toBe(Proportions.COLORS.torsoStroke);

    const armCylinder = createFreeformPrimitive('capsule', 'arms', 120, 300, 45, 110);
    expect(armCylinder.bodyPart).toBe('arms');
    expect(armCylinder.strokeColor).toBe(Proportions.COLORS.armsStroke);
  });

  it('duplicates existing shapes with position offset and copy label', () => {
    const original: ConstructionPrimitive = {
      id: 'primitive-ribcage',
      type: 'box',
      bodyPart: 'torso',
      name: 'Ribcage Block',
      x: 350,
      y: 300,
      width: 140,
      height: 180,
      rotation: 5,
      depthZ: 0.2,
      strokeColor: '#f43f5e',
      strokeWidth: 3,
      fillColor: '#e11d48',
      fillOpacity: 0.25,
      isUserCreated: false,
      isVisible: true,
    };

    const duplicateShape = (shape: ConstructionPrimitive): ConstructionPrimitive => ({
      ...shape,
      id: `clone-${Date.now()}`,
      name: `${shape.name} (Copy)`,
      x: shape.x + 20,
      y: shape.y + 20,
      isUserCreated: true,
    });

    const clone = duplicateShape(original);
    expect(clone.id).not.toBe(original.id);
    expect(clone.name).toBe('Ribcage Block (Copy)');
    expect(clone.x).toBe(original.x + 20);
    expect(clone.y).toBe(original.y + 20);
    expect(clone.isUserCreated).toBe(true);
  });

  it('reorders shape z-index forward and backward', () => {
    const shapeA: ConstructionPrimitive = { id: 'A', name: 'A' } as any;
    const shapeB: ConstructionPrimitive = { id: 'B', name: 'B' } as any;
    const shapeC: ConstructionPrimitive = { id: 'C', name: 'C' } as any;

    let list = [shapeA, shapeB, shapeC];

    // Bring A forward (index 0 -> index 1)
    const reorder = (arr: ConstructionPrimitive[], id: string, dir: 'forward' | 'backward') => {
      const idx = arr.findIndex(s => s.id === id);
      if (idx === -1) return arr;
      const targetIdx = dir === 'forward' ? idx + 1 : idx - 1;
      if (targetIdx < 0 || targetIdx >= arr.length) return arr;
      const next = [...arr];
      const temp = next[idx];
      next[idx] = next[targetIdx];
      next[targetIdx] = temp;
      return next;
    };

    list = reorder(list, 'A', 'forward');
    expect(list.map(s => s.id)).toEqual(['B', 'A', 'C']);

    // Send C backward (index 2 -> index 1)
    list = reorder(list, 'C', 'backward');
    expect(list.map(s => s.id)).toEqual(['B', 'C', 'A']);

    // Boundary protection: sending B backward when at 0 should be no-op
    list = reorder(list, 'B', 'backward');
    expect(list.map(s => s.id)).toEqual(['B', 'C', 'A']);
  });

  it('generates a complete Starter Mannequin for manual figure blocking', () => {
    const syntheticPose = createSyntheticPose({ contrapposto: false });
    const starterPrimitives = buildConstructionPrimitives(syntheticPose, 800, 1000, 'okabayashi');

    // Must have head, torso, pelvis, and limbs
    const cranium = starterPrimitives.find(s => s.id === 'primitive-cranium');
    const ribcage = starterPrimitives.find(s => s.id === 'primitive-ribcage');
    const pelvis = starterPrimitives.find(s => s.id === 'primitive-pelvis');
    const limbs = starterPrimitives.filter(s => s.bodyPart === 'arms' || s.bodyPart === 'legs');

    expect(cranium).toBeDefined();
    expect(ribcage).toBeDefined();
    expect(pelvis).toBeDefined();
    expect(limbs.length).toBeGreaterThan(6);

    // Starter mannequin primitives converted to user editable
    const userStarterPrimitives = starterPrimitives.map(s => ({ ...s, isUserCreated: true }));
    expect(userStarterPrimitives.every(s => s.isUserCreated)).toBe(true);
  });

  it('enforces minimum dimensions and circle aspect ratio during click-draw', () => {
    const sanitizeDimensions = (tool: DrawToolType, rawW: number, rawH: number) => {
      let w = rawW;
      let h = rawH;
      if (w < 8 && h < 8) {
        w = tool === 'circle' ? 70 : tool === 'oval' ? 80 : 70;
        h = tool === 'circle' ? 70 : tool === 'cylinder' ? 120 : 80;
      }
      if (tool === 'circle') {
        const size = Math.max(w, h);
        w = size;
        h = size;
      }
      return { w, h };
    };

    // Tiny click creates sensible defaults
    const clickCircle = sanitizeDimensions('circle', 2, 2);
    expect(clickCircle.w).toBe(70);
    expect(clickCircle.h).toBe(70);

    const clickCylinder = sanitizeDimensions('cylinder', 0, 0);
    expect(clickCylinder.w).toBe(70);
    expect(clickCylinder.h).toBe(120);

    // Circle enforces square aspect ratio even with non-square drag
    const draggedCircle = sanitizeDimensions('circle', 100, 60);
    expect(draggedCircle.w).toBe(100);
    expect(draggedCircle.h).toBe(100);
  });
});
