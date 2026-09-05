import { ConstructionPrimitive } from '../types/shapes';

export function renderShapesToCanvas(
  shapes: ConstructionPrimitive[],
  width: number,
  height: number,
  options?: { strokeWidth?: number; shapesOpacity?: number }
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  // Transparent background
  ctx.clearRect(0, 0, width, height);

  for (const shape of shapes) {
    if (!shape.isVisible) continue;

    ctx.save();
    ctx.translate(shape.x, shape.y);
    ctx.rotate((shape.rotation * Math.PI) / 180);

    ctx.strokeStyle = shape.strokeColor;
    ctx.lineWidth = options?.strokeWidth ?? Math.max(4.5, shape.strokeWidth);
    ctx.fillStyle = shape.fillColor;
    ctx.globalAlpha = shape.fillOpacity * (options?.shapesOpacity ?? 1.0);

    switch (shape.type) {
      case 'oval': {
        const rx = shape.width / 2;
        const ry = shape.height / 2;
        ctx.beginPath();
        ctx.ellipse(0, 0, rx, ry, 0, 0, 2 * Math.PI);
        ctx.fill();
        ctx.globalAlpha = 1.0;
        ctx.stroke();
        break;
      }
      case 'circle': {
        const r = shape.width / 2;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, 2 * Math.PI);
        ctx.fill();
        ctx.globalAlpha = 1.0;
        ctx.stroke();
        break;
      }
      case 'box': {
        const w = shape.width;
        const h = shape.height;
        ctx.beginPath();
        ctx.roundRect(-w / 2, -h / 2, w, h, 6);
        ctx.fill();
        ctx.globalAlpha = 1.0;
        ctx.stroke();
        break;
      }
      case 'capsule': {
        const w = shape.width;
        const h = shape.height;
        const r = w / 2;
        ctx.beginPath();
        ctx.roundRect(-w / 2, -h / 2, w, h, r);
        ctx.fill();
        ctx.globalAlpha = 1.0;
        ctx.stroke();
        break;
      }
      case 'cross_contour': {
        const rx = shape.width / 2;
        const ry = shape.height / 2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.ellipse(0, 0, rx, ry, 0, 0, 2 * Math.PI);
        ctx.globalAlpha = 0.9;
        ctx.stroke();
        ctx.setLineDash([]);
        break;
      }
      case 'line_of_action': {
        if (shape.points && shape.points.length >= 6) {
          // Untranslate for absolute points
          ctx.restore();
          ctx.save();
          const pts = shape.points;
          ctx.strokeStyle = shape.strokeColor;
          ctx.lineWidth = shape.strokeWidth;
          ctx.beginPath();
          ctx.moveTo(pts[0], pts[1]);
          ctx.quadraticCurveTo(pts[2], pts[3], pts[4], pts[5]);
          ctx.stroke();
        }
        break;
      }
    }

    ctx.restore();
  }

  return canvas;
}

export function downloadPngFile(
  shapes: ConstructionPrimitive[],
  width: number,
  height: number,
  filename = 'figure-construction-forms.png',
  options?: { strokeWidth?: number; shapesOpacity?: number }
): void {
  const canvas = renderShapesToCanvas(shapes, width, height, options);
  canvas.toBlob(blob => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 'image/png');
}
