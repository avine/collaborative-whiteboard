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

export interface TranslateAction extends DrawEventPath {
  action: 'translate';
}

export interface ResizeAction extends DrawEventPath {
  action: 'resize';
  bounding: CanvasLine;
  corner: ResizeCorner;
}

export type ResizeCorner = 'topLeft' | 'topRight' | 'bottomRight' | 'bottomLeft';

export type DrawEventAction = TranslateAction | ResizeAction;
