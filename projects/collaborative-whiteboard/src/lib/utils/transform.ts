import { CanvasLine, DrawEvent } from '../cw.types';

export const translateEvent = (event: DrawEvent, x: number, y: number): DrawEvent => {
  const result: DrawEvent = { ...event };
  if (!result.data) {
    return result;
  }
  result.data = [...result.data];
  for (let i = 0; i < result.data.length - 1; i += 2) {
    result.data[i] = result.data[i] + x;
    result.data[i + 1] = result.data[i + 1] + y;
  }
  return result;
};

export const resizeEvent = (
  event: DrawEvent,
  [originX, originY]: [number, number],
  [scaleX, scaleY]: [number, number]
): DrawEvent => {
  const result: DrawEvent = { ...event };
  if (!result.data) {
    return result;
  }
  switch (result.type) {
    case 'line':
    case 'rectangle':
    case 'ellipse': {
      const [fromX, fromY, toX, toY] = result.dataSnapshot as CanvasLine;
      result.data = [
        originX + (fromX - originX) * scaleX,
        originY + (fromY - originY) * scaleY,
        originX + (fromX - originX) * scaleX + Math.round((toX - fromX) * scaleX),
        originY + (fromY - originY) * scaleY + Math.round((toY - fromY) * scaleY),
      ];
      break;
    }
    case 'point': {
      // TODO: NOT IMPLEMENTED YET...
      break;
    }
    case 'lineSerie': {
      // TODO: NOT IMPLEMENTED YET...
      break;
    }
  }
  return result;
};

export const defineEventDataSnapshot = (event: DrawEvent): DrawEvent => {
  event.dataSnapshot ??= [...event.data];
  return event;
};

export const deleteEventDataSnapshot = (event: DrawEvent): DrawEvent => {
  delete event.dataSnapshot; // !FIXME: should we better use event.resizeFrom = undefined to prevent performance issue?
  return event;
};
