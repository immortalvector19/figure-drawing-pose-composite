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

  it('exports true 3D cylinder and 3D perspective box geometry in SVG', () => {
    const testShapes = [
      {
        id: 'cyl-1',
        type: 'cylinder' as const,
        bodyPart: 'arms' as const,
        name: 'Right Upper Arm Cylinder',
        x: 200,
        y: 300,
        width: 60,
        height: 140,
        rotation: 15,
        depthZ: -0.1,
        strokeColor: '#38bdf8',
        strokeWidth: 4,
        fillColor: '#0284c7',
        fillOpacity: 0.3,
        isUserCreated: true,
        isVisible: true,
      },
      {
        id: 'box-1',
        type: 'box' as const,
        bodyPart: 'torso' as const,
        name: 'Thorax Box Form',
        x: 400,
        y: 400,
        width: 120,
        height: 160,
        rotation: 0,
        depthZ: 0,
        strokeColor: '#f43f5e',
        strokeWidth: 4,
        fillColor: '#e11d48',
        fillOpacity: 0.25,
        isUserCreated: true,
        isVisible: true,
      },
    ];

    const svg = generateSvgString(testShapes, 800, 1000);

    // Cylinder: body rect, bottom base ellipse, top rim cap ellipse, lateral edges, and cross-contour
    expect(svg).toContain('data-name="Right Upper Arm Cylinder"');
    expect(svg).toContain('stroke="none"'); // Cylinder body fill
    expect(svg).toContain('stroke-dasharray="5,4"'); // Mid cross-contour
    expect(svg).toContain('<ellipse cx="200" cy="357.4" rx="30" ry="12.6"'); // Bottom base
    expect(svg).toContain('<ellipse cx="200" cy="242.6" rx="30" ry="12.6"'); // Top rim cap
    expect(svg).toContain('<line x1="170" y1="242.6" x2="170" y2="357.4"'); // Left lateral edge
    expect(svg).toContain('<line x1="230" y1="242.6" x2="230" y2="357.4"'); // Right lateral edge

    // Box: top facet polygon, side facet polygon, front rect face
    expect(svg).toContain('data-name="Thorax Box Form"');
    expect(svg).toContain('<polygon points="340,320'); // Top facet
    expect(svg).toContain('<polygon points="460,320'); // Side facet
    expect(svg).toContain('<rect x="340" y="320" width="120" height="160"'); // Front face
  });
});
