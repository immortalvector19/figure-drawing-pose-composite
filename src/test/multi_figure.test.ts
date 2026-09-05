import { describe, it, expect } from 'vitest';
import { createMultiFigureSyntheticPose, createSyntheticPose } from '../samplePoses';
import { buildConstructionPrimitives } from '../geometry/sceneBuilder';
import { generateSvgString } from '../export/svgExporter';

describe('Multi-Figure Pose Detection & Mannequin Generation Suite', () => {
  it('generates multi-figure synthetic pose dataset with two distinct figures', () => {
    const multiPose = createMultiFigureSyntheticPose();

    expect(multiPose.totalPosesDetected).toBe(2);
    expect(multiPose.allPoses).toBeDefined();
    expect(multiPose.allPoses?.length).toBe(2);

    const fig1 = multiPose.allPoses![0];
    const fig2 = multiPose.allPoses![1];

    expect(fig1.landmarks.length).toBe(33);
    expect(fig2.landmarks.length).toBe(33);
    expect(fig1.worldLandmarks.length).toBe(33);
    expect(fig2.worldLandmarks.length).toBe(33);

    // Assert that figures are horizontally separated across the canvas
    const fig1NoseX = fig1.landmarks[0].x;
    const fig2NoseX = fig2.landmarks[0].x;
    expect(fig1NoseX).toBeLessThan(fig2NoseX);
    expect(fig2NoseX - fig1NoseX).toBeGreaterThan(0.2);
  });

  it('generates independent, non-colliding construction primitives for every detected figure', () => {
    const multiPose = createMultiFigureSyntheticPose();
    const shapes = buildConstructionPrimitives(multiPose, 1000, 1000, 'okabayashi');

    expect(shapes.length).toBeGreaterThan(30); // ~18 primitives per figure * 2

    // All IDs must be unique
    const idSet = new Set(shapes.map(s => s.id));
    expect(idSet.size).toBe(shapes.length);

    // Primitives for Figure 1 must have fig1 prefix and naming
    const fig1Shapes = shapes.filter(s => s.id.startsWith('fig1-'));
    expect(fig1Shapes.length).toBeGreaterThan(12);
    expect(fig1Shapes.every(s => s.name.startsWith('Figure 1:'))).toBe(true);

    // Primitives for Figure 2 must have fig2 prefix and naming
    const fig2Shapes = shapes.filter(s => s.id.startsWith('fig2-'));
    expect(fig2Shapes.length).toBeGreaterThan(12);
    expect(fig2Shapes.every(s => s.name.startsWith('Figure 2:'))).toBe(true);

    // Both figures must contain vital construction forms
    expect(fig1Shapes.some(s => s.name.includes('Cranium'))).toBe(true);
    expect(fig2Shapes.some(s => s.name.includes('Cranium'))).toBe(true);
    expect(fig1Shapes.some(s => s.name.includes('Ribcage'))).toBe(true);
    expect(fig2Shapes.some(s => s.name.includes('Ribcage'))).toBe(true);
    expect(fig1Shapes.some(s => s.name.includes('Pelvis'))).toBe(true);
    expect(fig2Shapes.some(s => s.name.includes('Pelvis'))).toBe(true);
  });

  it('exports valid multi-figure SVG with all figures layered', () => {
    const multiPose = createMultiFigureSyntheticPose();
    const shapes = buildConstructionPrimitives(multiPose, 1000, 1000, 'okabayashi');
    const svg = generateSvgString(shapes, 1000, 1000);

    expect(svg).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(svg).toContain('data-name="Figure 1: Cranium (Loomis Sphere)"');
    expect(svg).toContain('data-name="Figure 2: Cranium (Loomis Sphere)"');
    expect(svg).toContain('data-name="Figure 1: Pelvis (Pelvic Block)"');
    expect(svg).toContain('data-name="Figure 2: Pelvis (Pelvic Block)"');
  });

  it('preserves clean single-figure naming and IDs when only one figure is detected', () => {
    const singlePose = createSyntheticPose();
    const shapes = buildConstructionPrimitives(singlePose, 800, 1000, 'okabayashi');

    // Standard single-pose IDs do not have fig prefix
    expect(shapes.some(s => s.id === 'primitive-cranium')).toBe(true);
    expect(shapes.some(s => s.id === 'primitive-ribcage')).toBe(true);
    expect(shapes.every(s => !s.id.startsWith('fig1-'))).toBe(true);
    expect(shapes.every(s => !s.name.startsWith('Figure 1:'))).toBe(true);
  });
});
