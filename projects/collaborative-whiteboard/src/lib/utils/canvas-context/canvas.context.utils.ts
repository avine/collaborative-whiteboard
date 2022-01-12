import { CanvasLine, CanvasLineSerie, CanvasPoint, DrawType } from '../../cw.types';
import { ICanvasContext } from './canvas.context.types';

export const getCanvasContextHandler: Record<Exclude<DrawType, 'selection'>, keyof ICanvasContext> = {
  point: 'drawPoint',
  line: 'drawLine',
  lineSerie: 'drawLineSerie',
  rectangle: 'drawRectangle',
  ellipse: 'drawEllipse',
  fillRect: 'drawFillRect',
  clear: 'drawClear',
};

export const normalizeCanvasLine = (canvasLine: CanvasLine): CanvasLine => {
  const fromX = Math.min(canvasLine[0], canvasLine[2]);
  const toX = Math.max(canvasLine[0], canvasLine[2]);
  const fromY = Math.min(canvasLine[1], canvasLine[3]);
  const toY = Math.max(canvasLine[1], canvasLine[3]);
  return [fromX, fromY, toX, toY];
};

type BoundingRectData = CanvasPoint | CanvasLine | CanvasLineSerie;

const _getBoundingRect = (data: BoundingRectData): CanvasLine => {
  switch (data.length) {
    case 2: {
      return [data[0], data[1], data[0], data[1]];
    }
    case 4: {
      return normalizeCanvasLine(data as CanvasLine);
    }
    default: {
      let xMin = data[0];
      let xMax = data[0];
      let yMin = data[1];
      let yMax = data[1];
      for (let i = 2; i < data.length; i += 2) {
        xMin = Math.min(xMin, data[i]);
        xMax = Math.max(xMax, data[i]);
        yMin = Math.min(yMin, data[i + 1]);
        yMax = Math.max(yMax, data[i + 1]);
      }
      return normalizeCanvasLine([xMin, yMin, xMax, yMax]);
    }
  }
};

export const getBoundingRect = (...items: BoundingRectData[]): CanvasLine => {
  if (items.length === 0) {
    return [0, 0, 0, 0];
  }
  let [xMin, yMin, xMax, yMax] = _getBoundingRect(items[0]);
  for (let i = 1; i < items.length; i++) {
    const [fromX, fromY, toX, toY] = _getBoundingRect(items[i]);
    xMin = Math.min(xMin, fromX);
    yMin = Math.min(yMin, fromY);
    xMax = Math.max(xMax, toX);
    yMax = Math.max(yMax, toY);
  }
  return [xMin, yMin, xMax, yMax];
};
