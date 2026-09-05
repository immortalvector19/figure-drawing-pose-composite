import { describe, it, expect } from 'vitest';
import { createSyntheticPose } from '../samplePoses';
import { buildConstructionPrimitives } from '../geometry/sceneBuilder';
import { generateSvgString } from '../export/svgExporter';

describe('Performance Benchmark & SLA Verification', () => {
  it('executes full 3D primitive fitting pipeline in < 15ms', () => {
    const pose = createSyntheticPose({ contrapposto: true, foreshortenedArm: true });

    const startTime = performance.now();
    const iterations = 50;

    for (let i = 0; i < iterations; i++) {
      const primitives = buildConstructionPrimitives(pose, 800, 1000);
      expect(primitives.length).toBeGreaterThan(10);
    }

    const elapsed = performance.now() - startTime;
    const avgPerIteration = elapsed / iterations;

    // Must be well within SLA (target < 10ms per frame, acceptable < 25ms)
    expect(avgPerIteration).toBeLessThan(15);
  });

  it('serializes SVG in < 15ms', () => {
    const pose = createSyntheticPose();
    const primitives = buildConstructionPrimitives(pose, 800, 1000);

    // Warmup JIT
    generateSvgString(primitives, 800, 1000);

    const startTime = performance.now();
    const svg = generateSvgString(primitives, 800, 1000);
    const elapsed = performance.now() - startTime;

    expect(svg.length).toBeGreaterThan(100);
    expect(elapsed).toBeLessThan(15);
  });
});
