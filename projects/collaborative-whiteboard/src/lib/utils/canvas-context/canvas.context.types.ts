import { CanvasLine, CanvasLineSerie, CanvasPoint, DrawOptions } from '../../cw.types';

export interface ICanvasContext {
  drawPoint: (data: CanvasPoint, options: DrawOptions) => void;
  drawLine: (data: CanvasLine, options: DrawOptions) => void;
  drawLineSerie: (data: CanvasLineSerie, options: DrawOptions) => void;
  drawRectangle: (data: CanvasLine, options: DrawOptions) => void;
  drawEllipse: (data: CanvasLine, options: DrawOptions) => void;
  drawFillRect: (data: CanvasLine, options: DrawOptions) => void;
  drawClear: (data: CanvasLine, options: DrawOptions) => void;
}
