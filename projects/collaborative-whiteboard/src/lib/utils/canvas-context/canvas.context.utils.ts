import { CanvasLine, CanvasLineSerie, CanvasPoint, DrawEvent } from '../../cw.types';
import { ICanvasContext } from './canvas.context.types';

export const getCanvasContextHandler: Record<DrawEvent['type'], keyof ICanvasContext> = {
  point: 'drawPoint',
  line: 'drawLine',
  lineSerie: 'drawLineSerie',
  rectangle: 'drawRectangle',
  ellipse: 'drawEllipse',
  fillRect: 'drawFillRect',
  clear: 'drawClear',
  selection: 'drawSelection',
};

export const getExtremities = (data: CanvasPoint | CanvasLine | CanvasLineSerie): CanvasLine => {
  switch (data.length) {
    case 2: {
      return [data[0], data[1], data[0], data[1]];
    }
    case 4: {
      return data as CanvasLine;
    }
    default: {
      let xMin = data[0];
      let xMax = data[0];
      let yMin = data[1];
      let yMax = data[1];
      for (let i = 2; i <data.length; i += 2) {
        xMin = Math.min(xMin, data[i]);
        xMax = Math.max(xMax, data[i]);
        yMin = Math.min(yMin, data[i + 1]);
        yMax = Math.max(yMax, data[i + 1]);
      }
      return [xMin, yMin, xMax, yMax] as CanvasLine;
    }
  }
};
