import { DrawEvent } from '../../cw.types';
import { ICanvasContext } from './canvas.context.types';

export const getCanvasContextMethod: Record<DrawEvent['type'], keyof ICanvasContext> = {
  point: 'drawPoint',
  line: 'drawLine',
  lineSerie: 'drawLineSerie',
  rectangle: 'drawRectangle',
  ellipse: 'drawEllipse',
  fillRect: 'drawFillRect',
  clear: 'drawClear',
};
