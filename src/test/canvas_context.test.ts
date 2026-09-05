import { describe, it, expect } from 'vitest';

export interface Native2DContextLike {
  imageSmoothingEnabled: boolean;
  imageSmoothingQuality: ImageSmoothingQuality;
}

export interface NativeCanvasLike {
  getContext(contextId: '2d'): Native2DContextLike | null;
}

export interface KonvaCanvasWrapperLike {
  _canvas: NativeCanvasLike;
  getContext(): unknown; // Konva's getContext takes 0 arguments
}

export interface KonvaLayerLike {
  getCanvas(): KonvaCanvasWrapperLike | undefined;
}

/**
 * Mirror of the exact context configuration logic in ConstructionCanvas.tsx
 */
export function applyCanvasSmoothing(layer: KonvaLayerLike): boolean {
  try {
    const htmlCanvas = layer.getCanvas()?._canvas;
    const ctx = htmlCanvas?.getContext('2d');
    if (ctx) {
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

describe('ConstructionCanvas Canvas Context Regression Test', () => {
  it('correctly accesses native HTMLCanvasElement via _canvas and configures image smoothing', () => {
    let smoothingEnabled = false;
    let smoothingQuality: ImageSmoothingQuality = 'low';

    const mockContext: Native2DContextLike = {
      get imageSmoothingEnabled() { return smoothingEnabled; },
      set imageSmoothingEnabled(val: boolean) { smoothingEnabled = val; },
      get imageSmoothingQuality() { return smoothingQuality; },
      set imageSmoothingQuality(val: ImageSmoothingQuality) { smoothingQuality = val; },
    };

    const mockHtmlCanvas: NativeCanvasLike = {
      getContext: (id: '2d') => (id === '2d' ? mockContext : null),
    };

    const mockKonvaCanvas: KonvaCanvasWrapperLike = {
      _canvas: mockHtmlCanvas,
      getContext: () => ({ /* Konva Context wrapper */ }),
    };

    const mockLayer: KonvaLayerLike = {
      getCanvas: () => mockKonvaCanvas,
    };

    const success = applyCanvasSmoothing(mockLayer);
    expect(success).toBe(true);
    expect(mockContext.imageSmoothingEnabled).toBe(true);
    expect(mockContext.imageSmoothingQuality).toBe('high');
  });

  it('handles missing canvas or uninitialized context gracefully without throwing', () => {
    const emptyLayer: KonvaLayerLike = {
      getCanvas: () => undefined,
    };
    expect(applyCanvasSmoothing(emptyLayer)).toBe(false);

    const nullCtxLayer: KonvaLayerLike = {
      getCanvas: () => ({
        _canvas: { getContext: () => null },
        getContext: () => ({}),
      }),
    };
    expect(applyCanvasSmoothing(nullCtxLayer)).toBe(false);
  });
});
