import { DEFAULT_OWNER, getDefaultColors } from './cw.config';
import {
  CanvasLine,
  CutRange,
  CutRangeArg,
  DrawClear,
  DrawEvent,
  DrawEventsBroadcast,
  DrawFillRect,
  DrawType,
} from './cw.types';

export const getColorsMatrix = (colors = getDefaultColors(), maxColorsPerRow = 6) => {
  const matrix: string[][] = [];
  while (colors.length) {
    matrix.push(colors.splice(0, maxColorsPerRow));
  }
  return matrix;
};

export const getEmptyCanvasLine = (): CanvasLine => [0, 0, 0, 0];

export const isEmptyCanvasLine = ([fromX, fromY, toX, toY]: CanvasLine) => toX === fromX && toY === fromY;

export const getFillRectEvent = (color: string, opacity = 1, owner = DEFAULT_OWNER): DrawFillRect => ({
  id: getEventUID(),
  owner,
  type: 'fillRect',
  data: getEmptyCanvasLine(),
  options: { lineWidth: 0, color, opacity }, // Note: `lineWidth` is not relevant in this case
});

export const getClearEvent = (owner = DEFAULT_OWNER): DrawClear => ({
  id: getEventUID(),
  owner,
  type: 'clear',
  data: getEmptyCanvasLine(),
  options: { lineWidth: 0, color: '', opacity: 0 }, // Note: `options` is not relevant in this case
});

export const mapToDrawEventsBroadcast = (events: DrawEvent[], animate = false): DrawEventsBroadcast => ({
  animate,
  events,
});

export const normalizeCutRange = (data: CutRangeArg): CutRange => {
  const compareNumbers = (a: number, b: number) => {
    if (a > b) {
      return 1;
    }
    if (a < b) {
      return -1;
    }
    return 0;
  };
  const [from, to] = Array.isArray(data) ? [...data].sort(compareNumbers) : [data, data];
  return [Math.max(0, from), Math.max(0, to)];
};

export const keepDrawEventsAfterClearEvent = (events: DrawEvent[]): DrawEvent[] => {
  for (let i = events.length - 1; i >= 0; i--) {
    if (events[i].type === 'clear') {
      return events.slice(i + 1);
    }
  }
  return events;
};

export const inferBasicDrawType = (dataLength: number): DrawType =>
  dataLength === 2 ? 'point' : dataLength === 4 ? 'line' : 'lineSerie';

export const translate = (event: DrawEvent, x: number, y: number): DrawEvent => {
  const result = { ...event };
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

export const getEventUID = () =>
  `${Date.now()}-${Math.round(Math.random() * 1e16)
    .toString(16)
    .substring(0, 4)}`;

export const getUID = (prefix = '') => (prefix ? `${prefix}-` : '') + Math.random().toString().substring(2);
