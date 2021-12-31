import { DrawEvent } from '../../cw.types';
import { ICanvasContext } from './canvas.context.types';

export const getCanvasContextHandler: Record<DrawEvent['type'], keyof ICanvasContext> = {
  point: 'drawPoint',
  line: 'drawLine',
  lineSerie: 'drawLineSerie',
  rectangle: 'drawRectangle',
  ellipse: 'drawEllipse',
  fillRect: 'drawFillRect',
  clear: 'drawClear',
};
