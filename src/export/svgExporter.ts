import { ConstructionPrimitive } from '../types/shapes';

export function generateSvgString(
  shapes: ConstructionPrimitive[],
  width: number,
  height: number,
  options?: { strokeWidth?: number; shapesOpacity?: number }
): string {
  const strokeWidthOverride = options?.strokeWidth;
  const opacityMultiplier = options?.shapesOpacity ?? 1.0;

  const elements = shapes.map(shape => {
    if (!shape.isVisible) return '';

    const stroke = shape.strokeColor;
    const strokeWidth = strokeWidthOverride ?? Math.max(4.5, shape.strokeWidth);
    const fill = shape.fillColor;
    const fillOpacity = Math.min(1.0, shape.fillOpacity * opacityMultiplier);

    switch (shape.type) {
      case 'oval': {
        const rx = shape.width / 2;
        const ry = shape.height / 2;
        return `    <ellipse cx="${shape.x}" cy="${shape.y}" rx="${rx}" ry="${ry}" transform="rotate(${shape.rotation} ${shape.x} ${shape.y})" fill="${fill}" fill-opacity="${fillOpacity}" stroke="${stroke}" stroke-width="${strokeWidth}" data-name="${shape.name}" />`;
      }
      case 'circle': {
        const r = shape.width / 2;
        return `    <circle cx="${shape.x}" cy="${shape.y}" r="${r}" fill="${fill}" fill-opacity="${fillOpacity}" stroke="${stroke}" stroke-width="${strokeWidth}" data-name="${shape.name}" />`;
      }
      case 'box': {
        const x = shape.x - shape.width / 2;
        const y = shape.y - shape.height / 2;
        return `    <rect x="${x}" y="${y}" width="${shape.width}" height="${shape.height}" rx="6" ry="6" transform="rotate(${shape.rotation} ${shape.x} ${shape.y})" fill="${fill}" fill-opacity="${fillOpacity}" stroke="${stroke}" stroke-width="${strokeWidth}" data-name="${shape.name}" />`;
      }
      case 'capsule': {
        // Render capsule as a rounded rectangle with half-width corner radius
        const x = shape.x - shape.width / 2;
        const y = shape.y - shape.height / 2;
        const r = shape.width / 2;
        return `    <rect x="${x}" y="${y}" width="${shape.width}" height="${shape.height}" rx="${r}" ry="${r}" transform="rotate(${shape.rotation} ${shape.x} ${shape.y})" fill="${fill}" fill-opacity="${fillOpacity}" stroke="${stroke}" stroke-width="${strokeWidth}" data-name="${shape.name}" />`;
      }
      case 'cross_contour': {
        const rx = shape.width / 2;
        const ry = shape.height / 2;
        return `    <ellipse cx="${shape.x}" cy="${shape.y}" rx="${rx}" ry="${ry}" transform="rotate(${shape.rotation} ${shape.x} ${shape.y})" fill="none" stroke="${stroke}" stroke-width="${Math.max(3.0, strokeWidth * 0.7)}" stroke-dasharray="4,4" data-name="${shape.name}" />`;
      }
      case 'line_of_action': {
        if (!shape.points || shape.points.length < 4) return '';
        const pts = shape.points;
        const d = `M ${pts[0]} ${pts[1]} Q ${pts[2]} ${pts[3]} ${pts[4]} ${pts[5]}`;
        return `    <path d="${d}" fill="none" stroke="${stroke}" stroke-width="${Math.max(5.5, strokeWidth * 1.15)}" stroke-linecap="round" data-name="${shape.name}" />`;
      }
      default:
        return '';
    }
  }).filter(Boolean).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <!-- Figure Drawing Construction Overlay - FormMaster -->
  <g id="construction-primitives">
${elements}
  </g>
</svg>`;
}

export function downloadSvgFile(
  shapes: ConstructionPrimitive[],
  width: number,
  height: number,
  filename = 'figure-construction-forms.svg',
  options?: { strokeWidth?: number; shapesOpacity?: number }
): void {
  const svgString = generateSvgString(shapes, width, height, options);
  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
