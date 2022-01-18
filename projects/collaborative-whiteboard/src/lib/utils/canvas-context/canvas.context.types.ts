import { CanvasLine, CanvasLineSerie, CanvasPoint, DrawOptions } from '../../cw.types';

export interface ICanvasContext {
  drawPoint: (data: CanvasPoint, options: DrawOptions) => Path2D;
  drawLine: (data: CanvasLine, options: DrawOptions) => Path2D;
  drawLineSerie: (data: CanvasLineSerie, options: DrawOptions) => Path2D;
  drawRectangle: (data: CanvasLine, options: DrawOptions) => Path2D;
  drawEllipse: (data: CanvasLine, options: DrawOptions) => Path2D;
  drawFillBackground: (data: CanvasLine, options: DrawOptions) => void;
  drawClear: (data: CanvasLine, options: DrawOptions) => void;
}

export interface DrawEventPath {
  path2D: Path2D;
  eventId: string;
}

export interface DrawBoundingSelectionPath extends DrawEventPath {
  action: 'translate' | 'resize';
  bounding: CanvasLine;
}

export type BoundingSelectionAction = Omit<DrawBoundingSelectionPath, 'path2D'>;
