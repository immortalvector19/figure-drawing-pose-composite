import React, { useRef } from 'react';
import { Rect, Ellipse, Circle, Line, Group } from 'react-konva';
import Konva from 'konva';
import { ConstructionPrimitive } from '../types/shapes';

interface CanvasShapeItemProps {
  shape: ConstructionPrimitive;
  isSelected: boolean;
  opacity: number;
  strokeWidth?: number;
  onSelect: (id: string) => void;
  onChange: (id: string, newAttrs: Partial<ConstructionPrimitive>) => void;
}

export function hexToRgba(hex: string, alpha: number): string {
  if (!hex || hex === 'transparent') return 'transparent';
  if (hex.startsWith('rgb')) return hex;
  const cleanHex = hex.replace('#', '');
  if (cleanHex.length === 3) {
    const r = parseInt(cleanHex[0] + cleanHex[0], 16);
    const g = parseInt(cleanHex[1] + cleanHex[1], 16);
    const b = parseInt(cleanHex[2] + cleanHex[2], 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  if (cleanHex.length === 6) {
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return hex;
}

export const CanvasShapeItem: React.FC<CanvasShapeItemProps> = ({
  shape,
  isSelected,
  opacity,
  strokeWidth: customStrokeWidth,
  onSelect,
  onChange,
}) => {
  const shapeRef = useRef<Konva.Group | null>(null);

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    onChange(shape.id, {
      x: e.target.x(),
      y: e.target.y(),
    });
  };

  const handleTransformEnd = () => {
    const node = shapeRef.current;
    if (!node) return;

    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    node.scaleX(1);
    node.scaleY(1);

    onChange(shape.id, {
      x: node.x(),
      y: node.y(),
      width: Math.max(10, shape.width * scaleX),
      height: Math.max(10, shape.height * scaleY),
      rotation: node.rotation(),
    });
  };

  if (!shape.isVisible) return null;

  const stroke = shape.strokeColor;
  const baseStroke = customStrokeWidth ?? shape.strokeWidth ?? 5.0;
  const effectiveStrokeWidth = isSelected ? baseStroke + 2.5 : baseStroke;
  // Richer fill volume
  const effectiveFillAlpha = Math.min(0.65, shape.fillOpacity * 1.3);
  const fillColor = hexToRgba(shape.fillColor, effectiveFillAlpha);

  const renderShapeContent = () => {
    switch (shape.type) {
      case 'oval':
        return (
          <Ellipse
            radiusX={shape.width / 2}
            radiusY={shape.height / 2}
            fill={fillColor}
            stroke={stroke}
            strokeWidth={effectiveStrokeWidth}
            strokeScaleEnabled={false}
            shadowColor={isSelected ? stroke : '#000000'}
            shadowBlur={isSelected ? 14 : 5}
            shadowOpacity={isSelected ? 0.95 : 0.65}
          />
        );

      case 'circle':
        return (
          <Circle
            radius={shape.width / 2}
            fill={fillColor}
            stroke={stroke}
            strokeWidth={effectiveStrokeWidth}
            strokeScaleEnabled={false}
            shadowColor={isSelected ? stroke : '#000000'}
            shadowBlur={isSelected ? 14 : 5}
            shadowOpacity={isSelected ? 0.95 : 0.65}
          />
        );

      case 'box':
        return (
          <Rect
            x={-shape.width / 2}
            y={-shape.height / 2}
            width={shape.width}
            height={shape.height}
            cornerRadius={6}
            fill={fillColor}
            stroke={stroke}
            strokeWidth={effectiveStrokeWidth}
            strokeScaleEnabled={false}
            shadowColor={isSelected ? stroke : '#000000'}
            shadowBlur={isSelected ? 14 : 5}
            shadowOpacity={isSelected ? 0.95 : 0.65}
          />
        );

      case 'capsule':
        return (
          <Rect
            x={-shape.width / 2}
            y={-shape.height / 2}
            width={shape.width}
            height={shape.height}
            cornerRadius={shape.width / 2}
            fill={fillColor}
            stroke={stroke}
            strokeWidth={effectiveStrokeWidth}
            strokeScaleEnabled={false}
            shadowColor={isSelected ? stroke : '#000000'}
            shadowBlur={isSelected ? 14 : 5}
            shadowOpacity={isSelected ? 0.95 : 0.65}
          />
        );

      case 'cross_contour':
        return (
          <Ellipse
            radiusX={shape.width / 2}
            radiusY={shape.height / 2}
            stroke={stroke}
            strokeWidth={Math.max(3.0, baseStroke * 0.7)}
            strokeScaleEnabled={false}
            dash={[6, 6]}
            shadowColor="#000000"
            shadowBlur={3}
            shadowOpacity={0.6}
          />
        );

      case 'line_of_action':
        if (!shape.points || shape.points.length < 4) return null;
        return (
          <Line
            points={shape.points.map((pt, i) => (i % 2 === 0 ? pt - shape.x : pt - shape.y))}
            stroke={stroke}
            strokeWidth={Math.max(5.5, baseStroke * 1.15)}
            strokeScaleEnabled={false}
            tension={0.4}
            lineCap="round"
            shadowColor="#000000"
            shadowBlur={4}
            shadowOpacity={0.7}
          />
        );

      case 'rhythm_line':
        if (!shape.points || shape.points.length < 4) return null;
        return (
          <Line
            points={shape.points.map((pt, i) => (i % 2 === 0 ? pt - shape.x : pt - shape.y))}
            stroke={stroke}
            strokeWidth={Math.max(4.0, baseStroke * 0.85)}
            strokeScaleEnabled={false}
            tension={0.35}
            lineCap="round"
            dash={[8, 4]}
            shadowColor="#000000"
            shadowBlur={3}
            shadowOpacity={0.6}
          />
        );

      case 'facial_thirds':
        if (!shape.points || shape.points.length < 4) return null;
        return (
          <Line
            points={shape.points.map((pt, i) => (i % 2 === 0 ? pt - shape.x : pt - shape.y))}
            stroke={stroke}
            strokeWidth={Math.max(2.5, baseStroke * 0.6)}
            strokeScaleEnabled={false}
            dash={[4, 4]}
            shadowColor="#000000"
            shadowBlur={2}
            shadowOpacity={0.5}
          />
        );

      default:
        return null;
    }
  };

  const isNonDraggable =
    shape.type === 'line_of_action' ||
    shape.type === 'rhythm_line' ||
    shape.type === 'facial_thirds';

  return (
    <Group
      ref={shapeRef}
      id={shape.id}
      x={shape.x}
      y={shape.y}
      rotation={shape.rotation}
      opacity={opacity}
      draggable={!isNonDraggable}
      onClick={() => onSelect(shape.id)}
      onTap={() => onSelect(shape.id)}
      onDragEnd={handleDragEnd}
      onTransformEnd={handleTransformEnd}
    >
      {renderShapeContent()}
    </Group>
  );
};
