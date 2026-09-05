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
        return `    <g transform="rotate(${shape.rotation} ${shape.x} ${shape.y})" data-name="${shape.name}">
      <ellipse cx="${shape.x}" cy="${shape.y}" rx="${rx}" ry="${ry}" fill="${fill}" fill-opacity="${fillOpacity}" stroke="${stroke}" stroke-width="${strokeWidth}" />
      <ellipse cx="${shape.x}" cy="${shape.y}" rx="${rx * 0.96}" ry="${ry * 0.32}" fill="none" stroke="${stroke}" stroke-width="${Math.max(1.8, strokeWidth * 0.55)}" stroke-dasharray="5,4" />
      <line x1="${shape.x}" y1="${shape.y - ry}" x2="${shape.x}" y2="${shape.y + ry}" stroke="${stroke}" stroke-width="${Math.max(1.8, strokeWidth * 0.55)}" stroke-dasharray="4,4" />
    </g>`;
      }
      case 'circle': {
        const r = shape.width / 2;
        return `    <g transform="rotate(${shape.rotation} ${shape.x} ${shape.y})" data-name="${shape.name}">
      <circle cx="${shape.x}" cy="${shape.y}" r="${r}" fill="${fill}" fill-opacity="${fillOpacity}" stroke="${stroke}" stroke-width="${strokeWidth}" />
      <ellipse cx="${shape.x}" cy="${shape.y}" rx="${r * 0.98}" ry="${r * 0.28}" fill="none" stroke="${stroke}" stroke-width="${Math.max(1.8, strokeWidth * 0.55)}" stroke-dasharray="4,4" />
      <line x1="${shape.x}" y1="${shape.y - r}" x2="${shape.x}" y2="${shape.y + r}" stroke="${stroke}" stroke-width="${Math.max(1.8, strokeWidth * 0.55)}" stroke-dasharray="4,4" />
    </g>`;
      }
      case 'box': {
        const w = shape.width;
        const h = shape.height;
        const x = shape.x - w / 2;
        const y = shape.y - h / 2;
        const depth = Math.min(22, Math.max(8, Math.min(w, h) * 0.22));
        const dx = depth * 0.72;
        const dy = -depth * 0.62;
        const topPoints = `${x},${y} ${x + dx},${y + dy} ${x + w + dx},${y + dy} ${x + w},${y}`;
        const sidePoints = `${x + w},${y} ${x + w + dx},${y + dy} ${x + w + dx},${y + h + dy} ${x + w},${y + h}`;

        return `    <g transform="rotate(${shape.rotation} ${shape.x} ${shape.y})" data-name="${shape.name}">
      <polygon points="${topPoints}" fill="${fill}" fill-opacity="${Math.min(1.0, fillOpacity * 1.3)}" stroke="${stroke}" stroke-width="${strokeWidth * 0.85}" stroke-linejoin="round" />
      <polygon points="${sidePoints}" fill="${fill}" fill-opacity="${Math.min(1.0, fillOpacity * 0.75)}" stroke="${stroke}" stroke-width="${strokeWidth * 0.85}" stroke-linejoin="round" />
      <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="2" ry="2" fill="${fill}" fill-opacity="${fillOpacity}" stroke="${stroke}" stroke-width="${strokeWidth}" />
      <line x1="${x}" y1="${y}" x2="${x + dx}" y2="${y + dy}" stroke="${stroke}" stroke-width="${strokeWidth * 0.8}" />
      <line x1="${x + w}" y1="${y}" x2="${x + w + dx}" y2="${y + dy}" stroke="${stroke}" stroke-width="${strokeWidth * 0.8}" />
      <line x1="${x + w}" y1="${y + h}" x2="${x + w + dx}" y2="${y + h + dy}" stroke="${stroke}" stroke-width="${strokeWidth * 0.8}" />
    </g>`;
      }
      case 'cylinder':
      case 'capsule': {
        const rx = shape.width / 2;
        const ry = Math.max(3.5, Math.min(rx * 0.42, shape.height * 0.22));
        const topY = shape.y - shape.height / 2 + ry;
        const botY = shape.y + shape.height / 2 - ry;
        const bodyH = Math.max(0, shape.height - 2 * ry);
        const leftX = shape.x - rx;
        const rightX = shape.x + rx;

        return `    <g transform="rotate(${shape.rotation} ${shape.x} ${shape.y})" data-name="${shape.name}">
      <rect x="${leftX}" y="${topY}" width="${shape.width}" height="${bodyH}" fill="${fill}" fill-opacity="${fillOpacity}" stroke="none" />
      <ellipse cx="${shape.x}" cy="${botY}" rx="${rx}" ry="${ry}" fill="${fill}" fill-opacity="${fillOpacity}" stroke="${stroke}" stroke-width="${strokeWidth}" />
      <line x1="${leftX}" y1="${topY}" x2="${leftX}" y2="${botY}" stroke="${stroke}" stroke-width="${strokeWidth}" />
      <line x1="${rightX}" y1="${topY}" x2="${rightX}" y2="${botY}" stroke="${stroke}" stroke-width="${strokeWidth}" />
      <ellipse cx="${shape.x}" cy="${shape.y}" rx="${rx * 0.96}" ry="${ry * 0.9}" fill="none" stroke="${stroke}" stroke-width="${Math.max(2, strokeWidth * 0.6)}" stroke-dasharray="5,4" />
      <ellipse cx="${shape.x}" cy="${topY}" rx="${rx}" ry="${ry}" fill="${fill}" fill-opacity="${fillOpacity}" stroke="${stroke}" stroke-width="${strokeWidth}" />
    </g>`;
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
