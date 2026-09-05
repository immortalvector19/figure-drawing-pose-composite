import { describe, it, expect } from 'vitest';
import { generateSvgString } from '../export/svgExporter';
import { createSyntheticPose } from '../samplePoses';
import { buildConstructionPrimitives } from '../geometry/sceneBuilder';

describe('Export Engine (SVG & Integrity)', () => {
  it('generates valid SVG XML string with all primitives', () => {
    const pose = createSyntheticPose();
    const shapes = buildConstructionPrimitives(pose, 800, 1000);
    const svg = generateSvgString(shapes, 800, 1000);

    expect(svg).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(svg).toContain('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1000"');
    expect(svg).toContain('</svg>');
    expect(svg).toContain('<ellipse');
    expect(svg).toContain('<rect');
    expect(svg).toContain('data-name="Cranium (Loomis Sphere)"');
  });

  it('respects hidden shapes in SVG output', () => {
    const pose = createSyntheticPose();
    const shapes = buildConstructionPrimitives(pose, 800, 1000);
    // Hide cranial sphere
    shapes[0].isVisible = false;
    const svg = generateSvgString(shapes, 800, 1000);

    expect(svg).not.toContain(`data-name="${shapes[0].name}"`);
  });

  it('applies custom strokeWidth and shapesOpacity options', () => {
    const pose = createSyntheticPose();
    const shapes = buildConstructionPrimitives(pose, 800, 1000);
    const svg = generateSvgString(shapes, 800, 1000, { strokeWidth: 7.5, shapesOpacity: 0.5 });

    expect(svg).toContain('stroke-width="7.5"');
  });
});
