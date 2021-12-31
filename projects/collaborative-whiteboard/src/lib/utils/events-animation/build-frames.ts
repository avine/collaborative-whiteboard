import { CanvasLineSerie, CanvasLine, CanvasPoint } from '../../cw.types';

/**
 * Build frames from a brush stroke
 */
export const buildBrushFrames = (canvasLineSerie: CanvasLineSerie): CanvasLineSerie[] => {
  const result: CanvasLineSerie[] = [];
  for (let i = 4; i <= canvasLineSerie.length; i += 2) {
    result.push(canvasLineSerie.slice(0, i));
  }
  return result;
};

/**
 * Build frames from a straight line path
 */
export const buildLineFrames = (canvasLineSerie: CanvasLineSerie): CanvasLine[] => {
  const result: CanvasLine[] = [];
  for (let i = 4; i <= canvasLineSerie.length; i += 2) {
    result.push([...(canvasLineSerie.slice(0, 2) as CanvasPoint), ...(canvasLineSerie.slice(i - 2, i) as CanvasPoint)]);
  }
  return result;
};
