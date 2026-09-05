import { useState, useCallback } from 'react';
import { ConstructionPrimitive, PrimitiveType, BodyPartCategory, ConstructionStyle } from '../types/shapes';
import { Proportions } from '../geometry/proportions';
import { createSyntheticPose } from '../samplePoses';
import { buildConstructionPrimitives } from '../geometry/sceneBuilder';

export interface ShapeStoreState {
  shapes: ConstructionPrimitive[];
  autoDetectedShapes: ConstructionPrimitive[];
  selectedShapeId: string | null;
  canUndo: boolean;
  canRedo: boolean;
}

export function useShapeStore() {
  const [shapes, setShapes] = useState<ConstructionPrimitive[]>([]);
  const [autoDetectedShapes, setAutoDetectedShapes] = useState<ConstructionPrimitive[]>([]);
  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);
  const [history, setHistory] = useState<ConstructionPrimitive[][]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  const pushHistory = useCallback((newShapes: ConstructionPrimitive[]) => {
    setHistory(prev => {
      const next = prev.slice(0, historyIndex + 1);
      return [...next, newShapes];
    });
    setHistoryIndex(prev => prev + 1);
  }, [historyIndex]);

  const setInitialShapes = useCallback((newShapes: ConstructionPrimitive[]) => {
    setAutoDetectedShapes(newShapes.map(s => ({ ...s })));
    setShapes(newShapes);
    setSelectedShapeId(null);
    setHistory([newShapes]);
    setHistoryIndex(0);
  }, []);

  const updateShape = useCallback((id: string, patch: Partial<ConstructionPrimitive>) => {
    setShapes(prev => {
      const updated = prev.map(shape => {
        if (shape.id === id) {
          return { ...shape, ...patch, isUserCreated: shape.isUserCreated || Object.keys(patch).some(k => k !== 'isVisible') };
        }
        return shape;
      });
      pushHistory(updated);
      return updated;
    });
  }, [pushHistory]);

  const selectShape = useCallback((id: string | null) => {
    setSelectedShapeId(id);
  }, []);

  const deleteShape = useCallback((id: string) => {
    setShapes(prev => {
      const filtered = prev.filter(shape => shape.id !== id);
      pushHistory(filtered);
      return filtered;
    });
    setSelectedShapeId(curr => (curr === id ? null : curr));
  }, [pushHistory]);

  const addPrimitive = useCallback((
    type: PrimitiveType,
    bodyPart: BodyPartCategory = 'torso',
    options?: { x?: number; y?: number; width?: number; height?: number }
  ) => {
    const newId = `user-shape-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const x = options?.x ?? 200;
    const y = options?.y ?? 200;
    const width = options?.width ?? (type === 'circle' ? 70 : type === 'oval' ? 80 : 60);
    const height = options?.height ?? (type === 'circle' ? 70 : type === 'capsule' ? 120 : 90);

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

    const newShape: ConstructionPrimitive = {
      id: newId,
      type,
      bodyPart,
      name: `Custom ${type.charAt(0).toUpperCase() + type.slice(1)}`,
      x,
      y,
      width,
      height,
      rotation: 0,
      depthZ: -0.1, // bring to front
      strokeColor,
      strokeWidth: 2.5,
      fillColor,
      fillOpacity: 0.2,
      isUserCreated: true,
      isVisible: true,
    };

    setShapes(prev => {
      const updated = [...prev, newShape];
      pushHistory(updated);
      return updated;
    });
    setSelectedShapeId(newId);
    return newId;
  }, [pushHistory]);

  const addCustomShape = useCallback((newShape: ConstructionPrimitive) => {
    setShapes(prev => {
      const updated = [...prev, newShape];
      pushHistory(updated);
      return updated;
    });
    setSelectedShapeId(newShape.id);
    return newShape.id;
  }, [pushHistory]);

  const clearShapes = useCallback(() => {
    setShapes([]);
    setSelectedShapeId(null);
    pushHistory([]);
  }, [pushHistory]);

  const duplicateShape = useCallback((id: string) => {
    let newId: string | null = null;
    setShapes(prev => {
      const target = prev.find(s => s.id === id);
      if (!target) return prev;
      newId = `user-shape-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const clone: ConstructionPrimitive = {
        ...target,
        id: newId,
        name: `${target.name} (Copy)`,
        x: target.x + 20,
        y: target.y + 20,
        isUserCreated: true,
      };
      const next = [...prev, clone];
      pushHistory(next);
      return next;
    });
    if (newId) setSelectedShapeId(newId);
    return newId;
  }, [pushHistory]);

  const reorderShape = useCallback((id: string, direction: 'forward' | 'backward') => {
    setShapes(prev => {
      const index = prev.findIndex(s => s.id === id);
      if (index === -1) return prev;
      const targetIndex = direction === 'forward' ? index + 1 : index - 1;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;
      const next = [...prev];
      const temp = next[index];
      next[index] = next[targetIndex];
      next[targetIndex] = temp;
      pushHistory(next);
      return next;
    });
  }, [pushHistory]);

  const loadStarterMannequin = useCallback((
    imageWidth: number,
    imageHeight: number,
    style: ConstructionStyle = 'okabayashi'
  ) => {
    const syntheticPose = createSyntheticPose({ contrapposto: false });
    const starterPrimitives = buildConstructionPrimitives(syntheticPose, imageWidth, imageHeight, style);
    const userPrimitives = starterPrimitives.map(s => ({ ...s, isUserCreated: true }));
    setShapes(userPrimitives);
    setSelectedShapeId(null);
    pushHistory(userPrimitives);
  }, [pushHistory]);

  const resetToAutoDetected = useCallback(() => {
    if (autoDetectedShapes.length === 0) return;
    const restored = autoDetectedShapes.map(s => ({ ...s }));
    setShapes(restored);
    setSelectedShapeId(null);
    pushHistory(restored);
  }, [autoDetectedShapes, pushHistory]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const targetIndex = historyIndex - 1;
      const targetShapes = history[targetIndex];
      setShapes(targetShapes);
      setHistoryIndex(targetIndex);
    }
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const targetIndex = historyIndex + 1;
      const targetShapes = history[targetIndex];
      setShapes(targetShapes);
      setHistoryIndex(targetIndex);
    }
  }, [history, historyIndex]);

  return {
    shapes,
    autoDetectedShapes,
    selectedShapeId,
    canUndo: historyIndex > 0,
    canRedo: historyIndex < history.length - 1,
    setInitialShapes,
    updateShape,
    selectShape,
    deleteShape,
    addPrimitive,
    addCustomShape,
    clearShapes,
    duplicateShape,
    reorderShape,
    loadStarterMannequin,
    resetToAutoDetected,
    undo,
    redo,
  };
}
