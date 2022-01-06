import { CanvasLine, CanvasLineSerie, CanvasPoint, DrawOptions } from '../../cw.types';

export interface ICanvasContext {
  drawPoint: (data: CanvasPoint, options: DrawOptions) => Path2D;
  drawLine: (data: CanvasLine, options: DrawOptions) => Path2D;
  drawLineSerie: (data: CanvasLineSerie, options: DrawOptions) => Path2D;
  drawRectangle: (data: CanvasLine, options: DrawOptions) => Path2D;
  drawEllipse: (data: CanvasLine, options: DrawOptions) => Path2D;
  drawFillRect: (data: CanvasLine, options: DrawOptions) => Path2D;
  drawClear: (data: CanvasLine, options: DrawOptions) => void;
  drawSelection: (data: CanvasLine, options: DrawOptions) => void;
}
