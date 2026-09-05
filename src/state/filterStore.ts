import { useState, useCallback } from 'react';
import { BodyPartCategory, BodyPartVisibilityMap, ConstructionStyle, ConstructionMode, DrawToolType } from '../types/shapes';

export function useFilterStore() {
  const [visibility, setVisibility] = useState<BodyPartVisibilityMap>({
    face: true,
    torso: true,
    arms: true,
    legs: true,
    hands: true,
    feet: true,
  });

  const [constructionMode, setConstructionMode] = useState<ConstructionMode>('auto');
  const [activeDrawTool, setActiveDrawTool] = useState<DrawToolType>('select');
  const [activeBodyPart, setActiveBodyPart] = useState<BodyPartCategory>('torso');
  const [shapesOpacity, setShapesOpacity] = useState<number>(0.90);
  const [imageOpacity, setImageOpacity] = useState<number>(1.0);
  const [strokeWidth, setStrokeWidth] = useState<number>(5.0);
  const [constructionStyle, setConstructionStyle] = useState<ConstructionStyle>('okabayashi');
  const [showCrossContours, setShowCrossContours] = useState<boolean>(true);
  const [showLineOfAction, setShowLineOfAction] = useState<boolean>(true);
  const [show8HeadGrid, setShow8HeadGrid] = useState<boolean>(false);
  const [showPlumbLine, setShowPlumbLine] = useState<boolean>(false);

  // Backwards compatibility alias for tests/components expecting opacity
  const opacity = shapesOpacity;
  const setOpacity = setShapesOpacity;

  const isAllVisible = Object.values(visibility).every(v => v);

  const togglePart = useCallback((part: BodyPartCategory) => {
    setVisibility(prev => ({
      ...prev,
      [part]: !prev[part],
    }));
  }, []);

  const selectAll = useCallback(() => {
    setVisibility({
      face: true,
      torso: true,
      arms: true,
      legs: true,
      hands: true,
      feet: true,
    });
  }, []);

  const isolatePart = useCallback((part: BodyPartCategory) => {
    setVisibility({
      face: part === 'face',
      torso: part === 'torso',
      arms: part === 'arms',
      legs: part === 'legs',
      hands: part === 'hands',
      feet: part === 'feet',
    });
  }, []);

  return {
    visibility,
    opacity,
    shapesOpacity,
    imageOpacity,
    strokeWidth,
    constructionStyle,
    showCrossContours,
    showLineOfAction,
    show8HeadGrid,
    isAllVisible,
    togglePart,
    selectAll,
    isolatePart,
    setOpacity,
    setShapesOpacity,
    setImageOpacity,
    setStrokeWidth,
    setConstructionStyle,
    setShowCrossContours,
    setShowLineOfAction,
    setShow8HeadGrid,
    constructionMode,
    setConstructionMode,
    activeDrawTool,
    setActiveDrawTool,
    activeBodyPart,
    setActiveBodyPart,
    showPlumbLine,
    setShowPlumbLine,
  };
}
