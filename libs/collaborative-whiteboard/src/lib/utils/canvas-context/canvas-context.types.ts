import { CanvasLine, CanvasLineSerie, CanvasPoint, DrawOptions } from '../../cw.types';

export interface ICanvasContext {
  drawPoint: (data: CanvasPoint, options: DrawOptions) => Omit<DrawEventInfo, 'eventId'>;
  drawLine: (data: CanvasLine, options: DrawOptions) => Omit<DrawEventInfo, 'eventId'>;
  drawLineSerie: (data: CanvasLineSerie, options: DrawOptions) => Omit<DrawEventInfo, 'eventId'>;
  drawRectangle: (data: CanvasLine, options: DrawOptions) => Omit<DrawEventInfo, 'eventId'>;
  drawEllipse: (data: CanvasLine, options: DrawOptions) => Omit<DrawEventInfo, 'eventId'>;
  drawBackground: (data: CanvasLine, options: DrawOptions) => void;
  drawClear: (data: CanvasLine, options: DrawOptions) => void;
}

export interface DrawEventInfo {
  path2D: Path2D;
  bounding: CanvasLine;
  eventId: string;
}

export interface TranslateAction extends DrawEventInfo {
  action: 'translate';
}

export interface ResizeAction extends DrawEventInfo {
  action: 'resize';
  // bounding: CanvasLine;
  corner: ResizeCorner;
}

export type ResizeCorner = 'topLeft' | 'topRight' | 'bottomRight' | 'bottomLeft';

export type DrawEventAction = TranslateAction | ResizeAction;
